import { useEffect, useMemo, useRef, useState } from 'react';
import type { Ctx } from '../App';
import { WORKOUTS, CORE_BALANCE_WORKOUT, REFERENCE_TRACKS, PHASES, PHASE_WEEKLY_SETS, PHASE_VOLUME_RANGE, VOLUME_MUSCLES, weeklyVolumeForSplit, filterGroupForExercise, exerciseNeeds, daysForTime, splitForDays, TRAINING_STYLES, CES_TEMPLATES, EQUIPMENT_NOTES, effectiveEquipment, resolveExercise, findExerciseByName, CLASS_WORKOUT_FOCUS, applyClassFocus, GOAL_FINISHERS, ALL_EXERCISES, CUSTOM_WORKOUT_ID, CUSTOM_WORKOUT_TITLE, customGroupsForLog } from '../lib/data';
import type { TrainingStyle, FilterGroup } from '../lib/data';
import type { ExerciseFeedback } from '../lib/store';
import { phaseForDoc, hasFullAccess, metCompanionIds, lastTimeFor, awardBadges, currentWeekForDoc, hasApprovedRetest, hasCleanApprovedRetest, assessmentApproved, assessmentPending, volumeTierForDoc, volumeSetsFor, latestWorkoutDate, lastSplitIndex, latestWorkoutSplitGroups, clampWorkoutDate, workoutDateIso, workoutDateRange, todayDayKey, yesterdayDayKey } from '../lib/store';
import { cardioThisWeek } from '../lib/badges';
import BackToTop from './BackToTop';
import { cycleForWeek, nextRetestWeek, nextRetestLabel, isDeloadWeek } from '../lib/yearPlan';
import type { Workout } from '../lib/types';
import ExampleVideo from './ExampleVideo';

function resolveForDoc(ex: Parameters<typeof resolveExercise>[0], doc: { equipment: string[]; dislikedExercises?: string[]; hurtExercises?: string[] }) {
  const disliked = (doc.dislikedExercises || []).includes(ex.id) || (doc.hurtExercises || []).includes(ex.id);
  if (!disliked) return resolveExercise(ex, doc.equipment);
  const candidates: string[] = [];
  if (ex.swap) candidates.push(ex.swap);
  for (const name of candidates) {
    const c = findExerciseByName(name);
    if (c && !resolveExercise(c, doc.equipment).unavailable) {
      return { exercise: { ...c, sets: ex.sets, reps: ex.reps, restSec: ex.restSec, tempo: ex.tempo ?? c.tempo }, swappedFrom: ex.name, missingEquipment: 'you marked it', unavailable: false };
    }
  }
  return { exercise: ex, swappedFrom: null, missingEquipment: 'you marked it', unavailable: true };
}

