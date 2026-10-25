import { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { TOPICS, TOPIC_BY_ID, isSymptomTopic } from '../data/ophthalmology';
import { Wheel, type WheelHandle, type WheelItem } from '../components/Wheel';
import { ChapterChip, Icon, Modal, ProgressBar, TierBadge } from '../components/ui';
import { formatMinutes, isDone, minutesFor, pace, symptomUnlockDay, symptomUnlocked, wheelEntries } from '../lib/plan';
import { playLand, playTick, unlockAudio } from '../lib/sound';
import { useStore, useToast } from '../lib/store';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Late night grind';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function WheelPage() {
  const plan = useStore((s) => s.plan);
  const progress = useStore((s) => s.progress);
  const active = useStore((s) => s.active);
  const startSession = useStore((s) => s.startSession);
  const skip = useStore((s) => s.skip);
  const showToast = useToast((s) => s.show);
  const navigate = useNavigate();

  const wheelRef = useRef<WheelHandle>(null);
  const [spinning, setSpinning] = useState(false);
  const [underPointer, setUnderPointer] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);

  const entries = useMemo(() => wheelEntries(plan, progress), [plan, progress]);
  const items = useMemo<WheelItem[]>(
    () => entries.map((e) => ({ id: e.topic.id, label: e.topic.short, color: e.color, weight: e.weight, again: e.again })),
    [entries],
  );
  const p = pace(plan, progress);
  const unlocked = symptomUnlocked(plan, progress);
  const lockedSymptoms = unlocked ? 0 : TOPICS.filter((t) => isSymptomTopic(t) && !isDone(progress, t.id)).length;
  const doneCount = TOPICS.length - p.remaining;

  const spinningRef = useRef(false);
  const onPass = useCallback(
    (id: string) => {
      setUnderPointer(id);
      if (plan.sound && spinningRef.current) playTick();
    },
    [plan.sound],
  );

  const spin = () => {
    unlockAudio();
    wheelRef.current?.spin();
  };

  const result = resultId ? TOPIC_BY_ID[resultId] : null;
  const resultMinutes = result ? minutesFor(plan, result.tier) : null;
  const resultAgain = result ? (progress[result.id]?.attempts ?? 0) > 0 : false;
  const pointerTopic = underPointer ? TOPIC_BY_ID[underPointer] : null;

  const notNow = () => {
    if (resultId) {
      skip(resultId);
      showToast('Back in the wheel — spin again!');
    }
    setResultId(null);
  };

  const start = () => {
    if (!resultId) return;
    unlockAudio();
    startSession(resultId);
    setResultId(null);
    navigate('/session');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
      <section className="flex flex-col items-center">
        <header className="mb-5 w-full">
          <p className="text-sm font-semibold text-ink-soft">
            {greeting()}
            {plan.name ? `, ${plan.name}` : ''} 👋
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="nb-chip" style={{ background: 'var(--color-lilac)' }}>
              Day {Math.min(p.day, plan.days)} of {plan.days}
              {p.day > plan.days ? ' · overtime' : ''}
            </span>
            <span className="nb-chip" style={{ background: 'var(--color-mint)' }}>
              {doneCount}/{TOPICS.length} done
            </span>
            <span className="nb-chip" style={{ background: p.doneToday >= p.todayTarget ? 'var(--color-mint)' : 'var(--color-peach)' }}>
              Today {p.doneToday}/{p.todayTarget}
              {p.doneToday >= p.todayTarget && p.todayTarget > 0 ? ' ✓' : ''}
            </span>
          </div>
        </header>

        {items.length > 0 ? (
          <>
            <Wheel
              ref={wheelRef}
              items={items}
              centerLabel={String(items.length)}
              onSpinStart={() => {
                spinningRef.current = true;
                setSpinning(true);
              }}
              onPass={onPass}
              onLand={(id) => {
                spinningRef.current = false;
                setSpinning(false);
                if (plan.sound) playLand();
                if ('vibrate' in navigator) navigator.vibrate?.(30);
                setTimeout(() => setResultId(id), 350);
              }}
            />

            <div className="mt-5 flex h-9 max-w-full items-center justify-center" aria-live="polite">
              {pointerTopic && (
                <span className="nb-chip max-w-full text-sm" style={{ background: spinning ? 'var(--color-paper)' : 'var(--color-butter)' }}>
                  <span className="truncate">{pointerTopic.title}</span>
                </span>
              )}
            </div>

            {active ? (
              <Link to="/session" className="nb-btn mt-4 w-full max-w-sm text-lg" style={{ background: 'var(--color-butter)' }}>
                Finish your current topic first →
              </Link>
            ) : (
              <button
                onClick={spin}
                disabled={spinning}
                className="nb-btn mt-4 w-full max-w-sm py-4 text-2xl tracking-[0.2em] shadow-nb-lg"
                style={{ background: 'var(--color-rose)', minHeight: 64 }}
              >
                {spinning ? 'SPINNING…' : 'SPIN'}
              </button>
            )}

            {lockedSymptoms > 0 && (
              <p className="mt-4 flex items-center gap-2 text-sm font-medium text-ink-soft">
                <Icon name="lock" size={16} /> Symptom round ({lockedSymptoms} topics) unlocks on Day {symptomUnlockDay(plan)}
              </p>
            )}
          </>
        ) : (
          <div className="nb-card w-full max-w-md animate-pop p-8 text-center" style={{ background: 'var(--color-mint)' }}>
            <div className="text-6xl">🎉</div>
            <h1 className="mt-3 text-3xl font-bold">Wheel cleared!</h1>
            <p className="mt-2 text-ink-soft">Every topic is done. You absolutely earned a break.</p>
            <Link to="/stats" className="nb-btn mt-5">
              See your stats
            </Link>
          </div>
        )}
      </section>

      <aside className="grid gap-4">
        <div className="nb-card p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold">Your progress</h2>
            <span className="font-display text-2xl font-bold">{Math.round((doneCount / TOPICS.length) * 100)}%</span>
          </div>
          <div className="mt-3">
            <ProgressBar value={doneCount / TOPICS.length} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border-2 border-ink bg-sky/60 p-3">
              <dt className="text-ink-soft">Left to revise</dt>
              <dd className="font-display text-xl font-bold">{formatMinutes(p.minutesLeft)}</dd>
            </div>
            <div className="rounded-xl border-2 border-ink bg-peach/60 p-3">
              <dt className="text-ink-soft">Per day from now</dt>
              <dd className="font-display text-xl font-bold">{formatMinutes(p.minutesPerDayLeft)}</dd>
            </div>
          </dl>
        </div>

        <div className="nb-card p-5">
          <h2 className="text-lg font-bold">How it works</h2>
          <ol className="mt-3 grid gap-2.5 text-sm">
            {[
              ['🎡', 'Spin', 'The wheel picks a topic. Bigger slices = asked more often.'],
              ['📖', 'Learn', 'Study it with the timer. The exact past questions are listed.'],
              ['🗣️', 'Talk', 'Explain it out loud. Tick each point as you cover it.'],
              ['✅', 'Rate', 'Happy with it? It leaves the wheel. Not yet? It comes back.'],
            ].map(([emoji, title, body]) => (
              <li key={title} className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-ink bg-butter text-lg">{emoji}</span>
                <span>
                  <b className="font-display">{title}.</b> <span className="text-ink-soft">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </aside>

      <Modal open={!!result} onClose={notNow} label="Spin result">
        {result && resultMinutes && (
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-wider text-ink-soft">The wheel says…</p>
              <button onClick={notNow} className="-mr-1 -mt-1 rounded-lg p-1" aria-label="Close">
                <Icon name="close" />
              </button>
            </div>
            <h2 className="mt-1 animate-pop text-3xl font-bold leading-tight">{result.title}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <ChapterChip chapter={result.chapter} />
              <TierBadge tier={result.tier} />
              {resultAgain && (
                <span className="nb-chip" style={{ background: 'var(--color-peach)' }}>
                  ↺ Another go
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border-2 border-ink bg-blush/60 p-2.5">
                <div className="font-display text-2xl font-bold">{result.qs}×</div>
                <div className="text-xs text-ink-soft">asked</div>
              </div>
              <div className="rounded-xl border-2 border-ink bg-sky/60 p-2.5">
                <div className="font-display text-2xl font-bold">{resultMinutes.learn}m</div>
                <div className="text-xs text-ink-soft">learn</div>
              </div>
              <div className="rounded-xl border-2 border-ink bg-mint/60 p-2.5">
                <div className="font-display text-2xl font-bold">{resultMinutes.talk}m</div>
                <div className="text-xs text-ink-soft">talk</div>
              </div>
            </div>

            <h3 className="mt-5 text-sm font-bold uppercase tracking-wider text-ink-soft">Most asked</h3>
            <ul className="mt-2 grid gap-1.5">
              {result.asks.slice(0, 4).map((a) => (
                <li key={a.text} className="flex gap-2 text-sm">
                  <b className="w-7 shrink-0 font-display">{a.count}×</b>
                  <span>{a.text}</span>
                </li>
              ))}
              {result.asks.length > 4 && <li className="pl-9 text-sm text-muted">+{result.asks.length - 4} more inside</li>}
            </ul>

            <div className="mt-6 flex gap-3">
              <button className="nb-btn flex-1" onClick={notNow}>
                Not now
              </button>
              <button className="nb-btn flex-[1.6] text-lg" style={{ background: 'var(--color-mint)' }} onClick={start}>
                <Icon name="play" size={18} /> Start learning
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
