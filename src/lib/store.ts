// Client profile document: the whole client state in one object.
// It is saved to the server (Neon profiles.data) when the API is available,
// and always to localStorage so the app works offline and before deploy.
import type { AssessmentResult, FindingId, GoalType } from './types';
import { ARMOR, CES_TEMPLATES, CREATURES } from './data';
import type { TrainingStyle } from './data';
import { HAIR_OPTIONS, SKIN_TONES } from './guardianOptions';

export const GUARDIAN_MOODS = ['celebrate', 'determined', 'tired', 'strong', 'struggling', 'thumbs-up'] as const;
export type GuardianMood = (typeof GUARDIAN_MOODS)[number];

export interface GuardianState {
  name: string;
  classId: 'Guardian' | 'Ranger' | 'Spellweaver';
  color: string;
  gem: string;
  cape: boolean;
  look?: 'Female' | 'Male';
  hair?: string;
  build?: 'Slim' | 'Athletic' | 'Strong';
  // Skin tone name, one of SKIN_TONES in guardianOptions. Optional on
  // old profiles: store.ts fills in 'Light' (the tone the avatar
  // shipped with) so existing guardians do not break.
  skinColor?: string;
  bodyColor?: string;
  armColor?: string;
  legColor?: string;
  capeColor?: string;
  // Equipped gear (Derek, Nov 22 8:53 PM: armor and weapons change the
  // avatar when equipped). One weapon slot + one armor slot, ARMOR ids.
  // Optional on old profiles: no equipped gear, so the guardian looks
  // exactly as before (class weapon, no trim) until something is equipped.
  equippedWeaponId?: string;
  equippedArmorId?: string;
  // Default mood / emote face (Derek, Nov 22 9:21 PM: the guardian
  // should not be stuck with the angry Determined look). The client
  // picks it in Customize guardian; Today can override it for the day
  // based on how they are doing (see lib/mood.ts). Optional on old
  // profiles: normalize fills in 'determined', the look the avatar
  // shipped with.
  mood?: GuardianMood;
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
  kind: 'question' | 'message' | 'video-call-request';
  body: string;
  date: string;
  coachReply?: string;
  repliedAt?: string;
  video?: AssessmentVideo;
  callStatus?: 'requested' | 'confirmed';
  callTime?: string;
  // Custom guardian emote id, e.g. 'celebrate'. The body always carries
  // a plain-text fallback ("Sent an emote: Celebrate") so the message
  // still reads if the face ever fails to render.
  emote?: string;
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

export interface ExerciseFeedback {
  exerciseId: string;
  exerciseName: string;
  kind: 'dislike' | 'hurts';
  reason: 'too-hard' | 'hurts' | 'dont-like' | 'no-equipment';
  date: string;
}

export interface BalanceTest {
  id: string;
  date: string;
  leftSec: number;
  rightSec: number;
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
  reminderPhone: string;
  reminderEmail: string;
  reminderEmailOk: boolean;
  reminderTextOk: boolean;
  checkinFrequency: 'daily' | '1x-month' | '2x-month' | '3x-month' | '4x-month';
  checkinMode: 'text' | 'live-call';
  trainingDays: number;
  trainingStyle: TrainingStyle;
  dislikedExercises: string[];
  hurtExercises: string[];
  exerciseFeedback: ExerciseFeedback[];
  balanceTests: BalanceTest[];
  doctorCleared: boolean;
  reducedMotion: boolean;
  focus: Record<string, number>;
  socialPermission: boolean;
  steps: LogEntry[];
  cesStep: Record<string, number>;
  phaseOverride: number | null;
  phase5Approved: boolean;
  cesSheet?: { marks: string[]; sides?: Record<string, 'right' | 'left' | 'both'>; davies?: { right: number | null; left: number | null }; notes: string; date: string };
  manaLastRefill: string;
  week13Goal: string | null;
  week13PlanRequested: boolean;
  // Tab-badge "seen" counters: how much gear the client had seen the last
  // time they opened Armor, and which journey week they had seen the last
  // time they opened Journey. Badges clear when the tab is visited.
  armorSeenCount: number;
  journeySeenWeek: number;
  // Community board: opt-in only, off by default. Turning it off removes
  // the client from the board. Only the guardian name and this month's
  // consistency counts are ever shared. Never a real name, weight, or
  // measurements.
  communityOptIn: boolean;
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
    reminderPhone: '',
    reminderEmail: '',
    reminderEmailOk: false,
    reminderTextOk: false,
    checkinFrequency: 'daily',
    checkinMode: 'text',
    trainingDays: 3,
    trainingStyle: 'full-body',
    dislikedExercises: [],
    hurtExercises: [],
    exerciseFeedback: [],
    balanceTests: [],
    doctorCleared: false,
    reducedMotion: false,
    focus: {},
    socialPermission: false,
    steps: [],
    cesStep: {},
    phaseOverride: null,
    phase5Approved: false,
    manaLastRefill: now.slice(0, 10),
    week13Goal: null,
    week13PlanRequested: false,
    armorSeenCount: 0,
    journeySeenWeek: 0,
    communityOptIn: false,
    trialStartedAt: null,
    betaRedeemed: false,
    joinedAt: now,
    lastActive: now,
    streakDays: 0,
    lastWorkoutDate: null,
  };
}

