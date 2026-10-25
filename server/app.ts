import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { PoolClient } from 'pg';
import { DECK, TOPIC_BY_ID } from '../src/data/ophthalmology.js';
import type { SyncState } from '../src/lib/merge';
import type { Plan, StudySession, TopicProgress } from '../src/lib/types';
import { auth, googleEnabled } from './auth.js';
import { pool } from './db.js';

type Vars = { Variables: { userId: string } };

const app = new Hono<Vars>().basePath('/api');

app.get('/health', (c) => c.json({ ok: true }));
// Google only redirects back to BETTER_AUTH_URL, so hide the button on any other address (e.g. a LAN IP)
const authHost = process.env.BETTER_AUTH_URL ? new URL(process.env.BETTER_AUTH_URL).host : null;
app.get('/config', (c) => c.json({ google: googleEnabled && (!authHost || c.req.header('host') === authHost) }));

app.on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw));

const requireUser = createMiddleware<Vars>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: 'Not signed in' }, 401);
  c.set('userId', session.user.id);
  await next();
});

// Everything below needs a signed-in user
app.use('/state', requireUser);
app.use('/sync', requireUser);

// ── Validation (the client is not trusted) ──

const num = (v: unknown, max = Number.MAX_SAFE_INTEGER): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max ? Math.round(v) : null;
const rating = (v: unknown) => (v === 1 || v === 2 || v === 3 ? v : null);

function cleanPlan(v: unknown): Plan | null {
  if (!v || typeof v !== 'object') return null;
  const p = v as Plan;
  if (typeof p.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.startDate)) return null;
  if (!num(p.days, 60) || !num(p.updatedAt)) return null;
  if (!['smart', 'classic', 'custom'].includes(p.timingMode)) return null;
  const tiers = ['vhigh', 'high', 'moderate', 'low'] as const;
  if (!p.custom || !tiers.every((t) => num(p.custom[t]?.learn, 240) !== null && num(p.custom[t]?.talk, 240) !== null)) return null;
  return {
    name: String(p.name ?? '').slice(0, 30),
    startDate: p.startDate,
    days: p.days,
    timingMode: p.timingMode,
    custom: Object.fromEntries(tiers.map((t) => [t, { learn: p.custom[t].learn, talk: p.custom[t].talk }])) as Plan['custom'],
    wheelMode: p.wheelMode === 'equal' ? 'equal' : 'weighted',
    symptomRule: p.symptomRule === 'open' ? 'open' : 'later',
    sound: p.sound !== false,
    onboarded: p.onboarded === true,
    updatedAt: p.updatedAt,
  };
}

function cleanProgress(v: unknown): Record<string, TopicProgress> {
  if (!v || typeof v !== 'object') return {};
  const out: Record<string, TopicProgress> = {};
  for (const [id, raw] of Object.entries(v as Record<string, TopicProgress>)) {
    if (!TOPIC_BY_ID[id] || !raw || typeof raw !== 'object') continue;
    const updatedAt = num(raw.updatedAt);
    if (updatedAt === null || (raw.status !== 'done' && raw.status !== 'pending')) continue;
    out[id] = {
      status: raw.status,
      attempts: num(raw.attempts, 10_000) ?? 0,
      skips: num(raw.skips, 10_000) ?? 0,
      lastRating: rating(raw.lastRating) ?? undefined,
      completedAt: num(raw.completedAt) ?? undefined,
      manual: raw.manual === true,
      updatedAt,
    };
  }
  return out;
}

function cleanSessions(v: unknown): StudySession[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 5000).flatMap((s: StudySession) => {
    if (!s || typeof s !== 'object' || typeof s.id !== 'string' || s.id.length > 64 || !TOPIC_BY_ID[s.topicId]) return [];
    const startedAt = num(s.startedAt);
    const endedAt = num(s.endedAt);
    if (startedAt === null || endedAt === null) return [];
    return [
      {
        id: s.id,
        topicId: s.topicId,
        startedAt,
        endedAt,
        learnSec: num(s.learnSec, 86_400) ?? 0,
        talkSec: num(s.talkSec, 86_400) ?? 0,
        outcome: s.outcome === 'abandoned' ? 'abandoned' : 'completed',
        rating: rating(s.rating) ?? undefined,
        covered: num(s.covered, 1000) ?? 0,
        totalAsks: num(s.totalAsks, 1000) ?? 0,
      } satisfies StudySession,
    ];
  });
}

// ── Queries ──

async function loadState(db: PoolClient, userId: string): Promise<SyncState> {
  const [planRes, progRes, sessRes] = await Promise.all([
    db.query('select data, reset_at from user_plan where user_id = $1 and deck_id = $2', [userId, DECK.id]),
    db.query('select * from topic_progress where user_id = $1 and deck_id = $2', [userId, DECK.id]),
    db.query('select * from study_session where user_id = $1 and deck_id = $2 order by started_at', [userId, DECK.id]),
  ]);
  const progress: Record<string, TopicProgress> = {};
  for (const r of progRes.rows) {
    progress[r.topic_id] = {
      status: r.status,
      attempts: r.attempts,
      skips: r.skips,
      lastRating: r.last_rating ?? undefined,
      completedAt: r.completed_at === null ? undefined : Number(r.completed_at),
      manual: r.manual,
      updatedAt: Number(r.updated_at),
    };
  }
  return {
    plan: planRes.rows[0]?.data ?? null,
    resetAt: Number(planRes.rows[0]?.reset_at ?? 0),
    progress,
    sessions: sessRes.rows.map((r) => ({
      id: r.id,
      topicId: r.topic_id,
      startedAt: Number(r.started_at),
      endedAt: Number(r.ended_at),
      learnSec: r.learn_sec,
      talkSec: r.talk_sec,
      outcome: r.outcome,
      rating: r.rating ?? undefined,
      covered: r.covered,
      totalAsks: r.total_asks,
    })),
  };
}

