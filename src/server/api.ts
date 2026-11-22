/// <reference types="@cloudflare/workers-types" />
import { Hono } from "hono";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { neon } from "@neondatabase/serverless";

// Shared Hono API for Active Life Quest.
// Used by BOTH entry points, so auth / profile / beta / coach logic lives
// in exactly one place:
//   - Cloudflare Worker: src/worker.ts (serves dist/ + /api/*)
//   - Cloudflare Pages Function: functions/api/[[path]].ts
// Edge-safe: WebCrypto only, no Node APIs, no bcrypt.
// All responses are JSON. No stack traces are returned to clients.

export type Env = {
  DATABASE_URL?: string;
  SESSION_SECRET?: string;
  COACH_PIN_HASH?: string;
  BETA_CODE?: string;
  BETA_USES?: string;
  BETA_EXPIRES?: string;
  // Cloudflare R2 bucket for assessment videos. Bound in wrangler.toml as
  // VIDEOS (bucket active-life-quest-videos). R2 must be enabled in the
  // Cloudflare dashboard and the bucket created before the first deploy
  // that includes the binding, or the deploy fails. Until then the
  // upload endpoint returns a plain error and the assessment still
  // finishes fine without a video.
  VIDEOS?: R2Bucket;
};

type Sql = ReturnType<typeof neon>;
type AppContext = Context<{ Bindings: Env }>;

type SessionUser = {
  id: string;
  email: string;
  displayName: string | null;
};

const SESSION_COOKIE = "alq_session";
const COACH_COOKIE = "alq_coach";
const SESSION_DAYS = 30;
const COACH_HOURS = 12;
const PROFILE_MAX_BYTES = 1_000_000;
const PBKDF2_ITERATIONS = 100_000;

export const app = new Hono<{ Bindings: Env }>();

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Something went wrong. Please try again." }, 500);
});

app.notFound((c) => c.json({ error: "Not found." }, 404));

// ---------- crypto helpers (WebCrypto, PBKDF2-SHA256) ----------

function b64encode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

function b64decode(input: string): Uint8Array {
  const binary = atob(input);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomHex(byteCount: number): string {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return hex(bytes);
}

async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64encode(salt)}$${b64encode(new Uint8Array(bits))}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split("$");
    if (parts.length !== 4 || parts[0] !== "pbkdf2") {
      return false;
    }
    const iterations = Number.parseInt(parts[1], 10);
    if (!Number.isFinite(iterations) || iterations <= 0) {
      return false;
    }
    const salt = b64decode(parts[2]);
    const expected = parts[3];
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      key,
      256,
    );
    return b64encode(new Uint8Array(bits)) === expected;
  } catch {
    return false;
  }
}

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return hex(new Uint8Array(digest));
}

// ---------- request helpers ----------

function getDb(c: AppContext): Sql | null {
  const url = c.env.DATABASE_URL;
  if (!url) {
    return null;
  }
  return neon(url);
}

function dbMissing(c: AppContext) {
  return c.json(
    {
      error:
        "Database is not configured yet. Set DATABASE_URL in Cloudflare settings.",
    },
    503,
  );
}

function isSecure(c: AppContext): boolean {
  try {
    return new URL(c.req.url).protocol === "https:";
  } catch {
    return false;
  }
}

