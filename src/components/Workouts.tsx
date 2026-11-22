import { useEffect, useMemo, useRef, useState } from 'react';
import type { Ctx } from '../App';
import { WORKOUTS, PHASES, CES_TEMPLATES, effectiveEquipment, resolveExercise } from '../lib/data';
import { phaseForDoc, hasFullAccess } from '../lib/store';
import type { Workout } from '../lib/types';

export default function Workouts({ ctx }: { ctx: Ctx }) {
  const { doc, update } = ctx;
  const [activeId, setActiveId] = useState<string | null>(doc.sessions?.workoutId || null);
  const [step, setStep] = useState(doc.sessions?.step || 0);
  const [log, setLog] = useState<Record<string, { w: string; s: string; r: string }>>({});
  const [restLeft, setRestLeft] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [showHow, setShowHow] = useState<string | null>(null);
  const [finishMinutes, setFinishMinutes] = useState('');
  const [notice, setNotice] = useState('');
  const [timeMin, setTimeMin] = useState<15 | 30 | 45>(30);
  const [editId, setEditId] = useState<string | null>(null);
  const [editMinutes, setEditMinutes] = useState('');
  const timerRef = useRef<number | null>(null);

  const phase = phaseForDoc(doc);
  const full = hasFullAccess(doc);
  // Best workout for you today: picked from your main goal, your gear, and
  // the time you have. Every class gets a real strength workout, Spellweaver
  // included. Only a rest day overrides it, and only if you trained yesterday.
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const trainedYesterday = doc.lastWorkoutDate === yesterday;
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
    !(w.phase === 5 && !doc.retests.some((r) => (r as { clean?: boolean }).clean === true)) &&
    (full || w.id === 'day1-first') &&
    w.exercises.every((e) => !resolveExercise(e, doc.equipment).unavailable);
  const best: Workout | null = useMemo(() => {
    if (!doc.assessmentDone || trainedYesterday) return null;
    const candidates = WORKOUTS.filter(unlocked);
    if (!candidates.length) return null;
    if (doc.workouts.length === 0) {
      return candidates.find((w) => w.id === 'day1-first') || candidates[0];
    }
    if (timeMin === 15) {
      return candidates.find((w) => w.id === 'track-block-1') || [...candidates].sort((a, b) => a.minutes - b.minutes)[0];
    }
    const fits = candidates.filter((w) => w.minutes <= timeMin);
    const pool = fits.length ? fits : candidates;
    return [...pool].sort((a, b) => (b.phase - a.phase) || (b.minutes - a.minutes))[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.assessmentDone, trainedYesterday, timeMin, phase, full, doc.workouts.length, doc.equipment]);
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

  const active: Workout | undefined = useMemo(() => WORKOUTS.find((w) => w.id === activeId), [activeId]);

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
      if (!clean) {
        setNotice('Phase 5 is locked until a clean form retest AND Derek approves it in Coach.');
        return;
      }
    }
    if (!full && w.id !== 'day1-first') {
      setNotice('Week 2 and later workouts need the trial or beta access. Start the trial or enter your beta code on Today.');
      return;
    }
    setNotice('');
    setActiveId(w.id);
    setStep(doc.sessions?.workoutId === w.id ? doc.sessions.step : 0);
    startedAt.current = Date.now();
    update((d) => {
      d.sessions = { workoutId: w.id, step: 0, log: {}, startedAt: new Date().toISOString() };
    });
  }

  function completeWorkout(minutesOverride?: number) {
    if (!active) return;
    const minutes = minutesOverride ?? Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));
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
      d.xp += 50;
      if (!d.badges.includes('week1') && d.workouts.length >= 1) d.badges.push('week1');
    });
    setActiveId(null);
    setLog({});
    setNotice(`Workout saved. ${minutes} minutes, +50 XP.`);
  }

  if (active) {
    const rawEx = active.exercises[step];
    const resolved = resolveExercise(rawEx, doc.equipment);
    const ex = resolved.exercise;
    const isLast = step >= active.exercises.length - 1;
    return (
      <div>
        <div className="card">
          <h2>{active.title}</h2>
          <p className="muted small">
            Exercise {step + 1} of {active.exercises.length} · About {active.minutes} minutes · {active.note || ''}
          </p>
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
            <p>Do your corrective moves before the workout. They stay the same until your Week 4, 8, or 12 retest clears them.</p>
            {myTemplates.map((t) => (
              <details key={t.id}>
                <summary>{t.plainName}</summary>
                <p><strong>Inhibit:</strong> {t.inhibit}</p>
                <p><strong>Lengthen:</strong> {t.lengthen}</p>
                <p><strong>Activation:</strong> {t.activation}</p>
                <p><strong>Integration:</strong> {t.integration}</p>
              </details>
            ))}
          </div>
        )}
        <div className="card">
          <h3>{ex.name}</h3>
          <p>{ex.sets} sets x {ex.reps}{ex.tempo ? ` · Tempo ${ex.tempo}` : ''} · Rest {ex.restSec}s</p>
          <details open={showHow === ex.id} onToggle={(e) => setShowHow((e.target as HTMLDetailsElement).open ? ex.id : null)}>
            <summary>How to do it</summary>
            <ol>{ex.howTo.map((h, i) => <li key={i}>{h}</li>)}</ol>
            <p><strong>Easier version:</strong> {ex.regression}</p>
            {ex.swap && <p><strong>Swap:</strong> {ex.swap}</p>}
            {ex.videoLabel && <p className="small muted">Video: {ex.videoLabel}</p>}
          </details>
          <div className="grid2" style={{ marginTop: 10 }}>
            <div>
              <label htmlFor={`w-${ex.id}`}>Weight (lb)</label>
              <input id={`w-${ex.id}`} inputMode="decimal" value={log[ex.id]?.w || ''} onChange={(e) => setLog((p) => ({ ...p, [ex.id]: { ...(p[ex.id] || { w: '', s: '', r: '' }), w: e.target.value } }))} placeholder="Last time: see Progress" />
            </div>
            <div>
              <label htmlFor={`r-${ex.id}`}>Reps done</label>
              <input id={`r-${ex.id}`} inputMode="numeric" value={log[ex.id]?.r || ''} onChange={(e) => setLog((p) => ({ ...p, [ex.id]: { ...(p[ex.id] || { w: '', s: '', r: '' }), r: e.target.value } }))} placeholder={ex.reps} />
            </div>
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            <h3 style={{ textAlign: 'center' }}>Rest timer</h3>
            <div className="timer">{Math.floor(restLeft / 60)}:{String(restLeft % 60).padStart(2, '0')}</div>
            <div className="row" style={{ justifyContent: 'center' }}>
              <button onClick={() => { setRestLeft(ex.restSec); setRestRunning(true); }}>Start ({ex.restSec}s)</button>
              <button onClick={() => setRestRunning((v) => !v)}>{restRunning ? 'Pause' : 'Resume'}</button>
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
        <p>{effectiveEquipment(doc.equipment).join(', ')}. Moves you cannot do with this gear are swapped for one you can, and the swap is shown in the workout.</p>
        <button onClick={() => ctx.go('assessment')}>Change my equipment in the assessment</button>
      </div>

      <div className="card gold-frame">
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
        {doc.assessmentDone && trainedYesterday && (
          <div>
            <p><strong>Today is an active rest day.</strong> You trained yesterday. Take 1 to 2 rest days between strength days.</p>
            <p className="small muted">Rest well today: a gentle walk, your 2-minute balance hold, and your stretches. No strength workout today. The gym gives the stimulus, recovery builds on it.</p>
          </div>
        )}
        {doc.assessmentDone && !trainedYesterday && best && (
          <div>
            <p><strong>{best.title}</strong> · Phase {best.phase} · about {best.minutes} minutes</p>
            <p className="small">Picked for your goal ({goalLabel}), your gear ({effectiveEquipment(doc.equipment).join(', ')}), and {timeMin === 45 ? '45 or more' : timeMin} minutes. {goalNote}</p>
            <p className="small muted">{best.exercises.map((e) => resolveExercise(e, doc.equipment).exercise.name).join(' · ')}</p>
            <button className="primary" onClick={() => startWorkout(best)}>Start this workout</button>
          </div>
        )}
        {doc.assessmentDone && !trainedYesterday && !best && (
          <p>No workout fits right now. Pick one from the list below.</p>
        )}
      </div>

      {doc.sessions && (
        <div className="card gold-frame">
          <h3>Resume your workout</h3>
          <p>You left {WORKOUTS.find((w) => w.id === doc.sessions?.workoutId)?.title || 'a workout'} partway.</p>
          <button className="primary" onClick={() => startWorkout(WORKOUTS.find((w) => w.id === doc.sessions?.workoutId) || WORKOUTS[0])}>Resume</button>
        </div>
      )}

      <div className="card">
        <h3>Fit the workout to your time</h3>
        <p>Shorter workouts need more days: at 15 minutes, train 4 days a week to hit your Phase 1 weekly sets (6 to 10 per muscle). Split days work different muscles, so weekly volume still adds up.</p>
      </div>

      {WORKOUTS.map((w) => {
        const locked =
          (w.phase === 4 && !doc.retests.some((r) => (r as { week?: number }).week === 12)) ||
          (w.phase === 5 && !doc.retests.some((r) => (r as { clean?: boolean }).clean === true));
        const resolved = w.exercises.map((e) => resolveExercise(e, doc.equipment));
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
