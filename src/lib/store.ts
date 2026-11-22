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
  balanceBaseline: { left: number; right: number } | null;
  messages: ClientMessage[];
  nudges: { id: string; text: string; date: string; read: boolean }[];
  nutritionEnabled: boolean;
  calorieCalcEnabled: boolean;
  largeText: boolean;
  reminderTimes: { workout: string; checkin: string; streak: string };
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
    balanceBaseline: null,
    messages: [],
    nudges: [],
    nutritionEnabled: false,
    calorieCalcEnabled: false,
    largeText: false,
    reminderTimes: { workout: '07:30', checkin: '20:00', streak: '18:00' },
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
  return doc.assessment?.startingPhase ?? 1;
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
