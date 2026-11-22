import { useEffect, useMemo, useRef, useState } from 'react';
import type { Ctx } from '../App';
import { WORKOUTS, PHASES, CES_TEMPLATES } from '../lib/data';
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
  const [editId, setEditId] = useState<string | null>(null);
  const [editMinutes, setEditMinutes] = useState('');
  const timerRef = useRef<number | null>(null);

  const phase = phaseForDoc(doc);
  const full = hasFullAccess(doc);
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
      window.alert('Do the assessment first. It sets your starting phase.');
      return;
    }
    if (w.phase === 4 && !doc.retests.some((r) => (r as { week?: number }).week === 12)) {
      window.alert('Phase 4 unlocks after Phase 3 and your Week 12 retest.');
      return;
    }
    if (w.phase === 5) {
      const clean = doc.retests.some((r) => (r as { clean?: boolean }).clean === true);
      if (!clean) {
        window.alert('Phase 5 is locked until a clean form retest AND Derek approves it in Coach.');
        return;
      }
    }
    if (!full && w.id !== 'w1_first') {
      window.alert('Week 2 and later workouts need the trial or beta access. Start the trial or enter your beta code on Today.');
      return;
    }
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
    window.alert(`Workout saved. ${minutes} minutes, +50 XP.`);
  }

  if (active) {
    const ex = active.exercises[step];
    const isLast = step >= active.exercises.length - 1;
    return (
      <div>
        <div className="card">
          <h2>{active.title}</h2>
          <p className="muted small">
            Exercise {step + 1} of {active.exercises.length} · About {active.minutes} minutes · {active.note || ''}
          </p>
          <div className="progress-bar"><div style={{ width: `${((step + 1) / active.exercises.length) * 100}%` }} /></div>
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
        {myTemplates.length > 0 && (
          <details>
            <summary>Your fix-it warm-up ({myTemplates.length} {myTemplates.length === 1 ? 'move' : 'moves'})</summary>
            {myTemplates.map((t) => <p key={t.id}><strong>{t.plainName}:</strong> {t.activation}</p>)}
          </details>
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
        return (
          <div className="card" key={w.id}>
            <div className="row space">
              <h3 style={{ margin: 0 }}>{w.title}</h3>
              <span className="pill">Phase {w.phase} · ~{w.minutes} min</span>
            </div>
            <p className="muted small">{w.day}{w.note ? ` · ${w.note}` : ''}</p>
            <p>{w.exercises.map((e) => e.name).join(' · ')}</p>
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