function cookieOptions(c: AppContext, maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: isSecure(c),
    sameSite: "Lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

async function readJson(
  c: AppContext,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await c.req.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function createSession(db: Sql, userId: string): Promise<string> {
  const id = randomHex(32);
  const expires = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  await db`INSERT INTO sessions (id, user_id, expires_at) VALUES (${id}, ${userId}, ${expires})`;
  return id;
}

async function createCoachSession(db: Sql): Promise<string> {
  const id = randomHex(32);
  const expires = new Date(
    Date.now() + COACH_HOURS * 60 * 60 * 1000,
  ).toISOString();
  await db`INSERT INTO coach_sessions (id, expires_at) VALUES (${id}, ${expires})`;
  return id;
}

async function getSessionUser(
  c: AppContext,
  db: Sql,
): Promise<SessionUser | null> {
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (!sessionId) {
    return null;
  }
  const rows = (await db`SELECT u.id, u.email, u.display_name AS "displayName"
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ${sessionId} AND s.expires_at > now()`) as unknown as Array<SessionUser>;
  return rows.length > 0 ? rows[0] : null;
}

async function requireSession(
  c: AppContext,
  db: Sql,
): Promise<SessionUser | null> {
  return getSessionUser(c, db);
}

async function hasCoachSession(c: AppContext, db: Sql): Promise<boolean> {
  const sessionId = getCookie(c, COACH_COOKIE);
  if (!sessionId) {
    return false;
  }
  const rows = (await db`SELECT id FROM coach_sessions
    WHERE id = ${sessionId} AND expires_at > now()`) as unknown as Array<{
    id: string;
  }>;
  return rows.length > 0;
}

async function getProfileDoc(
  db: Sql,
  userId: string,
): Promise<Record<string, unknown> | null> {
  const rows = (await db`SELECT data FROM profiles WHERE user_id = ${userId}`) as unknown as Array<{
    data: Record<string, unknown> | null;
  }>;
  if (rows.length === 0) {
    return null;
  }
  const stored = rows[0].data ?? {};
  // Legacy rows were stored wrapped as { data: profile }. Unwrap them.
  if (
    stored &&
    typeof stored === 'object' &&
    'data' in stored &&
    typeof (stored as Record<string, unknown>).data === 'object' &&
    (stored as Record<string, unknown>).data !== null &&
    !('assessmentDone' in stored)
  ) {
    return (stored as Record<string, unknown>).data as Record<string, unknown>;
  }
  return stored;
}

async function saveProfileDoc(
  db: Sql,
  userId: string,
  doc: Record<string, unknown>,
): Promise<void> {
  const text = JSON.stringify(doc);
  await db`INSERT INTO profiles (user_id, data) VALUES (${userId}, ${text}::jsonb)
    ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
}

function parseMaxUses(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------- health ----------

app.get("/api/health", (c) => c.json({ ok: true }));

// ---------- auth ----------

app.post("/api/auth/signup", async (c) => {
  const body = await readJson(c);
  if (!body) {
    return c.json({ error: "Email and password are required." }, 400);
  }
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName =
    typeof body.displayName === "string"
      ? body.displayName.trim().slice(0, 100)
      : "";
  if (!isValidEmail(email)) {
    return c.json({ error: "Enter a valid email address." }, 400);
  }
  if (password.length < 8) {
    return c.json({ error: "Password must be at least 8 characters." }, 400);
  }
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  const existing = (await db`SELECT id FROM users WHERE email = ${email}`) as unknown as Array<{
    id: string;
  }>;
  if (existing.length > 0) {
    return c.json(
      { error: "An account with that email already exists." },
      400,
    );
  }
  const passwordHash = await hashPassword(password);
  const inserted = (await db`INSERT INTO users (email, password_hash, display_name)
    VALUES (${email}, ${passwordHash}, ${displayName || null})
    RETURNING id, email, display_name AS "displayName"`) as unknown as Array<SessionUser>;
  const user = inserted[0];
  await db`INSERT INTO profiles (user_id, data) VALUES (${user.id}, '{}'::jsonb)
    ON CONFLICT (user_id) DO NOTHING`;
  const sessionId = await createSession(db, user.id);
  setCookie(
    c,
    SESSION_COOKIE,
    sessionId,
    cookieOptions(c, SESSION_DAYS * 24 * 60 * 60),
  );
  return c.json(
    {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    },
    201,
  );
});

app.post("/api/auth/login", async (c) => {
  const body = await readJson(c);
  if (!body) {
    return c.json({ error: "Email and password are required." }, 400);
  }
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return c.json({ error: "Email and password are required." }, 400);
  }
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  const rows = (await db`SELECT id, email, password_hash AS "passwordHash", display_name AS "displayName"
    FROM users WHERE email = ${email}`) as unknown as Array<{
    id: string;
    email: string;
    passwordHash: string;
    displayName: string | null;
  }>;
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ error: "Email or password is not correct." }, 401);
  }
  const sessionId = await createSession(db, user.id);
  setCookie(
    c,
    SESSION_COOKIE,
    sessionId,
    cookieOptions(c, SESSION_DAYS * 24 * 60 * 60),
  );
  return c.json({
    user: { id: user.id, email: user.email, displayName: user.displayName },
  });
});

app.post("/api/auth/logout", async (c) => {
  const db = getDb(c);
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (db && sessionId) {
    await db`DELETE FROM sessions WHERE id = ${sessionId}`;
  }
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

app.get("/api/auth/me", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  const user = await requireSession(c, db);
  if (!user) {
    return c.json({ error: "You are not signed in." }, 401);
  }
  return c.json({
    user: { id: user.id, email: user.email, displayName: user.displayName },
  });
});

app.post("/api/auth/forgot", async (c) => {
  const body = await readJson(c);
  const email =
    body && typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";
  const db = getDb(c);
  // Always return the same generic message, so a request never reveals
  // whether an email address has an account.
  if (db && isValidEmail(email)) {
    const rows = (await db`SELECT id FROM users WHERE email = ${email}`) as unknown as Array<{
      id: string;
    }>;
    const user = rows[0];
    if (user) {
      // Token is stored hashed only. Email sending is not wired in v1, so
      // the deployer must deliver the token (for example with Resend).
      // Nothing sensitive is returned here.
      const token = randomHex(32);
      const tokenHash = await hashToken(token);
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await db`INSERT INTO password_resets (user_id, token_hash, expires_at)
        VALUES (${user.id}, ${tokenHash}, ${expires})`;
    }
  }
  return c.json({ ok: true });
});

app.post("/api/auth/reset", async (c) => {
  const body = await readJson(c);
  if (!body) {
    return c.json({ error: "Reset link and new password are required." }, 400);
  }
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";
  if (!token || newPassword.length < 8) {
    return c.json(
      { error: "Password must be at least 8 characters." },
      400,
    );
  }
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  const tokenHash = await hashToken(token);
  const rows = (await db`SELECT id, user_id AS "userId" FROM password_resets
    WHERE token_hash = ${tokenHash} AND used_at IS NULL AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1`) as unknown as Array<{
    id: string;
    userId: string;
  }>;
  const reset = rows[0];
  if (!reset) {
    return c.json(
      { error: "This reset link is not valid or has expired." },
      400,
    );
  }
  const passwordHash = await hashPassword(newPassword);
  await db`UPDATE users SET password_hash = ${passwordHash}, updated_at = now() WHERE id = ${reset.userId}`;
  await db`UPDATE password_resets SET used_at = now() WHERE id = ${reset.id}`;
  await db`DELETE FROM sessions WHERE user_id = ${reset.userId}`;
  return c.json({ ok: true });
});

app.delete("/api/auth/account", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  const user = await requireSession(c, db);
  if (!user) {
    return c.json({ error: "You are not signed in." }, 401);
  }
  await db`DELETE FROM users WHERE id = ${user.id}`;
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

// ---------- profile ----------

app.get("/api/profile", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  const user = await requireSession(c, db);
  if (!user) {
    return c.json({ error: "You are not signed in." }, 401);
  }
  const doc = await getProfileDoc(db, user.id);
  return c.json({ data: doc ?? {} });
});

app.put("/api/profile", async (c) => {
  const body = await readJson(c);
  if (!body) {
    return c.json({ error: "Profile must be an object." }, 400);
  }
  // Client sends { data: profile }. Store the profile itself, not the wrapper.
  const profile =
    body.data && typeof body.data === 'object' && !Array.isArray(body.data)
      ? (body.data as Record<string, unknown>)
      : body;
  const text = JSON.stringify(profile);
  if (text.length > PROFILE_MAX_BYTES) {
    return c.json({ error: "Profile is too large." }, 400);
  }
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  const user = await requireSession(c, db);
  if (!user) {
    return c.json({ error: "You are not signed in." }, 401);
  }
  const rows = (await db`INSERT INTO profiles (user_id, data) VALUES (${user.id}, ${text}::jsonb)
    ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    RETURNING updated_at AS "updatedAt"`) as unknown as Array<{
    updatedAt: string;
  }>;
  return c.json({ ok: true, updatedAt: rows[0]?.updatedAt ?? null });
});

// ---------- assessment videos (Cloudflare R2) ----------
// Video bytes live in R2 only, never in the Neon profile JSON
// (PROFILE_MAX_BYTES is 1,000,000, a video would blow it up). Only the
// small metadata record (key, label, date, week, size, type) is stored
// in the profile doc, in assessmentVideos.

const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

function videoKeyFor(userId: string, fileName: string): string {
  const safe = fileName.replace(/[^A-Za-z0-9._-]+/g, "-").slice(-60) || "video";
  const ext = safe.includes(".") ? safe.slice(safe.lastIndexOf(".")) : "";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `assessment/${userId}/${stamp}-${randomHex(8)}${ext}`;
}

function isOwnVideoKey(userId: string, key: string): boolean {
  return (
    key.startsWith(`assessment/${userId}/`) &&
    !key.includes("..") &&
    !key.slice(`assessment/${userId}/`.length).includes("/")
  );
}

app.post("/api/assessment/video", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  const user = await requireSession(c, db);
  if (!user) {
    return c.json({ error: "You are not signed in." }, 401);
  }
  const bucket = c.env.VIDEOS;
  if (!bucket) {
    return c.json(
      {
        error:
          "Video storage is not set up yet. Derek needs to enable R2 in Cloudflare and create the active-life-quest-videos bucket, then redeploy. You can still finish the assessment without a video.",
      },
      503,
    );
  }
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return c.json({ error: "No video was attached." }, 400);
  }
  const file = form.get("video");
  if (!(file instanceof File)) {
    return c.json({ error: "No video was attached." }, 400);
  }
  if (!file.type.startsWith("video/")) {
    return c.json({ error: "That file is not a video. Pick a video file." }, 400);
  }
  if (file.size === 0) {
    return c.json({ error: "That video is empty. Pick a different video." }, 400);
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return c.json(
      { error: "That video is over 100 MB. Pick a shorter clip." },
      400,
    );
  }
  const label =
    typeof form.get("label") === "string" && (form.get("label") as string).trim()
      ? (form.get("label") as string).trim().slice(0, 100)
      : "Assessment video";
  const weekRaw = Number(form.get("week"));
  const week = Number.isFinite(weekRaw) && weekRaw >= 1 && weekRaw <= 13 ? Math.floor(weekRaw) : 1;
  const key = videoKeyFor(user.id, file.name || "video.mp4");
  try {
    await bucket.put(key, file, {
      httpMetadata: { contentType: file.type || "video/mp4" },
    });
  } catch {
    return c.json(
      {
        error:
          "The video could not be saved. Video storage may not be set up yet. You can still finish the assessment without a video.",
      },
      503,
    );
  }
  const doc = await getProfileDoc(db, user.id);
  if (!doc) {
    await bucket.delete(key);
    return c.json({ error: "Client not found." }, 404);
  }
  const video = {
    id: randomHex(16),
    key,
    label,
    date: new Date().toISOString(),
    week,
    sizeBytes: file.size,
    contentType: file.type || "video/mp4",
  };
  const videos = Array.isArray(doc.assessmentVideos) ? doc.assessmentVideos : [];
  videos.unshift(video);
  doc.assessmentVideos = videos;
  await saveProfileDoc(db, user.id, doc);
  return c.json({ ok: true, video }, 201);
});

// Coach-only: stream one client's assessment video from R2.
app.get("/api/coach/videos/:userId/:key", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  if (!(await hasCoachSession(c, db))) {
    return c.json({ error: "Coach sign-in is required." }, 401);
  }
  const userId = c.req.param("userId");
  const fileName = c.req.param("key");
  const key = `assessment/${userId}/${fileName}`;
  if (!isOwnVideoKey(userId, key)) {
    return c.json({ error: "Video not found." }, 404);
  }
  const bucket = c.env.VIDEOS;
  if (!bucket) {
    return c.json({ error: "Video storage is not set up yet." }, 503);
  }
  const obj = await bucket.get(key);
  if (!obj) {
    return c.json({ error: "Video not found." }, 404);
  }
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "video/mp4",
      "Content-Length": String(obj.size),
      "Cache-Control": "private, max-age=3600",
    },
  });
});

// Coach-only: delete one client's assessment video (R2 + profile record).
app.delete("/api/coach/videos/:userId/:key", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  if (!(await hasCoachSession(c, db))) {
    return c.json({ error: "Coach sign-in is required." }, 401);
  }
  const userId = c.req.param("userId");
  const fileName = c.req.param("key");
  const key = `assessment/${userId}/${fileName}`;
  if (!isOwnVideoKey(userId, key)) {
    return c.json({ error: "Video not found." }, 404);
  }
  const bucket = c.env.VIDEOS;
  if (bucket) {
    await bucket.delete(key);
  }
  const doc = await getProfileDoc(db, userId);
  if (doc) {
    const videos = Array.isArray(doc.assessmentVideos) ? doc.assessmentVideos : [];
    doc.assessmentVideos = videos.filter(
      (v) =>
        v === null ||
        typeof v !== "object" ||
        (v as Record<string, unknown>).key !== key,
    );
    await saveProfileDoc(db, userId, doc);
  }
  return c.json({ ok: true });
});

// ---------- beta ----------

app.post("/api/beta/redeem", async (c) => {
  const body = await readJson(c);
  const code =
    body && typeof body.code === "string"
      ? body.code.trim().toUpperCase()
      : "";
  if (!code) {
    return c.json({ error: "Enter a beta code." }, 400);
  }
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  const user = await requireSession(c, db);
  if (!user) {
    return c.json({ error: "You are not signed in." }, 401);
  }
  // Seed the configured beta code the first time the table is empty.
  const countRows = (await db`SELECT count(*)::int AS count FROM beta_codes`) as unknown as Array<{
    count: number;
  }>;
  if (countRows[0]?.count === 0 && c.env.BETA_CODE) {
    const seedCode = c.env.BETA_CODE.trim().toUpperCase();
    const seedMax = parseMaxUses(c.env.BETA_USES, 25);
    const seedExpires = c.env.BETA_EXPIRES ?? "2027-02-19";
    await db`INSERT INTO beta_codes (code, max_uses, uses, expires_at)
      VALUES (${seedCode}, ${seedMax}, 0, ${seedExpires})
      ON CONFLICT (code) DO NOTHING`;
  }
  const rows = (await db`SELECT code, uses, max_uses AS "maxUses", expires_at AS "expiresAt"
    FROM beta_codes WHERE upper(code) = ${code}`) as unknown as Array<{
    code: string;
    uses: number;
    maxUses: number;
    expiresAt: string;
  }>;
  const beta = rows[0];
  if (!beta) {
    return c.json({ error: "That beta code is not valid." }, 400);
  }
  const expiresStr =
    typeof beta.expiresAt === "string"
      ? beta.expiresAt.slice(0, 10)
      : new Date(beta.expiresAt).toISOString().slice(0, 10);
  if (expiresStr < todayDateString()) {
    return c.json({ error: "This beta code has expired." }, 400);
  }
  if (beta.uses >= beta.maxUses) {
    return c.json(
      { error: "This beta code has already been used the maximum number of times." },
      400,
    );
  }
  const updated = (await db`UPDATE beta_codes SET uses = uses + 1, updated_at = now()
    WHERE code = ${beta.code} AND uses < max_uses
    RETURNING uses, max_uses AS "maxUses"`) as unknown as Array<{
    uses: number;
    maxUses: number;
  }>;
  if (updated.length === 0) {
    return c.json(
      { error: "This beta code has already been used the maximum number of times." },
      400,
    );
  }
  return c.json({ ok: true, usesLeft: updated[0].maxUses - updated[0].uses });
});

// ---------- coach ----------

app.post("/api/coach/pin", async (c) => {
  const body = await readJson(c);
  const pin = body && typeof body.pin === "string" ? body.pin.trim() : "";
  if (!/^\d{4,8}$/.test(pin)) {
    return c.json({ error: "PIN must be 4 to 8 digits." }, 400);
  }
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  const settingRows = (await db`SELECT value FROM settings WHERE key = 'coach_pin_hash'`) as unknown as Array<{
    value: string;
  }>;
  const stored = settingRows[0]?.value || c.env.COACH_PIN_HASH || "";
  if (!stored) {
    // First Coach sign-in: Derek sets the PIN, and its hash is stored.
    const hash = await hashPassword(pin);
    await db`INSERT INTO settings (key, value) VALUES ('coach_pin_hash', ${hash})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
    const sessionId = await createCoachSession(db);
    setCookie(
      c,
      COACH_COOKIE,
      sessionId,
      cookieOptions(c, COACH_HOURS * 60 * 60),
    );
    return c.json({ ok: true, firstSet: true });
  }
  if (!(await verifyPassword(pin, stored))) {
    return c.json({ error: "PIN is not correct." }, 401);
  }
  const sessionId = await createCoachSession(db);
  setCookie(
    c,
    COACH_COOKIE,
    sessionId,
    cookieOptions(c, COACH_HOURS * 60 * 60),
  );
  return c.json({ ok: true });
});

