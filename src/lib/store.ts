// Client profile document: the whole client state in one object.
// It is saved to the server (Neon profiles.data) when the API is available,
// and always to localStorage so the app works offline and before deploy.
import type { AssessmentResult, FindingId, GoalType } from './types';
import { CREATURES } from './data';

export interface GuardianState {
  name: string;
  classId: 'Guardian' | 'Ranger' | 'Spellweaver';
  color: string;
  gem: string;
  cape: boolean;
  look?: 'Female' | 'Male';
}

export interface ProgressPhoto {
  id: string;
  key: string;
  date: string;
  note: string;
  sizeBytes: number;
  contentType: string;
}

export interface ClientMessage {
  id: string;
  kind: 'question' | 'message';
  body: string;
  date: string;
  coachReply?: string;
  repliedAt?: string;
}

export interface LogEntry {
  id: string;
  date: string;
  [key: string]: unknown;
}

export interface AssessmentVideo {
  id: string;
  key: string;
  label: string;
  date: string;
  week: number;
  sizeBytes: number;
  contentType: string;
}

export interface ProfileDoc {
  version: number;
  displayName: string;
  email: string;
  guardian: GuardianState | null;
  guardianPicked: boolean;
  tutorialDone: boolean;
  storySkipped: boolean;
  assessment: AssessmentResult | null;
  assessmentDone: boolean;
  healthFlags: string[];
  contraindications: string[];
  body: { sex: string; heightIn: number | null; weightLb: number | null; goalWeightLb: number | null; age: number | null; activity: string };
  equipment: string[];
  goals: { type: GoalType; label: string; why: string; started: string }[];
  mainGoal: string;
  xp: number;
  level: number;
  mana: number;
  badges: string[];
  armorEarned: string[];
  rarityEarned: string[];
  prs: { exercise: string; weight: number; reps: number; date: string }[];
  workouts: LogEntry[];
  sessions: { workoutId: string; step: number; log: Record<string, unknown>; startedAt: string } | null;
  cardio: LogEntry[];
  checkins: LogEntry[];
  sleep: LogEntry[];
  measurements: LogEntry[];
  photos: { id: string; date: string; note: string }[];
  quests: LogEntry[];
  retests: LogEntry[];
  bossHp: Record<string, number>;
  assessmentVideos: AssessmentVideo[];
  progressPhotos: ProgressPhoto[];
  balanceBaseline: { left: number; right: number } | null;
  messages: ClientMessage[];
  nudges: { id: string; text: string; date: string; read: boolean }[];
  nutritionEnabled: boolean;
  calorieCalcEnabled: boolean;
  largeText: boolean;
  reminderTimes: { workout: string; checkin: string; streak: string };
  checkinFrequency: 'daily' | '3x-week' | 'weekly';
  trainingDays: number;
  dislikedExercises: string[];
  hurtExercises: string[];
  focus: Record<string, number>;
  socialPermission: boolean;
  steps: LogEntry[];
  cesStep: Record<string, number>;
  phaseOverride: number | null;
  phase5Approved: boolean;
  manaLastRefill: string;
  week13Goal: string | null;
  week13PlanRequested: boolean;
  trialStartedAt: string | null;
  betaRedeemed: boolean;
  joinedAt: string;
  lastActive: string;
  streakDays: number;
  lastWorkoutDate: string | null;
}

export function defaultProfile(email = '', displayName = ''): ProfileDoc {
  const now = new Date().toISOString();
  return {
    version: 1,
    displayName,
    email,
    guardian: null,
    guardianPicked: false,
    tutorialDone: false,
    storySkipped: false,
    assessment: null,
    assessmentDone: false,
    healthFlags: [],
    contraindications: [],
    body: { sex: '', heightIn: null, weightLb: null, goalWeightLb: null, age: null, activity: '' },
    equipment: [],
    goals: [],
    mainGoal: '',
    xp: 0,
    level: 1,
    mana: 10,
    badges: [],
    armorEarned: [],
    rarityEarned: [],
    prs: [],
    workouts: [],
    sessions: null,
    cardio: [],
    checkins: [],
    sleep: [],
    measurements: [],
    photos: [],
    quests: [],
    retests: [],
    bossHp: {},
    assessmentVideos: [],
    progressPhotos: [],
    balanceBaseline: null,
    messages: [],
    nudges: [],
    nutritionEnabled: false,
    calorieCalcEnabled: false,
    largeText: false,
    reminderTimes: { workout: '07:30', checkin: '20:00', streak: '18:00' },
    checkinFrequency: 'daily',
    trainingDays: 3,
    dislikedExercises: [],
    hurtExercises: [],
    focus: {},
    socialPermission: false,
    steps: [],
    cesStep: {},
    phaseOverride: null,
    phase5Approved: false,
    manaLastRefill: now.slice(0, 10),
    week13Goal: null,
    week13PlanRequested: false,
    trialStartedAt: null,
    betaRedeemed: false,
    joinedAt: now,
    lastActive: now,
    streakDays: 0,
    lastWorkoutDate: null,
  };
}

