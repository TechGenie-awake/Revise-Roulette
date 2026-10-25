import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import { Link } from 'react-router';
import { CHAPTERS, TOPICS, TOPIC_BY_ID, TOTAL_TOPIC_QS } from '../data/ophthalmology';
import { ProgressBar } from '../components/ui';
import { addDaysStr, dayOf, formatMinutes, isDone, pace, parseDateStr } from '../lib/plan';
import { useStore } from '../lib/store';

// Validated pair (dataviz validate_palette: all checks pass on #FFFDF8)
const LEARN = '#7B5CE6';
const TALK = '#D9772B';

interface DayRow {
  day: string;
  date: string;
  learn: number;
  talk: number;
}

function DayTooltip({ active, payload }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as DayRow;
  return (
    <div className="nb-card px-3 py-2 text-sm" style={{ boxShadow: 'var(--shadow-nb-sm)' }}>
      <div className="font-display font-bold">
        {row.day} · {row.date}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: LEARN }} /> Learn <b className="ml-auto pl-3">{formatMinutes(row.learn)}</b>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: TALK }} /> Talk <b className="ml-auto pl-3">{formatMinutes(row.talk)}</b>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="nb-card p-4" style={{ background: color }}>
      <div className="text-sm font-semibold text-ink-soft">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold leading-none sm:text-4xl">{value}</div>
      {sub && <div className="mt-1.5 text-xs font-medium text-ink-soft">{sub}</div>}
    </div>
  );
}