app.post("/api/coach/logout", async (c) => {
  const db = getDb(c);
  const sessionId = getCookie(c, COACH_COOKIE);
  if (db && sessionId) {
    await db`DELETE FROM coach_sessions WHERE id = ${sessionId}`;
  }
  deleteCookie(c, COACH_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

app.get("/api/coach/clients", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  if (!(await hasCoachSession(c, db))) {
    return c.json({ error: "Coach sign-in is required." }, 401);
  }
  const rows = (await db`SELECT u.id, u.email, u.display_name AS "displayName",
      p.data AS profile, p.updated_at AS "updatedAt"
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    ORDER BY u.created_at ASC`) as unknown as Array<{
    id: string;
    email: string;
    displayName: string | null;
    profile: Record<string, unknown> | null;
    updatedAt: string | null;
  }>;
  return c.json({
    clients: rows.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      profile: row.profile ?? {},
      updatedAt: row.updatedAt,
    })),
  });
});

app.post("/api/coach/reply", async (c) => {
  const body = await readJson(c);
  if (!body) {
    return c.json({ error: "User, message, and reply are required." }, 400);
  }
  const userId = typeof body.userId === "string" ? body.userId : "";
  const messageId = typeof body.messageId === "string" ? body.messageId : "";
  const reply = typeof body.reply === "string" ? body.reply.trim() : "";
  if (!userId || !messageId || !reply || reply.length > 2000) {
    return c.json({ error: "User, message, and reply are required." }, 400);
  }
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  if (!(await hasCoachSession(c, db))) {
    return c.json({ error: "Coach sign-in is required." }, 401);
  }
  const doc = await getProfileDoc(db, userId);
  if (!doc) {
    return c.json({ error: "Client not found." }, 404);
  }
  const messages = Array.isArray(doc.messages) ? doc.messages : [];
  const index = messages.findIndex(
    (m) =>
      m !== null &&
      typeof m === "object" &&
      (m as Record<string, unknown>).id === messageId,
  );
  if (index === -1) {
    return c.json({ error: "Message not found." }, 404);
  }
  const message = messages[index] as Record<string, unknown>;
  message.coachReply = reply;
  message.repliedAt = new Date().toISOString();
  messages[index] = message;
  doc.messages = messages;
  await saveProfileDoc(db, userId, doc);
  return c.json({ ok: true });
});

