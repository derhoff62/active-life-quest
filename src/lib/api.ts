// API client for Active Life Quest.
// Talks to /api/* (Cloudflare Pages Functions + Neon) when available.
// Falls back to local-only mode (profile in localStorage) when the API
// is not configured, so the app still works offline / before deploy.
import type { ProfileDoc } from './store';

export type ApiMode = 'server' | 'local';

let mode: ApiMode | null = null;
let modeChecked = false;

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    credentials: 'same-origin',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || `Request failed (${res.status})`);
  return body as T;
}

export async function detectMode(): Promise<ApiMode> {
  if (modeChecked && mode) return mode;
  modeChecked = true;
  try {
    const r = await fetch('/api/health', { credentials: 'same-origin' });
    if (r.ok) {
      const b = await r.json().catch(() => ({}));
      mode = (b as { db?: boolean }).db === false ? 'local' : 'server';
      // If the server says the DB is not configured, treat as local mode.
      if ((b as { db?: boolean }).db === false) mode = 'local';
    } else {
      mode = 'local';
    }
  } catch {
    mode = 'local';
  }
  return mode;
}

export function getMode(): ApiMode {
  return mode ?? 'local';
}

// --- Auth ---
export async function signup(email: string, password: string, displayName: string) {
  return req<{ user: { id: string; email: string; displayName: string } }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
}
export async function login(email: string, password: string) {
  return req<{ user: { id: string; email: string; displayName: string } }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
export async function logout() {
  try {
    await req('/api/auth/logout', { method: 'POST' });
  } catch {
    /* local mode */
  }
}
export async function me() {
  return req<{ user: { id: string; email: string; displayName: string } | null }>('/api/auth/me');
}
export async function forgotPassword(email: string) {
  return req<{ ok: boolean }>('/api/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) });
}
export async function resetPassword(token: string, newPassword: string) {
  return req<{ ok: boolean }>('/api/auth/reset', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
}
export async function deleteAccount() {
  return req<{ ok: boolean }>('/api/auth/account', { method: 'DELETE' });
}

// --- Profile doc ---
// loadProfile throws when the server cannot be reached, after retries.
// That is deliberate: callers must tell "the server did not answer" apart
// from "this account has no profile yet" (null). The old version returned
// null for both, so a single failed fetch looked like a brand-new account
// and the app then saved a fresh default over the real profile in Neon.
export async function loadProfile(): Promise<ProfileDoc | null> {
  const m = await detectMode();
  if (m === 'local') return null;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await req<{ data: ProfileDoc }>('/api/profile');
      return r.data && Object.keys(r.data).length ? r.data : null;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => window.setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Could not load your profile.');
}
export async function saveProfile(doc: ProfileDoc): Promise<boolean> {
  const m = await detectMode();
  if (m === 'local') return false;
  try {
    await req('/api/profile', { method: 'PUT', body: JSON.stringify({ data: doc }) });
    return true;
  } catch {
    return false;
  }
}

// --- Beta ---
export async function redeemBeta(code: string): Promise<{ ok: boolean; usesLeft?: number; error?: string }> {
  const m = await detectMode();
  if (m === 'local') {
    if (code.trim().toUpperCase() === 'ACTIVEBETA') return { ok: true };
    return { ok: false, error: 'That code did not work. Check the spelling and try again.' };
  }
  try {
    const r = await req<{ ok: boolean; usesLeft?: number }>('/api/beta/redeem', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return { ok: true, usesLeft: r.usesLeft };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'That code did not work.' };
  }
}

// --- Assessment videos ---
export async function uploadAssessmentVideo(file: File, label: string, week: number) {
  const form = new FormData();
  form.append("video", file);
  form.append("label", label);
  form.append("week", String(week));
  const res = await fetch("/api/assessment/video", {
    method: "POST",
    body: form,
    credentials: "same-origin",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || `Upload failed (${res.status})`);
  return body as {
    ok: boolean;
    video: { id: string; key: string; label: string; date: string; week: number; sizeBytes: number; contentType: string };
  };
}
export function coachVideoUrl(userId: string, key: string) {
  const fileName = key.split("/").pop() || "";
  return `/api/coach/videos/${encodeURIComponent(userId)}/${encodeURIComponent(fileName)}`;
}
export async function coachDeleteVideo(userId: string, key: string) {
  const fileName = key.split("/").pop() || "";
  return req<{ ok: boolean }>(`/api/coach/videos/${encodeURIComponent(userId)}/${encodeURIComponent(fileName)}`, {
    method: "DELETE",
  });
}

// --- Check-in / message videos (same R2 bucket, checkin/ prefix) ---
export async function uploadCheckinVideo(file: File, label: string, week: number) {
  const form = new FormData();
  form.append("video", file);
  form.append("label", label);
  form.append("week", String(week));
  const res = await fetch("/api/checkin/video", {
    method: "POST",
    body: form,
    credentials: "same-origin",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || `Upload failed (${res.status})`);
  return body as {
    ok: boolean;
    video: { id: string; key: string; label: string; date: string; week: number; sizeBytes: number; contentType: string };
  };
}
export function coachCheckinVideoUrl(userId: string, key: string) {
  const fileName = key.split("/").pop() || "";
  return `/api/coach/checkin-videos/${encodeURIComponent(userId)}/${encodeURIComponent(fileName)}`;
}
export async function coachDeleteCheckinVideo(userId: string, key: string) {
  const fileName = key.split("/").pop() || "";
  return req<{ ok: boolean }>(`/api/coach/checkin-videos/${encodeURIComponent(userId)}/${encodeURIComponent(fileName)}`, {
    method: "DELETE",
  });
}

export async function uploadProgressPhoto(file: File, note: string) {
  const form = new FormData();
  form.append("photo", file);
  form.append("note", note);
  const res = await fetch("/api/progress/photo", {
    method: "POST",
    body: form,
    credentials: "same-origin",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || `Upload failed (${res.status})`);
  return body as {
    ok: boolean;
    photo: { id: string; key: string; date: string; note: string; sizeBytes: number; contentType: string };
  };
}
export function coachPhotoUrl(userId: string, key: string) {
  const fileName = key.split("/").pop() || "";
  return `/api/coach/photos/${encodeURIComponent(userId)}/${encodeURIComponent(fileName)}`;
}
export async function coachDeletePhoto(userId: string, key: string) {
  const fileName = key.split("/").pop() || "";
  return req<{ ok: boolean }>(`/api/coach/photos/${encodeURIComponent(userId)}/${encodeURIComponent(fileName)}`, {
    method: "DELETE",
  });
}

export async function coachSetCalorieCalc(userId: string, enabled: boolean) {
  return req<{ ok: boolean; enabled: boolean }>('/api/coach/calorie-calc', {
    method: 'POST',
    body: JSON.stringify({ userId, enabled }),
  });
}

export async function coachSetPhase5(userId: string, approved: boolean) {
  return req<{ ok: boolean; approved: boolean }>('/api/coach/phase5', {
    method: 'POST',
    body: JSON.stringify({ userId, approved }),
  });
}
export async function coachSaveCesSheet(userId: string, marks: string[], notes: string) {
  return req<{ ok: boolean }>('/api/coach/ces-sheet', {
    method: 'POST',
    body: JSON.stringify({ userId, marks, notes }),
  });
}

export async function coachSetCheckinPreference(userId: string, mode: string, frequency: string) {
  return req<{ ok: boolean; mode: string; frequency: string }>('/api/coach/checkin-preference', {
    method: 'POST',
    body: JSON.stringify({ userId, mode, frequency }),
  });
}

// --- Community board (opt-in, anonymous) ---
// The server returns only the top 5 plus your own row and the row
// directly above you. No user ids, no emails, no real names, no weight,
// no measurements ever come back from this endpoint.
export interface LeaderboardEntry {
  rank: number;
  name: string;
  classId: string;
  workouts: number;
  checkins: number;
  cardioMinutes: number;
  streak: number;
  score: number;
  isMe: boolean;
}
export interface LeaderboardResponse {
  month: string;
  monthLabel: string;
  top: LeaderboardEntry[];
  me: LeaderboardEntry | null;
  aheadOfMe: { rank: number; workouts: number; checkins: number; cardioMinutes: number; streak: number; score: number } | null;
  totalOptedIn: number;
}
export async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  return req<LeaderboardResponse>('/api/community/leaderboard');
}

// --- Coach ---
export async function coachUnlock(pin: string) {
  return req<{ ok: boolean; firstSet?: boolean }>('/api/coach/pin', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
}
export async function coachLogout() {
  try {
    await req('/api/coach/logout', { method: 'POST' });
  } catch {
    /* ignore */
  }
}
export async function coachClients() {
  return req<{ clients: { id: string; email: string; displayName: string; data: ProfileDoc; updatedAt: string }[] }>(
    '/api/coach/clients',
  );
}
export async function coachReply(userId: string, messageId: string, reply: string) {
  return req<{ ok: boolean }>('/api/coach/reply', {
    method: 'POST',
    body: JSON.stringify({ userId, messageId, reply }),
  });
}
export async function coachNudge(userId: string, text: string) {
  return req<{ ok: boolean }>('/api/coach/nudge', {
    method: 'POST',
    body: JSON.stringify({ userId, text }),
  });
}
export async function coachSettings() {
  return req<{ code: string; uses: number; maxUses: number; expires: string }>('/api/coach/settings');
}
export async function coachSetBeta(code: string, maxUses: number, expires: string) {
  return req<{ ok: boolean }>('/api/coach/beta', {
    method: 'POST',
    body: JSON.stringify({ code, maxUses, expires }),
  });
}
export async function coachResetToken(userId: string) {
  return req<{ ok: boolean; token: string }>('/api/coach/reset-token', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}
