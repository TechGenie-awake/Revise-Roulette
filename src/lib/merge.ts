// Shared by the browser and the API: how two copies of someone's progress combine.
// Rules: newest change per topic wins, sessions are a union, and a reset drops everything older than it.
import type { Plan, StudySession, TopicProgress } from './types';

export interface SyncState {
  plan: Plan | null;
  progress: Record<string, TopicProgress>;
  sessions: StudySession[];
  /** Last "Reset all progress"; anything older is discarded */
  resetAt: number;
}

export function mergePlan(a: Plan | null, b: Plan | null): Plan | null {
  if (!a) return b;
  if (!b) return a;
  // A fresh device that hasn't finished setup must never overwrite a real plan
  if (a.onboarded !== b.onboarded) return a.onboarded ? a : b;
  return b.updatedAt > a.updatedAt ? b : a;
}

export function mergeProgress(a: Record<string, TopicProgress>, b: Record<string, TopicProgress>): Record<string, TopicProgress> {
  const out = { ...a };
  for (const [id, p] of Object.entries(b)) {
    if (!out[id] || p.updatedAt > out[id].updatedAt) out[id] = p;
  }
  return out;
}

export function mergeSessions(a: StudySession[], b: StudySession[]): StudySession[] {
  const byId = new Map(a.map((s) => [s.id, s]));
  for (const s of b) if (!byId.has(s.id)) byId.set(s.id, s);
  return [...byId.values()].sort((x, y) => x.startedAt - y.startedAt);
}

export function dropBefore(state: SyncState, resetAt: number): SyncState {
  if (!resetAt) return state;
  return {
    ...state,
    resetAt: Math.max(state.resetAt, resetAt),
    progress: Object.fromEntries(Object.entries(state.progress).filter(([, p]) => p.updatedAt > resetAt)),
    sessions: state.sessions.filter((s) => s.endedAt > resetAt),
  };
}

export function mergeState(a: SyncState, b: SyncState): SyncState {
  const resetAt = Math.max(a.resetAt, b.resetAt);
  const x = dropBefore(a, resetAt);
  const y = dropBefore(b, resetAt);
  return {
    plan: mergePlan(x.plan, y.plan),
    progress: mergeProgress(x.progress, y.progress),
    sessions: mergeSessions(x.sessions, y.sessions),
    resetAt,
  };
}
