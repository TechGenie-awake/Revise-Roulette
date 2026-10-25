import { CHAPTER_BY_NO, TOPICS, isSymptomTopic } from '../data/ophthalmology';
import type { Minutes, Plan, Tier, TierMinutes, Topic, TopicProgress } from './types';

export const TIERS: Tier[] = ['vhigh', 'high', 'moderate', 'low'];

export const TIER_LABEL: Record<Tier, string> = {
  vhigh: '★ Very high',
  high: '★ High',
  moderate: 'Moderate',
  low: 'Low',
};

export const TIER_COLOR: Record<Tier, string> = {
  vhigh: '#FF9AAE',
  high: '#FFC48C',
  moderate: '#A9D1FF',
  low: '#E7E2DA',
};

/** Slice size on the weighted wheel */
export const TIER_WEIGHT: Record<Tier, number> = { vhigh: 4, high: 3, moderate: 2, low: 1 };

export const TIMING_PRESETS: Record<'smart' | 'classic', TierMinutes> = {
  smart: {
    vhigh: { learn: 30, talk: 20 },
    high: { learn: 20, talk: 20 },
    moderate: { learn: 15, talk: 10 },
    low: { learn: 10, talk: 5 },
  },
  classic: {
    vhigh: { learn: 20, talk: 20 },
    high: { learn: 20, talk: 20 },
    moderate: { learn: 20, talk: 20 },
    low: { learn: 20, talk: 20 },
  },
};

export function tierMinutes(plan: Plan): TierMinutes {
  return plan.timingMode === 'custom' ? plan.custom : TIMING_PRESETS[plan.timingMode];
}

export function minutesFor(plan: Plan, tier: Tier): Minutes {
  return tierMinutes(plan)[tier];
}

export function totalPlannedMinutes(minutes: TierMinutes, topics: Topic[] = TOPICS): number {
  return topics.reduce((sum, t) => sum + minutes[t.tier].learn + minutes[t.tier].talk, 0);
}

// ── Dates ──

export function toDateStr(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysStr(s: string, days: number): string {
  const d = parseDateStr(s);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

export function startOfDay(t: number): Date {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 1-based plan day for a timestamp (day 1 = start date) */
export function dayOf(plan: Plan, t: number): number {
  const diff = startOfDay(t).getTime() - parseDateStr(plan.startDate).getTime();
  return Math.round(diff / 86_400_000) + 1;
}

export function dayIndex(plan: Plan, t = Date.now()): number {
  return Math.max(1, dayOf(plan, t));
}

export function isToday(ts: number | undefined, now = Date.now()): boolean {
  return ts !== undefined && startOfDay(ts).getTime() === startOfDay(now).getTime();
}

// ── Wheel & progress ──

export function isDone(progress: Record<string, TopicProgress>, id: string): boolean {
  return progress[id]?.status === 'done';
}

/** Symptom round opens the day before the last day (Day 4 of 5), or once all chapter topics are done */
export function symptomUnlockDay(plan: Plan): number {
  return Math.max(1, plan.days - 1);
}

export function symptomUnlocked(plan: Plan, progress: Record<string, TopicProgress>, t = Date.now()): boolean {
  if (plan.symptomRule === 'open') return true;
  if (dayIndex(plan, t) >= symptomUnlockDay(plan)) return true;
  return TOPICS.filter((x) => !isSymptomTopic(x)).every((x) => isDone(progress, x.id));
}

/** Topics that failed a rating and are waiting for another go */
export function needsAgain(p: TopicProgress | undefined): boolean {
  return !!p && p.status === 'pending' && p.attempts > 0;
}

// Stable mixed order so neighbouring slices are mostly different chapters
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const WHEEL_ORDER: Topic[] = [...TOPICS].sort((a, b) => hash(a.id) - hash(b.id));

export interface WheelEntry {
  topic: Topic;
  weight: number;
  again: boolean;
  color: string;
}

export function wheelEntries(plan: Plan, progress: Record<string, TopicProgress>, t = Date.now()): WheelEntry[] {
  const unlocked = symptomUnlocked(plan, progress, t);
  return WHEEL_ORDER.filter((x) => !isDone(progress, x.id) && (unlocked || !isSymptomTopic(x))).map((x) => {
    const again = needsAgain(progress[x.id]);
    const base = plan.wheelMode === 'weighted' ? TIER_WEIGHT[x.tier] : 1;
    return {
      topic: x,
      // A topic she wasn't happy with comes back, but with a smaller slice so new topics still get their turn
      weight: again ? base * 0.5 : base,
      again,
      color: CHAPTER_BY_NO[x.chapter].color,
    };
  });
}

export interface Pace {
  day: number;
  daysLeft: number;
  remaining: number;
  doneToday: number;
  todayTarget: number;
  minutesLeft: number;
  minutesPerDayLeft: number;
}

export function pace(plan: Plan, progress: Record<string, TopicProgress>, t = Date.now()): Pace {
  const day = dayIndex(plan, t);
  const daysLeft = Math.max(1, plan.days - day + 1);
  const pending = TOPICS.filter((x) => !isDone(progress, x.id));
  const doneToday = TOPICS.filter((x) => isDone(progress, x.id) && isToday(progress[x.id]?.completedAt, t)).length;
  const minutesLeft = totalPlannedMinutes(tierMinutes(plan), pending);
  return {
    day,
    daysLeft,
    remaining: pending.length,
    doneToday,
    todayTarget: Math.ceil((pending.length + doneToday) / daysLeft),
    minutesLeft,
    minutesPerDayLeft: Math.round(minutesLeft / daysLeft),
  };
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
