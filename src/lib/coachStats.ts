// Coach check-in and volume stats (Derek, Nov 25, 2026): the numbers
// Derek goes over with a client on a call. Read-only, worked out from
// data already on the profile doc. Nothing here invents a new log.
//
// Check-ins: date, recovery, sleep, energy, soreness, from what the
// client logged. Recovery uses the same formula as the app
// (recoveryScore in store.ts: sleep 40, aches 25, energy 25, rest 10).
//
// Volume: sets per muscle per week, counted from the workouts the
// client actually finished, after the recovery shortening that day.
// The workout log does not record the sets dropped separately, so the
// drop is worked out from the check-in logged that day (or the day
// before), with the same tiers as volumeTierForDoc in store.ts:
// good (70 and up) trains as planned, ok (50 to 69) drops 1 set per
// move, bad (below 50) drops 2 sets per move. A check-in note that
// mentions sharp, new, or worsening pain is a pain flag, not a tier:
// no workout is prescribed around pain. If a client logged no
// check-in near a workout, that workout counts as planned, and the
// section says so instead of guessing.
import { CORE_BALANCE_WORKOUT, CUSTOM_WORKOUT_ID, EXERCISE_BY_ID, EXERCISE_MUSCLE, PHASE_VOLUME_RANGE, VOLUME_MUSCLES, WORKOUTS, type MuscleGroup } from './data';
import type { Workout } from './types';
import { recoveryScore, volumeSetsFor, type ProfileDoc, type VolumeTier } from './store';

const DAY = 24 * 60 * 60 * 1000;

function dayKey(date: string | undefined): string {
  return String(date || '').slice(0, 10);
}

