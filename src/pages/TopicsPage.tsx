import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { CHAPTERS, TOPICS, isSymptomTopic } from '../data/ophthalmology';
import { Icon, ProgressBar, TierBadge } from '../components/ui';
import { isDone, needsAgain, symptomUnlocked } from '../lib/plan';
import { unlockAudio } from '../lib/sound';
import { useStore, useToast } from '../lib/store';
import type { Rating, Topic } from '../lib/types';

type Filter = 'left' | 'again' | 'done' | 'all';

export default function TopicsPage() {
  const plan = useStore((s) => s.plan);
  const progress = useStore((s) => s.progress);
  const active = useStore((s) => s.active);
  const { markDone, undoDone, startSession } = useStore.getState();
  const showToast = useToast((s) => s.show);
  const navigate = useNavigate();

  const [filter, setFilter] = useState<Filter>('left');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  /** Topic whose "Mark done" is waiting for a confidence rating */
  const [rating, setRating] = useState<string | null>(null);

  const finishManually = (t: Topic, r: Rating) => {
    markDone(t.id, r);
    setRating(null);
    showToast(`${r === 3 ? '💪' : '🙂'} ${t.short} marked done`);
  };

  const unlocked = symptomUnlocked(plan, progress);
  const counts = {
    left: TOPICS.filter((t) => !isDone(progress, t.id)).length,
    again: TOPICS.filter((t) => needsAgain(progress[t.id])).length,
    done: TOPICS.filter((t) => isDone(progress, t.id)).length,
    all: TOPICS.length,
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOPICS.filter((t) => {
      if (filter === 'left' && isDone(progress, t.id)) return false;
      if (filter === 'done' && !isDone(progress, t.id)) return false;
      if (filter === 'again' && !needsAgain(progress[t.id])) return false;
      if (!q) return true;
      return t.title.toLowerCase().includes(q) || t.asks.some((a) => a.text.toLowerCase().includes(q));
    });
  }, [filter, query, progress]);

  const studyNow = (t: Topic) => {
    unlockAudio();
    startSession(t.id);
    navigate('/session');
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Topics</h1>
      <p className="mt-1 text-ink-soft">Every topic from the PYQ checklist, most asked first in each chapter.</p>

      <div className="nb-seg mt-5" role="group" aria-label="Filter topics">
        {(
          [
            ['left', 'Left'],
            ['again', '↺ Again'],
            ['done', '✓ Done'],
            ['all', 'All'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>
            {label} <span className="text-ink-soft">{counts[id]}</span>
          </button>
        ))}
      </div>

      <label className="relative mt-3 block">
        <span className="sr-only">Search topics</span>
        <Icon name="search" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input className="nb-input pl-10" placeholder="Search e.g. hypopyon, WHO, case…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      <div className="mt-6 grid gap-6">
        {CHAPTERS.map((ch) => {
          const all = TOPICS.filter((t) => t.chapter === ch.no);
          const shown = visible.filter((t) => t.chapter === ch.no);
          if (shown.length === 0) return null;
          const done = all.filter((t) => isDone(progress, t.id)).length;
          const locked = ch.symptom && !unlocked;
          return (
            <section key={ch.no}>
              <div className="mb-2.5 flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-ink font-display font-bold" style={{ background: ch.color }}>
                  {ch.no}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="flex items-center gap-1.5 truncate text-lg font-bold">
                    {ch.name} {locked && <Icon name="lock" size={16} />}
                  </h2>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="w-24">
                      <ProgressBar value={done / all.length} height={10} color={ch.color} />
                    </div>
                    <span className="text-xs font-semibold text-ink-soft">
                      {done}/{all.length}
                    </span>
                  </div>
                </div>
              </div>

              <ul className="grid gap-2.5">
                {shown.map((t) => {
                  const p = progress[t.id];
                  const doneT = isDone(progress, t.id);
                  const again = needsAgain(p);
                  const expanded = open === t.id;
                  return (
                    <li key={t.id} className="nb-card overflow-hidden" style={{ boxShadow: expanded ? undefined : 'var(--shadow-nb-sm)' }}>
                      <button className="flex w-full items-center gap-3 p-3.5 text-left" onClick={() => setOpen(expanded ? null : t.id)} aria-expanded={expanded}>
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-ink"
                          style={{ background: doneT ? 'var(--color-mint)' : again ? 'var(--color-peach)' : 'var(--color-paper)' }}
                          aria-label={doneT ? 'Done' : again ? 'Needs another go' : 'Not done'}
                        >
                          {doneT ? <Icon name="check" size={18} /> : again ? '↺' : ''}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block font-semibold ${doneT ? 'text-ink-soft line-through decoration-2' : ''}`}>{t.title}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-1.5">
                            <TierBadge tier={t.tier} />
                            <span className="text-xs font-medium text-muted">asked {t.qs}×</span>
                            {p?.lastRating === 3 && <span className="text-xs">💪</span>}
                          </span>
                        </span>
                        <span className={`text-xl transition-transform ${expanded ? 'rotate-90' : ''}`} aria-hidden="true">
                          ›
                        </span>
                      </button>

                      {expanded && (
                        <div className="border-t-2 border-ink bg-cream/60 p-3.5">
                          <ul className="grid gap-1.5">
                            {t.asks.map((a) => (
                              <li key={a.text} className="flex gap-2 text-sm">
                                <b className="w-7 shrink-0 font-display">{a.count}×</b>
                                <span>
                                  {a.text} <span className="text-xs text-muted">· {a.years}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                          {rating === t.id ? (
                            <div className="mt-4">
                              <p className="mb-2 font-display font-bold">How well do you know it?</p>
                              <div className="flex flex-wrap gap-2.5">
                                <button className="nb-btn min-h-11 flex-1 whitespace-nowrap px-3 text-sm" style={{ background: 'var(--color-sky)' }} onClick={() => finishManually(t, 2)}>
                                  🙂 Okay
                                </button>
                                <button className="nb-btn min-h-11 flex-1 whitespace-nowrap px-3 text-sm" style={{ background: 'var(--color-mint)' }} onClick={() => finishManually(t, 3)}>
                                  💪 Nailed it
                                </button>
                                <button className="nb-btn min-h-11 px-3 text-sm" onClick={() => setRating(null)}>
                                  Cancel
                                </button>
                              </div>
                              <p className="mt-2 text-xs text-muted">Not sure yet? Cancel and tap Study now instead.</p>
                            </div>
                          ) : (
                          <div className="mt-4 flex flex-wrap gap-2.5">
                            {!doneT && (
                              <button className="nb-btn min-h-11 flex-1 text-sm" style={{ background: 'var(--color-mint)' }} disabled={!!active} onClick={() => studyNow(t)}>
                                <Icon name="play" size={16} /> Study now
                              </button>
                            )}
                            {doneT ? (
                              <button
                                className="nb-btn min-h-11 flex-1 text-sm"
                                onClick={() => {
                                  undoDone(t.id);
                                  showToast(`${t.short} is back in the wheel`);
                                }}
                              >
                                Undo · put back in wheel
                              </button>
                            ) : (
                              <button className="nb-btn min-h-11 flex-1 text-sm" onClick={() => setRating(t.id)}>
                                <Icon name="check" size={16} /> Mark done
                              </button>
                            )}
                          </div>
                          )}
                          {active && !doneT && <p className="mt-2 text-xs text-muted">Finish your current topic to start another.</p>}
                          {isSymptomTopic(t) && !unlocked && !doneT && (
                            <p className="mt-2 text-xs text-muted">Not on the wheel yet (symptom round), but you can study it now.</p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
        {visible.length === 0 && (
          <div className="nb-card p-8 text-center text-ink-soft">
            {filter === 'again' ? 'Nothing to redo. Every topic you rated went well 🎉' : filter === 'done' ? 'Nothing done yet. Go spin!' : 'No topics match that search.'}
          </div>
        )}
      </div>
    </div>
  );
}
