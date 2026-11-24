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
  // Cloudflare R2 bucket for assessment videos, check-in videos and
  // progress photos. Bound in wrangler.toml as VIDEOS (bucket
  // active-life-quest-videos). VIDEOS is optional: the binding was
  // TEMPORARILY REMOVED from wrangler.toml on Nov 22, 2026 because
  // videos are deferred and the bucket does not exist yet (a deploy
  // with the binding fails when the bucket is missing). With no
  // binding, every video/photo endpoint returns a plain 503
  // "Video storage is not set up yet" and the assessment, check-in,
  // message and progress flows still finish fine without a file.
  // To re-enable videos, create the bucket first, then uncomment the
  // [[r2_buckets]] block in wrangler.toml and redeploy.
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
  // Safety net: never let a fresh default profile overwrite a profile
  // that already has progress. This happened live three times: a failed
  // load made the client think the account was new, and the next save
  // PUT an empty doc (0 XP, no guardian, no assessment) over the real
  // one. If the stored profile has progress and the incoming one has
  // none, keep the stored one and tell the client.
  const hasProgress = (d: Record<string, unknown> | null): boolean => {
    if (!d) return false;
    if (typeof d.xp === "number" && d.xp > 0) return true;
    if (d.guardianPicked === true) return true;
    if (d.assessmentDone === true) return true;
    if (d.betaRedeemed === true) return true;
    if (typeof d.trialStartedAt === "string" && d.trialStartedAt) return true;
    for (const f of ["workouts", "checkins", "messages", "cardio", "sleep", "measurements", "prs", "retests"] as const) {
      if (Array.isArray(d[f]) && (d[f] as unknown[]).length > 0) return true;
    }
    return false;
  };
  const existing = await getProfileDoc(db, user.id);
  if (hasProgress(existing) && !hasProgress(profile)) {
    return c.json(
      { error: "Your saved progress was kept. The empty profile was not written over it. Reload the page and try again." },
      409,
    );
  }
  const rows = (await db`INSERT INTO profiles (user_id, data) VALUES (${user.id}, ${text}::jsonb)
    ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    RETURNING updated_at AS "updatedAt"`) as unknown as Array<{
    updatedAt: string;
  }>;
  return c.json({ ok: true, updatedAt: rows[0]?.updatedAt ?? null });
});