function dayMs(day: string): number {
  const t = new Date(`${day}T12:00:00`).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function shortDate(date: string | undefined): string {
  const t = new Date(String(date || ''));
  if (Number.isNaN(t.getTime())) return 'no date';
  return t.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export interface CheckinRow {
  date: string;
  day: string;
  energy: number | null;
  sleepHours: number | null;
  soreness: number | null;
  recovery: number | null;
  note: string;
}

/** Recovery score for one check-in entry, same formula as the app. */
export function recoveryForCheckin(c: { energy?: unknown; sleepHours?: unknown; soreness?: unknown }): number {
  const energy = typeof c.energy === 'number' ? c.energy : 7;
  const sleepHours = typeof c.sleepHours === 'number' ? c.sleepHours : 7;
  const soreness = typeof c.soreness === 'number' ? c.soreness : 3;
  return recoveryScore(sleepHours, soreness, energy, true);
}

function checkinRow(c: { date?: unknown; energy?: unknown; sleepHours?: unknown; soreness?: unknown; note?: unknown }): CheckinRow {
  return {
    date: String(c.date || ''),
    day: dayKey(String(c.date || '')),
    energy: typeof c.energy === 'number' ? c.energy : null,
    sleepHours: typeof c.sleepHours === 'number' ? c.sleepHours : null,
    soreness: typeof c.soreness === 'number' ? c.soreness : null,
    recovery: recoveryForCheckin(c),
    note: String(c.note || ''),
  };
}

/** Check-in rows, newest first, for the last `days` days. */
export function checkinHistory(doc: ProfileDoc, days = 30): CheckinRow[] {
  const from = Date.now() - days * DAY;
  return (doc.checkins || [])
    .map((c) => checkinRow(c as { date?: unknown; energy?: unknown; sleepHours?: unknown; soreness?: unknown; note?: unknown }))
    .filter((r) => new Date(r.date).getTime() >= from)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((t, n) => t + n, 0) / nums.length);
}

export interface CheckinWindow {
  /** Distinct days checked in, in the window. */
  daysDone: number;
  /** Days in the window. */
  daysTotal: number;
  avgRecovery: number | null;
  avgSleep: number | null;
  avgEnergy: number | null;
  avgSoreness: number | null;
}

function windowStats(rows: CheckinRow[], fromMs: number, toMs: number): CheckinWindow {
  const inWindow = rows.filter((r) => {
    const t = new Date(r.date).getTime();
    return t >= fromMs && t < toMs;
  });
  const daysDone = new Set(inWindow.map((r) => r.day)).size;
  const daysTotal = Math.max(1, Math.round((toMs - fromMs) / DAY));
  return {
    daysDone,
    daysTotal,
    avgRecovery: avg(inWindow.map((r) => r.recovery).filter((n): n is number => n !== null)),
    avgSleep: avg(inWindow.map((r) => r.sleepHours).filter((n): n is number => n !== null)),
    avgEnergy: avg(inWindow.map((r) => r.energy).filter((n): n is number => n !== null)),
    avgSoreness: avg(inWindow.map((r) => r.soreness).filter((n): n is number => n !== null)),
  };
}

/** Recovery trend: this week vs the week before. Null when either
 * week has no check-in to compare. A move of 3 points or more counts. */
export function recoveryTrend(doc: ProfileDoc): { direction: 'up' | 'down' | 'same'; thisAvg: number; prevAvg: number } | null {
  const rows = checkinHistory(doc, 14);
  const now = Date.now();
  const thisWeek = windowStats(rows, now - 7 * DAY, now);
  const prevWeek = windowStats(rows, now - 14 * DAY, now - 7 * DAY);
  if (thisWeek.avgRecovery === null || prevWeek.avgRecovery === null) return null;
  const diff = thisWeek.avgRecovery - prevWeek.avgRecovery;
  return {
    direction: diff >= 3 ? 'up' : diff <= -3 ? 'down' : 'same',
    thisAvg: thisWeek.avgRecovery,
    prevAvg: prevWeek.avgRecovery,
  };
}

// Same pain words as volumeTierForDoc in store.ts. A note matching
// these is a pain flag, not a volume tier.
const PAIN_NOTE = /\b(sharp|stabbing|chest pain|dizzy|dizziness|worsening|getting worse|new pain)\b/i;

export interface VolumeTierForDay {
  tier: VolumeTier;
  setsDrop: number;
  recovery: number | null;
  pain: boolean;
}

/** The volume tier that applied on one day, from the check-in logged
 * that day or the day before. Older check-ins are stale, so the day
 * counts as planned. */
export function tierForDay(doc: ProfileDoc, day: string): VolumeTierForDay {
  const rows = (doc.checkins || [])
    .map((c) => checkinRow(c as { date?: unknown; energy?: unknown; sleepHours?: unknown; soreness?: unknown; note?: unknown }))
    .filter((r) => r.day <= day)
    .sort((a, b) => b.day.localeCompare(a.day));
  const planned: VolumeTierForDay = { tier: 'none', setsDrop: 0, recovery: null, pain: false };
  const latest = rows[0];
  if (!latest) return planned;
  const gapDays = Math.round((dayMs(day) - dayMs(latest.day)) / DAY);
  if (gapDays < 0 || gapDays > 1) return planned;
  if (PAIN_NOTE.test(latest.note)) return { tier: 'pain', setsDrop: 0, recovery: latest.recovery, pain: true };
  const rec = latest.recovery;
  if (rec === null) return planned;
  if (rec >= 70) return { tier: 'good', setsDrop: 0, recovery: rec, pain: false };
  if (rec >= 50) return { tier: 'ok', setsDrop: 1, recovery: rec, pain: false };
  return { tier: 'bad', setsDrop: 2, recovery: rec, pain: false };
}

function workoutById(id: string): Workout | undefined {
  if (id === CORE_BALANCE_WORKOUT.id) return CORE_BALANCE_WORKOUT;
  return WORKOUTS.find((w) => w.id === id);
}

/** Sets per muscle from one finished workout, after the recovery
 * shortening that day. A planned workout counts its prescribed sets,
 * shortened by the tier that day. A custom workout counts the sets
 * the client actually logged, per exercise, under each move's primary
 * muscle, shortened by the same tier. Returns null when the workout
 * is not in the library and is not custom (reference tracks are not
 * counted here). */
export function setsForWorkout(
  doc: ProfileDoc,
  entry: { workoutId?: unknown; date?: unknown; log?: unknown; custom?: unknown },
): Record<MuscleGroup, number> | null {
  const day = dayKey(String(entry.date || ''));
  const tier = tierForDay(doc, day);
  const out: Record<MuscleGroup, number> = { chest: 0, back: 0, shoulders: 0, legs: 0, core: 0 };
  const isCustom = String(entry.workoutId || '') === CUSTOM_WORKOUT_ID || (entry as { custom?: unknown }).custom === true;
  if (isCustom) {
    const log = (entry.log || {}) as Record<string, { s?: unknown }>;
    for (const [exId, logged] of Object.entries(log)) {
      const ex = EXERCISE_BY_ID.get(exId);
      if (!ex) continue;
      const m = EXERCISE_MUSCLE[ex.name];
      if (!m) continue;
      const sets = Number(logged?.s) || 0;
      if (sets <= 0) continue;
      out[m] += volumeSetsFor(sets, tier.tier);
    }
    return out;
  }
  const w = workoutById(String(entry.workoutId || ''));
  if (!w) return null;
  for (const ex of w.exercises) {
    const m = EXERCISE_MUSCLE[ex.name];
    if (!m) continue;
    out[m] += volumeSetsFor(ex.sets, tier.tier);
  }
  return out;
}

export interface WorkoutExerciseRow {
  name: string;
  weight: string;
  sets: string;
  reps: string;
  /** Rest in seconds between sets. For a planned workout this is the
   * rest from the plan; for a custom workout it is the rest the client
   * logged. Empty when no rest was recorded. */
  restSec: string;
}

/** One row per exercise in a finished workout, for Derek in Coach:
 * what they lifted, how many sets and reps, and the rest between
 * sets. A custom workout shows the rest the client logged; a planned
 * workout shows the rest from the plan. Moves with nothing logged
 * are left out. */
export function workoutExerciseRows(
  entry: { id?: unknown; date?: unknown; workoutId?: unknown; log?: unknown; custom?: unknown },
): WorkoutExerciseRow[] {
  const log = (entry.log || {}) as Record<string, { w?: unknown; s?: unknown; r?: unknown; rest?: unknown }>;
  const isCustom = String(entry.workoutId || '') === CUSTOM_WORKOUT_ID || (entry as { custom?: unknown }).custom === true;
  if (isCustom) {
    return Object.entries(log)
      .map(([exId, logged]) => {
        const ex = EXERCISE_BY_ID.get(exId);
        if (!ex) return null;
        if (!logged?.s && !logged?.r && !logged?.w) return null;
        return {
          name: ex.name,
          weight: String(logged.w || ''),
          sets: String(logged.s || ''),
          reps: String(logged.r || ''),
          restSec: String(logged.rest || ''),
        };
      })
      .filter((r): r is WorkoutExerciseRow => r !== null);
  }
  const w = workoutById(String(entry.workoutId || ''));
  if (!w) return [];
  return w.exercises
    .map((ex) => {
      const logged = log[ex.id];
      if (!logged?.s && !logged?.r && !logged?.w) return null;
      return {
        name: ex.name,
        weight: String(logged.w || ''),
        sets: String(logged.s || ''),
        reps: String(logged.r || ''),
        restSec: String(ex.restSec ?? ''),
      };
    })
    .filter((r): r is WorkoutExerciseRow => r !== null);
}

export interface VolumeWeek {
  label: string;
  workouts: number;
  totalSets: number;
  setsPerMuscle: Record<MuscleGroup, number>;
  /** Phase target range per muscle, e.g. [6, 10]. */
  target: [number, number];
}

/** Workouts and sets per week, last 4 weeks, newest week last so the
 * list reads oldest to newest. */
export function volumeByWeek(doc: ProfileDoc, phase: number): VolumeWeek[] {
  const now = Date.now();
  const target = PHASE_VOLUME_RANGE[phase] || PHASE_VOLUME_RANGE[1];
  const out: VolumeWeek[] = [];
  for (let w = 3; w >= 0; w -= 1) {
    const from = now - (w + 1) * 7 * DAY;
    const to = now - w * 7 * DAY;
    const setsPerMuscle: Record<MuscleGroup, number> = { chest: 0, back: 0, shoulders: 0, legs: 0, core: 0 };
    let workouts = 0;
    for (const entry of doc.workouts || []) {
      const t = new Date(String(entry.date || '')).getTime();
      if (Number.isNaN(t) || t < from || t >= to) continue;
      workouts += 1;
      const sets = setsForWorkout(doc, entry);
      if (!sets) continue;
      for (const m of VOLUME_MUSCLES) setsPerMuscle[m.id] += sets[m.id];
    }
    out.push({
      label: w === 0 ? 'This week' : w === 1 ? '1 week ago' : `${w} weeks ago`,
      workouts,
      totalSets: VOLUME_MUSCLES.reduce((t, m) => t + setsPerMuscle[m.id], 0),
      setsPerMuscle,
      target,
    });
  }
  return out;
}

export interface VolumeAdjustmentRow {
  date: string;
  title: string;
  tier: 'ok' | 'bad' | 'pain';
  setsDrop: number;
  recovery: number | null;
  /** Plain line Derek can read on the call. */
  line: string;
}

/** Workouts in the last `days` days that were shortened because
 * recovery was low, plus check-ins that flagged pain. Newest first.
 * A workout with no check-in near it is not listed: it counts as
 * planned, not shortened. */
export function volumeAdjustments(doc: ProfileDoc, days = 30): VolumeAdjustmentRow[] {
  const from = Date.now() - days * DAY;
  const out: VolumeAdjustmentRow[] = [];
  for (const entry of doc.workouts || []) {
    const t = new Date(String(entry.date || '')).getTime();
    if (Number.isNaN(t) || t < from) continue;
    const day = dayKey(String(entry.date || ''));
    const tier = tierForDay(doc, day);
    if (tier.tier === 'ok' || tier.tier === 'bad') {
      out.push({
        date: String(entry.date || ''),
        title: String(entry.title || entry.workoutId || 'Workout'),
        tier: tier.tier,
        setsDrop: tier.setsDrop,
        recovery: tier.recovery,
        line: tier.tier === 'ok'
          ? `Recovery was ${tier.recovery}/100, so 1 set was dropped from each move.`
          : `Recovery was ${tier.recovery}/100, so 2 sets were dropped from each move and the short session was offered instead.`,
      });
    }
  }
  // Pain flags, even when no workout was logged that day: Derek
  // needs to see them when he goes over the check-ins.
  for (const row of checkinHistory(doc, days)) {
    if (!PAIN_NOTE.test(row.note)) continue;
    if (out.some((o) => o.date === row.date && o.tier === 'pain')) continue;
    out.push({
      date: row.date,
      title: 'Check-in',
      tier: 'pain',
      setsDrop: 0,
      recovery: row.recovery,
      line: 'Check-in note mentioned sharp, new, or worsening pain. See a doctor or physical therapist. No workout was prescribed around pain.',
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

/** One plain summary line Derek can read on a call. Null when the
 * client has no check-ins and no workouts to go over yet. */
export function coachCheckinSummary(doc: ProfileDoc, phase = 1): string | null {
  const rows = checkinHistory(doc, 30);
  const workouts = (doc.workouts || []).filter((w) => new Date(String(w.date || '')).getTime() >= Date.now() - 7 * DAY);
  if (rows.length === 0 && workouts.length === 0) return null;
  const now = Date.now();
  const last7 = windowStats(rows, now - 7 * DAY, now);
  const weeks = volumeByWeek(doc, phase);
  const thisWeek = weeks[weeks.length - 1];
  const adj7 = volumeAdjustments(doc, 7).filter((a) => a.tier === 'ok' || a.tier === 'bad').length;
  const pain7 = volumeAdjustments(doc, 7).filter((a) => a.tier === 'pain').length;
  const parts = [
    `Last 7 days: checked in ${last7.daysDone} of 7`,
    last7.avgRecovery !== null ? `recovery averaged ${last7.avgRecovery}` : 'no recovery score yet',
    `${thisWeek.workouts} workout${thisWeek.workouts === 1 ? '' : 's'}`,
    `${thisWeek.totalSets} sets`,
    adj7 === 0 ? 'no workout shortened for low recovery' : `${adj7} workout${adj7 === 1 ? '' : 's'} shortened for low recovery`,
  ];
  if (pain7 > 0) parts.push(`${pain7} check-in${pain7 === 1 ? '' : 's'} flagged pain`);
  return `${parts.join(', ')}.`;
}

export { shortDate, windowStats };
