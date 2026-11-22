# Deploying Active Life Quest to Cloudflare

Plain-language steps. No code, no charges. Neon is already set up, so
this is only the Cloudflare part.

## What this is now

This app deploys as a **Cloudflare Worker**. That is the flow on the
screen you are already looking at ("Set up your application" /
"Configure your Worker project").

- A Worker project gets an address ending in `.workers.dev`, for
  example `active-life-quest.derhoff62.workers.dev`. That is correct
  for this app now.
- The Worker serves the app itself AND the API. The API lives under
  `/api/*` in the same Worker, backed by Neon.
- An earlier version of this app only worked as a Pages project, and
  a Worker showed a Cloudflare placeholder that said "There is nothing
  here yet". That is fixed: the repo now has a Worker entry point
  (`src/worker.ts`) that serves the built app from `dist/` and the
  API, so `npx wrangler deploy` works.

## Step 1. On the "Set up your application" screen, fill in exactly this

You should already be on this screen, with
`derhoff62/active-life-quest` picked as the repository and the project
name `active-life-quest`.

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Preview command: `npx wrangler preview`

There is no "build output directory" box on this Worker screen.
Do not look for one. The output directory (`dist`) is already in
the repo's `wrangler.toml` file, under `[assets]`.

Then tap **Deploy** (the blue button at the bottom right).

Wait for the build to finish. All four steps should be green:
Initializing, Installing, Building, Deploying. If Deploying fails,
send a screenshot of the log — do not change the commands.

## Step 2. Add the settings (environment variables)

## Step 1b. Video storage (R2) — DEFERRED, videos come later

Assessment videos, check-in videos and progress photos are stored in
Cloudflare R2 (free tier, 10 GB). Videos are deferred for now (Nov 22,
2026), so the R2 binding has been TEMPORARILY REMOVED from
`wrangler.toml` and deploys no longer need the bucket. The upload
buttons show a plain "Video storage is not set up yet" error, and the
assessment, check-in, message and progress flows still finish fine
without a file. No video bytes ever go in the Neon database.

To re-enable videos later: in the Cloudflare dashboard, go to Storage
& databases, then R2. If R2 is not enabled, enable it. Create a bucket
named exactly `active-life-quest-videos`, then uncomment the
`[[r2_buckets]]` block in `wrangler.toml` and redeploy the Worker
(Deployments > Redeploy, or push a new commit).

In the new Worker project, go to Settings, then Variables and
secrets, then Add, one at a time. Do not share these values in chat.

- `DATABASE_URL` - your Neon connection string. Find it in Neon under
  Connection Details. It starts with `postgresql://`.
- `SESSION_SECRET` - make up a long random mix of letters and numbers.
- `BETA_CODE` - `ACTIVEBETA`
- `BETA_USES` - `25`
- `BETA_EXPIRES` - `2027-02-19`
- Leave `COACH_PIN_HASH` blank. You set your Coach PIN on first
  Coach sign-in inside the app.

Set them for Production (and Preview, if it asks). If you added them
to an older project, add them again here. Settings do not move over
when you delete a project.

After adding them, redeploy if Cloudflare asks you to. A new
deployment picks up the new settings.

## Step 3. Check it worked

1. Open the link Cloudflare gives you. It ends in `.workers.dev`,
   for example `active-life-quest.derhoff62.workers.dev`.
2. The app's sign-up page should load, not the Cloudflare placeholder.
3. Open `<your-link>/api/health` in the browser. It should show
   `{"ok": true}`.
4. On the app, sign up with an email, enter beta code `ACTIVEBETA`,
   pick a guardian, do the assessment, and do Day 1.

## If something goes wrong

- The site loads but sign-up says "Database is not configured yet":
  `DATABASE_URL` is missing or wrong in the Worker's settings.
  Fix it there, then redeploy.
- The site shows the Cloudflare placeholder "There is nothing here
  yet": the deployment did not finish, or you are looking at an old
  project. Check the Deployments tab for a green, successful
  deployment, and open the link from that deployment.
- Fails at Building: the error is in the build log. Send a screenshot
  of the log.
- Fails at Deploying: send a screenshot of the log. Do not change
  the Deploy command to `echo ok` — that only makes the build
  "succeed" by deploying nothing.

## Pages fallback (only if the Worker flow will not work)

The same repo can also deploy as a Cloudflare Pages project. The
Pages Function in `functions/api/[[path]].ts` calls the same shared
API as the Worker, so the app behaves the same.

1. In Cloudflare, go to Workers & Pages, then Create, and pick the
   **Pages** option near the bottom of the Create page. Do not pick
   the big Worker option at the top.
2. Connect the GitHub repo `derhoff62/active-life-quest`, branch `main`.
3. Build command: `npm run build`
4. Build output directory: `dist`
5. Deploy command: **leave empty**. Do not type `npx wrangler deploy`.
   A Pages project deploys the `dist` folder itself.
6. Add the same environment variables as in Step 2 above.
7. The live address ends in `.pages.dev`, and
   `<your-link>/api/health` should show `{"ok": true}`.
