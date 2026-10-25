import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { TOPIC_BY_ID } from '../data/ophthalmology';
import { playChime } from '../lib/sound';
import { phaseRemaining, useStore, useToast } from '../lib/store';
import { Icon, formatClock } from './ui';

const TABS = [
  { to: '/', label: 'Wheel', icon: 'wheel' as const },
  { to: '/topics', label: 'Topics', icon: 'list' as const },
  { to: '/stats', label: 'Stats', icon: 'chart' as const },
  { to: '/settings', label: 'Settings', icon: 'gear' as const },
];

/** Re-renders every `ms` while `enabled` */
export function useNow(enabled: boolean, ms = 250): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(Date.now()), ms);
    const onVisible = () => setNow(Date.now());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, ms]);
  return now;
}

/** Ends a phase when its time is up (on any screen) and keeps the screen awake while the timer runs */
function SessionWatcher() {
  const active = useStore((s) => s.active);
  const sound = useStore((s) => s.plan.sound);
  const timeUp = useStore((s) => s.timeUp);
  const running = !!active?.runningSince;
  const now = useNow(running, 500);

  useEffect(() => {
    if (active?.runningSince && phaseRemaining(active, now) <= 0) {
      timeUp();
      if (sound) playChime();
    }
  }, [active, now, sound, timeUp]);

  useEffect(() => {
    if (!running || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        if (document.visibilityState === 'visible') lock = await navigator.wakeLock.request('screen');
        if (cancelled) void lock?.release();
      } catch {
        // Not allowed (e.g. low battery mode) — the timer still works
      }
    };
    void acquire();
    const onVisible = () => document.visibilityState === 'visible' && void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release();
    };
  }, [running]);

  return null;
}

function SessionBanner() {
  const active = useStore((s) => s.active);
  const location = useLocation();
  const navigate = useNavigate();
  const now = useNow(!!active?.runningSince, 1000);
  if (!active || location.pathname === '/session') return null;
  const topic = TOPIC_BY_ID[active.topicId];
  const label =
    active.phase === 'rate' ? 'Rate it' : active.timeUp ? "Time's up" : active.runningSince ? formatClock(phaseRemaining(active, now)) : 'Paused';
  return (
    <button
      onClick={() => navigate('/session')}
      className="nb-card mb-4 flex w-full items-center gap-3 bg-butter px-4 py-3 text-left"
      style={{ background: 'var(--color-butter)' }}
    >
      <Icon name="clock" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {active.phase === 'learn' ? 'Learning' : active.phase === 'talk' ? 'Talking' : 'Almost done'}
        </span>
        <span className="block truncate font-display font-bold">{topic?.short}</span>
      </span>
      <span className="font-display text-lg font-bold tabular-nums">{label}</span>
    </button>
  );
}

function Toast() {
  const message = useToast((s) => s.message);
  const clear = useToast((s) => s.clear);
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 md:bottom-8">
      <button onClick={clear} className="nb-card pointer-events-auto animate-pop px-4 py-3 font-semibold" style={{ background: 'var(--color-mint)' }}>
        {message}
      </button>
    </div>
  );
}

export function Layout() {
  return (
    <div className="min-h-dvh md:pl-28">
      <SessionWatcher />

      {/* iPad / desktop side rail */}
      <nav className="fixed inset-y-0 left-0 z-30 hidden w-28 flex-col items-center gap-3 border-r-[2.5px] border-ink bg-paper py-6 md:flex" aria-label="Main">
        <img src="/icon.svg" alt="" className="mb-4 h-12 w-12" />
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `flex w-20 flex-col items-center gap-1 rounded-2xl border-[2.5px] py-2.5 text-xs font-semibold ${
                isActive ? 'border-ink bg-butter shadow-nb-sm' : 'border-transparent text-ink-soft'
              }`
            }
          >
            <Icon name={t.icon} />
            {t.label}
          </NavLink>
        ))}
      </nav>

      <main className="mx-auto w-full max-w-5xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 md:pb-10 md:pt-8">
        <SessionBanner />
        <Outlet />
      </main>

      {/* Phone bottom tabs */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t-[2.5px] border-ink bg-paper px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
        aria-label="Main"
      >
        <div className="mx-auto flex max-w-md justify-between">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                `flex min-w-[4.5rem] flex-col items-center gap-0.5 rounded-xl border-2 px-3 py-1.5 text-[11px] font-semibold ${
                  isActive ? 'border-ink bg-butter' : 'border-transparent text-ink-soft'
                }`
              }
            >
              <Icon name={t.icon} size={22} />
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <Toast />
    </div>
  );
}