app.post("/api/coach/nudge", async (c) => {
  const body = await readJson(c);
  if (!body) {
    return c.json({ error: "User and message are required." }, 400);
  }
  const userId = typeof body.userId === "string" ? body.userId : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!userId || !text || text.length > 2000) {
    return c.json({ error: "User and message are required." }, 400);
  }
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  if (!(await hasCoachSession(c, db))) {
    return c.json({ error: "Coach sign-in is required." }, 401);
  }
  const doc = await getProfileDoc(db, userId);
  if (!doc) {
    return c.json({ error: "Client not found." }, 404);
  }
  const nudges = Array.isArray(doc.nudges) ? doc.nudges : [];
  nudges.push({
    id: randomHex(16),
    text,
    createdAt: new Date().toISOString(),
  });
  doc.nudges = nudges;
  await saveProfileDoc(db, userId, doc);
  return c.json({ ok: true });
});

app.get("/api/coach/settings", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  if (!(await hasCoachSession(c, db))) {
    return c.json({ error: "Coach sign-in is required." }, 401);
  }
  const rows = (await db`SELECT code, uses, max_uses AS "maxUses", expires_at AS "expiresAt"
    FROM beta_codes ORDER BY created_at ASC LIMIT 1`) as unknown as Array<{
    code: string;
    uses: number;
    maxUses: number;
    expiresAt: string;
  }>;
  const beta = rows[0];
  if (!beta) {
    return c.json({
      code: c.env.BETA_CODE ?? "ACTIVEBETA",
      uses: 0,
      maxUses: parseMaxUses(c.env.BETA_USES, 25),
      expires: c.env.BETA_EXPIRES ?? "2027-02-19",
    });
  }
  const expires =
    typeof beta.expiresAt === "string"
      ? beta.expiresAt.slice(0, 10)
      : new Date(beta.expiresAt).toISOString().slice(0, 10);
  return c.json({
    code: beta.code,
    uses: beta.uses,
    maxUses: beta.maxUses,
    expires,
  });
});

