import { useState } from 'react';
import type { Ctx } from '../App';
import * as api from '../lib/api';
import { PHASES, WORKOUTS, WEEK13, CLASS_GOOD_FOR } from '../lib/data';
import { phaseForDoc, hasFullAccess, recoveryScore, levelForXp, titleForLevel, metCompanionIds, currentWeekForDoc, checkinPreferenceText, checkinFrequenciesForMode, normalizeCheckinFrequency } from '../lib/store';
import type { AssessmentVideo } from '../lib/store';
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
  const [msgVideoFile, setMsgVideoFile] = useState<File | null>(null);
  const [msgVideoPreview, setMsgVideoPreview] = useState('');
  const [msgVideoUploading, setMsgVideoUploading] = useState(false);
  const [msgVideoMsg, setMsgVideoMsg] = useState('');
  const [msgVideoError, setMsgVideoError] = useState('');
  const [msgVideo, setMsgVideo] = useState<AssessmentVideo | null>(null);
  const [callWhen, setCallWhen] = useState('');
  const [callTopic, setCallTopic] = useState('');
  const [callMsg, setCallMsg] = useState('');

  const phase = phaseForDoc(doc);
  const phaseInfo = PHASES.find((p) => p.phase === phase);
  const full = hasFullAccess(doc);
  const nextWorkout = WORKOUTS.find((w) => w.id === 'day1-first') || WORKOUTS.find((w) => w.phase === phase);
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

  const met = metCompanionIds(doc);

  function sendMessage() {
    if (!msgBody.trim()) return;
    const quillBonus = met.has('quill');
    update((d) => {
      d.messages.unshift({
        id: `m${Date.now()}`,
        kind: msgMode,
        body: msgBody.trim(),
        date: new Date().toISOString(),
        video: msgVideo || undefined,
      });
      d.xp += quillBonus ? 10 : 5;
    });
    setMsgBody('');
    setMsgVideo(null);
  }

  // Recorded video clip attach: pick, preview, upload. Filming is always
  // optional. A failed upload never blocks the check-in or the message.
  function pickClip(file: File | undefined) {
    setMsgVideoMsg('');
    setMsgVideoError('');
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setMsgVideoError('That file is not a video. Pick a video file.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setMsgVideoError('That video is over 100 MB. Pick a shorter clip.');
      return;
    }
    if (msgVideoPreview) URL.revokeObjectURL(msgVideoPreview);
    setMsgVideoFile(file);
    setMsgVideoPreview(URL.createObjectURL(file));
  }

  async function uploadClip() {
    if (!msgVideoFile || msgVideoUploading) return;
    setMsgVideoUploading(true);
    setMsgVideoMsg('');
    setMsgVideoError('');
    try {
      const r = await api.uploadCheckinVideo(msgVideoFile, 'Form-check video', currentWeekForDoc(doc));
      setMsgVideo(r.video);
      setMsgVideoMsg('Video uploaded. It will go with your message.');
      if (msgVideoPreview) URL.revokeObjectURL(msgVideoPreview);
      setMsgVideoPreview('');
      setMsgVideoFile(null);
    } catch (e) {
      setMsgVideoError(e instanceof Error ? e.message : 'The video could not be uploaded. You can still send the message without it.');
    } finally {
      setMsgVideoUploading(false);
    }
  }

  function sendCallRequest() {
    if (!callWhen.trim() && !callTopic.trim()) return;
    update((d) => {
      d.messages.unshift({
        id: `m${Date.now()}`,
        kind: 'video-call-request',
        body: `Video call request. Times that work: ${callWhen.trim() || 'any time Derek picks'}. What I want to talk about: ${callTopic.trim() || 'my check-in'}.`,
        date: new Date().toISOString(),
        callStatus: 'requested',
      });
      d.xp += 5;
    });
    setCallWhen('');
    setCallTopic('');
    setCallMsg('Request sent. Derek will reply within one business day to set a time and send the call link.');
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
            {doc.guardian && <p className="small">{CLASS_GOOD_FOR[doc.guardian.classId] || ''} All classes do the same strength workouts.</p>}
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
        <p className="small"><strong>{checkinPreferenceText(doc)}</strong></p>
        <label>How do you want to check in with Derek?</label>
        <div className="row">
          {([['text', 'Text check-in in the app'], ['live-call', 'Live video call with Derek']] as const).map(([v, label]) => (
            <button key={v} type="button" onClick={() => update((d) => { d.checkinMode = v; d.checkinFrequency = normalizeCheckinFrequency(v, d.checkinFrequency); })} style={doc.checkinMode === v ? { background: '#124571', color: '#fff' } : {}}>
              {label}
            </button>
          ))}
        </div>
        <p className="small muted">Live video call: you request times in the app, Derek confirms the time and sends the call link, or you schedule it outside the app. The app itself does not do the video call. Recorded video is not a check-in type. It is only for form-check clips, in the assessment and attached to a message about form.</p>
        <label>How often do you want to check in with Derek?</label>
        {doc.checkinMode === 'live-call' && <p className="small muted">Live video calls are 1 to 4 times a month. Text or recorded video can be more often.</p>}
        <div className="row">
          {checkinFrequenciesForMode(doc.checkinMode).map(({ value: v, label }) => (
            <button key={v} type="button" onClick={() => update((d) => { d.checkinFrequency = v; })} style={doc.checkinFrequency === v ? { background: '#124571', color: '#fff' } : {}}>
              {label}
            </button>
          ))}
        </div>
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
                  d.xp += met.has('hoot') ? 15 : 10;
                });
                setCheckinNote('');
                setShowCheckin(false);
              }}
            >
              Log check-in (+10 XP{met.has('hoot') ? ', +5 from Hoot' : ''})
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3>2-minute balance quest (+15 XP)</h3>
        <p className="small muted">Stand on one leg for 2 minutes, switching sides. Hold a chair or wall if you need it. Once a day.</p>
        {(() => {
          const today = new Date().toISOString().slice(0, 10);
          const done = doc.quests.some((q) => q.kind === 'balance-quest' && String(q.date).slice(0, 10) === today);
          if (done) return <p className="small ok">Done today. +15 XP earned.</p>;
          return (
            <button
              className="primary"
              onClick={() => {
                update((d) => {
                  d.quests.push({ id: `q${Date.now()}`, date: new Date().toISOString(), kind: 'balance-quest' });
                  d.xp += 15;
                });
              }}
            >
              I did my 2-minute balance quest
            </button>
          );
        })()}
      </div>

      <div className="card">
        <h3>Reminder times</h3>
        <p className="small muted">Pick when you want a reminder card on Today. In-app reminders only, no push notifications yet.</p>
        <div className="grid2">
          <div>
            <label htmlFor="rt-workout">Workout reminder</label>
            <input id="rt-workout" type="time" value={doc.reminderTimes.workout} onChange={(e) => update((d) => { d.reminderTimes.workout = e.target.value; })} />
          </div>
          <div>
            <label htmlFor="rt-checkin">Check-in reminder</label>
            <input id="rt-checkin" type="time" value={doc.reminderTimes.checkin} onChange={(e) => update((d) => { d.reminderTimes.checkin = e.target.value; })} />
          </div>
          <div>
            <label htmlFor="rt-streak">Streak reminder</label>
            <input id="rt-streak" type="time" value={doc.reminderTimes.streak} onChange={(e) => update((d) => { d.reminderTimes.streak = e.target.value; })} />
          </div>
        </div>
        {(() => {
          const now = new Date();
          const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const today = now.toISOString().slice(0, 10);
          const workedToday = doc.workouts.some((w) => String(w.date).slice(0, 10) === today);
          const checkedToday = doc.checkins.some((c) => String(c.date).slice(0, 10) === today);
          const cards: string[] = [];
          if (hhmm >= doc.reminderTimes.workout && !workedToday) cards.push('Reminder: time for your workout today.');
          if (hhmm >= doc.reminderTimes.checkin && !checkedToday) cards.push('Reminder: your daily check-in is waiting.');
          if (hhmm >= doc.reminderTimes.streak && doc.workouts.length > 0 && !workedToday) cards.push('Reminder: keep your streak going with one small step today.');
          return cards.map((c) => <p key={c} className="notice">{c}</p>);
        })()}
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
                  d.xp += met.has('mara') ? 10 : 5;
                });
                setShowSleep(false);
              }}
            >
              Log sleep (+5 XP{met.has('mara') ? ', +5 from Mara' : ''})
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
        <div style={{ marginTop: 12 }}>
          <h4 style={{ margin: '0 0 4px' }}>Attach a form-check video (optional)</h4>
          <p className="small muted">A short clip of a move helps Derek check your form. Filming is never required.</p>
          {!msgVideo && (
            <label>
              <input type="file" accept="video/*" onChange={(e) => pickClip(e.target.files?.[0])} style={{ display: 'none' }} />
              <span className="button-like">Pick a video or record one</span>
            </label>
          )}
          {msgVideoPreview && msgVideoFile && (
            <div>
              <video src={msgVideoPreview} controls style={{ width: '100%', maxHeight: 240 }} />
              <p className="small muted">{msgVideoFile.name} · {(msgVideoFile.size / 1024 / 1024).toFixed(1)} MB</p>
              <div className="row">
                <button className="primary" disabled={msgVideoUploading} onClick={() => uploadClip()}>{msgVideoUploading ? 'Uploading...' : 'Upload this video'}</button>
                <button onClick={() => { if (msgVideoPreview) URL.revokeObjectURL(msgVideoPreview); setMsgVideoPreview(''); setMsgVideoFile(null); }}>Remove</button>
              </div>
            </div>
          )}
          {msgVideo && <p className="small ok">Video ready: {(msgVideo.sizeBytes / 1024 / 1024).toFixed(1)} MB. It goes with your message. <button onClick={() => setMsgVideo(null)}>Remove</button></p>}
          {msgVideoMsg && <p className="ok">{msgVideoMsg}</p>}
          {msgVideoError && <p className="error">{msgVideoError}</p>}
        </div>
        <button className="primary" style={{ marginTop: 10 }} onClick={sendMessage}>
          {msgMode === 'question' ? 'Send question' : 'Send message'}
        </button>
        {met.has('quill') && <p className="small muted">Quill carries your message to Derek (+5 XP).</p>}
        {doc.messages.slice(0, 5).map((m) => (
          <div key={m.id} style={{ borderTop: '1px solid #d7e3ee', padding: '8px 0' }}>
            <p><strong>{m.kind === 'question' ? 'Question' : m.kind === 'video-call-request' ? 'Video call request' : 'Message'}:</strong> {m.body}</p>
            {m.kind === 'video-call-request' && m.callStatus === 'confirmed' && m.callTime && <p className="ok">Confirmed: video call on {m.callTime}. Derek will send the call link.</p>}
            {m.kind === 'video-call-request' && m.callStatus !== 'confirmed' && <p className="small muted">Request sent. Derek will reply within one business day to set a time.</p>}
            {m.video && <p className="small muted">Video attached ({(m.video.sizeBytes / 1024 / 1024).toFixed(1)} MB). Derek can watch it in Coach.</p>}
            {m.coachReply && <p className="ok">Derek replied: {m.coachReply}</p>}
            {!m.coachReply && m.kind !== 'video-call-request' && <p className="small muted">Waiting for Derek.</p>}
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Book a video call check-in with Derek</h3>
        <p className="small muted">A live video call, not a recording. The free assessment is 30 to 45 minutes. A check-in call is shorter. Derek replies within one business day to set a time and send the call link. The app itself does not do the video call.</p>
        <label htmlFor="call-when">Times that work for you</label>
        <input id="call-when" value={callWhen} onChange={(e) => setCallWhen(e.target.value)} placeholder="e.g. Tue or Thu morning, or any weekday after 5" />
        <label htmlFor="call-topic">What do you want to talk about?</label>
        <input id="call-topic" value={callTopic} onChange={(e) => setCallTopic(e.target.value)} placeholder="e.g. my squat form, or my Week 4 retest" />
        <button className="primary" style={{ marginTop: 10 }} onClick={sendCallRequest} disabled={!callWhen.trim() && !callTopic.trim()}>
          Request a video call
        </button>
        {callMsg && <p className="ok">{callMsg}</p>}
        {doc.messages.filter((m) => m.kind === 'video-call-request').slice(0, 3).map((m) => (
          <p key={m.id} className="small" style={{ borderTop: '1px solid #d7e3ee', paddingTop: 8 }}>
            {m.callStatus === 'confirmed' && m.callTime ? `Confirmed: video call on ${m.callTime}. Derek will send the call link.` : 'Request sent. Derek will reply within one business day to set a time.'}
          </p>
        ))}
      </div>

      <div className="card">
        <h3>Your companions</h3>
        <p className="small muted">You meet companions one at a time as you travel. They live on Journey, not here.</p>
        <button onClick={() => go('journey')}>Meet them on Journey</button>
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