export function levelForXp(xp: number): number {
  // Level thresholds: roughly 100 XP per level, growing slowly.
  let level = 1;
  let need = 100;
  let remaining = xp;
  while (remaining >= need && level < 30) {
    remaining -= need;
    level += 1;
    need = 100 + (level - 1) * 25;
  }
  return level;
}

export function titleForLevel(level: number): string {
  if (level >= 15) return 'Hero';
  if (level >= 10) return 'Guardian';
  if (level >= 5) return 'Adventurer';
  return 'Apprentice';
}

export function recoveryScore(sleepHours: number, aches: number, energy: number, rested: boolean): number {
  // Sleep 40 / Aches 25 / Energy 25 / Rest rhythm 10
  const sleep = Math.max(0, Math.min(40, (sleepHours / 8) * 40));
  const ache = Math.max(0, Math.min(25, ((10 - aches) / 10) * 25));
  const en = Math.max(0, Math.min(25, (energy / 10) * 25));
  return Math.round(sleep + ache + en + (rested ? 10 : 0));
}

export function proteinRange(goalWeightLb: number | null): string {
  if (!goalWeightLb) return '0.7 to 1 g per lb of goal body weight';
  return `${Math.round(goalWeightLb * 0.7)} to ${Math.round(goalWeightLb * 1)} g per day`;
}

export function fiberTarget(sex: string): string {
  if (sex === 'female') return 'about 25 g a day';
  if (sex === 'male') return 'about 38 g a day';
  return 'about 25 to 38 g a day';
}

export function phaseForDoc(doc: ProfileDoc): number {
  if (doc.phaseOverride) return doc.phaseOverride;
  return doc.assessment?.startingPhase ?? 1;
}

/** Mana refills to full once a day. Call on save; harmless if already done today. */
export function refillMana(doc: ProfileDoc): void {
  const today = new Date().toISOString().slice(0, 10);
  if (doc.manaLastRefill !== today) {
    doc.mana = 10;
    doc.manaLastRefill = today;
  }
}

/** Last logged weight/reps for an exercise, from workout history. */
export function lastTimeFor(doc: ProfileDoc, exerciseId: string): { w: string; r: string } | null {
  for (let i = doc.workouts.length - 1; i >= 0; i -= 1) {
    const w = doc.workouts[i] as { log?: Record<string, { w?: string; r?: string }> };
    const entry = w.log?.[exerciseId];
    if (entry && (entry.w || entry.r)) return { w: entry.w || '', r: entry.r || '' };
  }
  return null;
}

/** Gear earned, worked out from what the client has actually done, so
 * armor is never stuck at zero. Level pieces by level, sets by phase
 * unlocks, workouts, PRs, cardio, badges, boss rounds, balance, check-ins. */
export function earnedArmorIds(doc: ProfileDoc): string[] {
  const level = levelForXp(doc.xp);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const cardioWeek = doc.cardio
    .filter((c) => new Date(String(c.date)).getTime() >= weekAgo)
    .reduce((s, c) => s + Number(c.minutes || 0), 0);
  const bossesBeaten = Object.values(doc.bossHp || {}).filter((hp) => hp <= 0).length;
  const balanceBest = Math.max(doc.balanceBaseline?.left || 0, doc.balanceBaseline?.right || 0);
  const checkinStreak = doc.checkins.length;
  const out = new Set<string>();
  const add = (id: string, ok: boolean) => { if (ok) out.add(id); };
  add('travelers-boots', doc.workouts.length >= 1);
  add('apprentice-gloves', level >= 2);
  add('sturdy-belt', level >= 3);
  add('trail-cloak', level >= 4);
  add('iron-bracers', level >= 5);
  add('wanderers-helm', level >= 6);
  add('sturdy-pauldrons', level >= 7);
  add('trail-leggings', level >= 8);
  add('guardians-tabard', level >= 9);
  add('veterans-chestplate', level >= 10);
  add('peakforged-helm', phaseForDoc(doc) >= 4);
  add('peakforged-chestplate', doc.workouts.some((w) => Number((w as { phase?: number }).phase || 0) === 4 || String(w.workoutId || '').startsWith('p4')));
  add('peakforged-greaves', doc.workouts.filter((w) => String(w.workoutId || '').startsWith('p4')).length >= 4);
  add('peakforged-gauntlets', doc.prs.length >= 1 && phaseForDoc(doc) >= 4);
  add('stormforged-helm', phaseForDoc(doc) >= 5);
  add('stormforged-chestplate', doc.workouts.some((w) => String(w.workoutId || '').startsWith('p5')));
  add('stormforged-greaves', doc.workouts.filter((w) => String(w.workoutId || '').startsWith('p5')).length >= 4);
  add('stormforged-gauntlets', doc.prs.length >= 1 && phaseForDoc(doc) >= 5);
  add('blade-long-game', doc.guardian?.classId === 'Guardian' && doc.prs.length >= 3);
  add('bow-steady-steps', doc.guardian?.classId === 'Ranger' && balanceBest >= 30);
  add('staff-deep-rest', doc.guardian?.classId === 'Spellweaver' && checkinStreak >= 7);
  add('trailwarden-cloak', doc.workouts.length >= 3);
  add('ember-shortblade', doc.prs.length >= 3);
  add('riverstep-boots', cardioWeek >= 150);
  add('sunforged-chestplate', phaseForDoc(doc) >= 2);
  add('stormcaller-longbow', bossesBeaten >= 1);
  add('gauntlets-many-wins', doc.badges.length >= 8);
  add('voidforged-greatblade', bossesBeaten >= 3);
  add('mantle-long-road', doc.workouts.length >= 25);
  add('circlet-full-journey', phaseForDoc(doc) >= 5);
  return [...out];
}