/** Fill in any field missing from a profile saved by an older version of
 * the app, so old accounts never crash a tab that touches a newer field.
 * Profiles are saved whole, so a field added later (steps, prs, progress
 * photos, retests, ...) stays undefined forever on an old account unless
 * it is filled in here. Idempotent: a complete profile comes back unchanged. */
export function normalizeProfile(raw: unknown): ProfileDoc {
  const base = defaultProfile();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<ProfileDoc>;
  const out: ProfileDoc = { ...base, ...r };
  const arrFields = [
    'healthFlags', 'contraindications', 'equipment', 'goals', 'badges',
    'armorEarned', 'rarityEarned', 'prs', 'workouts', 'cardio', 'checkins',
    'sleep', 'measurements', 'photos', 'quests', 'retests',
    'assessmentVideos', 'progressPhotos', 'messages', 'nudges',
    'dislikedExercises', 'hurtExercises', 'steps', 'exerciseFeedback', 'balanceTests',
  ] as const;
  for (const f of arrFields) {
    if (!Array.isArray((r as Record<string, unknown>)[f])) (out as unknown as Record<string, unknown>)[f] = [];
  }
  // Retests saved before coach review existed have no status: they were
  // saved under the old instant-advance system, so they count as
  // approved. A status that is not one of the three known values is
  // treated the same way, never as pending.
  for (const rt of out.retests as Record<string, unknown>[]) {
    if (rt && typeof rt === 'object') {
      const s = rt.status;
      if (s !== 'pending' && s !== 'approved' && s !== 'not-yet') rt.status = 'approved';
    }
  }
  out.body = { ...base.body, ...((r.body as object) || {}) };
  out.reminderTimes = { ...base.reminderTimes, ...((r.reminderTimes as object) || {}) };
  // Reminder contact (Derek, Nov 24, 2026): optional email and phone so
  // reminders can be sent later if a client forgets to log in. Nothing
  // is sent yet. Old profiles have neither field, so the sign-up email
  // pre-fills the reminder email and the phone starts empty.
  if (typeof out.reminderPhone !== 'string') out.reminderPhone = '';
  else out.reminderPhone = out.reminderPhone.trim();
  if (typeof out.reminderEmail !== 'string' || !out.reminderEmail.trim()) {
    out.reminderEmail = typeof out.email === 'string' ? out.email.trim() : '';
  } else {
    out.reminderEmail = out.reminderEmail.trim();
  }
  // Reminder permissions (Derek, Nov 24, 2026): both off unless the
  // client turned them on. Old profiles have neither flag.
  if (typeof out.reminderEmailOk !== 'boolean') out.reminderEmailOk = false;
  if (typeof out.reminderTextOk !== 'boolean') out.reminderTextOk = false;
  if (!out.bossHp || typeof out.bossHp !== 'object') out.bossHp = {};
  if (!out.focus || typeof out.focus !== 'object') out.focus = {};
  if (!out.cesStep || typeof out.cesStep !== 'object') out.cesStep = {};
  if (!out.guardian) out.guardian = null;
  // Hair and build are optional on old profiles: fill in safe defaults so
  // the avatar never crashes and always has a look.
  if (out.guardian) {
    const look = out.guardian.look === 'Male' ? 'Male' : 'Female';
    out.guardian.look = look;
    const validHair = HAIR_OPTIONS[look];
    if (!out.guardian.hair || !validHair.includes(out.guardian.hair)) {
      out.guardian.hair = look === 'Male' ? 'ShortBeard' : 'Long';
    }
    if (!['Slim', 'Athletic', 'Strong'].includes(out.guardian.build || '')) {
      out.guardian.build = 'Athletic';
    }
    // Skin tone: old profiles have none, so fill in 'Light', the tone
    // the avatar shipped with. An unknown value is reset the same way.
    if (!out.guardian.skinColor || !(SKIN_TONES as readonly string[]).includes(out.guardian.skinColor)) {
      out.guardian.skinColor = 'Light';
    }
    // Equipped gear: an unknown id (a piece that no longer exists) is
    // cleared, so the avatar falls back to the class weapon / no trim.
    for (const f of ['equippedWeaponId', 'equippedArmorId'] as const) {
      const v = out.guardian[f];
      if (v && !ARMOR.some((a) => a.id === v)) out.guardian[f] = undefined;
    }
    // Default mood: old profiles have none, so fill in 'determined',
    // the look the avatar shipped with. An unknown value is reset
    // the same way.
    if (!out.guardian.mood || !(GUARDIAN_MOODS as readonly string[]).includes(out.guardian.mood)) {
      out.guardian.mood = 'determined';
    }
    // Per-part colors default to the overall color, so old profiles and a
    // single overall pick still look the same.
    const validColors = [
      'Navy', 'Forest', 'Crimson', 'Gold', 'Teal', 'Purple', 'Silver',
      'Orange', 'Pink', 'Brown', 'Black',
    ];
    for (const f of ['bodyColor', 'armColor', 'legColor', 'capeColor'] as const) {
      const v = out.guardian[f];
      if (!v || !validColors.includes(v)) out.guardian[f] = out.guardian.color;
    }
  }
  // A check-in pick saved by an older version can pair a live video call
  // with a text frequency, or a text check-in with a weekly frequency.
  // Text check-in is daily only, and video calls are 30 minutes, at most
  // once a week, 1 to 4 times a month, so an invalid pick is reset here,
  // on every load.
  out.checkinMode = normalizeCheckinMode(out.checkinMode);
  out.checkinFrequency = normalizeCheckinFrequency(out.checkinMode, out.checkinFrequency);
  if (typeof out.xp !== 'number') out.xp = 0;
  if (typeof out.mana !== 'number') out.mana = 10;
  if (typeof out.level !== 'number') out.level = 1;
  if (typeof out.armorSeenCount !== 'number') out.armorSeenCount = 0;
  if (typeof out.journeySeenWeek !== 'number') out.journeySeenWeek = 0;
  if (typeof out.communityOptIn !== 'boolean') out.communityOptIn = false;
  if (typeof out.streakDays !== 'number') out.streakDays = 0;
  if (typeof out.trainingDays !== 'number') out.trainingDays = 3;
  if (typeof out.doctorCleared !== 'boolean') out.doctorCleared = false;
  if (typeof out.reducedMotion !== 'boolean') out.reducedMotion = false;
  if (out.trainingStyle !== 'full-body' && out.trainingStyle !== 'ppl' && out.trainingStyle !== 'short' && out.trainingStyle !== 'upper-lower') out.trainingStyle = 'full-body';
  return out;
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

export function normalizeCheckinMode(mode: string | undefined): 'text' | 'live-call' {
  return mode === 'live-call' ? 'live-call' : 'text';
}

export function checkinModeLabel(mode: string | undefined): string {
  if (mode === 'live-call') return 'live video call, 30 minutes';
  return 'text check-in in the app';
}

export function checkinFrequencyLabel(freq: string | undefined): string {
  if (freq === '1x-month') return '1 time a month';
  if (freq === '2x-month') return '2 times a month';
  if (freq === '3x-month') return '3 times a month';
  if (freq === '4x-month') return '4 times a month';
  return 'daily';
}

/** Daily check-in is in the app, every day: the client completes their
 * tasks in the app, then logs how it went. Text check-in is daily only,
 * there is no other text frequency to pick. Live video calls with Derek
 * are 30 minutes each, at most once a week, and the client picks 1, 2, 3,
 * or 4 a month. Recorded video is NOT a check-in type: it stays only for
 * form-check clips (assessment, and attached to a message to Derek about
 * form). */
export type CheckinFrequency = 'daily' | '1x-month' | '2x-month' | '3x-month' | '4x-month';
export function checkinFrequenciesForMode(mode: string | undefined): { value: CheckinFrequency; label: string }[] {
  if (mode === 'live-call') {
    return [
      { value: '1x-month', label: '1 time a month' },
      { value: '2x-month', label: '2 times a month' },
      { value: '3x-month', label: '3 times a month' },
      { value: '4x-month', label: '4 times a month' },
    ];
  }
  // Text check-in is daily only. No frequency picker for text.
  return [{ value: 'daily', label: 'Daily' }];
}

export function normalizeCheckinFrequency(mode: string | undefined, freq: string | undefined): CheckinFrequency {
  if (mode !== 'live-call') return 'daily';
  const allowed = checkinFrequenciesForMode(mode).map((f) => f.value);
  if (freq && allowed.includes(freq as CheckinFrequency)) return freq as CheckinFrequency;
  return '1x-month';
}

export function checkinPreferenceText(doc: ProfileDoc): string {
  const mode = normalizeCheckinMode(doc.checkinMode);
  const freq = normalizeCheckinFrequency(mode, doc.checkinFrequency);
  return `Your check-ins: ${checkinModeLabel(mode)}, ${checkinFrequencyLabel(freq)}.`;
}

export function phaseForDoc(doc: ProfileDoc): number {
  if (doc.phaseOverride) return doc.phaseOverride;
  return doc.assessment?.startingPhase ?? 1;
}

// ---------- Coach-reviewed retests (Derek, Nov 24, 2026) ----------
// A client cannot always see their own imbalance, so a retest is never
// self-graded. The client saves balance numbers plus their own view
// ("I think my movement looks clean"), and the retest sits PENDING until
// Derek reviews it in Coach. Only an APPROVED retest moves the phase,
// moves the corrective steps, or earns XP. Legacy retests saved before
// this change have no status field: they were saved under the old
// instant-advance system, so they count as approved.
export type RetestStatus = 'pending' | 'approved' | 'not-yet';

export function retestStatus(r: { status?: unknown }): RetestStatus {
  const s = (r as { status?: string }).status;
  return s === 'pending' || s === 'approved' || s === 'not-yet' ? s : 'approved';
}

export function approvedRetests(doc: ProfileDoc): LogEntry[] {
  return (doc.retests || []).filter((r) => retestStatus(r as never) === 'approved');
}

export function pendingRetests(doc: ProfileDoc): LogEntry[] {
  return (doc.retests || []).filter((r) => retestStatus(r as never) === 'pending');
}

export function hasApprovedRetest(doc: ProfileDoc, week: number): boolean {
  return approvedRetests(doc).some((r) => Number((r as { week?: number }).week || 0) === week);
}

export function hasCleanApprovedRetest(doc: ProfileDoc): boolean {
  return approvedRetests(doc).some((r) => (r as { clean?: boolean }).clean === true);
}

/** Phase a retest week moves to, once Derek approves it. Weeks 4, 8 and
 * 12 move the phase; later retests keep the phase the client is in
 * (later cycles build on what they have, and Week 13 plans move phases). */
export function retestNextPhase(doc: ProfileDoc, week: number): number {
  return week === 4 ? 2 : week === 8 ? 3 : week === 12 ? 4 : phaseForDoc(doc);
}

/** Apply Derek's review of one pending retest. Returns false when there
 * is no pending retest for that week (already reviewed, or never saved).
 * Approve, clean: phase moves, every corrective step moves one step
 * forward, +20 XP, badges are re-checked. Approve, not clean: the retest
 * is recorded, but the phase, corrective steps and XP stay put. Not yet:
 * nothing moves; the client stays in their phase until the next retest. */
export function applyRetestReview(doc: ProfileDoc, week: number, approved: boolean): boolean {
  const entry = (doc.retests || []).find(
    (r) => Number((r as { week?: number }).week || 0) === week && retestStatus(r as never) === 'pending',
  );
  if (!entry) return false;
  (entry as Record<string, unknown>).status = approved ? 'approved' : 'not-yet';
  (entry as Record<string, unknown>).reviewedAt = new Date().toISOString();
  if (!approved) return true;
  const clean = (entry as { clean?: boolean }).clean === true;
  if (clean) {
    doc.phaseOverride = retestNextPhase(doc, week);
    for (const t of CES_TEMPLATES) {
      const cur = doc.cesStep?.[t.id] || 0;
      doc.cesStep = { ...(doc.cesStep || {}), [t.id]: Math.min(cur + 1, t.progression.length - 1) };
    }
    doc.xp += 20;
  }
  awardBadges(doc);
  return true;
}

/** Mana refills to full once a day. Call on save; harmless if already done today. */
export function refillMana(doc: ProfileDoc): void {
  const today = new Date().toISOString().slice(0, 10);
  if (doc.manaLastRefill !== today) {
    doc.mana = 10;
    doc.manaLastRefill = today;
  }
}

/** True when the list has an entry dated today (local date). Used to stop
 * the same daily reward being earned over and over by tapping again. */
export function loggedToday(entries: { date?: string }[] | undefined, kind?: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return (entries || []).some((e) => {
    if (kind && (e as { kind?: string }).kind !== kind) return false;
    return String(e.date || '').slice(0, 10) === today;
  });
}

/** Credited cardio minutes for one log entry. Clients log ACTUAL minutes
 * plus the intensity; high-intensity (HIIT) minutes count double in the
 * weekly total, so 20 hard minutes count as 40. Zone 2 counts as logged.
 * Old entries with no zone count as logged. */
export function cardioCreditMinutes(entry: { minutes?: unknown; zone?: unknown }): number {
  const mins = Number(entry.minutes || 0);
  if (!Number.isFinite(mins) || mins <= 0) return 0;
  return entry.zone === 'HIIT' ? mins * 2 : mins;
}

/** Credited cardio minutes across entries, optionally only since a time. */
export function cardioCreditedSum(entries: { date?: string; minutes?: unknown; zone?: unknown }[] | undefined, sinceMs?: number): number {
  return (entries || [])
    .filter((c) => sinceMs === undefined || new Date(String(c.date)).getTime() >= sinceMs)
    .reduce((s, c) => s + cardioCreditMinutes(c), 0);
}

/** "Last logged 12 Nov" for a log list, or null when nothing is logged. */
export function lastLoggedLabel(entries: { date?: string }[] | undefined): string | null {
  const list = (entries || []).filter((e) => e.date);
  if (list.length === 0) return null;
  const last = list[list.length - 1];
  return `Last logged ${new Date(String(last.date)).toLocaleDateString()}`;
}

/** Whole days since the last check-in, 0 when one was logged today. */
export function missedCheckinDays(doc: ProfileDoc): number {
  const days = (doc.checkins || []).map((c) => String(c.date || '').slice(0, 10));
  if (days.length === 0) return Number.POSITIVE_INFINITY;
  const last = days.sort()[days.length - 1];
  return Math.floor((Date.now() - new Date(`${last}T12:00:00`).getTime()) / (24 * 60 * 60 * 1000));
}

/** Recovery score from the last check-in actually logged, or null. */
export function recoveryScoreForDoc(doc: ProfileDoc): number | null {
  const last = (doc.checkins || [])[(doc.checkins || []).length - 1] as { energy?: number; sleepHours?: number; soreness?: number } | undefined;
  if (!last) return null;
  const lastSleep = (doc.sleep || [])[(doc.sleep || []).length - 1] as { hours?: number } | undefined;
  return recoveryScore(last.sleepHours ?? lastSleep?.hours ?? 7, last.soreness ?? 3, last.energy ?? 7, true);
}

/** Best balance hold so far, in seconds, from the baseline and tests. */
export function bestBalanceSec(doc: ProfileDoc): number {
  const base = Math.max(doc.balanceBaseline?.left || 0, doc.balanceBaseline?.right || 0);
  const tests = Math.max(0, ...(doc.balanceTests || []).map((t) => Math.max(t.leftSec || 0, t.rightSec || 0)));
  return Math.max(base, tests);
}

/** Day numbers (1-31) of entries that fall in the given month and year.
 * A calendar must never light up a day just because an old entry shares
 * the same day number in a different month. */
export function daysInMonthSet(entries: { date?: string }[] | undefined, year: number, month: number): Set<number> {
  const out = new Set<number>();
  for (const e of entries || []) {
    const d = new Date(String(e.date || ''));
    if (!Number.isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month) out.add(d.getDate());
  }
  return out;
}

/** Current streak: consecutive days ending today or yesterday with a
 * workout or a check-in. Worked out from the dates, so it can never get
 * stuck at 0 the way the stored streakDays field did. */
export function streakDaysForDoc(doc: ProfileDoc): number {
  const days = new Set<string>();
  for (const w of doc.workouts || []) days.add(String(w.date || '').slice(0, 10));
  for (const c of doc.checkins || []) days.add(String(c.date || '').slice(0, 10));
  let streak = 0;
  const d = new Date();
  // A streak is still alive if the last active day was yesterday.
  if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (days.has(d.toISOString().slice(0, 10))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** Consecutive days of check-ins ending today or yesterday. */
export function checkinStreakDays(doc: ProfileDoc): number {
  const days = new Set((doc.checkins || []).map((c) => String(c.date || '').slice(0, 10)));
  let streak = 0;
  const d = new Date();
  if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (days.has(d.toISOString().slice(0, 10))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** Last logged weight/reps for an exercise, from workout history. */
export function lastTimeFor(doc: ProfileDoc, exerciseId: string): { w: string; r: string } | null {
  const workouts = doc.workouts || [];
  for (let i = workouts.length - 1; i >= 0; i -= 1) {
    const w = workouts[i] as { log?: Record<string, { w?: string; r?: string }> };
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
  const cardio = doc.cardio || [];
  const workouts = doc.workouts || [];
  const prs = doc.prs || [];
  const badges = doc.badges || [];
  const checkins = doc.checkins || [];
  const cardioWeek = cardioCreditedSum(cardio, weekAgo);
  const bossesBeaten = Object.values(doc.bossHp || {}).filter((hp) => hp <= 0).length;
  const balanceBest = Math.max(doc.balanceBaseline?.left || 0, doc.balanceBaseline?.right || 0);
  const checkinStreak = checkins.length;
  // Only Derek-approved retests count for gear: a pending retest has
  // not been reviewed yet, so it earns nothing.
  const hasRetest = (w: number) => hasApprovedRetest(doc, w);
  const bossBeaten = (id: string) => (doc.bossHp || {})[id] !== undefined && (doc.bossHp || {})[id]! <= 0;
  const cardioTotal = cardioCreditedSum(cardio);
  const out = new Set<string>();
  const add = (id: string, ok: boolean) => { if (ok) out.add(id); };
  add('travelers-boots', workouts.length >= 1);
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
  add('peakforged-chestplate', workouts.some((w) => Number((w as { phase?: number }).phase || 0) === 4 || String(w.workoutId || '').startsWith('p4')));
  add('peakforged-greaves', workouts.filter((w) => String(w.workoutId || '').startsWith('p4')).length >= 4);
  add('peakforged-gauntlets', prs.length >= 1 && phaseForDoc(doc) >= 4);
  add('stormforged-helm', phaseForDoc(doc) >= 5);
  add('stormforged-chestplate', workouts.some((w) => String(w.workoutId || '').startsWith('p5')));
  add('stormforged-greaves', workouts.filter((w) => String(w.workoutId || '').startsWith('p5')).length >= 4);
  add('stormforged-gauntlets', prs.length >= 1 && phaseForDoc(doc) >= 5);
  add('blade-long-game', doc.guardian?.classId === 'Guardian' && prs.length >= 3);
  add('bow-steady-steps', doc.guardian?.classId === 'Ranger' && balanceBest >= 30);
  add('staff-deep-rest', doc.guardian?.classId === 'Spellweaver' && checkinStreak >= 7);
  add('trailwarden-cloak', workouts.length >= 3);
  add('ember-shortblade', prs.length >= 3);
  add('riverstep-boots', cardioWeek >= 150);
  add('sunforged-chestplate', phaseForDoc(doc) >= 2);
  add('stormcaller-longbow', bossesBeaten >= 1);
  add('gauntlets-many-wins', badges.length >= 8);
  add('voidforged-greatblade', bossesBeaten >= 3);
  add('mantle-long-road', workouts.length >= 25);
  add('circlet-full-journey', phaseForDoc(doc) >= 5);
  // Year gear: one set per cycle after the first, plus three year pieces.
  add('emberforged-helm', bossBeaten('boss-week-16'));
  add('emberforged-chestplate', hasRetest(24));
  add('emberforged-greaves', prs.length >= 10);
  add('tideforged-helm', bossBeaten('boss-week-28'));
  add('tideforged-chestplate', hasRetest(36));
  add('tideforged-greaves', workouts.length >= 40);
  add('summitforged-helm', bossBeaten('boss-week-40'));
  add('summitforged-chestplate', hasRetest(48));
  add('summitforged-greaves', workouts.length >= 50);
  add('crown-year', hasRetest(52));
  add('cloak-year', badges.length >= 20);
  add('boots-year', cardioTotal >= 2000);
  // Epic weapons: famous-weapon-inspired, renamed, earned only.
  add('epic-excalibur', bossesBeaten >= 5);
  add('epic-stormhammer', prs.length >= 5);
  add('epic-starforged-blade', workouts.length >= 15);
  add('epic-windrunner-bow', balanceBest >= 45);
  add('epic-starfall-staff', checkinStreak >= 14);
  add('epic-vanguard-shield', badges.length >= 12);
  add('epic-truthbound-lasso', (doc.sleep || []).length >= 30);
  add('epic-shadowstep-dagger', level >= 12);
  add('epic-feral-claws', bossesBeaten >= 3);
  // Epic helmets: each unlock is distinct from the epic weapons and
  // from the other helms (Excalibur is 5 boss rounds, so the Mountain
  // King asks for 6; no other piece asks for 20 workouts, Level 11,
  // a 60-second balance hold, or a 30-day check-in streak).
  add('epic-helm-mountain-king', bossesBeaten >= 6);
  add('epic-helm-horned-north', workouts.length >= 20);
  add('epic-helm-dragonlord', level >= 11);
  add('epic-helm-winged-swift', balanceBest >= 60);
  add('epic-helm-first-light', checkinStreak >= 30);
  return [...out];
}

/** Award badges that have actually been earned. Call after workouts,
 * check-ins, cardio, PRs, and retests. Never removes a badge. */
export function awardBadges(doc: ProfileDoc): string[] {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const workouts = doc.workouts || [];
  const cardio = doc.cardio || [];
  const prs = doc.prs || [];
  if (!Array.isArray(doc.badges)) doc.badges = [];
  const workoutsWeek = workouts.filter((w) => new Date(String(w.date)).getTime() >= weekAgo).length;
  const cardioWeek = cardioCreditedSum(cardio, weekAgo);
  const add = (id: string, ok: boolean) => { if (ok && !doc.badges.includes(id)) doc.badges.push(id); };
  // Week 1 Finished means a full first week has passed with at least one
  // workout, not just the first workout logged.
  const joinedMs = new Date(doc.joinedAt || Date.now()).getTime();
  add('week-1-finished', workouts.length >= 1 && Date.now() - joinedMs >= 7 * 24 * 60 * 60 * 1000);
  add('three-in-a-row', workoutsWeek >= 3);
  add('full-sequence-week', workoutsWeek >= 2 && workoutsWeek >= (doc.trainingDays || 3));
  add('two-to-three-strength', workoutsWeek >= 2 && workoutsWeek <= 3);
  add('150-club', cardioWeek >= 150);
  add('first-pr', prs.length >= 1);
  add('five-prs', prs.length >= 5);
  // Balance Breakthrough means an approved retest beat the assessment
  // baseline, not just starting out with a long hold.
  const baseBest = Math.max(doc.assessment?.balanceLeftSec || 0, doc.assessment?.balanceRightSec || 0);
  const retestBest = Math.max(
    0,
    ...approvedRetests(doc).map((r) => Math.max(Number((r as { balanceLeftSec?: number }).balanceLeftSec || 0), Number((r as { balanceRightSec?: number }).balanceRightSec || 0))),
  );
  add('balance-breakthrough', approvedRetests(doc).length >= 1 && retestBest > baseBest);
  add('phase-1-finisher', phaseForDoc(doc) >= 2);
  add('phase-2-finisher', phaseForDoc(doc) >= 3);
  add('phase-3-finisher', hasApprovedRetest(doc, 12));
  // Year badges: one per cycle milestone, plus monthly result badges.
  const hasRetest = (w: number) => hasApprovedRetest(doc, w);
  add('cycle-1-finisher', hasRetest(12));
  add('cycle-2-finisher', hasRetest(24));
  add('cycle-3-finisher', hasRetest(36));
  add('cycle-4-finisher', hasRetest(48));
  add('year-finisher', hasRetest(52));
  add('ten-prs', prs.length >= 10);
  add('twenty-five-workouts', workouts.length >= 25);
  add('fifty-workouts', workouts.length >= 50);
  add('two-week-checkin', checkinStreakDays(doc) >= 14);
  add('cardio-1000', cardioCreditedSum(cardio) >= 1000);
  add('sleep-30', (doc.sleep || []).length >= 30);
  add('measurement-tracker', (doc.measurements || []).length >= 6);
  // 3-Day Check-In Streak means 3 check-in days in a row, not 3 total.
  add('three-day-checkin', checkinStreakDays(doc) >= 3);
  return doc.badges;
}

// Current journey week, from retests done, or from the phase if no retest yet.
// Companions are met gradually by this week, and companion effects only
// apply once the companion is met. One place, so every tab agrees.
export function currentWeekForDoc(doc: ProfileDoc): number {
  const weeks = approvedRetests(doc).map((r) => (r as { week?: number }).week || 0);
  const max = Math.max(0, ...weeks);
  const phase = phaseForDoc(doc);
  return max > 0 ? Math.min(52, max + 1) : phase >= 4 ? 13 : phase === 3 ? 9 : phase === 2 ? 5 : 1;
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