/** Builds "($1,$2,…),($n,…)" for a multi-row insert */
function values(rows: unknown[][]): { sql: string; params: unknown[] } {
  const params: unknown[] = [];
  const sql = rows.map((row) => `(${row.map((v) => (params.push(v), `$${params.length}`)).join(',')})`).join(',');
  return { sql, params };
}

async function applySync(db: PoolClient, userId: string, incoming: SyncState): Promise<void> {
  const current = await db.query('select reset_at from user_plan where user_id = $1 and deck_id = $2 for update', [userId, DECK.id]);
  const storedReset = Number(current.rows[0]?.reset_at ?? 0);
  const resetAt = Math.max(storedReset, incoming.resetAt);

  if (resetAt > storedReset) {
    await db.query('delete from topic_progress where user_id = $1 and deck_id = $2 and updated_at <= $3', [userId, DECK.id, resetAt]);
    await db.query('delete from study_session where user_id = $1 and deck_id = $2 and ended_at <= $3', [userId, DECK.id, resetAt]);
  }

  if (incoming.plan || resetAt > storedReset) {
    await db.query(
      `insert into user_plan (user_id, deck_id, data, updated_at, reset_at) values ($1, $2, $3, $4, $5)
       on conflict (user_id, deck_id) do update set
         data = case
           when excluded.updated_at = 0 then user_plan.data
           when (user_plan.data->>'onboarded')::boolean is distinct from (excluded.data->>'onboarded')::boolean
             then case when (excluded.data->>'onboarded')::boolean then excluded.data else user_plan.data end
           when excluded.updated_at > user_plan.updated_at then excluded.data
           else user_plan.data end,
         updated_at = greatest(user_plan.updated_at, excluded.updated_at),
         reset_at = greatest(user_plan.reset_at, excluded.reset_at)`,
      [userId, DECK.id, incoming.plan ?? {}, incoming.plan?.updatedAt ?? 0, resetAt],
    );
  }

  const progressRows = Object.entries(incoming.progress)
    .filter(([, p]) => p.updatedAt > resetAt)
    .map(([id, p]) => [userId, DECK.id, id, p.status, p.attempts, p.skips, p.lastRating ?? null, p.completedAt ?? null, p.manual ?? false, p.updatedAt]);
  if (progressRows.length) {
    const v = values(progressRows);
    await db.query(
      `insert into topic_progress (user_id, deck_id, topic_id, status, attempts, skips, last_rating, completed_at, manual, updated_at)
       values ${v.sql}
       on conflict (user_id, deck_id, topic_id) do update set
         status = excluded.status, attempts = excluded.attempts, skips = excluded.skips, last_rating = excluded.last_rating,
         completed_at = excluded.completed_at, manual = excluded.manual, updated_at = excluded.updated_at
       where topic_progress.updated_at < excluded.updated_at`,
      v.params,
    );
  }

  const sessionRows = incoming.sessions
    .filter((s) => s.endedAt > resetAt)
    .map((s) => [s.id, userId, DECK.id, s.topicId, s.startedAt, s.endedAt, s.learnSec, s.talkSec, s.outcome, s.rating ?? null, s.covered, s.totalAsks]);
  for (let i = 0; i < sessionRows.length; i += 500) {
    const v = values(sessionRows.slice(i, i + 500));
    await db.query(
      `insert into study_session (id, user_id, deck_id, topic_id, started_at, ended_at, learn_sec, talk_sec, outcome, rating, covered, total_asks)
       values ${v.sql} on conflict (id) do nothing`,
      v.params,
    );
  }
}

async function withClient<T>(fn: (db: PoolClient) => Promise<T>): Promise<T> {
  const db = await pool.connect();
  try {
    return await fn(db);
  } finally {
    db.release();
  }
}

app.get('/state', async (c) => {
  const state = await withClient((db) => loadState(db, c.get('userId')));
  return c.json(state);
});

app.post('/sync', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object') return c.json({ error: 'Bad request' }, 400);
  const incoming: SyncState = {
    plan: cleanPlan(body.plan),
    progress: cleanProgress(body.progress),
    sessions: cleanSessions(body.sessions),
    resetAt: num(body.resetAt) ?? 0,
  };
  const userId = c.get('userId');
  const state = await withClient(async (db) => {
    await db.query('begin');
    try {
      await applySync(db, userId, incoming);
      await db.query('commit');
    } catch (e) {
      await db.query('rollback');
      throw e;
    }
    return loadState(db, userId);
  });
  return c.json(state);
});

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Something went wrong' }, 500);
});

export default app;
