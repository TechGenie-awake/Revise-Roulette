import { useState, type ReactNode } from 'react';
import { AccountCard } from '../components/Account';
import { TimingPicker } from '../components/TimingPicker';
import { ConfirmModal, Icon } from '../components/ui';
import { symptomUnlockDay } from '../lib/plan';
import { useStore, useToast } from '../lib/store';

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="nb-card p-5">
      <h2 className="text-xl font-bold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const plan = useStore((s) => s.plan);
  const updatePlan = useStore((s) => s.updatePlan);
  const resetProgress = useStore((s) => s.resetProgress);
  const showToast = useToast((s) => s.show);
  const [confirmReset, setConfirmReset] = useState(false);

  const invite = async () => {
    const url = window.location.origin;
    const text = 'Revising with this spin-the-wheel PYQ app. Try it!';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Revise Roulette', text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      showToast('Link copied. Send it to your friends!');
    } catch {
      // Share sheet dismissed
    }
  };

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-ink-soft">Changes apply to your next spin.</p>
      </div>

      <Section title="Your plan">
        <label className="block">
          <span className="mb-1.5 block font-semibold">Name</span>
          <input className="nb-input" value={plan.name} maxLength={30} placeholder="Optional" onChange={(e) => updatePlan({ name: e.target.value })} />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block font-semibold">Start date</span>
            <input type="date" className="nb-input" value={plan.startDate} onChange={(e) => e.target.value && updatePlan({ startDate: e.target.value })} />
          </label>
          <div>
            <span className="mb-1.5 block font-semibold">Days to revise</span>
            <div className="flex items-center gap-2">
              <button className="nb-btn w-12 p-0" onClick={() => updatePlan({ days: Math.max(1, plan.days - 1) })} aria-label="Fewer days">
                −
              </button>
              <span className="flex-1 text-center font-display text-2xl font-bold">{plan.days}</span>
              <button className="nb-btn w-12 p-0" onClick={() => updatePlan({ days: Math.min(30, plan.days + 1) })} aria-label="More days">
                +
              </button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Timing" hint="How long you learn and talk, by how often a topic was asked.">
        <TimingPicker
          mode={plan.timingMode}
          custom={plan.custom}
          days={plan.days}
          onMode={(timingMode) => updatePlan({ timingMode })}
          onCustom={(custom) => updatePlan({ custom })}
        />
      </Section>

      <Section title="Wheel">
        <span className="mb-1.5 block font-semibold">Slice size</span>
        <div className="nb-seg" role="group" aria-label="Slice size">
          <button aria-pressed={plan.wheelMode === 'weighted'} onClick={() => updatePlan({ wheelMode: 'weighted' })}>
            By how often asked
          </button>
          <button aria-pressed={plan.wheelMode === 'equal'} onClick={() => updatePlan({ wheelMode: 'equal' })}>
            All equal
          </button>
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          {plan.wheelMode === 'weighted'
            ? 'High-yield topics get bigger slices, so they tend to come up earlier.'
            : 'Every topic has the same chance.'}
        </p>

        <span className="mb-1.5 mt-5 block font-semibold">Symptom-based questions</span>
        <div className="nb-seg" role="group" aria-label="Symptom-based questions">
          <button aria-pressed={plan.symptomRule === 'later'} onClick={() => updatePlan({ symptomRule: 'later' })}>
            Unlock on Day {symptomUnlockDay(plan)}
          </button>
          <button aria-pressed={plan.symptomRule === 'open'} onClick={() => updatePlan({ symptomRule: 'open' })}>
            On the wheel now
          </button>
        </div>
        <p className="mt-2 text-sm text-ink-soft">They also unlock as soon as every chapter topic is done.</p>

        <label className="mt-5 flex items-center justify-between gap-3">
          <span className="font-semibold">Sounds</span>
          <button
            role="switch"
            aria-checked={plan.sound}
            onClick={() => updatePlan({ sound: !plan.sound })}
            className="relative h-9 w-16 rounded-full border-[2.5px] border-ink transition-colors"
            style={{ background: plan.sound ? 'var(--color-mint)' : 'var(--color-paper)' }}
          >
            <span className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-2 border-ink bg-paper transition-[left]" style={{ left: plan.sound ? 30 : 4 }} />
          </button>
        </label>
      </Section>

      <Section title="Friends" hint="Studying with friends? Send them the link. Everyone gets their own wheel.">
        <button className="nb-btn w-full" style={{ background: 'var(--color-lilac)' }} onClick={invite}>
          <Icon name="share" size={18} /> Invite friends
        </button>
      </Section>

      <Section title="Account & sync">
        <AccountCard />
      </Section>

      <Section title="Start over">
        <button className="nb-btn w-full" style={{ background: 'var(--color-coral)' }} onClick={() => setConfirmReset(true)}>
          Reset all progress
        </button>
      </Section>

      <ConfirmModal
        open={confirmReset}
        title="Reset everything?"
        body="All topics go back into the wheel and your stats are cleared, on every device you're signed in on. This can't be undone."
        confirmLabel="Reset"
        danger
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetProgress();
          showToast('Fresh start. All topics are back in the wheel.');
        }}
      />
    </div>
  );
}
