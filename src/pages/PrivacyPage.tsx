import type { ReactNode } from 'react';

export const CONTACT_EMAIL = 'techgenie2050@gmail.com';
const UPDATED = '25 October 2026';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-2 grid gap-2 text-ink-soft">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh px-4 py-[max(1.5rem,env(safe-area-inset-top))]">
      <article className="nb-card mx-auto max-w-2xl p-5 sm:p-8">
        <a href="/" className="flex items-center gap-3">
          <img src="/icon.svg" alt="" className="h-10 w-10" />
          <span className="font-display text-xl font-bold">Revise Roulette</span>
        </a>
        <h1 className="mt-6 text-3xl font-bold">Privacy policy</h1>
        <p className="mt-1 text-sm text-muted">Last updated {UPDATED}</p>

        <p className="mt-4 text-ink-soft">
          Revise Roulette is a free study tool for revising past exam questions. This page explains what it stores and why. The short version: only
          what's needed to save your progress, and nothing is sold or shared.
        </p>

        <Section title="What we store">
          <p>
            <b className="text-ink">If you don't sign in:</b> everything (your plan, progress and study times) stays in your browser on your
            device. Nothing is sent to us.
          </p>
          <p>
            <b className="text-ink">If you sign in:</b> your name, email address and, if you use Google, your Google profile picture link. We
            also store your study plan, which topics you've finished, your ratings and your study session times, so they sync between your
            devices.
          </p>
          <p>With Google sign-in we only ask Google for your basic profile and email (the <code>openid</code>, <code>email</code> and <code>profile</code> scopes). We never see your Google password and can't access anything else in your Google account.</p>
        </Section>

        <Section title="How it's used">
          <p>Only to run the app: to sign you in, and to show and sync your own progress. No ads, no tracking or analytics, and no selling or sharing your data with anyone.</p>
        </Section>

        <Section title="Where it's kept">
          <p>
            Data is stored in a PostgreSQL database hosted by Neon, and the app is served by Vercel. Both act only as our service providers. A
            sign-in cookie keeps you logged in; it isn't used for anything else. Fonts are loaded from Google Fonts.
          </p>
        </Section>

        <Section title="Deleting your data">
          <p>
            Signing out clears your data from that device. To delete your account and everything stored with it, email{' '}
            <a className="font-semibold text-ink underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{' '}
            from the address you signed up with, and it will be removed within 7 days.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy:{' '}
            <a className="font-semibold text-ink underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>

        <a href="/" className="nb-btn mt-8" style={{ background: 'var(--color-mint)' }}>
          ← Back to the app
        </a>
      </article>
    </div>
  );
}