export default function Workouts({ ctx }: { ctx: Ctx }) {
  const { doc, update, toast, go } = ctx;
  const [activeId, setActiveId] = useState<string | null>(doc.sessions?.workoutId || null);
  const [step, setStep] = useState(doc.sessions?.step || 0);
  const [log, setLog] = useState<Record<string, { w: string; s: string; r: string }>>(
    (doc.sessions?.log as Record<string, { w: string; s: string; r: string }>) || {},
  );
  const [restLeft, setRestLeft] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [showHow, setShowHow] = useState<string | null>(null);
  const [finishMinutes, setFinishMinutes] = useState('');
  // Backdating (Derek, Nov 25, 2026): the day the workout was done,
  // default today. Up to 7 days back if they forgot to log it.
  // Local date, not UTC: at 9:56 PM PST the UTC date is already
  // tomorrow, and a late-night workout would log as tomorrow.
  const [workoutDate, setWorkoutDate] = useState(() => todayDayKey());
  // Custom workout (Derek, Nov 25, 2026): a workout the client did on
  // their own, not from the plan. One row per move they did: the move,
  // weight, sets, reps, and rest between sets. Date uses the same
  // backdating window as a planned workout.
  const [showCustom, setShowCustom] = useState(false);
  const [customRows, setCustomRows] = useState<{ key: number; exerciseId: string; w: string; s: string; r: string; rest: string }[]>([]);
  // Search text per custom row, by row key. Filters the move picker so a
  // long list does not have to be scrolled. The picked move always stays
  // in the list, even when it does not match the search text.
  const [customSearch, setCustomSearch] = useState<Record<number, string>>({});
  const [customMinutes, setCustomMinutes] = useState('');
  const [customDate, setCustomDate] = useState(() => todayDayKey());
  const customKey = useRef(0);
  const [notice, setNotice] = useState('');
  const [timeMin, setTimeMin] = useState<15 | 30 | 45 | 60>(30);
  const [editId, setEditId] = useState<string | null>(null);
  const [editMinutes, setEditMinutes] = useState('');
  const [regressionPick, setRegressionPick] = useState<Record<string, string>>({});
  const [finisherDone, setFinisherDone] = useState(false);
  const [feedbackFor, setFeedbackFor] = useState<{ kind: 'dislike' | 'hurts'; exerciseId: string; exerciseName: string } | null>(null);
  const [muscleFilter, setMuscleFilter] = useState<'all' | FilterGroup>('all');
  const [equipFilter, setEquipFilter] = useState<string>('all');
  const timerRef = useRef<number | null>(null);

  const phase = phaseForDoc(doc);
  // Check-in adaptive volume: today's workout follows the last
  // check-in (today, or yesterday). Good trains as planned, ok is
  // shortened, bad is the short session or Zone 2, pain blocks the
  // workout. See volumeTierForDoc in store.ts.
  const vol = volumeTierForDoc(doc);
  // Class workout focus: Guardian, Ranger, and Spellweaver change volume,
  // not just spells and looks. The focus line is shown in Best for you
  // today, in the workout list, and in the player. Focus never overrides
  // a swap: equipment, dislike, and hurt swaps are resolved first, and
  // focus only adjusts the sets of the move that is actually done.
  const classId = doc.guardian?.classId;
  const classFocus = classId ? CLASS_WORKOUT_FOCUS[classId] : null;
  const focusFor = (w: Workout) => {
    const deltas = w.exercises.map((e) => applyClassFocus(resolveForDoc(e, doc).exercise, classId, w.phase));
    return deltas.some((d) => d.delta !== 0);
  };
  const full = hasFullAccess(doc);
  // Best workout for you today: picked from your main goal, your gear, and
  // the time you have. Every class gets a real strength workout, Spellweaver
  // included. Only a rest day overrides it, and only if you trained yesterday.
  // Local dates, not UTC: lastWorkoutDate is a local-picked day key,
  // so "yesterday" and "today" must be local too, or a workout done
  // late at night reads as tomorrow.
  const yesterday = yesterdayDayKey();
  const trainedYesterday = doc.lastWorkoutDate === yesterday;
  const todayStr = todayDayKey();
  const trainedToday = doc.lastWorkoutDate === todayStr;
  const restLoggedToday = doc.quests.some((q) => (q as { kind?: string }).kind === 'rest-day' && new Date(String(q.date)).toISOString().split('T')[0] === todayStr);
  const daysNeeded = daysForTime(timeMin, phase);
  const weeklySets = PHASE_WEEKLY_SETS[phase] || '6 to 10';
  // How the client trains at 5 to 6 days a week. At 2 to 4 days it is
  // always Full-body. At 5 to 6 days the saved pick wins, defaulting to
  // Push / Pull / Legs for old profiles.
  const daysPerWeek = doc.trainingDays || 3;
  // At 4 days and up the saved split pick wins (Upper / Lower, Push /
  // Pull / Legs, or Short). Below 4 days it is always Full-body.
  const style: TrainingStyle = daysPerWeek >= 4 ? (doc.trainingStyle || 'full-body') : 'full-body';
  const split = splitForDays(daysPerWeek, phase, style);
  // Latest workout by DATE, not insertion order: a backdated workout
  // logged later must not rewind the split rotation. A custom workout
  // counts too: its biggest group picks up the rotation where it left
  // off, so a custom legs day is followed by push, not legs again.
  const lastSplitIdx = lastSplitIndex(doc, split.days, style);
  const planned = split.days[(lastSplitIdx + 1) % split.days.length];
  // Every group the latest workout hit, mapped for this style: a
  // custom workout can hit more than one group, and any of them
  // resting tomorrow means a rest day when that group is planned.
  const lastGroups = latestWorkoutSplitGroups(doc, split.days, style);
  // Rest is per muscle group, not per day: on a Push / Pull / Legs week,
  // training a different muscle group the day after is fine, because
  // that muscle rested. Only the same group twice in a row needs a rest
  // day. Short sessions are a light dose, so they never force a rest day
  // (if you are sore or tired, take the day off anyway).
  const isRestDay = style === 'ppl' || style === 'upper-lower'
    ? trainedYesterday && lastGroups.includes(planned.group || '')
    : style === 'short'
      ? false
      : trainedYesterday;

  function logRestDay() {
    // One rest day logged a day. Tapping again does not earn again.
    if (restLoggedToday) {
      setNotice('Rest day already logged today.');
      return;
    }
    const m = metCompanionIds(doc);
    let xp = 5;
    const names: string[] = [];
    if (m.has('tilda')) { xp += 5; names.push('Tilda'); }
    if (m.has('miso')) { xp += 5; names.push('Miso'); }
    update((d) => {
      // Stamped at midday UTC on the local day, like a workout date,
      // so "rest logged today" reads the local day, not the UTC date.
      d.quests.push({ id: `q${Date.now()}`, date: workoutDateIso(todayDayKey()), kind: 'rest-day' });
      d.xp += xp;
    });
    setNotice(`Rest day logged. +${xp} XP.${names.length ? ` Includes +5 XP from ${names.join(' and ')}.` : ''}`);
    toast(`Rest day logged. +${xp} XP.`);
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const cardioWeek = cardioThisWeek(doc);
  const cardioMilestone = cardioWeek >= 300 ? '300 minute milestone done' : cardioWeek >= 200 ? '200 done, next is 300' : cardioWeek >= 150 ? '150 done, next is 200' : 'Next milestone is 150';
  const mainGoal = doc.goals[0];
  const goalLabel = mainGoal?.label || doc.mainGoal || 'your goal';
  const goalNote =
    mainGoal?.type === 'stronger' ? 'Compound lifts first, then the rest.'
    : mainGoal?.type === 'weight-loss' ? 'Strength first, then log cardio after.'
    : mainGoal?.type === 'move-better' || mainGoal?.type === 'balance' ? 'Starts with your fix-it warm-up.'
    : mainGoal?.type === 'cardio' || mainGoal?.type === 'endurance' ? 'Then log your cardio minutes after.'
    : mainGoal?.type === 'sleep' || mainGoal?.type === 'consistency' ? 'Short and steady, easy to finish.'
    : '';
  const unlocked = (w: Workout) =>
    w.phase <= phase &&
    !(w.phase === 4 && !hasApprovedRetest(doc, 12)) &&
    !(w.phase === 5 && !(hasCleanApprovedRetest(doc) && doc.phase5Approved)) &&
    (full || w.id === 'day1-first') &&
    w.exercises.every((e) => !resolveExercise(e, doc.equipment).unavailable);
  const best: Workout | null = useMemo(() => {
    if (!assessmentApproved(doc) || isRestDay) return null;
    // Pain in the last check-in: no workout is prescribed.
    if (vol.tier === 'pain') return null;
    const candidates = WORKOUTS.filter(unlocked);
    if (!candidates.length) return null;
    if (doc.workouts.length === 0) {
      return candidates.find((w) => w.id === 'day1-first') || candidates[0];
    }
    // Adaptive volume caps the session length: ok caps at 30 minutes
    // (fewer accessories, same main lifts), bad is the short session
    // only. The player then also drops sets (see volumeSetsFor).
    const cap = vol.tier === 'bad' ? 15 : vol.tier === 'ok' ? Math.min(timeMin, 30) : timeMin;
    if (cap === 15) {
      return candidates.find((w) => w.id === 'track-block-1') || [...candidates].sort((a, b) => a.minutes - b.minutes)[0];
    }
    // At 4 to 6 days the best workout is the next day in the client's
    // own split (Push, Pull, Legs, Upper / Lower, or the next short
    // session), not just the longest workout of the phase.
    if (daysPerWeek >= 4) {
      const plannedW = WORKOUTS.find((w) => w.id === planned.workoutId)
        || (planned.workoutId === 'core-balance-mobility' ? CORE_BALANCE_WORKOUT : undefined);
      if (plannedW && unlocked(plannedW) && plannedW.minutes <= cap) return plannedW;
    }
    const fits = candidates.filter((w) => w.minutes <= cap);
    const pool = fits.length ? fits : candidates;
    return [...pool].sort((a, b) => (b.phase - a.phase) || (b.minutes - a.minutes))[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.assessmentDone, doc.assessmentStatus, isRestDay, timeMin, phase, full, doc.workouts.length, doc.equipment, daysPerWeek, planned, vol.tier]);
  const myTemplates = CES_TEMPLATES.filter((t) => doc.assessment?.findings.includes(t.id));
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (restRunning && restLeft > 0) {
      timerRef.current = window.setTimeout(() => setRestLeft((v) => v - 1), 1000);
      return () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
      };
    }
    if (restLeft === 0 && restRunning) {
      setRestRunning(false);
      if (navigator.vibrate) navigator.vibrate(250);
    }
    return undefined;
  }, [restRunning, restLeft]);

  const ALL_WORKOUTS: Workout[] = useMemo(() => [...WORKOUTS, CORE_BALANCE_WORKOUT], []);
  const active: Workout | undefined = useMemo(() => {
    const found = ALL_WORKOUTS.find((w) => w.id === activeId);
    if (found) return found;
    const track = REFERENCE_TRACKS.find((t) => t.id === activeId);
    return track ? { id: track.id, title: track.name, phase, day: 'Reference track', minutes: track.minutes, exercises: track.exercises, note: track.blurb } : undefined;
  }, [activeId, ALL_WORKOUTS, phase]);

  function startWorkout(w: Workout) {
    if (!doc.assessmentDone) {
      setNotice('Do the assessment first. It sets your starting phase.');
      return;
    }
    if (!assessmentApproved(doc)) {
      setNotice('Assessment waiting for Derek to review. Your workouts unlock once he approves it.');
      return;
    }
    if (volumeTierForDoc(doc).tier === 'pain') {
      setNotice('You noted sharp, new, or worsening pain. See a doctor or physical therapist. No workout today.');
      return;
    }
    if (w.phase === 4 && !hasApprovedRetest(doc, 12)) {
      setNotice('Phase 4 unlocks after Phase 3 and your Week 12 retest is approved by Derek.');
      return;
    }
    if (w.phase === 5) {
      const clean = hasCleanApprovedRetest(doc);
      if (!clean || !doc.phase5Approved) {
        setNotice('Phase 5 is locked until a clean form retest AND Derek approves it in Coach.');
        return;
      }
    }
    // Phase leak guard: a workout from a later phase than the client's
    // current phase can never start, even if a button for it is
    // reachable from the list, the split, or a resume. Phase 4 and 5
    // have their own messages above.
    if (w.phase > phase) {
      setNotice(`That workout is from Phase ${w.phase}. You are on Phase ${phase} right now.`);
      return;
    }
    if (!full && w.id !== 'day1-first') {
      setNotice('Week 2 and later workouts need the trial or beta access. Start the trial or enter your beta code on Today.');
      return;
    }
    setNotice('');
    // Resume where the client left off: keep the saved step and the
    // weights and reps already logged, instead of starting over.
    const saved = doc.sessions?.workoutId === w.id ? doc.sessions : null;
    setActiveId(w.id);
    setWorkoutDate(todayDayKey());
    setFinisherDone(false);
    setStep(saved ? saved.step : 0);
    setLog((saved?.log as Record<string, { w: string; s: string; r: string }>) || {});
    startedAt.current = Date.now();
    update((d) => {
      d.sessions = { workoutId: w.id, step: saved ? saved.step : 0, log: saved ? saved.log : {}, startedAt: new Date().toISOString() };
    });
  }

  function completeWorkout(minutesOverride?: number) {
    if (!active) return;
    // Backdating: the workout counts on the day it was done, not the
    // day it was logged. Clamped to today back to 7 days ago, no future
    // dates, no older dates. Stamped at midday UTC so the day never
    // shifts with timezone.
    const chosenDay = clampWorkoutDate(workoutDate);
    const chosenIso = workoutDateIso(chosenDay);
    const backdated = chosenDay !== todayDayKey();
    const minutes = minutesOverride ?? Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));
    // Companion bonuses, only if that companion is met. Small, +5 XP each.
    const met = metCompanionIds(doc);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const workoutsThisWeek = doc.workouts.filter((w) => new Date(String(w.date)).getTime() >= weekAgo).length;
    const bonusNames: string[] = [];
    let bonus = 0;
    if (met.has('bram') && workoutsThisWeek === 0) { bonus += 5; bonusNames.push('Bram'); }
    if (met.has('ash') && workoutsThisWeek >= 1) { bonus += 5; bonusNames.push('Ash'); }
    if (met.has('rowan') && minutes >= active.minutes * 0.8) { bonus += 5; bonusNames.push('Rowan'); }
    // Personal records: heavier weight, or the same weight for more reps,
    // than the last time on the same move. Each new PR is +10 XP and shows
    // on Progress. A PR counts every time you beat your last logged weight,
    // not just once.
    let prCount = 0;
    const prNames: string[] = [];
    for (const ex of active.exercises) {
      const entry = log[ex.id];
      if (!entry || !entry.w) continue;
      const prev = lastTimeFor(doc, ex.id);
      const w = Number(entry.w);
      const prevW = prev ? Number(prev.w) : 0;
      const r = Number(entry.r) || 0;
      const prevR = prev ? Number(prev.r) : 0;
      if (w > prevW || (w === prevW && w > 0 && r > prevR)) {
        prCount += 1;
        prNames.push(ex.name);
      }
    }
    // Ansel cheers a PR: +5 XP once per workout with a new personal record.
    if (met.has('ansel') && prCount > 0) { bonus += 5; bonusNames.push('Ansel'); }
    update((d) => {
      d.workouts.push({
        id: `w${Date.now()}`,
        date: chosenIso,
        workoutId: active.id,
        title: active.title,
        minutes,
        duration_minutes: minutes,
        log,
      });
      d.sessions = null;
      // lastWorkoutDate is the LATEST workout date, not blindly today:
      // a backdated workout must not mark today as trained, and must
      // not move the latest date backwards when a newer workout exists.
      d.lastWorkoutDate = latestWorkoutDate(d);
      d.mana = Math.min(10, d.mana + 2);
      for (const ex of active.exercises) {
        const entry = log[ex.id];
        if (!entry || !entry.w) continue;
        const w = Number(entry.w);
        const prev = doc.prs.filter((pr) => pr.exercise === ex.name);
        const best = prev.length ? Math.max(...prev.map((pr) => pr.weight)) : 0;
        const bestRepsAtBest = prev.filter((pr) => pr.weight === best).reduce((m, pr) => Math.max(m, pr.reps), 0);
        if (w > best || (w === best && w > 0 && (Number(entry.r) || 0) > bestRepsAtBest)) {
          d.prs.push({ exercise: ex.name, weight: w, reps: Number(entry.r) || 0, date: chosenIso });
        }
      }
      d.xp += 50 + bonus + prCount * 10;
      awardBadges(d);
    });
    setActiveId(null);
    setLog({});
    setWorkoutDate(todayDayKey());
    const savedText = `Workout saved${backdated ? ` for ${new Date(chosenIso).toLocaleDateString()}` : ''}. ${minutes} minutes, +${50 + bonus + prCount * 10} XP.${bonusNames.length ? ` Includes +5 XP from ${bonusNames.join(' and ')}.` : ''}${prCount ? ` New PR${prCount === 1 ? '' : 's'}: ${prNames.join(', ')} (+10 XP each).` : ''} Mana +2.`;
    setNotice(savedText);
    toast(`Workout saved. ${minutes} minutes, +${50 + bonus + prCount * 10} XP.`);
  }

  // Custom workout: moves the client can do with their gear, resolved
  // the same way as a planned workout (a move they cannot do is swapped
  // for one they can, and a move they flagged as disliked or hurting is
  // left out). One entry per move, sorted by name so it is easy to find.
  const customOptions = useMemo(() => {
    const flagged = new Set([...(doc.dislikedExercises || []), ...(doc.hurtExercises || [])]);
    const seen = new Set<string>();
    const out: { id: string; name: string; restSec: number; swappedFrom: string | null }[] = [];
    for (const ex of ALL_EXERCISES) {
      const resolved = resolveExercise(ex, doc.equipment);
      if (resolved.unavailable) continue;
      const done = resolved.exercise;
      if (flagged.has(done.id)) continue;
      if (seen.has(done.id)) continue;
      seen.add(done.id);
      out.push({ id: done.id, name: done.name, restSec: done.restSec, swappedFrom: resolved.swappedFrom });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [doc.equipment, doc.dislikedExercises, doc.hurtExercises]);

  function addCustomRow() {
    const used = new Set(customRows.map((r) => r.exerciseId));
    const next = customOptions.find((o) => !used.has(o.id));
    if (!next) return;
    customKey.current += 1;
    setCustomRows((rows) => [...rows, { key: customKey.current, exerciseId: next.id, w: '', s: '', r: '', rest: String(next.restSec) }]);
  }

  // Open the form with 3 empty rows (Derek, Nov 25, 2026), so it is
  // obvious more than one move can be logged. Built in one setState
  // call so the three picks do not collide on the same first move.
  function openCustom() {
    setShowCustom(true);
    setCustomDate(todayDayKey());
    if (customRows.length > 0) return;
    const used = new Set<string>();
    const rows: { key: number; exerciseId: string; w: string; s: string; r: string; rest: string }[] = [];
    for (let i = 0; i < 3; i++) {
      const next = customOptions.find((o) => !used.has(o.id));
      if (!next) break;
      used.add(next.id);
      customKey.current += 1;
      rows.push({ key: customKey.current, exerciseId: next.id, w: '', s: '', r: '', rest: String(next.restSec) });
    }
    setCustomRows(rows);
  }

  function saveCustomWorkout() {
    if (!doc.assessmentDone) {
      setNotice('Do the assessment first. It sets your starting phase.');
      return;
    }
    if (!assessmentApproved(doc)) {
      setNotice('Assessment waiting for Derek to review. Your workouts unlock once he approves it.');
      return;
    }
    if (volumeTierForDoc(doc).tier === 'pain') {
      setNotice('You noted sharp, new, or worsening pain. See a doctor or physical therapist. No workout today.');
      return;
    }
    if (!full) {
      setNotice('Week 2 and later workouts need the trial or beta access. Start the trial or enter your beta code on Today.');
      return;
    }
    // Only rows with a move picked and at least 1 set count. Weight may
    // be blank for bodyweight moves; rest defaults to the move's rest.
    const rows = customRows.filter((r) => r.exerciseId && (Number(r.s) || 0) > 0);
    if (rows.length === 0) {
      setNotice('Add at least one move with sets to save your workout.');
      return;
    }
    const minutes = Math.min(240, Math.max(1, Number(customMinutes) || 30));
    // Same backdating window as a planned workout: the workout counts
    // on the day it was done, not the day it was logged.
    const chosenDay = clampWorkoutDate(customDate);
    const chosenIso = workoutDateIso(chosenDay);
    const backdated = chosenDay !== todayDayKey();
    const log: Record<string, { w: string; s: string; r: string; rest: string }> = {};
    for (const r of rows) {
      const opt = customOptions.find((o) => o.id === r.exerciseId);
      log[r.exerciseId] = { w: r.w, s: r.s, r: r.r, rest: r.rest || String(opt?.restSec ?? 60) };
    }
    // Companion bonuses, same as a planned workout. Rowan is left out:
    // it compares minutes to the planned workout length, and a custom
    // workout has no planned length to compare against.
    const met = metCompanionIds(doc);
    const workoutsThisWeek = doc.workouts.filter((w) => new Date(String(w.date)).getTime() >= weekAgo).length;
    const bonusNames: string[] = [];
    let bonus = 0;
    if (met.has('bram') && workoutsThisWeek === 0) { bonus += 5; bonusNames.push('Bram'); }
    if (met.has('ash') && workoutsThisWeek >= 1) { bonus += 5; bonusNames.push('Ash'); }
    // Personal records, judged against the latest date logged for each
    // move, same as a planned workout.
    let prCount = 0;
    const prNames: string[] = [];
    for (const r of rows) {
      if (!r.w) continue;
      const prev = lastTimeFor(doc, r.exerciseId);
      const w = Number(r.w);
      const prevW = prev ? Number(prev.w) : 0;
      const reps = Number(r.r) || 0;
      const prevR = prev ? Number(prev.r) : 0;
      const name = customOptions.find((o) => o.id === r.exerciseId)?.name || r.exerciseId;
      if (w > prevW || (w === prevW && w > 0 && reps > prevR)) {
        prCount += 1;
        prNames.push(name);
      }
    }
    if (met.has('ansel') && prCount > 0) { bonus += 5; bonusNames.push('Ansel'); }
    update((d) => {
      d.workouts.push({
        id: `w${Date.now()}`,
        date: chosenIso,
        workoutId: CUSTOM_WORKOUT_ID,
        title: CUSTOM_WORKOUT_TITLE,
        minutes,
        duration_minutes: minutes,
        log,
        custom: true,
        // Groups hit, most sets first: drives the split rotation and
        // tells Derek at a glance what the workout was.
        customGroups: customGroupsForLog(log),
      });
      d.sessions = null;
      d.lastWorkoutDate = latestWorkoutDate(d);
      d.mana = Math.min(10, d.mana + 2);
      for (const r of rows) {
        if (!r.w) continue;
        const name = customOptions.find((o) => o.id === r.exerciseId)?.name || r.exerciseId;
        const w = Number(r.w);
        const prev = doc.prs.filter((pr) => pr.exercise === name);
        const best = prev.length ? Math.max(...prev.map((pr) => pr.weight)) : 0;
        const bestRepsAtBest = prev.filter((pr) => pr.weight === best).reduce((m, pr) => Math.max(m, pr.reps), 0);
        if (w > best || (w === best && w > 0 && (Number(r.r) || 0) > bestRepsAtBest)) {
          d.prs.push({ exercise: name, weight: w, reps: Number(r.r) || 0, date: chosenIso });
        }
      }
      d.xp += 50 + bonus + prCount * 10;
      awardBadges(d);
    });
    setCustomRows([]);
    setCustomSearch({});
    setCustomMinutes('');
    setCustomDate(todayDayKey());
    setShowCustom(false);
    const savedText = `My workout saved${backdated ? ` for ${new Date(chosenIso).toLocaleDateString()}` : ''}. ${minutes} minutes, +${50 + bonus + prCount * 10} XP.${bonusNames.length ? ` Includes +5 XP from ${bonusNames.join(' and ')}.` : ''}${prCount ? ` New PR${prCount === 1 ? '' : 's'}: ${prNames.join(', ')} (+10 XP each).` : ''} Mana +2.`;
    setNotice(savedText);
    toast(`My workout saved. ${minutes} minutes, +${50 + bonus + prCount * 10} XP.`);
  }

  if (active) {
    const rawEx0 = active.exercises[step];
    // Regression pick wins for this move: if the client tapped "Use the
    // easier version", the easier move is the one they do. Then the
    // equipment, dislike, and hurt swaps are resolved (the swap wins over
    // class focus), and only then does class focus adjust the sets of the
    // move that is actually done.
    const regressionName = regressionPick[rawEx0.id];
    const rawEx = regressionName ? (findExerciseByName(regressionName) || rawEx0) : rawEx0;
    const resolved = resolveForDoc(rawEx, doc);
    const focused = applyClassFocus(resolved.exercise, classId, active.phase);
    // Adaptive volume: the check-in drops sets on each move (ok: 1
    // fewer, bad: 2 fewer, never below 1). The reason is shown above
    // the move so the client knows why it is shorter today.
    const ex = { ...focused.exercise, sets: volumeSetsFor(focused.exercise.sets, vol.tier) };
    const last = lastTimeFor(doc, ex.id);
    const isLast = step >= active.exercises.length - 1;
    return (
      <div>
        <div className="card">
          <h2>{active.title}</h2>
          <p className="muted small">
            Exercise {step + 1} of {active.exercises.length} · About {active.minutes} minutes · {active.note || ''}
          </p>
          {classFocus && (
            <p className="small"><strong>{classFocus.line}</strong></p>
          )}
          {(vol.tier === 'ok' || vol.tier === 'bad') && (
            <p className="notice" style={{ marginTop: 10 }}>
              Shortened because recovery is low today: {vol.setsDrop} fewer {vol.setsDrop === 1 ? 'set' : 'sets'} on each move. {vol.line}
            </p>
          )}
          {regressionName && (
            <p className="notice" style={{ marginTop: 10 }}>
              Showing the easier version: {regressionName}, instead of {rawEx0.name}.
              {' '}
              <button onClick={() => setRegressionPick((p) => { const n = { ...p }; delete n[rawEx0.id]; return n; })}>
                Back to the full move
              </button>
            </p>
          )}
          <div className="progress-bar"><div style={{ width: `${((step + 1) / active.exercises.length) * 100}%` }} /></div>
          {resolved.swappedFrom && (
            <p className="notice" style={{ marginTop: 10 }}>
              Swapped in: {ex.name} instead of {resolved.swappedFrom}, because you do not have a {resolved.missingEquipment}. Same sets and reps.
            </p>
          )}
          {resolved.unavailable && (
            <p className="notice" style={{ marginTop: 10 }}>
              You do not have a {resolved.missingEquipment} for {rawEx.name}, and no swap fits your gear. Do the easier version below instead, or change your equipment in the assessment.
            </p>
          )}
        </div>
        {myTemplates.length > 0 && step === 0 && (
          <div className="card gold-frame">
            <h3>Fix-it warm-up first</h3>
            <p>Do your corrective moves before the workout. They stay the same until a retest clears them.</p>
            {myTemplates.map((t) => {
              const stepN = Math.min((doc.cesStep?.[t.id] || 0) + 1, t.progression.length);
              return (
                <details key={t.id}>
                  <summary>{t.plainName}</summary>
                  <p><strong>Inhibit:</strong> {t.inhibit}</p>
                  <p><strong>Lengthen:</strong> {t.lengthen}</p>
                  <p><strong>Activation:</strong> {t.activation}</p>
                  <p><strong>Integration:</strong> {t.integration}</p>
                  <p className="small muted">Next step {stepN} of {t.progression.length}: {t.progression[stepN - 1]}</p>
                </details>
              );
            })}
          </div>
        )}
        <div className="card">
          <h3>{ex.name}</h3>
          <p>{ex.sets} sets x {ex.reps}{ex.tempo ? ` · Tempo ${ex.tempo}` : ''} · Rest {ex.restSec}s</p>
          <details open={showHow === ex.id} onToggle={(e) => setShowHow((e.target as HTMLDetailsElement).open ? ex.id : null)}>
            <summary>How to do it</summary>
            <ol>{ex.howTo.map((h, i) => <li key={i}>{h}</li>)}</ol>
            <p><strong>Easier version:</strong> {ex.regression}</p>
            {findExerciseByName(ex.regression) && findExerciseByName(ex.regression)!.id !== ex.id && !regressionName && (
              <button onClick={() => setRegressionPick((p) => ({ ...p, [rawEx0.id]: ex.regression }))}>
                Use the easier version: {ex.regression}
              </button>
            )}
            {findExerciseByName(ex.regression) && findExerciseByName(ex.regression)!.id !== ex.id && regressionName && (
              <p className="small muted">You are doing the easier version now. Tap "Back to the full move" above to go back.</p>
            )}
            {ex.swap && <p><strong>Swap:</strong> {ex.swap}</p>}
            {ex.videoUrl && (
              <ExampleVideo src={ex.videoUrl} label={ex.videoLabel} />
            )}
            {!ex.videoUrl && ex.demoUrl && (
              <p style={{ marginTop: 8 }}>
                <a href={ex.demoUrl} target="_blank" rel="noopener noreferrer">Watch how to do it</a>
                <span className="small muted"> (opens in a new tab)</span>
              </p>
            )}
          </details>
          {last && <p className="small">Last time: {last.w ? `${last.w} lb` : ''}{last.w && last.r ? ' x ' : ''}{last.r ? `${last.r} reps` : ''}</p>}
          <div className="row" style={{ marginTop: 6 }}>
            <button onClick={() => setFeedbackFor({ kind: 'dislike', exerciseId: rawEx.id, exerciseName: rawEx.name })}>
              I don&apos;t like this move
            </button>
            <button onClick={() => setFeedbackFor({ kind: 'hurts', exerciseId: rawEx.id, exerciseName: rawEx.name })}>
              This hurts
            </button>
          </div>
          {feedbackFor && feedbackFor.exerciseId === rawEx.id && (
            <div className="card gold-frame" style={{ marginTop: 10 }}>
              <h4 style={{ margin: '0 0 4px' }}>Why {feedbackFor.kind === 'hurts' ? 'does it hurt' : "don't you like it"}?</h4>
              <p className="small muted">Derek sees your reason, so he can fix the plan. The move is still swapped out from now on.</p>
              <div className="row">
                {([
                  ['too-hard', 'Too hard'],
                  ['hurts', 'It hurts'],
                  ['dont-like', "I don't like it"],
                  ['no-equipment', 'No equipment for it'],
                ] as const).map(([reason, label]) => (
                  <button
                    key={reason}
                    className="primary"
                    onClick={() => {
                      const fb: ExerciseFeedback = { exerciseId: feedbackFor.exerciseId, exerciseName: feedbackFor.exerciseName, kind: feedbackFor.kind, reason, date: new Date().toISOString() };
                      update((d) => {
                        if (feedbackFor.kind === 'dislike') {
                          if (!d.dislikedExercises.includes(feedbackFor.exerciseId)) d.dislikedExercises.push(feedbackFor.exerciseId);
                        } else {
                          if (!d.hurtExercises.includes(feedbackFor.exerciseId)) d.hurtExercises.push(feedbackFor.exerciseId);
                        }
                        d.exerciseFeedback = [...(d.exerciseFeedback || []).filter((x) => x.exerciseId !== feedbackFor.exerciseId), fb];
                      });
                      if (feedbackFor.kind === 'hurts') {
                        setNotice(`${feedbackFor.exerciseName} flagged as hurting. It will be swapped out. Sharp, new, or worsening pain: see a doctor or physical therapist, and tell Derek.`);
                        toast(`${feedbackFor.exerciseName} flagged. It will be swapped out.`);
                      } else {
                        setNotice(`Got it. ${feedbackFor.exerciseName} will be swapped out from now on.`);
                        toast(`${feedbackFor.exerciseName} swapped out from now on.`);
                      }
                      setFeedbackFor(null);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button style={{ marginTop: 8 }} onClick={() => setFeedbackFor(null)}>Cancel</button>
            </div>
          )}
          <div className="grid2" style={{ marginTop: 10 }}>
            <div>
              <label htmlFor={`w-${ex.id}`}>Weight (lb)</label>
              <input id={`w-${ex.id}`} inputMode="decimal" value={log[ex.id]?.w || ''} onChange={(e) => setLog((p) => ({ ...p, [ex.id]: { ...(p[ex.id] || { w: '', s: '', r: '' }), w: e.target.value } }))} placeholder={last?.w ? `Last: ${last.w} lb` : 'lb'} />
            </div>
            <div>
              <label htmlFor={`r-${ex.id}`}>Reps done</label>
              <input id={`r-${ex.id}`} inputMode="numeric" value={log[ex.id]?.r || ''} onChange={(e) => setLog((p) => ({ ...p, [ex.id]: { ...(p[ex.id] || { w: '', s: '', r: '' }), r: e.target.value } }))} placeholder={ex.reps} />
            </div>
          </div>
          {isLast && (() => {
            const finisher = GOAL_FINISHERS[doc.goals[0]?.type || ''];
            if (!finisher) return null;
            return (
              <div className="card gold-frame" style={{ marginTop: 12 }}>
                <h3 style={{ margin: '0 0 4px' }}>Goal finisher: {finisher.name} (+5 XP)</h3>
                <p className="small">{finisher.text}</p>
                <p className="small muted">For your goal ({doc.goals[0]?.label}). Only after the last move, only on a workout day. It never changes your phase, warm-up, or rest days.</p>
                {finisherDone ? (
                  <p className="small ok">Finisher done. +5 XP earned.</p>
                ) : (
                  <button
                    className="primary"
                    onClick={() => {
                      update((d) => { d.xp += 5; });
                      setFinisherDone(true);
                    }}
                  >
                    I did the finisher (+5 XP)
                  </button>
                )}
              </div>
            );
          })()}
          <div className="card" style={{ marginTop: 12 }}>
            <h3 style={{ textAlign: 'center' }}>Rest timer</h3>
            <div className="timer">{Math.floor(restLeft / 60)}:{String(restLeft % 60).padStart(2, '0')}</div>
            <div className="row" style={{ justifyContent: 'center' }}>
              <button onClick={() => { setRestLeft(ex.restSec); setRestRunning(true); }}>Start ({ex.restSec}s)</button>
              <button disabled={!restRunning && restLeft === 0} onClick={() => setRestRunning((v) => !v)}>{restRunning ? 'Pause' : 'Resume'}</button>
              <button onClick={() => setRestLeft((v) => v + 30)}>+30s</button>
              <button onClick={() => { setRestLeft(0); setRestRunning(false); }}>Skip</button>
            </div>
            <p className="small muted" style={{ textAlign: 'center' }}>The timer never blocks the next exercise.</p>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            {!isLast && (
              <button
                className="primary"
                onClick={() => {
                  const ns = step + 1;
                  setStep(ns);
                  setRestLeft(0);
                  setRestRunning(false);
                  update((d) => { if (d.sessions) d.sessions.step = ns; });
                }}
              >
                Next exercise
              </button>
            )}
            {isLast && (
              <>
                <label htmlFor="fin-min" style={{ margin: 0 }}>How long did this workout take? (minutes)</label>
                <input id="fin-min" inputMode="numeric" value={finishMinutes} onChange={(e) => setFinishMinutes(e.target.value)} placeholder={String(active.minutes)} style={{ maxWidth: 120 }} />
                <label htmlFor="fin-date" style={{ margin: 0 }}>When did you do this workout?</label>
                <input
                  id="fin-date"
                  type="date"
                  value={workoutDate}
                  min={workoutDateRange().min}
                  max={workoutDateRange().max}
                  onChange={(e) => setWorkoutDate(e.target.value)}
                  style={{ maxWidth: 170 }}
                />
                <p className="small muted" style={{ margin: 0 }}>Pick today, or up to 7 days ago if you forgot to log it.</p>
                <button className="primary" onClick={() => completeWorkout(finishMinutes ? Number(finishMinutes) : undefined)}>Finish workout</button>
              </>
            )}
            <button
              onClick={() => {
                update((d) => { if (d.sessions) { d.sessions.step = step; d.sessions.log = log as never; } });
                setActiveId(null);
              }}
            >
              Leave (saves your spot)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Workout list, split by phase: only the client's current phase
  // shows up front. Other phases sit behind one Show more below.
  // The muscle and equipment filters apply to both lists.
  const filteredWorkouts = WORKOUTS.filter((w) => {
    const byMuscle = muscleFilter === 'all' || w.exercises.some((e) => filterGroupForExercise(e.name) === muscleFilter);
    const byEquip = equipFilter === 'all'
      ? true
      : equipFilter === 'none'
        ? w.exercises.every((e) => !exerciseNeeds(e))
        : w.exercises.some((e) => (exerciseNeeds(e) || '').includes(equipFilter));
    return byMuscle && byEquip;
  });
  const currentPhaseWorkouts = filteredWorkouts.filter((w) => w.phase === phase);
  const otherPhaseWorkouts = filteredWorkouts.filter((w) => w.phase !== phase);
  // One card for both lists, so the current-phase list and the
  // Show more list always show the same card.
  const workoutCard = (w: Workout) => {
    const locked =
      (w.phase === 4 && !hasApprovedRetest(doc, 12)) ||
      (w.phase === 5 && !(hasCleanApprovedRetest(doc) && doc.phase5Approved));
    const resolved = w.exercises.map((e) => resolveForDoc(e, doc));
    const swapped = resolved.filter((r) => r.swappedFrom);
    return (
      <div className="card" key={w.id}>
        <div className="row space">
          <h3 style={{ margin: 0 }}>{w.title}</h3>
          <span className="pill">Phase {w.phase} · ~{w.minutes} min</span>
        </div>
        <p className="muted small">{w.day}{w.note ? ` · ${w.note}` : ''}</p>
        <p>{resolved.map((r) => r.exercise.name).join(' · ')}</p>
        {swapped.length > 0 && (
          <p className="small muted">
            Swapped for your gear: {swapped.map((r) => `${r.exercise.name} in for ${r.swappedFrom}`).join('; ')}.
          </p>
        )}
        {classFocus && focusFor(w) && (
          <p className="small"><strong>{classFocus.line}</strong></p>
        )}
        <details>
          <summary>Regressions: easier versions</summary>
          {w.exercises.map((e) => (
            <p key={e.id} className="small" style={{ margin: '4px 0' }}>
              <strong>{e.name}:</strong> {e.regression}
            </p>
          ))}
          <p className="small muted">In the workout, tap "Use the easier version" on any move to switch to it. Tap "I don&apos;t like this move" or "This hurts" and it is swapped out from now on.</p>
        </details>
        <button className="primary" disabled={locked} onClick={() => startWorkout(w)}>
          {locked ? 'Locked' : 'Start workout'}
        </button>
        {w.phase === 5 && <p className="small muted">Phase 5 is locked until a clean form retest AND Derek approves it in Coach.</p>}
      </div>
    );
  };

  return (
    <div>
      <div className="card">
        <h2>Workouts</h2>
        <p>Phase {phase}: {PHASES.find((p) => p.phase === phase)?.name}. Take 1 to 2 rest days between strength days.</p>
        {doc.assessmentDone && (() => {
          const wWeek = currentWeekForDoc(doc);
          const { cycle: wCycle, weekInCycle: wWeekInCycle } = cycleForWeek(wWeek);
          const wNextRetest = nextRetestWeek(wWeek, new Set(doc.retests.map((r) => (r as { week?: number }).week || 0)));
          return (
            <div className="card gold-frame" style={{ marginTop: 10 }}>
              <h3 style={{ margin: 0 }}>{wCycle.name} · Week {wWeekInCycle}</h3>
              <p className="small">{wCycle.track}: {wCycle.trackDetail}</p>
              <p className="small"><strong>How to progress this cycle:</strong> {wCycle.progression}</p>
              {isDeloadWeek(wWeek) && <p className="small"><strong>Deload week.</strong> Lighter loads this week, then your retest.</p>}
              <p className="small muted">{nextRetestLabel(wNextRetest)} Short daily sessions stay available when time is tight.</p>
            </div>
          );
        })()}
        {!doc.assessmentDone && <div className="notice">Do the assessment first. It sets your starting phase.</div>}
        {assessmentPending(doc) && <div className="notice">Assessment waiting for Derek to review. Your workouts unlock once he approves it.</div>}
        {notice && (
          <div className="notice">
            {notice}
            {!doc.assessmentDone && (
              <div style={{ marginTop: 8 }}>
                <button className="primary" onClick={() => ctx.go('train')}>Go to assessment</button>
              </div>
            )}
          </div>
        )}
        {myTemplates.length > 0 && (
          <details>
            <summary>Your fix-it warm-up ({myTemplates.length} {myTemplates.length === 1 ? 'move' : 'moves'})</summary>
            {myTemplates.map((t) => <p key={t.id}><strong>{t.plainName}:</strong> {t.activation}</p>)}
          </details>
        )}
      </div>

      <div className="card">
        <h3>Your equipment</h3>
        <div className="equip-list">
          {effectiveEquipment(doc.equipment).map((e) => (
            <label key={e}>
              <span>
                <span className="equip-name">{e}</span>{' '}
                <span className="equip-note">{EQUIPMENT_NOTES[e] || ''}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="small muted">Moves you cannot do with this gear are swapped for one you can, and the swap is shown in the workout.</p>
        <button onClick={() => ctx.go('train')}>Change my equipment in the assessment</button>
      </div>

      <div className="card gold-frame" id="best-workout">
        <h3>Best for you today</h3>
        <p className="small">How much time do you have today?</p>
        <div className="row">
          {([15, 30, 45, 60] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeMin(t)}
              style={timeMin === t ? { background: '#124571', color: '#fff' } : {}}
            >
              {t === 45 ? '45+ min' : `${t} min`}
            </button>
          ))}
        </div>
        <p className="small muted">
          {timeMin === 15 && '15 min: easy to fit in and easy to finish. Good for busy days and getting started. You need more sessions a week to hit the same total.'}
          {timeMin === 30 && '30 min: a solid session that fits most days. A good middle ground. You need more sessions a week than a longer workout to hit the same total.'}
          {timeMin === 45 && '45+ min: time for a full warm-up, main lifts, and accessories. You can hit the same total with fewer sessions a week.'}
          {timeMin === 60 && '60 min: time for a full warm-up, main lifts, accessories, and a cool-down. You can hit the same total with fewer sessions a week.'}
        </p>
        <details>
          <summary>Short or long? What changes</summary>
          <p className="small">Shorter workouts, 15 to 30 minutes, are easier to fit in and easier to stay consistent with, and they leave you less tired. The drawback is less time for a warm-up, main lifts, and accessories in one session, so progress is slower per session. You need more sessions a week to hit the same total weekly volume, so take 1 to 2 rest days between strength days for the same muscles.</p>
          <p className="small">Longer workouts, 45 to 60 minutes, give you time for a full warm-up, main compound lifts, accessories, and a cool-down in one session, so you get more done per session. You can hit the same total weekly volume with fewer sessions a week. The drawback is they are harder to fit in, they leave you more tired, and they are easier to skip on a busy day. Longer is not better if your form breaks down, so stop the session or drop the weight if form goes.</p>
          <p className="small">What matters most is your total volume for the week and showing up consistently, not how long any one session is.</p>
        </details>
        {!doc.assessmentDone && <p>Do the assessment first. It sets your starting phase, and then your best workout shows here.</p>}
        {assessmentPending(doc) && <p>Assessment waiting for Derek to review. Your workouts unlock once he approves it.</p>}
        {doc.assessmentDone && vol.tier !== 'none' && <p className="small"><strong>{vol.line}</strong></p>}
        {doc.assessmentDone && vol.tier === 'bad' && <p className="small">Or take it easy today: a Zone 2 walk instead of strength. Log it on the Cardio tab.</p>}
        {doc.assessmentDone && isRestDay && (
          <div>
            <p><strong>Today is an active rest day.</strong> {style === 'ppl' || style === 'upper-lower' ? 'You trained those same muscles yesterday, so they rest today. A different muscle group is next.' : 'You trained yesterday. Take 1 to 2 rest days between strength days.'}</p>
            <p className="small muted">Rest well today: a gentle walk, your 2-minute balance hold, and your stretches. No strength workout today. The gym gives the stimulus, recovery builds on it.</p>
            {restLoggedToday ? (
              <p>Today is an active rest day, and you logged it. Walk, stretch, balance, and rest well.</p>
            ) : (
              <button onClick={logRestDay}>
                Log my rest day (+5 XP)
              </button>
            )}
            {notice && <p className="notice" style={{ marginTop: 8 }}>{notice}</p>}
          </div>
        )}
        {!isRestDay && trainedToday && style === 'full-body' && (
          <p><strong>Tomorrow is an active rest day.</strong> You trained today. Tomorrow, walk, stretch, and do your 2-minute balance hold. No strength workout tomorrow.</p>
        )}
        {!isRestDay && trainedToday && style !== 'full-body' && (
          <p><strong>Tomorrow is {planned.name.replace('Day ', 'day ')} in your split.</strong> {style === 'ppl' ? 'A different muscle group, so yesterday’s muscles keep resting.' : 'A short 15-minute dose. If you are sore or tired, take the day off instead.'}</p>
        )}
        {!isRestDay && !trainedToday && trainedYesterday && style !== 'full-body' && (
          <p><strong>Today is {planned.name}.</strong> A different muscle group from yesterday, so yesterday’s muscles keep resting. {style === 'short' ? 'A short 15-minute dose. If you are sore or tired, take the day off instead.' : ''}</p>
        )}
        {!trainedYesterday && !trainedToday && (
          <p>Rest days are active days. On a rest day, walk, stretch, and do your 2-minute balance hold. Take 1 to 2 rest days between strength days.</p>
        )}
        {doc.assessmentDone && !isRestDay && best && (
          <div>
            <p><strong>{best.title}</strong> · Phase {best.phase} · about {best.minutes} minutes</p>
            <p className="small">Picked for your goal ({goalLabel}), your gear ({effectiveEquipment(doc.equipment).join(', ')}), and {timeMin === 45 ? '45 or more' : timeMin} minutes. {goalNote}</p>
            {classFocus && (
              <p className="small"><strong>{classFocus.line}</strong></p>
            )}
            {classFocus && (
              <details>
                <summary>Show more about your class focus</summary>
                <p className="small">{classFocus.detail}</p>
              </details>
            )}
            <p className="small muted">{best.exercises.map((e) => resolveForDoc(e, doc).exercise.name).join(' · ')}</p>
            <button className="primary" onClick={() => startWorkout(best)}>Start this workout</button>
          </div>
        )}
        {doc.assessmentDone && !isRestDay && !best && vol.tier === 'pain' && (
          <p><strong>{vol.line}</strong></p>
        )}
        {doc.assessmentDone && !isRestDay && !best && vol.tier !== 'pain' && (
          <p>No workout fits right now. Pick one from the list below.</p>
        )}
      </div>

      <div className="card">
        <h3>Log a workout I did</h3>
        <p className="small">Did a workout that was not on the plan? Pick the moves you did, and log the weight, sets, reps, and rest for each one. It counts toward your week, your streak, and your sets per muscle, just like a planned workout. It does not replace your planned workout or move your phase forward.</p>
        {!showCustom && (
          <button className="primary" onClick={openCustom}>
            Log a workout I did
          </button>
        )}
        {showCustom && (
          <div style={{ marginTop: 10 }}>
            {customRows.map((row) => {
              const opt = customOptions.find((o) => o.id === row.exerciseId);
              const used = new Set(customRows.map((r) => r.exerciseId));
              const last = lastTimeFor(doc, row.exerciseId);
              // Search filters the picker by name as they type. The move
              // already picked on this row always stays in the list, even
              // when it does not match the search text.
              const q = (customSearch[row.key] || '').trim().toLowerCase();
              const visibleOptions = customOptions.filter((o) => (o.id === row.exerciseId || !used.has(o.id)) && (!q || o.name.toLowerCase().includes(q)));
              return (
                <div key={row.key} style={{ borderTop: '1px solid #d7e3ee', padding: '8px 0' }}>
                  <div>
                    <label htmlFor={`cu-search-${row.key}`}>Search moves</label>
                    <input
                      id={`cu-search-${row.key}`}
                      type="search"
                      value={customSearch[row.key] || ''}
                      onChange={(e) => setCustomSearch((s) => ({ ...s, [row.key]: e.target.value }))}
                      placeholder="Type a move, like squat or row"
                    />
                    <p className="small muted" style={{ margin: '2px 0 0' }}>{visibleOptions.length} of {customOptions.length} moves</p>
                  </div>
                  <div className="row">
                    <div style={{ flex: 1 }}>
                      <label htmlFor={`cu-ex-${row.key}`}>Move</label>
                      <select
                        id={`cu-ex-${row.key}`}
                        value={row.exerciseId}
                        onChange={(e) => {
                          const next = customOptions.find((o) => o.id === e.target.value);
                          setCustomRows((rows) => rows.map((r) => (r.key === row.key ? { ...r, exerciseId: e.target.value, rest: String(next?.restSec ?? 60) } : r)));
                        }}
                      >
                        {visibleOptions.map((o) => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => setCustomRows((rows) => rows.filter((r) => r.key !== row.key))}
                      disabled={customRows.length <= 1}
                    >
                      Remove
                    </button>
                  </div>
                  {opt?.swappedFrom && (
                    <p className="small muted" style={{ margin: '4px 0' }}>Swapped in: {opt.name} instead of {opt.swappedFrom}, because you do not have the gear for it.</p>
                  )}
                  {last && <p className="small" style={{ margin: '4px 0' }}>Last time: {last.w ? `${last.w} lb` : ''}{last.w && last.r ? ' x ' : ''}{last.r ? `${last.r} reps` : ''}</p>}
                  <div className="grid2" style={{ marginTop: 6 }}>
                    <div>
                      <label htmlFor={`cu-w-${row.key}`}>Weight (lb)</label>
                      <input id={`cu-w-${row.key}`} inputMode="decimal" value={row.w} onChange={(e) => setCustomRows((rows) => rows.map((r) => (r.key === row.key ? { ...r, w: e.target.value } : r)))} placeholder={last?.w ? `Last: ${last.w} lb` : 'lb'} />
                    </div>
                    <div>
                      <label htmlFor={`cu-s-${row.key}`}>Sets done</label>
                      <input id={`cu-s-${row.key}`} inputMode="numeric" value={row.s} onChange={(e) => setCustomRows((rows) => rows.map((r) => (r.key === row.key ? { ...r, s: e.target.value } : r)))} placeholder="Sets" />
                    </div>
                    <div>
                      <label htmlFor={`cu-r-${row.key}`}>Reps done</label>
                      <input id={`cu-r-${row.key}`} inputMode="numeric" value={row.r} onChange={(e) => setCustomRows((rows) => rows.map((r) => (r.key === row.key ? { ...r, r: e.target.value } : r)))} placeholder="Reps" />
                    </div>
                    <div>
                      <label htmlFor={`cu-rest-${row.key}`}>Rest between sets (seconds)</label>
                      <input id={`cu-rest-${row.key}`} inputMode="numeric" value={row.rest} onChange={(e) => setCustomRows((rows) => rows.map((r) => (r.key === row.key ? { ...r, rest: e.target.value } : r)))} placeholder="Seconds" />
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="row" style={{ marginTop: 8 }}>
              <button onClick={addCustomRow} disabled={customRows.length >= customOptions.length}>Add a move</button>
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <div>
                <label htmlFor="cu-min" style={{ margin: 0 }}>How long did it take? (minutes)</label>
                <input id="cu-min" inputMode="numeric" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} placeholder="30" style={{ maxWidth: 120 }} />
              </div>
              <div>
                <label htmlFor="cu-date" style={{ margin: 0 }}>When did you do this workout?</label>
                <input
                  id="cu-date"
                  type="date"
                  value={customDate}
                  min={workoutDateRange().min}
                  max={workoutDateRange().max}
                  onChange={(e) => setCustomDate(e.target.value)}
                  style={{ maxWidth: 170 }}
                />
                <p className="small muted" style={{ margin: 0 }}>Pick today, or up to 7 days ago if you forgot to log it.</p>
              </div>
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="primary" onClick={saveCustomWorkout}>Save my workout</button>
              <button onClick={() => { setShowCustom(false); setCustomRows([]); setCustomSearch({}); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {doc.sessions && (
        <div className="card gold-frame">
          <h3>Resume your workout</h3>
          <p>You left {(() => {
            const sid = doc.sessions?.workoutId || '';
            return ALL_WORKOUTS.find((w) => w.id === sid)?.title || REFERENCE_TRACKS.find((t) => t.id === sid)?.name || 'a workout';
          })()} partway.</p>
          <button
            className="primary"
            onClick={() => {
              const sid = doc.sessions?.workoutId || '';
              const w = ALL_WORKOUTS.find((x) => x.id === sid);
              if (w) { startWorkout(w); return; }
              const track = REFERENCE_TRACKS.find((t) => t.id === sid);
              if (track) startWorkout({ id: track.id, title: track.name, phase, day: 'Reference track', minutes: track.minutes, exercises: track.exercises, note: track.blurb });
            }}
          >
            Resume
          </button>
        </div>
      )}

      <p className="small muted">Workouts this week: {doc.workouts.filter((w) => new Date(String(w.date)).getTime() >= weekAgo).length}.</p>

      {/* Cardio is logged in the Cardio tab now, not here. This card
          only shows the weekly total, with a link to the one log form. */}
      <div className="card">
        <h3>Cardio this week</h3>
        <p><strong>{cardioWeek} of 150 to 300 minutes this week.</strong> {cardioMilestone}.</p>
        <div className="progress-bar"><div style={{ width: `${Math.min(100, (cardioWeek / 300) * 100)}%` }} /></div>
        <p className="small muted">Zone 2, easy enough to talk. High intensity counts double automatically when you log it as HIIT.</p>
        <button className="primary" onClick={() => go('health', 'cardio')}>Log cardio in Health</button>
      </div>

      <details>
        <summary>Show more about your weekly sets and time</summary>
      <div className="card">
        <h3>Fit the workout to your time</h3>
        <p>Shorter workouts need more days: at {timeMin === 45 ? '45 or more' : timeMin} minutes, train {daysNeeded} days a week to hit your Phase {phase} weekly sets ({weeklySets} per muscle). {style === 'ppl' ? 'Push, Pull, and Legs work different muscles, so each muscle gets 2 to 3 days off before its next session.' : style === 'short' ? 'Short sessions are a small daily dose, not a full strength session, so they do not add heavy volume every day.' : 'Full-body days work the same muscles each day, so take 1 to 2 rest days between strength days.'}</p>
        <p className="small muted">15 minutes: 4 days a week. 30 minutes: 3 days a week. 45 or more minutes: {phase >= 3 ? '3' : '2'} days a week. 60 minutes: same as 45 or more, {phase >= 3 ? '3' : '2'} days a week. Take 1 to 2 rest days between strength days.</p>
      </div>

      <div className="card">
        <h3>Sets per muscle this week</h3>
        <p className="small muted">From your current split, not from what you logged. Phase {phase} target: {PHASE_VOLUME_RANGE[phase] ? `${PHASE_VOLUME_RANGE[phase][0]} to ${PHASE_VOLUME_RANGE[phase][1]}` : '6 to 10'} sets per muscle per week.</p>
        {(() => {
          const vol = weeklyVolumeForSplit(split, ALL_WORKOUTS);
          const [lo, hi] = PHASE_VOLUME_RANGE[phase] || [6, 10];
          return VOLUME_MUSCLES.map((m) => {
            const v = vol[m.id];
            const verdict = v < lo ? 'under target' : v > hi ? 'over target' : 'on target';
            return (
              <div key={m.id} style={{ margin: '6px 0' }}>
                <p className="small" style={{ margin: '2px 0' }}>{m.label}: {v} sets a week · {verdict}</p>
                <div className="progress-bar"><div style={{ width: `${Math.min(100, (v / hi) * 100)}%` }} /></div>
              </div>
            );
          });
        })()}
        <p className="small muted">Legs run high on purpose: squats, hinges, and single-leg moves all count toward legs, so being over on legs is normal.</p>
      </div>
      </details>

      <div className="card">
        <h3>My week: training days and splits</h3>
        <p className="small">How many days a week do you train?</p>
        <div className="row">
          {[2, 3, 4, 5, 6].map((d) => (
            <button
              key={d}
              onClick={() => update((doc2) => {
                doc2.trainingDays = d;
                // Full-body and Upper / Lower are not offered at 6 days a
                // week, so a client on either who picks 6 days moves to
                // Push / Pull / Legs. Push / Pull / Legs and Short are not
                // offered at 4 days, so picking 4 days moves back to
                // Full-body.
                const cur = doc2.trainingStyle || 'full-body';
                if (d === 6 && (cur === 'full-body' || cur === 'upper-lower')) doc2.trainingStyle = 'ppl';
                if (d === 4 && (cur === 'ppl' || cur === 'short')) doc2.trainingStyle = 'full-body';
                if (d <= 3) doc2.trainingStyle = 'full-body';
              })}
              style={(doc.trainingDays || 3) === d ? { background: '#124571', color: '#fff' } : {}}
            >
              {d} days
            </button>
          ))}
        </div>
        {(doc.trainingDays || 3) >= 4 && (
          <div>
            <p className="small">How do you want to train {doc.trainingDays} days a week?</p>
            <div className="row">
              {TRAINING_STYLES.filter((s) => {
                const d = doc.trainingDays || 3;
                if (d === 4) return s.id === 'full-body' || s.id === 'upper-lower';
                if (d === 5) return true;
                return s.id === 'ppl' || s.id === 'short';
              }).map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    update((doc2) => { doc2.trainingStyle = s.id; });
                    toast(`${s.name} picked. ${s.id === 'ppl' || s.id === 'upper-lower' ? 'Each muscle rests 2 to 3 days between sessions.' : s.id === 'short' ? '15 minutes a day, small dose.' : 'Take 1 to 2 rest days between strength days.'}`);
                  }}
                  style={style === s.id ? { background: '#124571', color: '#fff' } : {}}
                >
                  {s.name}
                </button>
              ))}
            </div>
            <p className="small muted">{TRAINING_STYLES.find((s) => s.id === style)?.blurb}</p>
            {style === 'full-body' && <p className="small muted">Full-body trains the same muscles on back-to-back days. It is not offered at 6 days a week.</p>}
            {style === 'upper-lower' && <p className="small muted">Upper days work chest, back, shoulders, arms, and core. Lower days work legs, glutes, and core. Each muscle rests 2 to 3 days before its next session.</p>}
          </div>
        )}
        <p><strong>{split.label}</strong></p>
        {split.days.map((day) => {
          const w = ALL_WORKOUTS.find((x) => x.id === day.workoutId);
          return (
            <p key={day.name} className="small" style={{ margin: '4px 0' }}>
              {day.name}: {w ? w.title : day.workoutId}
              {' '}
              <button onClick={() => w && startWorkout(w)}>Start</button>
            </p>
          );
        })}
        <p className="small muted">{style === 'ppl' ? 'Each muscle rests 2 to 3 days between its sessions. Day 7 is a full rest day.' : style === 'short' ? 'Small daily dose. Day 7 is a full rest day. If you are sore or tired, take the day off instead.' : 'Take 1 to 2 rest days between strength days. The other days are active rest days.'}</p>
      </div>

      <div className="card">
        <h3>Reference tracks</h3>
        <p className="small muted">Extra tracks to try, built from the same moves. No brand credit, just the workout.</p>
        {classFocus && (
          <p className="small"><strong>{classFocus.line}</strong></p>
        )}
        <details>
          <summary>Show reference tracks</summary>
          {REFERENCE_TRACKS.map((t) => {
            const locked = !!t.locked && phase < 5;
            const trackWorkout: Workout = { id: t.id, title: t.name, phase, day: 'Reference track', minutes: t.minutes, exercises: t.exercises, note: t.blurb };
            return (
              <div key={t.id} style={{ borderTop: '1px solid #d7e3ee', padding: '8px 0' }}>
                <p><strong>{t.name}</strong> · about {t.minutes} min</p>
                <p className="small muted">{t.blurb}</p>
                {t.advancedOnly && <p className="small muted">Advanced clients only. Stop if form slips.</p>}
                <p className="small">{t.exercises.map((e2) => e2.name).join(' · ')}</p>
                {locked ? (
                  <p className="small muted">{t.locked}</p>
                ) : (
                  <button className="primary" onClick={() => startWorkout(trackWorkout)}>Start this track</button>
                )}
              </div>
            );
          })}
        </details>
      </div>

      <div className="card">
        <h3>Find a workout</h3>
        <div className="row">
          <div>
            <label htmlFor="wk-muscle">Muscle group</label>
            <select id="wk-muscle" value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value as 'all' | FilterGroup)}>
              <option value="all">All muscles</option>
              <option value="push">Push (chest and shoulders)</option>
              <option value="pull">Pull (back)</option>
              <option value="legs">Legs</option>
              <option value="core">Core</option>
            </select>
          </div>
          <div>
            <label htmlFor="wk-equip">Equipment</label>
            <select id="wk-equip" value={equipFilter} onChange={(e) => setEquipFilter(e.target.value)}>
              <option value="all">Any equipment</option>
              <option value="none">Bodyweight only</option>
              <option value="Dumbbells">Dumbbells</option>
              <option value="Barbell">Barbell</option>
              <option value="Cable machine">Cable machine</option>
              <option value="Step platform">Step platform</option>
              <option value="Resistance bands">Resistance bands</option>
            </select>
          </div>
        </div>
        {(muscleFilter !== 'all' || equipFilter !== 'all') && (
          <p className="small muted">
            Showing {WORKOUTS.filter((w) => {
              const byMuscle = muscleFilter === 'all' || w.exercises.some((e) => filterGroupForExercise(e.name) === muscleFilter);
              const byEquip = equipFilter === 'all'
                ? true
                : equipFilter === 'none'
                  ? w.exercises.every((e) => !exerciseNeeds(e))
                  : w.exercises.some((e) => (exerciseNeeds(e) || '').includes(equipFilter));
              return byMuscle && byEquip;
            }).length} of {WORKOUTS.length} workouts.
            {' '}<button onClick={() => { setMuscleFilter('all'); setEquipFilter('all'); }}>Clear filters</button>
          </p>
        )}
      </div>

      {currentPhaseWorkouts.map(workoutCard)}

      {otherPhaseWorkouts.length > 0 && (
        <details>
          <summary>Show more workouts</summary>
          {otherPhaseWorkouts.map(workoutCard)}
        </details>
      )}

      <div className="card">
        <h3>Workout history</h3>
        {doc.workouts.length === 0 && <p className="muted">No workouts logged yet.</p>}
        {[...doc.workouts].reverse().slice(0, 10).map((w) => (
          <div key={w.id as string} style={{ borderTop: '1px solid #d7e3ee', padding: '8px 0' }}>
            <div className="row space">
              <span><strong>{String(w.title || w.workoutId)}</strong> · {new Date(String(w.date)).toLocaleDateString()} · {Number(w.minutes || w.duration_minutes || 0)} min</span>
              <button onClick={() => { setEditId(w.id as string); setEditMinutes(String(w.minutes || w.duration_minutes || '')); }}>Edit time</button>
            </div>
            {editId === w.id && (
              <div className="row" style={{ marginTop: 6 }}>
                <input inputMode="numeric" value={editMinutes} onChange={(e) => setEditMinutes(e.target.value)} style={{ maxWidth: 120 }} aria-label="Workout minutes" />
                <button
                  className="primary"
                  onClick={() => {
                    update((d) => {
                      const x = d.workouts.find((y) => y.id === w.id);
                      if (x) { x.minutes = Number(editMinutes); x.duration_minutes = Number(editMinutes); }
                    });
                    setEditId(null);
                    toast('Workout time saved.');
                  }}
                >
                  Save time
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <BackToTop />
    </div>
  );
}
