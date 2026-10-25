import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import confetti from 'canvas-confetti';
import { TOPIC_BY_ID } from '../data/ophthalmology';
import { useNow } from '../components/Layout';
import { ChapterChip, ConfirmModal, Icon, TierBadge, formatClock } from '../components/ui';
import { unlockAudio } from '../lib/sound';
import { maxRating, phaseElapsed, phaseRemaining, useStore, useToast } from '../lib/store';
import type { Phase, Rating } from '../lib/types';

const PHASES: { id: Phase; label: string }[] = [
  { id: 'learn', label: '1 · Learn' },
  { id: 'talk', label: '2 · Talk' },
  { id: 'rate', label: '3 · Rate' },
];

const RATINGS: { rating: Rating; emoji: string; title: string; body: string; color: string }[] = [
  { rating: 1, emoji: '😬', title: 'Not yet', body: 'Goes back into the wheel for another go', color: 'var(--color-peach)' },
  { rating: 2, emoji: '🙂', title: 'Okay', body: 'I can write this. Remove it from the wheel', color: 'var(--color-sky)' },
  { rating: 3, emoji: '💪', title: 'Nailed it', body: 'Could teach it. Remove it from the wheel', color: 'var(--color-mint)' },
];

function TimerRing({ fraction, children, alert }: { fraction: number; children: React.ReactNode; alert: boolean }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[11.5rem] sm:max-w-[15rem]">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth="9" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={alert ? 'var(--color-rose)' : 'var(--color-lilac)'} strokeWidth="6" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="6"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fraction)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.25s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export default function SessionPage() {
  const active = useStore((s) => s.active);
  const { pause, resume, addMinutes, finishPhase, goBack, toggleCovered, rate, abandon } = useStore.getState();
  const showToast = useToast((s) => s.show);
  const navigate = useNavigate();
  const now = useNow(!!active?.runningSince, 250);
  const [confirmQuit, setConfirmQuit] = useState(false);

  if (!active) return <Navigate to="/" replace />;
  const topic = TOPIC_BY_ID[active.topicId];
  if (!topic) return <Navigate to="/" replace />;

  const remaining = phaseRemaining(active, now);
  const fraction = active.durationMs ? phaseElapsed(active, now) / active.durationMs : 0;
  const running = !!active.runningSince;
  const phaseIdx = PHASES.findIndex((p) => p.id === active.phase);
  const total = topic.asks.length;
  const best = maxRating(active.covered.length, total);
  const missed = topic.asks.filter((_, i) => !active.covered.includes(i));
  const needForOkay = Math.ceil(total / 2);
  const lockReason = (r: Rating) =>
    r === 3 ? `Cover all ${total} points to unlock` : `Cover at least ${needForOkay} of ${total} points to unlock`;

  const onRate = (rating: Rating) => {
    rate(rating);
    if (rating >= 2) {
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#FFC8DD', '#BDE0FE', '#B8F2D9', '#FFF1A8', '#D9C8FF', '#FFD3B6'],
        disableForReducedMotion: true,
      });
      showToast(`✓ ${topic.short} is done and off the wheel`);
    } else {
      showToast(`↺ ${topic.short} is back in the wheel`);
    }
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap gap-2">
          <ChapterChip chapter={topic.chapter} />
          <TierBadge tier={topic.tier} />
        </div>
        <button onClick={() => setConfirmQuit(true)} className="shrink-0 text-sm font-semibold text-ink-soft underline underline-offset-4">
          Quit
        </button>
      </div>
      <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{topic.title}</h1>
      <p className="mt-1 text-ink-soft">Asked {topic.qs}× in past papers</p>

      <ol className="mt-5 grid grid-cols-3 gap-2" aria-label="Steps">
        {PHASES.map((p, i) => (
          <li
            key={p.id}
            className="rounded-xl border-2 border-ink py-2 text-center font-display text-sm font-bold"
            style={{
              background: i === phaseIdx ? 'var(--color-butter)' : i < phaseIdx ? 'var(--color-mint)' : 'var(--color-paper)',
              boxShadow: i === phaseIdx ? 'var(--shadow-nb-sm)' : undefined,
            }}
            aria-current={i === phaseIdx ? 'step' : undefined}
          >
            {i < phaseIdx ? '✓ ' : ''}
            {p.label}
          </li>
        ))}
      </ol>

      {active.phase === 'rate' ? (
        <div className="nb-card mt-6 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">How did that go?</h2>
              <p className="mt-1 text-ink-soft">
                You covered <b className="text-ink">{active.covered.length} of {total}</b> points out loud.
              </p>
            </div>
            <button className="nb-btn min-h-11 text-sm" onClick={goBack}>
              ← Back to Talk
            </button>
          </div>

          {missed.length > 0 && (
            <div className="mt-4 rounded-xl border-2 border-ink bg-peach/50 p-3.5">
              <p className="text-sm font-bold">Not covered yet</p>
              <ul className="mt-1.5 grid gap-1 text-sm">
                {missed.map((a) => (
                  <li key={a.text}>• {a.text}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {RATINGS.map((r) => {
              const locked = r.rating > best;
              return (
                <button
                  key={r.rating}
                  onClick={() => onRate(r.rating)}
                  disabled={locked}
                  className="nb-btn h-auto justify-start gap-4 p-4 text-left sm:flex-col sm:items-center sm:gap-1 sm:text-center"
                  style={{ background: locked ? 'var(--color-paper)' : r.color }}
                >
                  <span className="text-4xl">{locked ? '🔒' : r.emoji}</span>
                  <span>
                    <span className="block text-xl">{r.title}</span>
                    <span className="block font-sans text-sm font-medium text-ink-soft">{locked ? lockReason(r.rating) : r.body}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
          <div className="nb-card p-5 lg:sticky lg:top-6" style={{ background: active.timeUp ? 'var(--color-butter)' : undefined }}>
            <TimerRing fraction={fraction} alert={active.timeUp}>
              <span className="text-xs font-bold uppercase tracking-widest text-ink-soft">
                {active.phase === 'learn' ? 'Learn' : 'Talk'}
              </span>
              <span className="font-display text-4xl font-bold tabular-nums sm:text-5xl" role="timer" aria-live="off">
                {formatClock(remaining)}
              </span>
              <span className="mt-0.5 text-sm font-semibold text-ink-soft">
                {active.timeUp ? "Time's up! ⏰" : running ? 'running' : 'paused'}
              </span>
            </TimerRing>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {active.timeUp ? (
                <span className="col-span-1" />
              ) : running ? (
                <button className="nb-btn" onClick={pause}>
                  <Icon name="pause" size={18} /> Pause
                </button>
              ) : (
                <button className="nb-btn" onClick={() => { unlockAudio(); resume(); }}>
                  <Icon name="play" size={18} /> Resume
                </button>
              )}
              <button className="nb-btn" onClick={() => addMinutes(5)}>
                <Icon name="plus" size={18} /> 5 min
              </button>
            </div>
            <button className="nb-btn mt-3 w-full text-lg" style={{ background: 'var(--color-mint)' }} onClick={finishPhase}>
              {active.phase === 'learn' ? 'Done learning → Talk' : 'Done talking → Rate'}
            </button>
            {active.phase === 'talk' && (
              <button className="mt-3 w-full text-sm font-semibold text-ink-soft underline underline-offset-4" onClick={goBack}>
                ← Back to Learn
              </button>
            )}
          </div>

          <div className="nb-card p-5">
            {active.phase === 'learn' ? (
              <>
                <h2 className="text-xl font-bold">What examiners asked</h2>
                <p className="mt-1 text-sm text-ink-soft">Most asked first. Nail the top ones before the rest.</p>
                <ul className="mt-4 grid gap-2.5">
                  {topic.asks.map((a, i) => (
                    <li key={a.text} className="flex gap-3 rounded-xl border-2 border-ink p-3" style={{ background: i < 2 && a.count > 1 ? 'var(--color-butter)' : 'var(--color-paper)' }}>
                      <span className="grid h-9 min-w-9 shrink-0 place-items-center rounded-lg border-2 border-ink bg-paper font-display font-bold">{a.count}×</span>
                      <span className="min-w-0">
                        <span className="block font-medium">{a.text}</span>
                        <span className="mt-0.5 block text-xs text-muted">{a.years}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-xl font-bold">Explain it out loud</h2>
                  <span className="nb-chip" style={{ background: 'var(--color-mint)' }}>
                    {active.covered.length}/{topic.asks.length}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">
                  Talk to a friend, a mirror or your phone camera. Tap each point once you've covered it. Cover half to unlock 🙂 Okay, and
                  all of them for 💪 Nailed it.
                </p>
                <ul className="mt-4 grid gap-2.5">
                  {topic.asks.map((a, i) => {
                    const done = active.covered.includes(i);
                    return (
                      <li key={a.text}>
                        <button
                          onClick={() => toggleCovered(i)}
                          aria-pressed={done}
                          className="flex w-full items-center gap-3 rounded-xl border-2 border-ink p-3 text-left transition-colors"
                          style={{ background: done ? 'var(--color-mint)' : 'var(--color-paper)' }}
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-ink bg-paper">
                            {done && <Icon name="check" size={18} />}
                          </span>
                          <span className={`font-medium ${done ? 'line-through decoration-2' : ''}`}>{a.text}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmQuit}
        title="Quit this topic?"
        body="It stays in the wheel. The time you've spent still counts in your stats."
        confirmLabel="Quit"
        danger
        onClose={() => setConfirmQuit(false)}
        onConfirm={() => {
          abandon();
          navigate('/');
        }}
      />
    </div>
  );
}
