import { useEffect, useMemo, useRef, useState } from 'react';
import type { Ctx } from '../App';
import { WORKOUTS, CORE_BALANCE_WORKOUT, REFERENCE_TRACKS, PHASES, PHASE_WEEKLY_SETS, daysForTime, splitForDays, TRAINING_STYLES, CES_TEMPLATES, EQUIPMENT_NOTES, effectiveEquipment, resolveExercise, findExerciseByName, CLASS_WORKOUT_FOCUS, applyClassFocus, GOAL_FINISHERS } from '../lib/data';
import type { TrainingStyle } from '../lib/data';
import { phaseForDoc, hasFullAccess, metCompanionIds, lastTimeFor, awardBadges, daysInMonthSet, currentWeekForDoc } from '../lib/store';
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
  const [notice, setNotice] = useState('');
  const [timeMin, setTimeMin] = useState<15 | 30 | 45>(30);
  const [editId, setEditId] = useState<string | null>(null);
  const [editMinutes, setEditMinutes] = useState('');
  const [regressionPick, setRegressionPick] = useState<Record<string, string>>({});
  const [finisherDone, setFinisherDone] = useState(false);
  const timerRef = useRef<number | null>(null);

  const phase = phaseForDoc(doc);
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
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const trainedYesterday = doc.lastWorkoutDate === yesterday;
  const todayStr = new Date().toISOString().split('T')[0];
  const trainedToday = doc.lastWorkoutDate === todayStr;
  const restLoggedToday = doc.quests.some((q) => (q as { kind?: string }).kind === 'rest-day' && new Date(String(q.date)).toISOString().split('T')[0] === todayStr);
  const daysNeeded = daysForTime(timeMin, phase);
  const weeklySets = PHASE_WEEKLY_SETS[phase] || '6 to 10';
  // How the client trains at 5 to 6 days a week. At 2 to 4 days it is
  // always Full-body. At 5 to 6 days the saved pick wins, defaulting to
  // Push / Pull / Legs for old profiles.
  const daysPerWeek = doc.trainingDays || 3;
  const style: TrainingStyle = daysPerWeek >= 5 ? (doc.trainingStyle || 'ppl') : 'full-body';
  const split = splitForDays(daysPerWeek, phase, style);
  const lastSplitIdx = (() => {
    const lastId = doc.workouts.length ? String(doc.workouts[doc.workouts.length - 1].workoutId || '') : '';
    return split.days.findIndex((d) => d.workoutId === lastId);
  })();
  const planned = split.days[(lastSplitIdx + 1) % split.days.length];
  const lastGroup = lastSplitIdx >= 0 ? split.days[lastSplitIdx].group : undefined;
  // Rest is per muscle group, not per day: on a Push / Pull / Legs week,
  // training a different muscle group the day after is fine, because
  // that muscle rested. Only the same group twice in a row needs a rest
  // day. Short sessions are a light dose, so they never force a rest day
  // (if you are sore or tired, take the day off anyway).
  const isRestDay = style === 'ppl'
    ? trainedYesterday && lastGroup !== undefined && lastGroup === planned.group
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
      d.quests.push({ id: `q${Date.now()}`, date: new Date().toISOString(), kind: 'rest-day' });
      d.xp += xp;
    });
    setNotice(`Rest day logged. +${xp} XP.${names.length ? ` Includes +5 XP from ${names.join(' and ')}.` : ''}`);
    toast(`Rest day logged. +${xp} XP.`);
  }

  // Month calendar, same as Progress: navy days are trained days, green
  // days are active rest days. Only entries from this month light up:
  // a workout on the 15th last month must not light up the 15th now.
  const nowCal = new Date();
  const daysInMonth = new Date(nowCal.getFullYear(), nowCal.getMonth() + 1, 0).getDate();
  const trainedDays = daysInMonthSet(doc.workouts, nowCal.getFullYear(), nowCal.getMonth());
  const restDays = daysInMonthSet(
    doc.quests.filter((q) => (q as { kind?: string }).kind === 'rest-day'),
    nowCal.getFullYear(),
    nowCal.getMonth(),
  );
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const cardioThisWeek = doc.cardio
    .filter((c) => new Date(String(c.date)).getTime() >= weekAgo)
    .reduce((s, c) => s + Number(c.minutes || 0), 0);
  const cardioMilestone = cardioThisWeek >= 300 ? '300 minute milestone done' : cardioThisWeek >= 200 ? '200 done, next is 300' : cardioThisWeek >= 150 ? '150 done, next is 200' : 'Next milestone is 150';
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
    !(w.phase === 4 && !doc.retests.some((r) => (r as { week?: number }).week === 12)) &&
    !(w.phase === 5 && !(doc.retests.some((r) => (r as { clean?: boolean }).clean === true) && doc.phase5Approved)) &&
    (full || w.id === 'day1-first') &&
    w.exercises.every((e) => !resolveExercise(e, doc.equipment).unavailable);
  const best: Workout | null = useMemo(() => {
    if (!doc.assessmentDone || isRestDay) return null;
    const candidates = WORKOUTS.filter(unlocked);
    if (!candidates.length) return null;
    if (doc.workouts.length === 0) {
      return candidates.find((w) => w.id === 'day1-first') || candidates[0];
    }
    if (timeMin === 15) {
      return candidates.find((w) => w.id === 'track-block-1') || [...candidates].sort((a, b) => a.minutes - b.minutes)[0];
    }
    // At 5 to 6 days the best workout is the next day in the client's
    // own split (Push, Pull, Legs, or the next short session), not just
    // the longest workout of the phase.
    if (daysPerWeek >= 5) {
      const plannedW = WORKOUTS.find((w) => w.id === planned.workoutId)
        || (planned.workoutId === 'core-balance-mobility' ? CORE_BALANCE_WORKOUT : undefined);
      if (plannedW && unlocked(plannedW)) return plannedW;
    }
    const fits = candidates.filter((w) => w.minutes <= timeMin);
    const pool = fits.length ? fits : candidates;
    return [...pool].sort((a, b) => (b.phase - a.phase) || (b.minutes - a.minutes))[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.assessmentDone, isRestDay, timeMin, phase, full, doc.workouts.length, doc.equipment, daysPerWeek, planned]);
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
    if (w.phase === 4 && !doc.retests.some((r) => (r as { week?: number }).week === 12)) {
      setNotice('Phase 4 unlocks after Phase 3 and your Week 12 retest.');
      return;
    }
    if (w.phase === 5) {
      const clean = doc.retests.some((r) => (r as { clean?: boolean }).clean === true);
      if (!clean || !doc.phase5Approved) {
        setNotice('Phase 5 is locked until a clean form retest AND Derek approves it in Coach.');
        return;
      }
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
        date: new Date().toISOString(),
        workoutId: active.id,
        title: active.title,
        minutes,
        duration_minutes: minutes,
        log,
      });
      d.sessions = null;
      d.lastWorkoutDate = new Date().toISOString().split('T')[0];
      d.mana = Math.min(10, d.mana + 2);
      for (const ex of active.exercises) {
        const entry = log[ex.id];
        if (!entry || !entry.w) continue;
        const w = Number(entry.w);
        const prev = doc.prs.filter((pr) => pr.exercise === ex.name);
        const best = prev.length ? Math.max(...prev.map((pr) => pr.weight)) : 0;
        const bestRepsAtBest = prev.filter((pr) => pr.weight === best).reduce((m, pr) => Math.max(m, pr.reps), 0);
        if (w > best || (w === best && w > 0 && (Number(entry.r) || 0) > bestRepsAtBest)) {
          d.prs.push({ exercise: ex.name, weight: w, reps: Number(entry.r) || 0, date: new Date().toISOString() });
        }
      }
      d.xp += 50 + bonus + prCount * 10;
      awardBadges(d);
    });
    setActiveId(null);
    setLog({});
    const savedText = `Workout saved. ${minutes} minutes, +${50 + bonus + prCount * 10} XP.${bonusNames.length ? ` Includes +5 XP from ${bonusNames.join(' and ')}.` : ''}${prCount ? ` New PR${prCount === 1 ? '' : 's'}: ${prNames.join(', ')} (+10 XP each).` : ''} Mana +2.`;
    setNotice(savedText);
    toast(`Workout saved. ${minutes} minutes, +${50 + bonus + prCount * 10} XP.`);
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
    const ex = focused.exercise;
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
            <button
              onClick={() => {
                update((d) => {
                  if (!d.dislikedExercises.includes(rawEx.id)) d.dislikedExercises.push(rawEx.id);
                });
                setNotice(`Got it. ${rawEx.name} will be swapped out from now on.`);
                toast(`${rawEx.name} swapped out from now on.`);
              }}
            >
              I don&apos;t like this move
            </button>
            <button
              onClick={() => {
                update((d) => {
                  if (!d.hurtExercises.includes(rawEx.id)) d.hurtExercises.push(rawEx.id);
                });
                setNotice(`${rawEx.name} flagged as hurting. It will be swapped out. Sharp, new, or worsening pain: see a doctor or physical therapist, and tell Derek.`);
                toast(`${rawEx.name} flagged. It will be swapped out.`);
              }}
            >
              This hurts
            </button>
          </div>
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
        {notice && (
          <div className="notice">
            {notice}
            {!doc.assessmentDone && (
              <div style={{ marginTop: 8 }}>
                <button className="primary" onClick={() => ctx.go('assessment')}>Go to assessment</button>
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
        <button onClick={() => ctx.go('assessment')}>Change my equipment in the assessment</button>
      </div>

      <div className="card gold-frame" id="best-workout">
        <h3>Best for you today</h3>
        <p className="small">How much time do you have today?</p>
        <div className="row">
          {([15, 30, 45] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeMin(t)}
              style={timeMin === t ? { background: '#124571', color: '#fff' } : {}}
            >
              {t === 45 ? '45+ min' : `${t} min`}
            </button>
          ))}
        </div>
        {!doc.assessmentDone && <p>Do the assessment first. It sets your starting phase, and then your best workout shows here.</p>}
        {doc.assessmentDone && isRestDay && (
          <div>
            <p><strong>Today is an active rest day.</strong> {style === 'ppl' ? 'You trained those same muscles yesterday, so they rest today. A different muscle group is next.' : 'You trained yesterday. Take 1 to 2 rest days between strength days.'}</p>
            <p className="small muted">Rest well today: a gentle walk, your 2-minute balance hold, and your stretches. No strength workout today. The gym gives the stimulus, recovery builds on it.</p>
            <button onClick={logRestDay}>
              Log my rest day (+5 XP)
            </button>
            {notice && <p className="notice" style={{ marginTop: 8 }}>{notice}</p>}
          </div>
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
        {doc.assessmentDone && !isRestDay && !best && (
          <p>No workout fits right now. Pick one from the list below.</p>
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

      <div className="card">
        <h3>Your week at a glance</h3>
        <p className="small muted">
          {nowCal.toLocaleString('default', { month: 'long' })} {nowCal.getFullYear()}. Navy days are days you trained, green days are active rest days.
        </p>
        <div className="row" style={{ gap: 4 }}>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
            <span
              key={day}
              style={{
                width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8,
                background: trainedDays.has(day) ? '#124571' : restDays.has(day) ? '#1e7a46' : '#eef5fb',
                color: trainedDays.has(day) || restDays.has(day) ? '#fff' : '#124571',
                fontSize: 12,
                outline: day === nowCal.getDate() ? '2px solid #c9a227' : 'none',
              }}
            >
              {day}
            </span>
          ))}
        </div>
        <p className="small muted">Today is outlined in gold. Workouts this week: {doc.workouts.filter((w) => new Date(String(w.date)).getTime() >= weekAgo).length}.</p>
      </div>

      <div className="card">
        <h3>Active rest days</h3>
        {isRestDay && !restLoggedToday && (
          <div>
            <p><strong>Today is an active rest day.</strong> {style === 'ppl' ? 'You trained those same muscles yesterday, so they rest today.' : 'You trained yesterday. Take 1 to 2 rest days between strength days.'}</p>
            <p className="small muted">Rest well today: a gentle walk, your 2-minute balance hold, and your stretches. No strength workout today. The gym gives the stimulus, recovery builds on it.</p>
            <button onClick={logRestDay}>Log my rest day (+5 XP)</button>
          </div>
        )}
        {isRestDay && restLoggedToday && <p>Today is an active rest day, and you logged it. Walk, stretch, balance, and rest well.</p>}
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
        {notice && <p className="notice" style={{ marginTop: 8 }}>{notice}</p>}
      </div>

      {/* Cardio is logged in the Cardio tab now, not here. This card
          only shows the weekly total, with a link to the one log form. */}
      <div className="card">
        <h3>Cardio this week</h3>
        <p><strong>{cardioThisWeek} of 150 to 300 minutes this week.</strong> {cardioMilestone}.</p>
        <div className="progress-bar"><div style={{ width: `${Math.min(100, (cardioThisWeek / 300) * 100)}%` }} /></div>
        <p className="small muted">Zone 2, easy enough to talk. High intensity counts double.</p>
        <button className="primary" onClick={() => go('cardio')}>Log cardio in the Cardio tab</button>
      </div>

      <div className="card">
        <h3>Fit the workout to your time</h3>
        <p>Shorter workouts need more days: at {timeMin === 45 ? '45 or more' : timeMin} minutes, train {daysNeeded} days a week to hit your Phase {phase} weekly sets ({weeklySets} per muscle). {style === 'ppl' ? 'Push, Pull, and Legs work different muscles, so each muscle gets 2 to 3 days off before its next session.' : style === 'short' ? 'Short sessions are a small daily dose, not a full strength session, so they do not add heavy volume every day.' : 'Full-body days work the same muscles each day, so take 1 to 2 rest days between strength days.'}</p>
        <p className="small muted">15 minutes: 4 days a week. 30 minutes: 3 days a week. 45 or more minutes: {phase >= 3 ? '3' : '2'} days a week. Take 1 to 2 rest days between strength days.</p>
      </div>

      <div className="card">
        <h3>My week: training days and splits</h3>
        <p className="small">How many days a week do you train?</p>
        <div className="row">
          {[2, 3, 4, 5, 6].map((d) => (
            <button
              key={d}
              onClick={() => update((doc2) => {
                doc2.trainingDays = d;
                // Full-body is not offered at 6 days a week, so a client
                // on Full-body who picks 6 days moves to Push / Pull / Legs.
                if (d === 6 && (doc2.trainingStyle || 'full-body') === 'full-body') doc2.trainingStyle = 'ppl';
              })}
              style={(doc.trainingDays || 3) === d ? { background: '#124571', color: '#fff' } : {}}
            >
              {d} days
            </button>
          ))}
        </div>
        {(doc.trainingDays || 3) >= 5 && (
          <div>
            <p className="small">How do you want to train {doc.trainingDays} days a week?</p>
            <div className="row">
              {TRAINING_STYLES.filter((s) => s.id !== 'full-body' || (doc.trainingDays || 3) === 5).map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    update((doc2) => { doc2.trainingStyle = s.id; });
                    toast(`${s.name} picked. ${s.id === 'ppl' ? 'Each muscle rests 2 to 3 days between sessions.' : s.id === 'short' ? '15 minutes a day, small dose.' : 'Take 1 to 2 rest days between strength days.'}`);
                  }}
                  style={style === s.id ? { background: '#124571', color: '#fff' } : {}}
                >
                  {s.name}
                </button>
              ))}
            </div>
            <p className="small muted">{TRAINING_STYLES.find((s) => s.id === style)?.blurb}</p>
            {style === 'full-body' && <p className="small muted">Full-body trains the same muscles on back-to-back days. It is not offered at 6 days a week.</p>}
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

      {WORKOUTS.map((w) => {
        const locked =
          (w.phase === 4 && !doc.retests.some((r) => (r as { week?: number }).week === 12)) ||
          (w.phase === 5 && !(doc.retests.some((r) => (r as { clean?: boolean }).clean === true) && doc.phase5Approved));
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
      })}

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
    </div>
  );
}
