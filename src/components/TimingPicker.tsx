import { TIERS, TIER_LABEL, TIMING_PRESETS, formatMinutes, totalPlannedMinutes } from '../lib/plan';
import type { Minutes, Tier, TierMinutes, TimingMode } from '../lib/types';

const MODES: { id: TimingMode; title: string; body: string }[] = [
  { id: 'smart', title: 'Smart', body: 'More time for topics asked often, less for rare ones. Recommended.' },
  { id: 'classic', title: 'Classic', body: '20 min learn + 20 min talk for every topic.' },
  { id: 'custom', title: 'Custom', body: 'Set your own minutes for each tier.' },
];

function Stepper({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <button type="button" className="nb-btn h-9 min-h-9 w-9 p-0 shadow-nb-sm" onClick={() => onChange(Math.max(5, value - 5))} aria-label={`Less ${label}`}>
        −
      </button>
      <span className="w-12 text-center font-display font-bold tabular-nums">{value}m</span>
      <button type="button" className="nb-btn h-9 min-h-9 w-9 p-0 shadow-nb-sm" onClick={() => onChange(Math.min(90, value + 5))} aria-label={`More ${label}`}>
        +
      </button>
    </div>
  );
}

export function TimingPicker({
  mode,
  custom,
  days,
  onMode,
  onCustom,
}: {
  mode: TimingMode;
  custom: TierMinutes;
  days: number;
  onMode: (m: TimingMode) => void;
  onCustom: (c: TierMinutes) => void;
}) {
  const minutes = mode === 'custom' ? custom : TIMING_PRESETS[mode];
  const total = totalPlannedMinutes(minutes);

  const setTier = (tier: Tier, patch: Partial<Minutes>) => onCustom({ ...custom, [tier]: { ...custom[tier], ...patch } });

  return (
    <div>
      <div className="grid gap-2.5 sm:grid-cols-3">
        {MODES.map((m) => {
          const t = totalPlannedMinutes(m.id === 'custom' ? custom : TIMING_PRESETS[m.id]);
          const selected = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onMode(m.id)}
              aria-pressed={selected}
              className="nb-btn h-auto flex-col items-start justify-start gap-1 p-3.5 text-left"
              style={{ background: selected ? 'var(--color-butter)' : 'var(--color-paper)', boxShadow: selected ? undefined : 'var(--shadow-nb-sm)' }}
            >
              <span className="text-lg">{m.title}</span>
              <span className="nb-chip" style={{ background: selected ? 'var(--color-paper)' : 'var(--color-cream)' }}>
                ≈ {formatMinutes(t / days)} a day
              </span>
              <span className="mt-1 font-sans text-sm font-medium text-ink-soft">{m.body}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border-2 border-ink">
        <table className="w-full text-sm">
          <thead className="bg-cream">
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold">Tier</th>
              <th className="px-3 py-2 font-semibold">Learn</th>
              <th className="px-3 py-2 font-semibold">Talk</th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((tier) => (
              <tr key={tier} className="border-t-2 border-ink/10">
                <td className="px-3 py-2 font-semibold">{TIER_LABEL[tier]}</td>
                {mode === 'custom' ? (
                  <>
                    <td className="px-2 py-1.5">
                      <Stepper label={`${TIER_LABEL[tier]} learn minutes`} value={custom[tier].learn} onChange={(v) => setTier(tier, { learn: v })} />
                    </td>
                    <td className="px-2 py-1.5">
                      <Stepper label={`${TIER_LABEL[tier]} talk minutes`} value={custom[tier].talk} onChange={(v) => setTier(tier, { talk: v })} />
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2">{minutes[tier].learn} min</td>
                    <td className="px-3 py-2">{minutes[tier].talk} min</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm font-medium text-ink-soft">
        All 62 topics: <b className="text-ink">{formatMinutes(total)}</b> total, about <b className="text-ink">{formatMinutes(total / days)}</b> a day over {days} days.
      </p>
    </div>
  );
}
