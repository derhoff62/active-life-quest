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
export async function loadProfile(): Promise<ProfileDoc | null> {
  const m = await detectMode();
  if (m === 'local') return null;
  try {
    const r = await req<{ data: ProfileDoc }>('/api/profile');
    return r.data && Object.keys(r.data).length ? r.data : null;
  } catch {
    return null;
  }
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
