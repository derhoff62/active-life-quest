import { useState } from 'react';
import type { Ctx } from '../App';
import { PHASES, WORKOUTS, WEEK13, CREATURES } from '../lib/data';
import { phaseForDoc, hasFullAccess, recoveryScore, levelForXp, titleForLevel } from '../lib/store';
import GuardianAvatar from './GuardianAvatar';

export default function Today({ ctx }: { ctx: Ctx }) {
  const { doc, update, go } = ctx;
  const [msgMode, setMsgMode] = useState<'question' | 'message'>('question');
  const [msgBody, setMsgBody] = useState('');
  const [checkinNote, setCheckinNote] = useState('');
  const [energy, setEnergy] = useState(7);
  const [sleepH, setSleepH] = useState(7);
  const [soreness, setSoreness] = useState(3);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showSleep, setShowSleep] = useState(false);

  const phase = phaseForDoc(doc);
  const phaseInfo = PHASES.find((p) => p.phase === phase);
  const full = hasFullAccess(doc);
  const nextWorkout = WORKOUTS.find((w) => w.id === 'w1_first') || WORKOUTS.find((w) => w.phase === phase);
  const unfinished = doc.sessions;
  const week12Done = doc.retests.some((r) => (r as { week?: number }).week === 12);
  const lastSleep = doc.sleep[doc.sleep.length - 1] as { hours?: number } | undefined;
  const rec = recoveryScore(lastSleep?.hours ?? 7, soreness, energy, true);
  const level = levelForXp(doc.xp);
  // XP into the current level: thresholds are 100, 125, 150, ... per level.
  let xpIntoLevel = doc.xp;
  let needForNext = 100;
  for (let l = 1; l < level; l += 1) {
    xpIntoLevel -= 100 + (l - 1) * 25;
  }
  needForNext = 100 + (level - 1) * 25;
  const xpPct = Math.min(100, Math.max(0, (xpIntoLevel / needForNext) * 100));

  function sendMessage() {
    if (!msgBody.trim()) return;
    update((d) => {
      d.messages.unshift({
        id: `m${Date.now()}`,
        kind: msgMode,
        body: msgBody.trim(),
        date: new Date().toISOString(),
      });
      d.xp += 5;
    });
    setMsgBody('');
  }

  return (
    <div>
      <div className="card gold-frame guardian-hero">
        <GuardianAvatar guardian={doc.guardian} level={level} size="large" />
        <p className="small muted" style={{ textAlign: 'center' }}>
          {doc.guardian ? `${doc.guardian.name} the ${doc.guardian.classId}` : 'Your guardian'} · Level {level} {titleForLevel(level)} · {doc.xp} XP
        </p>
        <div className="progress-bar xp-glow" aria-label={`Level ${level}, ${xpIntoLevel} of ${needForNext} XP to Level ${level + 1}`}>
          <div style={{ width: `${xpPct}%` }} />
        </div>
        <p className="small muted" style={{ textAlign: 'center' }}>{xpIntoLevel} of {needForNext} XP to Level {level + 1}</p>
        <div className="creature">
          <div>
            <h2>{doc.guardian ? `${doc.guardian.name} is ready` : 'Your next step'}</h2>
            {!doc.assessmentDone && <p>Do the assessment first. It takes 30 to 45 minutes and sets your starting phase.</p>}
            {doc.assessmentDone && !doc.workouts.length && <p>Your next step: do Day 1. It takes about 10 to 15 minutes.</p>}
            {doc.assessmentDone && doc.workouts.length > 0 && <p>Your next step: your Phase {phase} workout. {phaseInfo?.name}. Take 1 to 2 rest days between strength days.</p>}
            <div className="row">
              {!doc.assessmentDone && <button className="primary" onClick={() => go('assessment')}>Start the assessment</button>}
              {doc.assessmentDone && <button className="primary" onClick={() => go('workouts')}>Start my workout</button>}
              <button onClick={() => go('journey')}>See my journey</button>
            </div>
          </div>
        </div>
      </div>

      {doc.nudges.filter((n) => !n.read).map((n) => (
        <div className="notice" key={n.id}>
          <strong>From Derek:</strong> {n.text}
          <div><button onClick={() => update((d) => { const x = d.nudges.find((y) => y.id === n.id); if (x) x.read = true; })}>Got it</button></div>
        </div>
      ))}

      {unfinished && (
        <div className="notice">
          <strong>Unfinished workout:</strong> you left a workout partway. Pick it back up where you left off.
          <div className="row" style={{ marginTop: 8 }}>
            <button className="primary" onClick={() => go('workouts')}>Resume workout</button>
            <button onClick={() => update((d) => { d.sessions = null; })}>Discard it</button>
          </div>
        </div>
      )}

      {week12Done && !doc.week13Goal && (
        <div className="card gold-frame">
          <h3>{WEEK13.title}</h3>
          <p>{WEEK13.text}</p>
          <div className="row">
            {WEEK13.options.map((o) => (
              <button key={o} onClick={() => update((d) => { d.week13Goal = o; d.week13PlanRequested = true; })}>{o}</button>
            ))}
          </div>
          <p className="small muted">Nothing resets. Your streak, level, badges, and PRs stay.</p>
        </div>
      )}
      {week12Done && doc.week13Goal && (
        <div className="card">
          <h3>Your next step</h3>
          <p>New goal: {doc.week13Goal}. Derek has your request for the next plan.</p>
        </div>
      )}

      <div className="card">
        <div className="row space">
          <h3 style={{ margin: 0 }}>Daily check-in</h3>
          <button onClick={() => setShowCheckin((v) => !v)}>{showCheckin ? 'Close' : 'Open'}</button>
        </div>
        <p className="muted small">Recovery score today: {rec}/100. Sleep 40, aches 25, energy 25, rest rhythm 10.</p>
        {showCheckin && (
          <div>
            <label>Energy (1 to 10): {energy}</label>
            <input type="range" min={1} max={10} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} />
            <label>Soreness (1 to 10): {soreness}</label>
            <input type="range" min={1} max={10} value={soreness} onChange={(e) => setSoreness(Number(e.target.value))} />
            <label htmlFor="ci-note">Anything to tell Derek?</label>
            <input id="ci-note" value={checkinNote} onChange={(e) => setCheckinNote(e.target.value)} placeholder="Optional" />
            <button
              className="primary"
              style={{ marginTop: 10 }}
              onClick={() => {
                update((d) => {
                  d.checkins.push({ id: `c${Date.now()}`, date: new Date().toISOString(), energy, sleepHours: sleepH, soreness, note: checkinNote });
                  d.xp += 10;
                });
                setCheckinNote('');
                setShowCheckin(false);
              }}
            >
              Log check-in (+10 XP)
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="row space">
          <h3 style={{ margin: 0 }}>Sleep and recovery</h3>
          <button onClick={() => setShowSleep((v) => !v)}>{showSleep ? 'Close' : 'Log sleep'}</button>
        </div>
        <p className="muted small">Last night: {lastSleep?.hours ?? 'not logged yet'} hours.</p>
        {showSleep && (
          <div>
            <label>Hours slept: {sleepH}</label>
            <input type="range" min={0} max={12} step={0.5} value={sleepH} onChange={(e) => setSleepH(Number(e.target.value))} />
            <button
              className="primary"
              style={{ marginTop: 10 }}
              onClick={() => {
                update((d) => {
                  d.sleep.push({ id: `s${Date.now()}`, date: new Date().toISOString(), hours: sleepH });
                  d.xp += 5;
                });
                setShowSleep(false);
              }}
            >
              Log sleep (+5 XP)
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Message Derek</h3>
        <p className="small muted">This is not live chat. Derek replies within one business day.</p>
        <div className="row">
          <button onClick={() => setMsgMode('question')} style={msgMode === 'question' ? { background: '#124571', color: '#fff' } : {}}>Ask a question</button>
          <button onClick={() => setMsgMode('message')} style={msgMode === 'message' ? { background: '#124571', color: '#fff' } : {}}>Send a message</button>
        </div>
        <label htmlFor="msg-body">{msgMode === 'question' ? 'Your question for Derek' : 'Your message for Derek'}</label>
        <textarea id="msg-body" rows={3} value={msgBody} onChange={(e) => setMsgBody(e.target.value)} />
        <button className="primary" style={{ marginTop: 10 }} onClick={sendMessage}>
          {msgMode === 'question' ? 'Send question' : 'Send message'}
        </button>
        {doc.messages.slice(0, 5).map((m) => (
          <div key={m.id} style={{ borderTop: '1px solid #d7e3ee', padding: '8px 0' }}>
            <p><strong>{m.kind === 'question' ? 'Question' : 'Message'}:</strong> {m.body}</p>
            {m.coachReply && <p className="ok">Derek replied: {m.coachReply}</p>}
            {!m.coachReply && <p className="small muted">Waiting for Derek.</p>}
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Your companions</h3>
        <p className="small muted">People and animals you befriend along the road. Bosses are not companions.</p>
        {CREATURES.map((c) => {
          const avatar =
            c.id === 'ash' ? '🐺'
            : c.id === 'ember' ? '🐲'
            : c.id === 'kaelith' ? '🐉'
            : c.id === 'rowan' ? '🛡️'
            : c.id === 'mara' ? '💚'
            : c.id === 'quill' ? '🐦‍⬛'
            : c.id === 'miso' ? '🐱'
            : c.id === 'sylva' ? '🧝'
            : c.id === 'bram' ? '🧔'
            : c.id === 'tilda' ? '🧑‍🍳'
            : c.id === 'pip' ? '🧙'
            : c.id === 'hoot' ? '🦉'
            : '✨';
          return (
            <div className="creature" key={c.id} style={{ margin: '8px 0' }}>
              <div className="avatar" aria-hidden>{avatar}</div>
              <p><strong>{c.name}</strong> ({c.kind}): {c.line}</p>
            </div>
          );
        })}
        <button onClick={() => go('journey')}>Meet them all on Journey</button>
      </div>

      {!full && (
        <div className="card">
          <h3>Your plan</h3>
          <p>Phase {phase}: {phaseInfo?.name}. {phaseInfo?.description}</p>
          <p className="small muted">{phaseInfo?.why}</p>
          {nextWorkout && <p className="small">Next workout: {nextWorkout.title}, about {nextWorkout.minutes} minutes.</p>}
        </div>
      )}
    </div>
  );
}