// ---------- community board (opt-in, anonymous) ----------
// The board ranks consistency only, this month only: workouts done,
// check-ins logged, cardio minutes, and streak days. It resets on the
// 1st of every month, so a new client never starts hundreds of points
// behind. The server aggregates here and returns ONLY the top 5 plus
// the caller's own row and the row directly above them. It never
// returns a full list, a user id, an email, a real name, a weight, or
// measurements. A client who has not opted in is never included, and
// turning the opt-in off removes them on the next load, because the
// endpoint only reads the stored opt-in flag.
app.get("/api/community/leaderboard", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  const user = await requireSession(c, db);
  if (!user) {
    return c.json({ error: "You are not signed in." }, 401);
  }
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthLabel = `${monthNames[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
  const todayKey = now.toISOString().slice(0, 10);

  const rows = (await db`SELECT user_id AS "userId", data FROM profiles`) as unknown as Array<{
    userId: string;
    data: Record<string, unknown> | null;
  }>;

  type RawEntry = {
    userId: string;
    name: string;
    classId: string;
    workouts: number;
    checkins: number;
    cardioMinutes: number;
    streak: number;
    score: number;
  };
  const raw: RawEntry[] = [];
  for (const row of rows) {
    const d = row.data;
    if (!d || d.communityOptIn !== true) continue;
    const guardian = d.guardian as { name?: string; classId?: string } | null;
    const name = typeof guardian?.name === "string" ? guardian.name.trim() : "";
    if (!name) continue;
    const inMonth = (list: unknown): Array<Record<string, unknown>> =>
      Array.isArray(list)
        ? (list as Array<Record<string, unknown>>).filter(
            (e) => typeof e?.date === "string" && e.date.slice(0, 7) === monthKey,
          )
        : [];
    const workouts = inMonth(d.workouts).length;
    const checkins = inMonth(d.checkins).length;
    // Credited minutes: high-intensity (HIIT) minutes count double.
    const cardioMinutes = inMonth(d.cardio).reduce(
      (s, e) => s + (e.zone === "HIIT" ? Number(e.minutes || 0) * 2 : Number(e.minutes || 0)),
      0,
    );
    // Streak: consecutive days ending today or yesterday with a workout
    // or a check-in, worked out from the dates.
    const days = new Set<string>();
    for (const list of [d.workouts, d.checkins]) {
      if (Array.isArray(list)) {
        for (const e of list as Array<Record<string, unknown>>) {
          if (typeof e?.date === "string") days.add(e.date.slice(0, 10));
        }
      }
    }
    let streak = 0;
    const day = new Date(`${todayKey}T12:00:00Z`);
    if (!days.has(day.toISOString().slice(0, 10))) day.setUTCDate(day.getUTCDate() - 1);
    while (days.has(day.toISOString().slice(0, 10))) {
      streak += 1;
      day.setUTCDate(day.getUTCDate() - 1);
    }
    // Showing up score: 10 per workout, 5 per check-in, 2 per streak
    // day, 1 per 10 cardio minutes up to 300 minutes.
    const score =
      workouts * 10 + checkins * 5 + streak * 2 + Math.min(cardioMinutes, 300) / 10;
    raw.push({
      userId: row.userId,
      name,
      classId: typeof guardian?.classId === "string" ? guardian.classId : "Guardian",
      workouts,
      checkins,
      cardioMinutes,
      streak,
      score,
    });
  }
  raw.sort(
    (a, b) =>
      b.score - a.score || b.workouts - a.workouts || a.name.localeCompare(b.name),
  );
  // Anonymous names only. If two guardians picked the same name, tell
  // them apart with a number, never with a real name. Names are numbered
  // once, up front, so an entry shown twice (top 5 and your own row)
  // keeps the same name.
  const seenNames = new Map<string, number>();
  const named = raw.map((e) => {
    const base = `${e.name} the ${e.classId}`;
    const n = (seenNames.get(base) || 0) + 1;
    seenNames.set(base, n);
    return { ...e, display: n === 1 ? base : `${base} ${n}` };
  });
  const toEntry = (e: (typeof named)[number], rank: number) => ({
    rank,
    name: e.display,
    classId: e.classId,
    workouts: e.workouts,
    checkins: e.checkins,
    cardioMinutes: e.cardioMinutes,
    streak: e.streak,
    score: e.score,
    isMe: e.userId === user.id,
  });
  const top = named.slice(0, 5).map((e, i) => toEntry(e, i + 1));
  const myIndex = named.findIndex((e) => e.userId === user.id);
  const me = myIndex >= 0 ? toEntry(named[myIndex], myIndex + 1) : null;
  // The row directly above the viewer, so the client can say how far
  // behind the next spot they are without ever seeing the full list.
  const ahead = myIndex > 0 ? named[myIndex - 1] : null;
  return c.json({
    month: monthKey,
    monthLabel,
    top,
    me,
    aheadOfMe: ahead
      ? {
          rank: myIndex,
          workouts: ahead.workouts,
          checkins: ahead.checkins,
          cardioMinutes: ahead.cardioMinutes,
          streak: ahead.streak,
          score: ahead.score,
        }
      : null,
    totalOptedIn: raw.length,
  });
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

// ---------- check-in / message videos ----------
// Same R2 path as assessment videos, but for Daily check-ins and Message
// Derek. The file goes to R2 only, never into Neon. The client attaches
// the returned record to the check-in or message in the profile doc.

function checkinVideoKeyFor(userId: string, fileName: string): string {
  const safe = fileName.replace(/[^A-Za-z0-9._-]+/g, "-").slice(-60) || "video";
  const ext = safe.includes(".") ? safe.slice(safe.lastIndexOf(".")) : "";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `checkin/${userId}/${stamp}-${randomHex(8)}${ext}`;
}

function isOwnCheckinVideoKey(userId: string, key: string): boolean {
  return (
    key.startsWith(`checkin/${userId}/`) &&
    !key.includes("..") &&
    !key.slice(`checkin/${userId}/`.length).includes("/")
  );
}

app.post("/api/checkin/video", async (c) => {
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
          "Video storage is not set up yet. Derek needs to enable R2 in Cloudflare and create the active-life-quest-videos bucket, then redeploy. You can still send the check-in or message without a video.",
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
      : "Check-in video";
  const weekRaw = Number(form.get("week"));
  const week = Number.isFinite(weekRaw) && weekRaw >= 1 && weekRaw <= 13 ? Math.floor(weekRaw) : 1;
  const key = checkinVideoKeyFor(user.id, file.name || "video.mp4");
  try {
    await bucket.put(key, file, {
      httpMetadata: { contentType: file.type || "video/mp4" },
    });
  } catch {
    return c.json(
      {
        error:
          "The video could not be saved. Video storage may not be set up yet. You can still send the check-in or message without a video.",
      },
      503,
    );
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
  return c.json({ ok: true, video }, 201);
});

// Coach-only: stream one client's check-in or message video from R2.
app.get("/api/coach/checkin-videos/:userId/:key", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  if (!(await hasCoachSession(c, db))) {
    return c.json({ error: "Coach sign-in is required." }, 401);
  }
  const userId = c.req.param("userId");
  const fileName = c.req.param("key");
  const key = `checkin/${userId}/${fileName}`;
  if (!isOwnCheckinVideoKey(userId, key)) {
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

// Coach-only: delete one client's check-in or message video (R2 + any
// check-in or message record that points at it).
app.delete("/api/coach/checkin-videos/:userId/:key", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  if (!(await hasCoachSession(c, db))) {
    return c.json({ error: "Coach sign-in is required." }, 401);
  }
  const userId = c.req.param("userId");
  const fileName = c.req.param("key");
  const key = `checkin/${userId}/${fileName}`;
  if (!isOwnCheckinVideoKey(userId, key)) {
    return c.json({ error: "Video not found." }, 404);
  }
  const bucket = c.env.VIDEOS;
  if (bucket) {
    await bucket.delete(key);
  }
  const doc = await getProfileDoc(db, userId);
  if (doc) {
    const strip = (arr: Array<Record<string, unknown>> | undefined) =>
      (arr || []).map((e) =>
        e && typeof e === "object" && (e as Record<string, unknown>).video &&
        ((e as Record<string, unknown>).video as Record<string, unknown>).key === key
          ? { ...e, video: undefined }
          : e,
      );
    doc.checkins = strip(doc.checkins as Array<Record<string, unknown>> | undefined) as typeof doc.checkins;
    doc.messages = strip(doc.messages as Array<Record<string, unknown>> | undefined) as typeof doc.messages;
    await saveProfileDoc(db, userId, doc);
  }
  return c.json({ ok: true });
});

// ---------- progress photos ----------
// Optional progress photos, same R2 bucket as videos, prefix progress/.
// Photo bytes go to R2 only, never into Neon. Metadata lives in the
// profile doc (progressPhotos) and is Coach-visible.

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB

function photoKeyFor(userId: string, fileName: string): string {
  const safe = fileName.replace(/[^A-Za-z0-9._-]+/g, "-").slice(-60) || "photo";
  const ext = safe.includes(".") ? safe.slice(safe.lastIndexOf(".")) : "";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `progress/${userId}/${stamp}-${randomHex(8)}${ext}`;
}

function isOwnPhotoKey(userId: string, key: string): boolean {
  return (
    key.startsWith(`progress/${userId}/`) &&
    !key.includes("..") &&
    !key.slice(`progress/${userId}/`.length).includes("/")
  );
}

app.post("/api/progress/photo", async (c) => {
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
          "Photo storage is not set up yet. Derek needs to enable R2 in Cloudflare and create the active-life-quest-videos bucket, then redeploy. You can still track progress without a photo.",
      },
      503,
    );
  }
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return c.json({ error: "No photo was attached." }, 400);
  }
  const file = form.get("photo");
  if (!(file instanceof File)) {
    return c.json({ error: "No photo was attached." }, 400);
  }
  if (!file.type.startsWith("image/")) {
    return c.json({ error: "That file is not a photo. Pick an image file." }, 400);
  }
  if (file.size === 0) {
    return c.json({ error: "That photo is empty. Pick a different photo." }, 400);
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return c.json({ error: "That photo is over 10 MB. Pick a smaller one." }, 400);
  }
  const note =
    typeof form.get("note") === "string" ? (form.get("note") as string).trim().slice(0, 200) : "";
  const key = photoKeyFor(user.id, file.name || "photo.jpg");
  try {
    await bucket.put(key, file, {
      httpMetadata: { contentType: file.type || "image/jpeg" },
    });
  } catch {
    return c.json({ error: "The photo could not be saved. Photo storage may not be set up yet." }, 503);
  }
  const doc = await getProfileDoc(db, user.id);
  if (!doc) {
    await bucket.delete(key);
    return c.json({ error: "Client not found." }, 404);
  }
  const photo = {
    id: randomHex(16),
    key,
    date: new Date().toISOString(),
    note,
    sizeBytes: file.size,
    contentType: file.type || "image/jpeg",
  };
  const photos = Array.isArray(doc.progressPhotos) ? doc.progressPhotos : [];
  photos.unshift(photo);
  doc.progressPhotos = photos;
  await saveProfileDoc(db, user.id, doc);
  return c.json({ ok: true, photo }, 201);
});

app.get("/api/coach/photos/:userId/:key", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  if (!(await hasCoachSession(c, db))) {
    return c.json({ error: "Coach sign-in is required." }, 401);
  }
  const userId = c.req.param("userId");
  const fileName = c.req.param("key");
  const key = `progress/${userId}/${fileName}`;
  if (!isOwnPhotoKey(userId, key)) {
    return c.json({ error: "Photo not found." }, 404);
  }
  const bucket = c.env.VIDEOS;
  if (!bucket) {
    return c.json({ error: "Photo storage is not set up yet." }, 503);
  }
  const obj = await bucket.get(key);
  if (!obj) {
    return c.json({ error: "Photo not found." }, 404);
  }
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "image/jpeg",
      "Content-Length": String(obj.size),
      "Cache-Control": "private, max-age=3600",
    },
  });
});

app.delete("/api/coach/photos/:userId/:key", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  if (!(await hasCoachSession(c, db))) {
    return c.json({ error: "Coach sign-in is required." }, 401);
  }
  const userId = c.req.param("userId");
  const fileName = c.req.param("key");
  const key = `progress/${userId}/${fileName}`;
  if (!isOwnPhotoKey(userId, key)) {
    return c.json({ error: "Photo not found." }, 404);
  }
  const bucket = c.env.VIDEOS;
  if (bucket) {
    await bucket.delete(key);
  }
  const doc = await getProfileDoc(db, userId);
  if (doc) {
    const photos = Array.isArray(doc.progressPhotos) ? doc.progressPhotos : [];
    doc.progressPhotos = photos.filter(
      (v) => v === null || typeof v !== "object" || (v as Record<string, unknown>).key !== key,
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

// Coach-only: change a client's check-in mode and frequency. Live video
// calls are 30 minutes each, at most once a week, 1 to 4 times a month.
app.post("/api/coach/checkin-preference", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  if (!(await hasCoachSession(c, db))) {
    return c.json({ error: "Coach sign-in is required." }, 401);
  }
  const body = await readJson(c);
  const userId = body && typeof body.userId === "string" ? body.userId : "";
  const rawMode = body && typeof body.mode === "string" ? body.mode : "";
  const mode = rawMode === "live-call" ? "live-call" : "text";
  const frequency = body && typeof body.frequency === "string" ? body.frequency : "";
  if (!userId) {
    return c.json({ error: "Pick a check-in type." }, 400);
  }
  const allowed = mode === "live-call" ? ["1x-month", "2x-month", "3x-month", "4x-month"] : ["daily"];
  const freq = allowed.includes(frequency) ? frequency : mode === "live-call" ? "1x-month" : "daily";
  const doc = await getProfileDoc(db, userId);
  if (!doc) {
    return c.json({ error: "Client not found." }, 404);
  }
  doc.checkinMode = mode;
  doc.checkinFrequency = freq;
  await saveProfileDoc(db, userId, doc);
  return c.json({ ok: true, mode, frequency: freq });
});

// Coach-only: approve or revoke Phase 5 for a client. Phase 5 also needs
// a clean form retest, checked in the app.
app.post("/api/coach/calorie-calc", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  if (!(await hasCoachSession(c, db))) {
    return c.json({ error: "Coach sign-in is required." }, 401);
  }
  const body = await readJson(c);
  const userId = body && typeof body.userId === "string" ? body.userId : "";
  const enabled = body && body.enabled === true;
  if (!userId) {
    return c.json({ error: "Client not found." }, 404);
  }
  const doc = await getProfileDoc(db, userId);
  if (!doc) {
    return c.json({ error: "Client not found." }, 404);
  }
  doc.calorieCalcEnabled = enabled;
  await saveProfileDoc(db, userId, doc);
  return c.json({ ok: true, enabled });
});

app.post("/api/coach/phase5", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  if (!(await hasCoachSession(c, db))) {
    return c.json({ error: "Coach sign-in is required." }, 401);
  }
  const body = await readJson(c);
  const userId = body && typeof body.userId === "string" ? body.userId : "";
  const approved = body && body.approved === true;
  if (!userId) {
    return c.json({ error: "Client not found." }, 404);
  }
  const doc = await getProfileDoc(db, userId);
  if (!doc) {
    return c.json({ error: "Client not found." }, 404);
  }
  doc.phase5Approved = approved;
  await saveProfileDoc(db, userId, doc);
  return c.json({ ok: true, approved });
});


// Coach-only: review one pending retest. A client cannot always see
// their own imbalance, so no retest moves a phase until Derek reviews
// it. This mirrors applyRetestReview in lib/store.ts: approve a clean
// retest and the phase moves (Week 4 to Phase 2, Week 8 to Phase 3,
// Week 12 to Phase 4; later retests keep the phase), every corrective
// step moves one step forward (all CES progressions are 3 steps, so the
// cap is index 2), and +20 XP is earned. Approve a retest the client
// did not call clean, or mark it not yet, and the phase stays put.
// Retests saved before coach review existed have no status and count
// as already approved, so only a pending entry can be reviewed here.
app.post("/api/coach/retest", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  if (!(await hasCoachSession(c, db))) {
    return c.json({ error: "Coach sign-in is required." }, 401);
  }
  const body = await readJson(c);
  const userId = body && typeof body.userId === "string" ? body.userId : "";
  const week = body && typeof body.week === "number" ? body.week : 0;
  const approved = body && body.approved === true;
  if (!userId || !week) {
    return c.json({ error: "Pick a client and a retest week." }, 400);
  }
  const doc = await getProfileDoc(db, userId);
  if (!doc) {
    return c.json({ error: "Client not found." }, 404);
  }
  const retests = Array.isArray(doc.retests) ? (doc.retests as Record<string, unknown>[]) : [];
  const entry = retests.find((r) => Number(r.week || 0) === week && r.status === "pending");
  if (!entry) {
    return c.json({ error: "That retest is not waiting for review." }, 400);
  }
  entry.status = approved ? "approved" : "not-yet";
  entry.reviewedAt = new Date().toISOString();
  if (approved && entry.clean === true) {
    const nextPhase = week === 4 ? 2 : week === 8 ? 3 : week === 12 ? 4 : Number(doc.phaseOverride || (doc.assessment as Record<string, unknown> | undefined)?.startingPhase || 1);
    doc.phaseOverride = nextPhase;
    const cesIds = ["feet-turn-out", "heel-rise", "overpronation", "knee-dominance", "knee-valgus", "knee-varus", "asymmetric-weight-shift", "excessive-anterior-pelvic-tilt", "excessive-forward-trunk-lean", "excessive-posterior-pelvic-tilt", "arms-fall-forward", "scapular-winging", "shoulder-elevation-forward-head", "shoulder-elevation-no-forward-head", "elbow-flexion", "non-neutral-wrist", "forward-head-posture"];
    const cesStep = ((doc.cesStep as Record<string, number> | undefined) || {}) as Record<string, number>;
    for (const id of cesIds) cesStep[id] = Math.min((cesStep[id] || 0) + 1, 2);
    doc.cesStep = cesStep;
    doc.xp = Number(doc.xp || 0) + 20;
    const badges = Array.isArray(doc.badges) ? (doc.badges as string[]) : [];
    const addBadge = (id: string) => { if (!badges.includes(id)) badges.push(id); };
    if (nextPhase >= 2) addBadge("phase-1-finisher");
    if (nextPhase >= 3) addBadge("phase-2-finisher");
    if (week === 12) { addBadge("phase-3-finisher"); addBadge("cycle-1-finisher"); }
    if (week === 24) addBadge("cycle-2-finisher");
    if (week === 36) addBadge("cycle-3-finisher");
    if (week === 48) addBadge("cycle-4-finisher");
    if (week === 52) addBadge("year-finisher");
    const assessment = (doc.assessment || {}) as Record<string, unknown>;
    const baseBest = Math.max(Number(assessment.balanceLeftSec || 0), Number(assessment.balanceRightSec || 0));
    const retestBest = Math.max(0, ...retests.filter((r) => r.status === "approved").map((r) => Math.max(Number(r.balanceLeftSec || 0), Number(r.balanceRightSec || 0))));
    if (retestBest > baseBest) addBadge("balance-breakthrough");
    doc.badges = badges;
  }
  await saveProfileDoc(db, userId, doc);
  return c.json({ ok: true, week, approved });
});

// Coach-only: save the CES assessment check sheet to the client file.
app.post("/api/coach/ces-sheet", async (c) => {
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  if (!(await hasCoachSession(c, db))) {
    return c.json({ error: "Coach sign-in is required." }, 401);
  }
  const body = await readJson(c);
  const userId = body && typeof body.userId === "string" ? body.userId : "";
  const marks = Array.isArray(body?.marks) ? body.marks.filter((m: unknown) => typeof m === "string") : [];
  const notes = body && typeof body.notes === "string" ? body.notes.trim().slice(0, 1000) : "";
  const sides: Record<string, "right" | "left" | "both"> = {};
  if (body?.sides && typeof body.sides === "object") {
    for (const [k, v] of Object.entries(body.sides as Record<string, unknown>)) {
      if (v === "right" || v === "left" || v === "both") sides[k] = v;
    }
  }
  const dv = (body?.davies || {}) as { right?: unknown; left?: unknown };
  const davies = {
    right: typeof dv.right === "number" ? dv.right : null,
    left: typeof dv.left === "number" ? dv.left : null,
  };
  if (!userId) {
    return c.json({ error: "Client not found." }, 404);
  }
  const doc = await getProfileDoc(db, userId);
  if (!doc) {
    return c.json({ error: "Client not found." }, 404);
  }
  doc.cesSheet = { marks, sides, davies, notes, date: new Date().toISOString() };
  await saveProfileDoc(db, userId, doc);
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

// Coach issues a one-time password reset code for a client. No email is
// sent in beta, so Derek copies this code to the client in a message, and
// the client enters it on the sign-in screen under "Set a new password".
// The code works for 1 hour, once.
app.post("/api/coach/reset-token", async (c) => {
  const body = await readJson(c);
  const userId = body && typeof body.userId === "string" ? body.userId : "";
  if (!userId) {
    return c.json({ error: "A client is required." }, 400);
  }
  const db = getDb(c);
  if (!db) {
    return dbMissing(c);
  }
  if (!(await hasCoachSession(c, db))) {
    return c.json({ error: "Coach sign-in is required." }, 401);
  }
  const rows = (await db`SELECT id FROM users WHERE id = ${userId}`) as unknown as Array<{ id: string }>;
  if (!rows[0]) {
    return c.json({ error: "That client was not found." }, 404);
  }
  const token = randomHex(32);
  const tokenHash = await hashToken(token);
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await db`INSERT INTO password_resets (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, ${expires})`;
  return c.json({ ok: true, token });
});

// Shared API module. Entry points live in src/worker.ts (Worker) and
// functions/api/[[path]].ts (Pages). Hono handles routing from there.
