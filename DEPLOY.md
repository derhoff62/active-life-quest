# Deploying Active Life Quest to Cloudflare

Plain-language steps. No code, no charges. Neon is already set up, so
this is only the Cloudflare part.

## The mistake to avoid

This app is a **Cloudflare Pages** project. It is **not** a Worker.

- A Pages project gets an address ending in `.pages.dev`.
- A Worker project gets an address ending in `.workers.dev`.

If your address ends in `.workers.dev`, it is the wrong kind of project.
It will show a Cloudflare placeholder that says "There is nothing here
yet", and the app and the API will never load, no matter how many times
you retry the build. That is what happened on Nov 21, 2026: the project
was created as a Worker, `npx wrangler deploy` failed at the Deploying
step, and https://active-life-quest.derhoff62.workers.dev/ showed the
placeholder. The app code itself was fine, `npm run build` passed.

Cloudflare's current Create page pushes you toward a Worker first. The
Pages option is a smaller button near the bottom of that page. Pick that
one.

## Step 1. Delete the wrong Worker project

1. In Cloudflare, go to Workers & Pages.
2. Open the project called `active-life-quest` that has a `.workers.dev`
   address.
3. Go to Settings, scroll to the bottom, and delete the project.
   (If there are two projects with that name, delete the Worker one and
   keep nothing until Step 2 is done.)

## Step 2. Create a Pages project

1. In Cloudflare, go to Workers & Pages, then Create.
2. Look for the **Pages** option near the bottom of the Create page.
   Do not pick the big Worker / Hello World option at the top.
3. Choose "Connect to Git" / "Import a Pages project".
4. Pick the GitHub repo `derhoff62/active-life-quest`, branch `main`.
5. Set these exactly:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Deploy command: **leave empty**. Do not type `npx wrangler deploy`
     and do not type `echo ok` if you can leave it blank. A Pages
     project deploys the `dist` folder itself. `npx wrangler deploy`
     is a Worker command, and it is the command that failed before.
   - Root directory: `/` (leave as it is)
6. Save and Deploy.

## Step 3. Add the settings (environment variables)

In the new Pages project, go to Settings, then Variables and secrets,
then Add, one at a time. Do not share these values in chat.

- `DATABASE_URL` - your Neon connection string. Find it in Neon under
  Connection Details. It starts with `postgresql://`.
- `SESSION_SECRET` - make up a long random mix of letters and numbers.
- `BETA_CODE` - `ACTIVEBETA`
- `BETA_USES` - `25`
- `BETA_EXPIRES` - `2027-02-19`
- Leave `COACH_PIN_HASH` blank. You set your Coach PIN on first
  Coach sign-in inside the app.

Set them for Production (and Preview, if it asks). If you added them
to the old Worker project, add them again here. Settings do not move
over when you delete a project.

## Step 4. Check it worked

1. Wait for the build to finish. All four steps should be green:
   Initializing, Installing, Building, Deploying.
2. Open the link Cloudflare gives you. It must end in `.pages.dev`,
   for example `active-life-quest.pages.dev`.
3. The app's sign-up page should load, not the Cloudflare placeholder.
4. Open `<your-link>/api/health` in the browser. It should show
   `{"ok": true}`. If it shows the placeholder instead, you are still
   on a Worker address. Go back to Step 1.
5. On the app, sign up with an email, enter beta code `ACTIVEBETA`,
   pick a guardian, do the assessment, and do Day 1.

## If the build fails again

- Fails at Deploying, and the Deploy command says `npx wrangler deploy`:
  that is a Worker command. Clear the Deploy command and retry, or
  check you are in a Pages project, not a Worker.
- Fails at Building: the error is in the build log. Send a screenshot
  of the log.
- The site loads but sign-up says "Database is not configured yet":
  `DATABASE_URL` is missing or wrong in the Pages project's settings.
  Fix it there, then redeploy.
