# Active Life Quest

## What this is

Active Life Quest is a gamified corrective weight loss app for beginners, built by Derek Hoffman of Active Life Personal Training in Chehalis, WA. It is assessment first, then a plan built around you. The app is NASM and Mind Pump aligned, for beginners age 40 to 59.

This folder is the server and deploy config for the rebuild. The React UI lives in `src/` and is built by the parent agent. The backend is a Cloudflare Pages Function API backed by Neon Postgres. The whole client profile (guardian, assessment, findings, phase, XP, level, badges, armor, logs, goals, messages, check-ins, sleep, cardio, measurements, settings) is stored as one JSON document in the `profiles` table.

Beta code: `ACTIVEBETA`, 25 uses, expires 2027-02-19.

Prices after beta: $150/month, $420 for 3 months, $810 for 6 months, $1,530 for 12 months, household $135 each. Payment is copy only in this version. There is no real payment.

Pain scope: Derek cannot fix, treat, diagnose, or cure pain. The app wording is move better with less discomfort, and it refers people to a doctor or physical therapist for sharp, new, worsening, or non-improving pain.

## Stack

- Cloudflare Workers (free) for hosting and the API, with the built
  app served as Static Assets from `dist/`
- Neon Postgres (free) for the database
- GitHub for the repo
- Vite plus React plus TypeScript for the frontend
- Hono plus `@neondatabase/serverless` for the API, running in the
  Worker (`src/worker.ts`) and, as a fallback, as a Cloudflare Pages
  Function (`functions/api/[[path]].ts`), both calling the same shared
  API module in `src/server/api.ts`
- Passwords hashed with PBKDF2-SHA256 using WebCrypto (100,000 iterations). No bcrypt, no Node APIs in the API code, so it stays edge safe.

## Local dev

```bash
npm install
cp .env.example .env
```

Set `DATABASE_URL` in `.env` to your Neon connection string, then:

```bash
npm run dev
```

The app runs at http://localhost:5173. The API is served from the same origin under `/api/*` when deployed to Cloudflare. For local API work, use `wrangler dev` after the frontend builds (Worker, with Static Assets), or `wrangler pages dev dist` (Pages fallback).

Other commands:

```bash
npm run build    # tsc -b && vite build
npm run preview  # vite preview
npm run deploy   # wrangler deploy (Worker)
npm run deploy:pages  # wrangler pages deploy dist --project-name active-life-quest
```

## Database setup

1. Create a free Neon project and database.
2. Open the Neon SQL editor.
3. Run `migrations/001_init.sql` in full. It creates the `users`, `sessions`, `password_resets`, `profiles`, `beta_codes`, `settings`, and `coach_sessions` tables, plus indexes.
4. Copy the Neon connection string into `DATABASE_URL`. It should look like `postgresql://user:pass@host/db?sslmode=require`.

The `ACTIVEBETA` row is seeded by the API on first redeem if the `beta_codes` table is empty and `BETA_CODE` is set. No seed row is in the migration.

## Deploy to Cloudflare (Worker — the flow Derek uses)

This app deploys as a **Cloudflare Worker**. The Worker serves the built
React app from `dist/` (Workers Static Assets) and the Hono API under
`/api/*` from one entry point, `src/worker.ts`. The API logic itself
lives in `src/server/api.ts`, shared with the Pages Function, so there
is only one copy of it.

1. Push this repo to GitHub as `derhoff62/active-life-quest`.
2. In Cloudflare, Workers & Pages > Create, and pick the **Worker**
   option. Connect that GitHub repo, branch `main`.
3. Set these exactly, as shown on the "Set up your application" screen:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Preview command: `npx wrangler preview`
   - Project name: `active-life-quest`
   (There is no "build output directory" field on the Worker screen.
   The output directory `dist` comes from `wrangler.toml` `[assets]`.)
4. Set these environment variables in the Worker's Settings >
   Variables and secrets (production and preview):
   - `DATABASE_URL`: Neon connection string
   - `SESSION_SECRET`: a long random string (set now, kept in reserve; sessions in v1 are opaque random ids stored in the database)
   - `COACH_PIN_HASH`: leave blank at first deploy. Derek sets the Coach PIN on first Coach sign-in, and the API stores its hash in the `settings` table.
   - `BETA_CODE`: `ACTIVEBETA`
   - `BETA_USES`: `25`
   - `BETA_EXPIRES`: `2027-02-19`
5. Deploy. The live address ends in `.workers.dev`, for example
   `active-life-quest.derhoff62.workers.dev`. `GET /api/health` should
   return `{"ok": true}`. Any database endpoint without `DATABASE_URL`
   returns 503 with a plain message telling you to set it.

## Deploy to Cloudflare Pages (fallback, also supported)

The same repo can deploy as a Pages project instead. The Pages
Function in `functions/api/[[path]].ts` is a thin wrapper around the
same shared API in `src/server/api.ts`.

1. In Cloudflare, Workers & Pages > Create, and pick the **Pages**
   option. Connect the GitHub repo, branch `main`.
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Deploy command: **leave empty**. Do not use `npx wrangler deploy`.
   A Pages project deploys `dist` itself.
5. Set the same environment variables as in the Worker section above.
6. Deploy. The live address ends in `.pages.dev`.
   `GET /api/health` should return `{"ok": true}`.

See `DEPLOY.md` for the full plain-language steps.

## PWA install on iPhone

Open the deployed site in Safari, tap Share, then tap Add to Home Screen. The app opens standalone with the navy theme color `#124571` and the shield icon. The manifest is `public/manifest.webmanifest` and the icon is `public/icon.svg`.

## Beta flow

1. Sign up with an email and password (8 characters minimum).
2. Enter the beta code `ACTIVEBETA`.
3. Pick a guardian.
4. Complete the assessment.
5. Start Day 1.

The Coach signs in separately with a 4 to 8 digit PIN. The first Coach sign-in sets the PIN. The Coach dashboard lists clients and their profile documents, and can reply to client messages and send nudges.

## API endpoints

All responses are JSON, with plain language errors and no stack traces.

- `GET /api/health`
- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `POST /api/auth/forgot`, `POST /api/auth/reset`, `DELETE /api/auth/account`
- `GET /api/profile`, `PUT /api/profile` (session required, profile capped at about 1 MB)
- `POST /api/beta/redeem` (session required, case-insensitive code)
- `POST /api/coach/pin`, `POST /api/coach/logout`
- `GET /api/coach/clients`, `POST /api/coach/reply`, `POST /api/coach/nudge`
- `GET /api/coach/settings`, `POST /api/coach/beta`

Auth uses httpOnly session cookies (Secure in production, SameSite Lax, 30 days). Coach sessions last 12 hours.

## What is NOT wired yet

- No real Stripe payment. Prices are copy only.
- No email sending for password reset. Reset tokens are generated and stored hashed, and the API always returns the same generic message. The deployer must deliver the token, for example with Resend, before reset emails work.
- No push notifications.
- No real payment, email, or notification provider keys are in this repo. Do not add any.
