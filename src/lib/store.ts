import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TOPIC_BY_ID } from '../data/ophthalmology';
import { TIMING_PRESETS, minutesFor, toDateStr } from './plan';
import type { SyncState } from './merge';
import type { ActiveSession, Plan, Rating, StudySession, TopicProgress } from './types';

export function newId(): string {
  // crypto.randomUUID is missing on plain-http LAN URLs (testing on the iPad), so fall back
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultPlan(): Plan {
  return {
    name: '',
    startDate: toDateStr(new Date()),
    days: 5,
    timingMode: 'smart',
    custom: structuredClone(TIMING_PRESETS.smart),
    wheelMode: 'weighted',
    symptomRule: 'later',
    sound: true,
    onboarded: false,
    updatedAt: Date.now(),
  };
}

const emptyProgress = (): TopicProgress => ({ status: 'pending', attempts: 0, skips: 0, updatedAt: Date.now() });

/** Time spent in the current phase, capped at its planned length */
export function phaseElapsed(a: ActiveSession, now = Date.now()): number {
  const running = a.runningSince ? now - a.runningSince : 0;
  return Math.min(a.durationMs, a.elapsedMs + running);
}

export function phaseRemaining(a: ActiveSession, now = Date.now()): number {
  return Math.max(0, a.durationMs - phaseElapsed(a, now));
}

interface State {
  plan: Plan;
  progress: Record<string, TopicProgress>;
  sessions: StudySession[];
  active: ActiveSession | null;
  /** When progress was last reset; synced so a reset on one device clears the others */
  resetAt: number;

  updatePlan: (patch: Partial<Plan>) => void;
  skip: (topicId: string) => void;
  markDone: (topicId: string, rating: Rating) => void;
  undoDone: (topicId: string) => void;
  resetProgress: () => void;

  startSession: (topicId: string) => void;
  pause: () => void;
  resume: () => void;
  addMinutes: (min: number) => void;
  timeUp: () => void;
  finishPhase: () => void;
  toggleCovered: (index: number) => void;
  rate: (rating: Rating) => void;
  abandon: () => void;

  applyRemote: (state: SyncState) => void;
  /** Clears this device (used on sign-out; the account keeps the data) */
  wipeLocal: () => void;
}

function patchProgress(
  progress: Record<string, TopicProgress>,
  id: string,
  patch: (p: TopicProgress) => Partial<TopicProgress>,
): Record<string, TopicProgress> {
  const current = progress[id] ?? emptyProgress();
  return { ...progress, [id]: { ...current, ...patch(current), updatedAt: Date.now() } };
}

function closeSession(a: ActiveSession, outcome: StudySession['outcome'], rating?: Rating): StudySession {
  const now = Date.now();
  const learnMs = a.phase === 'learn' ? phaseElapsed(a, now) : a.learnMs;
  const talkMs = a.phase === 'talk' ? phaseElapsed(a, now) : a.talkMs;
  return {
    id: newId(),
    topicId: a.topicId,
    startedAt: a.startedAt,
    endedAt: now,
    learnSec: Math.round(learnMs / 1000),
    talkSec: Math.round(talkMs / 1000),
    outcome,
    rating,
    covered: a.covered.length,
    totalAsks: TOPIC_BY_ID[a.topicId]?.asks.length ?? 0,
  };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      plan: defaultPlan(),
      progress: {},
      sessions: [],
      active: null,
      resetAt: 0,

      updatePlan: (patch) => set((s) => ({ plan: { ...s.plan, ...patch, updatedAt: Date.now() } })),

      skip: (topicId) => set((s) => ({ progress: patchProgress(s.progress, topicId, (p) => ({ skips: p.skips + 1 })) })),

      markDone: (topicId, rating) =>
        set((s) => ({
          progress: patchProgress(s.progress, topicId, () => ({ status: 'done', completedAt: Date.now(), manual: true, lastRating: rating })),
        })),

      undoDone: (topicId) =>
        set((s) => ({
          progress: patchProgress(s.progress, topicId, () => ({ status: 'pending', completedAt: undefined, manual: false })),
        })),

      resetProgress: () => set({ progress: {}, sessions: [], active: null, resetAt: Date.now() }),

      startSession: (topicId) => {
        const topic = TOPIC_BY_ID[topicId];
        if (!topic || get().active) return;
        const now = Date.now();
        set({
          active: {
            topicId,
            startedAt: now,
            phase: 'learn',
            durationMs: minutesFor(get().plan, topic.tier).learn * 60_000,
            elapsedMs: 0,
            runningSince: now,
            timeUp: false,
            learnMs: 0,
            talkMs: 0,
            covered: [],
          },
        });
      },

      pause: () => {
        const a = get().active;
        if (!a || !a.runningSince) return;
        set({ active: { ...a, elapsedMs: phaseElapsed(a), runningSince: null } });
      },

      resume: () => {
        const a = get().active;
        if (!a || a.runningSince || a.phase === 'rate') return;
        if (phaseRemaining(a) <= 0) return;
        set({ active: { ...a, runningSince: Date.now(), timeUp: false } });
      },

      addMinutes: (min) => {
        const a = get().active;
        if (!a || a.phase === 'rate') return;
        const wasUp = a.timeUp;
        set({
          active: {
            ...a,
            durationMs: a.durationMs + min * 60_000,
            timeUp: false,
            // Adding time after the chime restarts the clock straight away
            runningSince: wasUp ? Date.now() : a.runningSince,
          },
        });
      },

      timeUp: () => {
        const a = get().active;
        if (!a || !a.runningSince) return;
        set({ active: { ...a, elapsedMs: a.durationMs, runningSince: null, timeUp: true } });
      },

      finishPhase: () => {
        const a = get().active;
        if (!a) return;
        const now = Date.now();
        if (a.phase === 'learn') {
          const topic = TOPIC_BY_ID[a.topicId];
          set({
            active: {
              ...a,
              phase: 'talk',
              learnMs: phaseElapsed(a, now),
              durationMs: minutesFor(get().plan, topic.tier).talk * 60_000,
              elapsedMs: 0,
              runningSince: now,
              timeUp: false,
            },
          });
        } else if (a.phase === 'talk') {
          set({ active: { ...a, phase: 'rate', talkMs: phaseElapsed(a, now), runningSince: null, timeUp: false } });
        }
      },

      toggleCovered: (index) => {
        const a = get().active;
        if (!a) return;
        const covered = a.covered.includes(index) ? a.covered.filter((i) => i !== index) : [...a.covered, index];
        set({ active: { ...a, covered } });
      },

      rate: (rating) => {
        const a = get().active;
        if (!a) return;
        const session = closeSession(a, 'completed', rating);
        const satisfied = rating >= 2;
        set((s) => ({
          active: null,
          sessions: [...s.sessions, session],
          progress: patchProgress(s.progress, a.topicId, (p) => ({
            attempts: p.attempts + 1,
            lastRating: rating,
            status: satisfied ? 'done' : 'pending',
            completedAt: satisfied ? Date.now() : undefined,
            manual: false,
          })),
        }));
      },

      abandon: () => {
        const a = get().active;
        if (!a) return;
        const session = closeSession(a, 'abandoned');
        set((s) => ({ active: null, sessions: [...s.sessions, session] }));
      },

      applyRemote: (remote) =>
        set((s) => ({
          plan: remote.plan ?? s.plan,
          progress: remote.progress,
          sessions: remote.sessions,
          resetAt: remote.resetAt,
        })),

      wipeLocal: () => set({ plan: defaultPlan(), progress: {}, sessions: [], active: null, resetAt: 0 }),
    }),
    {
      name: 'revise-roulette:v1',
      version: 1,
      partialize: (s) => ({ plan: s.plan, progress: s.progress, sessions: s.sessions, active: s.active, resetAt: s.resetAt }),
    },
  ),
);

// Non-persisted UI toast
interface ToastState {
  message: string | null;
  show: (message: string) => void;
  clear: () => void;
}
let toastTimer: ReturnType<typeof setTimeout> | undefined;
export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    clearTimeout(toastTimer);
    set({ message });
    toastTimer = setTimeout(() => set({ message: null }), 3500);
  },
  clear: () => set({ message: null }),
}));