export default function StatsPage() {
  const plan = useStore((s) => s.plan);
  const progress = useStore((s) => s.progress);
  const sessions = useStore((s) => s.sessions);

  const done = TOPICS.filter((t) => isDone(progress, t.id));
  const coveredQs = done.reduce((sum, t) => sum + t.qs, 0);
  const totalSec = sessions.reduce((sum, s) => sum + s.learnSec + s.talkSec, 0);
  const p = pace(plan, progress);

  const lastDay = Math.max(plan.days, ...sessions.map((s) => dayOf(plan, s.startedAt)));
  const rows: DayRow[] = Array.from({ length: lastDay }, (_, i) => {
    const day = i + 1;
    const daySessions = sessions.filter((s) => dayOf(plan, s.startedAt) === day);
    return {
      day: `Day ${day}`,
      date: parseDateStr(addDaysStr(plan.startDate, i)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      learn: Math.round(daySessions.reduce((sum, s) => sum + s.learnSec, 0) / 60),
      talk: Math.round(daySessions.reduce((sum, s) => sum + s.talkSec, 0) / 60),
    };
  });

  // Latest rating per topic, so topics marked done from the Topics list count too.
  // Done topics from before ratings were asked for count as "Okay".
  const ratings = { 1: 0, 2: 0, 3: 0 } as Record<1 | 2 | 3, number>;
  TOPICS.forEach((t) => {
    const p = progress[t.id];
    if (!p) return;
    if (p.status === 'done') ratings[p.lastRating === 3 ? 3 : 2]++;
    else if (p.lastRating === 1) ratings[1]++;
  });

  const retries = TOPICS.filter((t) => (progress[t.id]?.attempts ?? 0) > 1 || (progress[t.id]?.status === 'pending' && (progress[t.id]?.attempts ?? 0) > 0));
  const dodged = TOPICS.filter((t) => (progress[t.id]?.skips ?? 0) >= 2 && !isDone(progress, t.id)).sort(
    (a, b) => (progress[b.id]?.skips ?? 0) - (progress[a.id]?.skips ?? 0),
  );

  const onTrack = p.doneToday >= p.todayTarget;
  const toGo = Math.max(0, p.todayTarget - p.doneToday);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold">Stats</h1>
      <p className="mt-1 text-ink-soft">How your revision is going.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="PYQ coverage" value={`${Math.round((coveredQs / TOTAL_TOPIC_QS) * 100)}%`} sub="of past questions' topics done" color="var(--color-lilac)" />
        <Stat label="Topics done" value={`${done.length}/${TOPICS.length}`} sub={`${p.remaining} left`} color="var(--color-mint)" />
        <Stat label="Time studied" value={formatMinutes(totalSec / 60)} sub={`${sessions.filter((s) => s.outcome === 'completed').length} sessions`} color="var(--color-sky)" />
        <Stat
          label="Today"
          value={`${p.doneToday}/${p.todayTarget}`}
          sub={onTrack ? 'On track ✓' : `${toGo} more to stay on track`}
          color={onTrack ? 'var(--color-mint)' : 'var(--color-peach)'}
        />
      </div>

      <div className="nb-card mt-5 p-5">
        <p className="font-display text-lg font-bold">
          {p.remaining === 0
            ? 'All topics done. Incredible work! 🎉'
            : `${formatMinutes(p.minutesLeft)} of revision left. That's about ${formatMinutes(p.minutesPerDayLeft)} a day for the next ${p.daysLeft} day${p.daysLeft > 1 ? 's' : ''}.`}
        </p>
      </div>

      <section className="nb-card mt-5 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold">Study time per day</h2>
          <div className="flex gap-4 text-sm font-medium" aria-label="Legend">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-ink" style={{ background: LEARN }} /> Learn
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-ink" style={{ background: TALK }} /> Talk
            </span>
          </div>
        </div>
        {totalSec === 0 ? (
          <p className="py-10 text-center text-ink-soft">
            Your study time shows up here after your first session.{' '}
            <Link to="/" className="font-semibold underline underline-offset-4">
              Go spin
            </Link>
          </p>
        ) : (
          <>
            <div className="mt-4 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid vertical={false} stroke="#1D1A24" strokeOpacity={0.08} />
                  <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: '#1D1A24', strokeOpacity: 0.3 }} tick={{ fontSize: 12, fill: '#6B6573' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6B6573' }} allowDecimals={false} unit="m" />
                  <Tooltip content={(props) => <DayTooltip {...(props as TooltipContentProps<number, string>)} />} cursor={{ fill: '#1D1A24', fillOpacity: 0.05 }} />
                  <Bar dataKey="learn" name="Learn" stackId="t" fill={LEARN} stroke="#FFFDF8" strokeWidth={2} />
                  <Bar dataKey="talk" name="Talk" stackId="t" fill={TALK} stroke="#FFFDF8" strokeWidth={2} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-semibold text-ink-soft">Show as table</summary>
              <table className="mt-2 w-full text-left">
                <thead>
                  <tr className="text-ink-soft">
                    <th className="py-1 font-semibold">Day</th>
                    <th className="py-1 font-semibold">Learn</th>
                    <th className="py-1 font-semibold">Talk</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.day} className="border-t border-ink/10">
                      <td className="py-1">
                        {r.day} · {r.date}
                      </td>
                      <td className="py-1">{formatMinutes(r.learn)}</td>
                      <td className="py-1">{formatMinutes(r.talk)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="nb-card p-5">
          <h2 className="text-xl font-bold">Chapters</h2>
          <ul className="mt-4 grid gap-3">
            {CHAPTERS.map((ch) => {
              const all = TOPICS.filter((t) => t.chapter === ch.no);
              const d = all.filter((t) => isDone(progress, t.id)).length;
              return (
                <li key={ch.no}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span className="truncate font-semibold">
                      {ch.no}. {ch.name}
                    </span>
                    <span className="shrink-0 font-medium text-ink-soft">
                      {d}/{all.length}
                    </span>
                  </div>
                  <ProgressBar value={d / all.length} height={12} />
                </li>
              );
            })}
          </ul>
        </section>

        <div className="grid content-start gap-5">
          <section className="nb-card p-5">
            <h2 className="text-xl font-bold">How confident you feel</h2>
            <p className="mt-1 text-sm text-ink-soft">Your latest rating for each topic.</p>
            <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
              {(
                [
                  [1, '😬', 'Not yet', 'var(--color-peach)'],
                  [2, '🙂', 'Okay', 'var(--color-sky)'],
                  [3, '💪', 'Nailed it', 'var(--color-mint)'],
                ] as const
              ).map(([r, emoji, label, color]) => (
                <div key={r} className="rounded-xl border-2 border-ink p-3" style={{ background: color }}>
                  <div className="text-2xl">{emoji}</div>
                  <div className="font-display text-2xl font-bold">{ratings[r]}</div>
                  <div className="text-xs font-medium text-ink-soft">{label}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="nb-card p-5">
            <h2 className="text-xl font-bold">Needed another go</h2>
            <p className="mt-1 text-sm text-ink-soft">Worth a quick look the night before.</p>
            {retries.length === 0 ? (
              <p className="mt-3 text-sm text-muted">None yet.</p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {retries.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm">
                    <span className="truncate font-semibold">{t.title}</span>
                    <span className="shrink-0 text-ink-soft">{isDone(progress, t.id) ? `✓ after ${progress[t.id]?.attempts} goes` : '↺ in wheel'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {dodged.length > 0 && (
            <section className="nb-card p-5">
              <h2 className="text-xl font-bold">Most dodged 👀</h2>
              <p className="mt-1 text-sm text-ink-soft">You keep tapping "Not now" on these.</p>
              <ul className="mt-3 grid gap-2">
                {dodged.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm">
                    <span className="truncate font-semibold">{TOPIC_BY_ID[t.id].title}</span>
                    <span className="shrink-0 text-ink-soft">skipped {progress[t.id]?.skips}×</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
