import { app, type Env } from "../../src/server/api";

// Cloudflare Pages Function for /api/*.
// Thin wrapper only: the Hono app lives in src/server/api.ts, shared
// with the Worker entry point in src/worker.ts.

type PagesFunctionContext = {
  request: Request;
  env: Env;
};

export async function onRequest(
  context: PagesFunctionContext,
): Promise<Response> {
  return app.fetch(context.request, context.env);
}
