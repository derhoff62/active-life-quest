/// <reference types="@cloudflare/workers-types" />
import { app, type Env } from "./server/api";

// Cloudflare Worker entry point for Active Life Quest.
// Serves the built React app from dist/ (Workers Static Assets) AND the
// same Hono API under /api/* — the API logic lives in src/server/api.ts,
// shared with the Pages Function in functions/api/[[path]].ts, so there
// is only one copy of auth / profile / beta / coach logic.
//
// Routing (wrangler.toml sets run_worker_first = true, so every request
// goes through the Worker first, including hashed /assets/* files,
// which the Worker then serves from the ASSETS binding):
//   /api/*            -> Hono app (Neon Postgres, or 503 if no DATABASE_URL)
//   /assets/*, etc.   -> served from dist/ via the ASSETS binding
//   any other path    -> the matching file in dist/, or index.html
//                        (single-page app fallback) when there is no match.

type WorkerEnv = Env & {
  ASSETS: Fetcher;
};

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // API first. No static file lives under /api/, so this never
    // collides with an asset.
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return app.fetch(request, env, ctx);
    }

    // Static file, if one matches this path.
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) {
      return asset;
    }

    // Single-page app fallback: every other route loads the app shell.
    // The manifest, icon, and hashed assets are real files above, so
    // they are never rewritten to index.html.
    return env.ASSETS.fetch(
      new Request(new URL("/index.html", url), request),
    );
  },
};
