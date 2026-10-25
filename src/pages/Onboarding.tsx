import { useState } from 'react';
import { AuthModal } from '../components/Account';
import { TimingPicker } from '../components/TimingPicker';
import { DECK, TOPICS } from '../data/ophthalmology';
import { toDateStr } from '../lib/plan';
import { useStore } from '../lib/store';

export default function Onboarding() {
  const plan = useStore((s) => s.plan);
  const updatePlan = useStore((s) => s.updatePlan);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(plan.name);
  const [days, setDays] = useState(plan.days);
  const [startDate, setStartDate] = useState(plan.startDate || toDateStr(new Date()));
  const [authOpen, setAuthOpen] = useState(false);

  const steps = 3;

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-xl">
        <div className="mb-5 flex items-center gap-3">
          <img src="/icon.svg" alt="" className="h-12 w-12" />
          <div>
            <div className="font-display text-2xl font-bold leading-none">Revise Roulette</div>
            <div className="text-sm text-ink-soft">{DECK.name} · {TOPICS.length} topics</div>
          </div>
        </div>

        <div className="mb-4 flex gap-2" aria-label={`Step ${step + 1} of ${steps}`}>
          {Array.from({ length: steps }, (_, i) => (
            <span key={i} className="h-2.5 flex-1 rounded-full border-2 border-ink" style={{ background: i <= step ? 'var(--color-rose)' : 'var(--color-paper)' }} />
          ))}
        </div>

        <div className="nb-card animate-pop p-5 sm:p-7" key={step}>
          {step === 0 && (
            <>
              <h1 className="text-3xl font-bold">Hey there 👋</h1>
              <p className="mt-2 text-ink-soft">Let's set up your revision plan. It takes 20 seconds.</p>
              <label className="mt-5 block">
                <span className="mb-1.5 block font-semibold">What should we call you?</span>
                <input className="nb-input" placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
              </label>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block font-semibold">Start date</span>
                  <input type="date" className="nb-input" value={startDate} onChange={(e) => e.target.value && setStartDate(e.target.value)} />
                </label>
                <div>
                  <span className="mb-1.5 block font-semibold">Days to revise</span>
                  <div className="flex items-center gap-2">
                    <button className="nb-btn w-12 p-0" onClick={() => setDays(Math.max(1, days - 1))} aria-label="Fewer days">
                      −
                    </button>
                    <span className="flex-1 text-center font-display text-2xl font-bold">{days}</span>
                    <button className="nb-btn w-12 p-0" onClick={() => setDays(Math.min(30, days + 1))} aria-label="More days">
                      +
                    </button>
                  </div>
                </div>
              </div>
              <button
                className="nb-btn mt-6 w-full text-lg"
                style={{ background: 'var(--color-mint)' }}
                onClick={() => {
                  updatePlan({ name: name.trim(), days, startDate });
                  setStep(1);
                }}
              >
                Next →
              </button>
              <p className="mt-4 text-center text-sm text-ink-soft">
                Already using it on another device?{' '}
                <button className="font-semibold text-ink underline underline-offset-4" onClick={() => setAuthOpen(true)}>
                  Sign in
                </button>
              </p>
              <AuthModal open={authOpen} initialMode="signin" onClose={() => setAuthOpen(false)} />
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-3xl font-bold">How long per topic?</h1>
              <p className="mt-2 mb-5 text-ink-soft">You learn first, then explain it out loud. You can change this any time in Settings.</p>
              <TimingPicker
                mode={plan.timingMode}
                custom={plan.custom}
                days={plan.days}
                onMode={(timingMode) => updatePlan({ timingMode })}
                onCustom={(custom) => updatePlan({ custom })}
              />
              <div className="mt-6 flex gap-3">
                <button className="nb-btn flex-1" onClick={() => setStep(0)}>
                  ← Back
                </button>
                <button className="nb-btn flex-[2] text-lg" style={{ background: 'var(--color-mint)' }} onClick={() => setStep(2)}>
                  Next →
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-3xl font-bold">How it works</h1>
              <ol className="mt-5 grid gap-3">
                {[
                  ['🎡', 'Spin the wheel', 'It picks a topic. Topics asked more often get bigger slices.', 'var(--color-blush)'],
                  ['📖', 'Learn it', "A timer runs while you study. You'll see exactly what was asked, and which years.", 'var(--color-sky)'],
                  ['🗣️', 'Talk it out', 'Explain it out loud and tick off each point you cover.', 'var(--color-lilac)'],
                  ['✅', 'Rate yourself', "Happy with it? It leaves the wheel for good. Not yet? It comes back later.", 'var(--color-mint)'],
                ].map(([emoji, title, body, color]) => (
                  <li key={title} className="flex gap-3 rounded-2xl border-2 border-ink p-3" style={{ background: color }}>
                    <span className="text-3xl">{emoji}</span>
                    <span>
                      <b className="block font-display text-lg">{title}</b>
                      <span className="text-sm text-ink-soft">{body}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-sm text-ink-soft">🔒 Symptom-based questions join the wheel on Day {Math.max(1, plan.days - 1)}, once the chapters are mostly done.</p>
              <div className="mt-6 flex gap-3">
                <button className="nb-btn flex-1" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button className="nb-btn flex-[2] text-lg" style={{ background: 'var(--color-rose)' }} onClick={() => updatePlan({ onboarded: true })}>
                  Let's spin 🎡
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
