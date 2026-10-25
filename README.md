# Revise Roulette 🎡

Spin a wheel of PYQ topics, learn the one it picks, explain it out loud, then rate yourself.
Topics you're happy with leave the wheel; the rest come back. Built for the MBBS Final
Ophthalmology PYQ checklist (62 topics, 17 chapters).

## Run it locally

```bash
npm install
npm run db:migrate   # once, and after schema changes (safe to re-run)
npm run dev          # web on :5173 + API on :8787 (Vite proxies /api)
```

Open http://localhost:5173. On an iPad or phone on the same Wi-Fi, use `http://<your-mac-ip>:5173`
and add that origin to `TRUSTED_ORIGINS` in `.env` so sign-in works.

`npm run dev:web` runs only the frontend; the app still works fully, just without sign-in.

## Environment (`.env`, never committed)

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `BETTER_AUTH_SECRET` | Random 32+ byte secret for sessions (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Public URL of the app, e.g. `http://localhost:5173` or `https://your-app.vercel.app` |
| `TRUSTED_ORIGINS` | Extra comma-separated origins allowed to sign in (LAN IP, preview URLs) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional. When set, "Continue with Google" appears |

## How it fits together

```
src/                     React 19 + Vite + Tailwind 4 (installable, works offline-first)
  data/ophthalmology.ts  All 62 topics: tier, question count, what was asked + years
  lib/store.ts           Zustand store persisted to localStorage, the single source of truth on device
  lib/plan.ts            Timing presets, wheel weights, day/pace maths, symptom-round unlock
  lib/merge.ts           How two copies of progress combine (shared with the server)
  lib/sync.ts            Better Auth client + push-on-change / pull-on-focus sync
  components/Wheel.tsx   SVG wheel with weighted slices and a requestAnimationFrame spin
  pages/                 Wheel, Session (Learn → Talk → Rate), Topics, Stats, Settings, Onboarding
server/                  Hono API
  auth.ts                Better Auth (email + password, Google when configured)
  app.ts                 /api/auth/*, /api/config, /api/state, /api/sync
  migrate.ts             Creates Better Auth tables + user_plan, topic_progress, study_session
api/index.ts             Vercel serverless entry (vercel.json rewrites /api/* here)
```

**Sync rules**: newest change per topic wins, study sessions are a union, a fresh device never
overwrites a real plan, and "Reset all progress" clears every signed-in device.

## Deploy to Vercel

1. Push the repo to GitHub and import it in Vercel (framework: Vite).
2. Add the environment variables above. Set `BETTER_AUTH_URL` to the production URL.
3. Deploy, then run `npm run db:migrate` locally once (it uses the same Neon database).

## Adding Google sign-in

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Web).
2. Authorised redirect URIs: `http://localhost:5173/api/auth/callback/google` and
   `https://<your-domain>/api/auth/callback/google`.
3. Put the ID and secret in `.env` (and in Vercel) and restart.

## Later: Groq answer checking

The Talk phase already records which asked points she covered. The plan is to record her answer,
transcribe it with Groq Whisper, and have a Llama model compare it against that topic's `asks`,
behind a new `/api/ai/*` route so the key stays on the server.