/** Award badges that have actually been earned. Call after workouts,
 * check-ins, cardio, PRs, and retests. Never removes a badge. */
export function awardBadges(doc: ProfileDoc): string[] {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const workoutsWeek = doc.workouts.filter((w) => new Date(String(w.date)).getTime() >= weekAgo).length;
  const cardioWeek = doc.cardio
    .filter((c) => new Date(String(c.date)).getTime() >= weekAgo)
    .reduce((s, c) => s + Number(c.minutes || 0), 0);
  const balanceBest = Math.max(doc.balanceBaseline?.left || 0, doc.balanceBaseline?.right || 0);
  const add = (id: string, ok: boolean) => { if (ok && !doc.badges.includes(id)) doc.badges.push(id); };
  add('week1', doc.workouts.length >= 1);
  add('three-in-a-row', workoutsWeek >= 3);
  add('two-to-three-strength', workoutsWeek >= 2 && workoutsWeek <= 3);
  add('150-club', cardioWeek >= 150);
  add('first-pr', doc.prs.length >= 1);
  add('five-prs', doc.prs.length >= 5);
  add('balance-breakthrough', balanceBest >= 30);
  add('phase-1-finisher', phaseForDoc(doc) >= 2);
  add('phase-2-finisher', phaseForDoc(doc) >= 3);
  add('phase-3-finisher', doc.retests.some((r) => (r as { week?: number }).week === 12));
  add('three-day-checkin', doc.checkins.length >= 3);
  add('week-1-finished', doc.workouts.length >= 2);
  return doc.badges;
}

// Current journey week, from retests done, or from the phase if no retest yet.
// Companions are met gradually by this week, and companion effects only
// apply once the companion is met. One place, so every tab agrees.
export function currentWeekForDoc(doc: ProfileDoc): number {
  const weeks = doc.retests.map((r) => (r as { week?: number }).week || 0);
  const max = Math.max(0, ...weeks);
  const phase = phaseForDoc(doc);
  return max > 0 ? Math.min(12, max + 1) : phase >= 4 ? 12 : phase === 3 ? 9 : phase === 2 ? 5 : 1;
}

export function metCompanionIds(doc: ProfileDoc): Set<string> {
  const week = currentWeekForDoc(doc);
  return new Set(CREATURES.filter((c) => week >= c.meetWeek).map((c) => c.id));
}

export function hasFullAccess(doc: ProfileDoc): boolean {
  if (doc.betaRedeemed) return true;
  if (doc.trialStartedAt) {
    const start = new Date(doc.trialStartedAt).getTime();
    return Date.now() - start < 14 * 24 * 60 * 60 * 1000;
  }
  return false;
}

export function trialEndsAt(doc: ProfileDoc): string | null {
  if (!doc.trialStartedAt) return null;
  return new Date(new Date(doc.trialStartedAt).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
}

// --- local persistence ---
const KEY = 'active-life-quest-profile-v1';
const AUTH_KEY = 'active-life-quest-auth-v1';

export function loadLocal(): ProfileDoc | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProfileDoc;
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocal(doc: ProfileDoc) {
  try {
    localStorage.setItem(KEY, JSON.stringify(doc));
  } catch {
    /* storage full or unavailable */
  }
}

export function clearLocal() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(AUTH_KEY);
  } catch {
    /* ignore */
  }
}

export function loadLocalAuth(): { email: string; displayName: string } | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as { email: string; displayName: string }) : null;
  } catch {
    return null;
  }
}

export function saveLocalAuth(auth: { email: string; displayName: string }) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  } catch {
    /* ignore */
  }
}

export type { AssessmentResult, FindingId, GoalType };