app.post("/api/coach/beta", async (c) => {
  const body = await readJson(c);
  if (!body) {
    return c.json({ error: "Code, max uses, and expiry are required." }, 400);
  }
  const code =
    typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  const maxUses =
    typeof body.maxUses === "number" ? body.maxUses : Number.NaN;
  const expires = typeof body.expires === "string" ? body.expires.trim() : "";
  if (
    !code ||
    code.length > 50 ||
    !Number.isInteger(maxUses) ||
    maxUses < 1 ||
    maxUses > 1000 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(expires) ||
    Number.isNaN(new Date(expires).getTime())
  ) {
    return c.json({ error: "Code, max uses, and expiry are required." }, 400);
  }
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  if (!(await hasCoachSession(c, db))) {
    return c.json({ error: "Coach sign-in is required." }, 401);
  }
  await db`INSERT INTO beta_codes (code, max_uses, uses, expires_at)
    VALUES (${code}, ${maxUses}, 0, ${expires})
    ON CONFLICT (code) DO UPDATE
      SET max_uses = EXCLUDED.max_uses, expires_at = EXCLUDED.expires_at, updated_at = now()`;
  return c.json({ ok: true });
});

// Shared API module. Entry points live in src/worker.ts (Worker) and
// functions/api/[[path]].ts (Pages). Hono handles routing from there.
