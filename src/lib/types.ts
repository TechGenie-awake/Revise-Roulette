export type Tier = 'vhigh' | 'high' | 'moderate' | 'low';

export interface Ask {
  text: string;
  count: number;
  years: string;
}

export interface Topic {
  id: string;
  chapter: number;
  title: string;
  /** Short label that fits on a wheel slice */
  short: string;
  tier: Tier;
  /** Number of past questions that came from this topic */
  qs: number;
  asks: Ask[];
}

export interface Chapter {
  no: number;
  name: string;
  qs: number;
  color: string;
  /** Symptom-based chapter: unlocks later in the plan */
  symptom?: boolean;
}

export type TimingMode = 'smart' | 'classic' | 'custom';
export interface Minutes {
  learn: number;
  talk: number;
}
export type TierMinutes = Record<Tier, Minutes>;

export interface Plan {
  name: string;
  /** Local date, YYYY-MM-DD */
  startDate: string;
  days: number;
  timingMode: TimingMode;
  custom: TierMinutes;
  wheelMode: 'weighted' | 'equal';
  symptomRule: 'later' | 'open';
  sound: boolean;
  onboarded: boolean;
  updatedAt: number;
}

/** 1 = not yet (back into the wheel), 2 = okay, 3 = nailed it */
export type Rating = 1 | 2 | 3;

export interface TopicProgress {
  status: 'pending' | 'done';
  /** Completed study sessions (any rating) */
  attempts: number;
  /** Times the wheel landed on it and she tapped "Not now" */
  skips: number;
  lastRating?: Rating;
  completedAt?: number;
  /** Marked done by hand from the Topics list */
  manual?: boolean;
  updatedAt: number;
}

export interface StudySession {
  id: string;
  topicId: string;
  startedAt: number;
  endedAt: number;
  learnSec: number;
  talkSec: number;
  outcome: 'completed' | 'abandoned';
  rating?: Rating;
  covered: number;
  totalAsks: number;
}

export type Phase = 'learn' | 'talk' | 'rate';

export interface ActiveSession {
  topicId: string;
  startedAt: number;
  phase: Phase;
  /** Planned length of the current phase, including any +5 min */
  durationMs: number;
  /** Time spent in the current phase before the current run */
  elapsedMs: number;
  /** Set while the timer runs; null when paused or time is up */
  runningSince: number | null;
  timeUp: boolean;
  learnMs: number;
  talkMs: number;
  /** Indexes of asks she ticked as covered while talking */
  covered: number[];
}
