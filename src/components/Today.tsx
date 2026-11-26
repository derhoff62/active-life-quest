import { useState } from 'react';
import type { Ctx } from '../App';
import * as api from '../lib/api';
import { PHASES, WORKOUTS, CORE_BALANCE_WORKOUT, WEEK13, CLASS_GOOD_FOR, GOAL_TYPES, splitForDays, foodQuestForDate } from '../lib/data';
import type { TrainingStyle } from '../lib/data';
import { phaseForDoc, recoveryScore, levelForXp, titleForLevel, metCompanionIds, currentWeekForDoc, checkinPreferenceText, checkinFrequenciesForMode, normalizeCheckinFrequency, loggedToday, streakDaysForDoc, lastLoggedLabel, cardioCreditedSum, hasApprovedRetest, pendingRetests, assessmentApproved, assessmentPending, volumeTierForDoc, latestWorkout, lastSplitIndex, DAILY_UNLOCK_LEVELS, dailyUnlocked } from '../lib/store';
import { cycleForWeek, nextRetestWeek, nextBossWeek, nextRetestLabel, nextBossLabel, isDeloadWeek, challengeForWeek } from '../lib/yearPlan';
import type { AssessmentVideo } from '../lib/store';
import GuardianAvatar from './GuardianAvatar';
import GuardianEmote, { EMOTES } from './GuardianEmote';
import Faq from './Faq';
import { autoMood } from '../lib/mood';

export default function Today({ ctx }: { ctx: Ctx }) {
  const { doc, update, go, toast } = ctx;
  const [msgMode, setMsgMode] = useState<'question' | 'message'>('question');
  const [msgBody, setMsgBody] = useState('');
  const [checkinNote, setCheckinNote] = useState('');
  const [checkinMsg, setCheckinMsg] = useState('');
  const [energy, setEnergy] = useState(7);
  const [soreness, setSoreness] = useState(3);
  const [goalPick, setGoalPick] = useState('');
  const [goalWhy, setGoalWhy] = useState('');
  const [goalMsg, setGoalMsg] = useState('');
  const [msgVideoFile, setMsgVideoFile] = useState<File | null>(null);
  const [msgVideoPreview, setMsgVideoPreview] = useState('');
  const [msgVideoUploading, setMsgVideoUploading] = useState(false);
  const [msgVideoMsg, setMsgVideoMsg] = useState('');
  const [msgVideoError, setMsgVideoError] = useState('');
  const [msgVideo, setMsgVideo] = useState<AssessmentVideo | null>(null);
  const [callWhen, setCallWhen] = useState('');
  const [callTopic, setCallTopic] = useState('');
  const [callMsg, setCallMsg] = useState('');
  // Short busy guard on the once-a-day XP buttons: the form disappears
  // after the first tap, but a fast double-tap before React re-renders
  // could log twice. Disabled + "Saving…" also tells the client the tap
  // landed, instead of the button sitting still.
  const [checkinBusy, setCheckinBusy] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [questBusy, setQuestBusy] = useState(false);

  const phase = phaseForDoc(doc);
  const phaseInfo = PHASES.find((p) => p.phase === phase);
  // Next workout rotates through the phase workouts instead of always
  // showing Day 1, even after many workouts.
  const phaseWorkouts = WORKOUTS.filter((w) => w.phase === phase && (w.id === 'day1-first' || w.id === `p${phase}a` || w.id === `p${phase}b`));
  // Latest workout by DATE, not insertion order: a backdated workout
  // logged later must not rewind the next-workout rotation.
  const lastWorkoutId = latestWorkout(doc) ? String(latestWorkout(doc)!.workoutId || '') : '';
  const lastIdx = phaseWorkouts.findIndex((w) => w.id === lastWorkoutId);
  const nextWorkout =
    doc.workouts.length === 0
      ? WORKOUTS.find((w) => w.id === 'day1-first')
      : (doc.trainingDays || 3) >= 4
        ? (() => {
          // At 4 to 6 days the next workout is the next day in the
          // client's own split (Push, Pull, Legs, Upper / Lower, or the
          // next short session), not a mix of full-body and split days.
          const style: TrainingStyle = doc.trainingStyle || 'ppl';
          const split = splitForDays(doc.trainingDays || 3, phase, style);
          // A custom workout counts too: its biggest group picks up the
          // rotation, so a custom legs day is followed by push, not legs.
          const idx = lastSplitIndex(doc, split.days, style);
          const next = split.days[(idx + 1) % split.days.length];
          return WORKOUTS.find((w) => w.id === next.workoutId)
            || (next.workoutId === 'core-balance-mobility' ? CORE_BALANCE_WORKOUT : undefined)
            || phaseWorkouts[(lastIdx + 1) % Math.max(1, phaseWorkouts.length)];
        })()
        : phaseWorkouts[(lastIdx + 1) % Math.max(1, phaseWorkouts.length)] || WORKOUTS.find((w) => w.phase === phase);
  const unfinished = doc.sessions;
  const week12Done = hasApprovedRetest(doc, 12);
  // Where you are in this stretch, and results so far, not
  // just XP. Waist change comes from first vs latest measurement.
  const yearWeek = currentWeekForDoc(doc);
  const { cycle: yearCycle, weekInCycle, isReview } = cycleForWeek(yearWeek);
  const yearDoneRetests = new Set(doc.retests.map((r) => (r as { week?: number }).week || 0));
  const yearNextRetest = nextRetestWeek(yearWeek, yearDoneRetests);
  const yearBeatenBossWeeks = new Set(
    Object.entries(doc.bossHp || {}).filter(([, hp]) => hp <= 0).map(([id]) => Number(id.replace('boss-week-', ''))),
  );
  const yearNextBoss = nextBossWeek(yearWeek, yearBeatenBossWeeks);
  const yearCardioTotal = cardioCreditedSum(doc.cardio);
  const yearStreak = streakDaysForDoc(doc);
  const yearWaists = (doc.measurements || []).map((m) => Number((m as { waist?: string }).waist || 0)).filter((w) => w > 0);
  const yearWaistChange = yearWaists.length >= 2 ? yearWaists[yearWaists.length - 1] - yearWaists[0] : null;
  const yearChallenge = challengeForWeek(yearWeek);
  // Today journey features. All read-only: no XP, no badges, no
  // programming changes. Guarded against empty arrays throughout.
  const firstWeekWorkoutDone = (doc.workouts || []).length > 0;
  const firstWeekCheckinDone = (doc.checkins || []).length > 0;
  const firstWeekBalanceDone = (doc.balanceTests || []).length > 0 || ((doc.balanceBaseline?.left || 0) > 0 || (doc.balanceBaseline?.right || 0) > 0);
  const firstWeekDoneCount = [firstWeekWorkoutDone, firstWeekCheckinDone, firstWeekBalanceDone].filter(Boolean).length;
  const strengthDaysThisWeek = doc.trainingDays || 3;
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);
  const checkinDates = (doc.checkins || []).map((c) => String(c.date || '').slice(0, 10));
  const missedYesterday =
    checkinDates.length > 0 && !checkinDates.includes(yesterdayStr) && !checkinDates.includes(todayStr);
  const lastSleep = doc.sleep[doc.sleep.length - 1] as { hours?: number } | undefined;
  // Recovery score comes from the last check-in you actually logged, not
  // from the slider positions. Until the first check-in, it uses last
  // night's sleep and a neutral middle for energy and soreness.
  const lastCheckin = doc.checkins[doc.checkins.length - 1] as { energy?: number; sleepHours?: number; soreness?: number } | undefined;
  // Check-in adaptive volume: today's workout follows the last
  // check-in (today, or yesterday). See volumeTierForDoc in store.ts.
  const vol = volumeTierForDoc(doc);
  const rec = recoveryScore(
    lastCheckin?.sleepHours ?? lastSleep?.hours ?? 7,
    lastCheckin?.soreness ?? 3,
    lastCheckin?.energy ?? 7,
    !!lastCheckin,
  );
  const level = levelForXp(doc.xp);
  // Today's face: the auto mood (how they are doing) wins over the
  // picked default mood; null means no rule fired, so the avatar
  // falls back to the picked mood. Computed once, used for the face
  // and for the caption under it.
  const moodToday = autoMood(doc);
  // XP into the current level: thresholds are 100, 125, 150, ... per level.
  let xpIntoLevel = doc.xp;
  let needForNext = 100;
  for (let l = 1; l < level; l += 1) {
    xpIntoLevel -= 100 + (l - 1) * 25;
  }
  needForNext = 100 + (level - 1) * 25;
  const xpPct = Math.min(100, Math.max(0, (xpIntoLevel / needForNext) * 100));

  const met = metCompanionIds(doc);

  function sendEmote(emoteId: string) {
    const emote = EMOTES.find((e) => e.id === emoteId);
    if (!emote) return;
    const quillBonus = met.has('quill');
    update((d) => {
      d.messages.unshift({
        id: `m${Date.now()}`,
        kind: 'message',
        body: `Sent an emote: ${emote.text}`,
        date: new Date().toISOString(),
        emote: emote.id,
      });
      d.xp += quillBonus ? 10 : 5;
    });
    toast(quillBonus ? `Emote sent. +10 XP.` : 'Emote sent. +5 XP.');
  }

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
    toast(quillBonus ? 'Message sent. +10 XP.' : 'Message sent. +5 XP.');
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
      toast('Video uploaded. It will go with your message.');
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
    // One open request at a time: a second request while Derek has not
    // answered the first one just makes a pile in Coach.
    if (doc.messages.some((m) => m.kind === 'video-call-request' && m.callStatus !== 'confirmed')) {
      setCallMsg('You already have a video call request waiting. Derek will reply within one business day.');
      return;
    }
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
    toast('Video call request sent.');
  }

  return (
    <div>
      <div className="card gold-frame guardian-hero">
        <GuardianAvatar guardian={doc.guardian} level={level} size="large" face={moodToday?.face} />
        {moodToday && (
          <p className="small muted" style={{ textAlign: 'center' }}>
            Your guardian looks {moodToday.label} — {moodToday.reason}.
          </p>
        )}
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
            {doc.guardian && <p className="small">{CLASS_GOOD_FOR[doc.guardian.classId] || ''}</p>}
            {!doc.assessmentDone && <p>Do the assessment first. It takes 30 to 45 minutes and sets your starting phase.</p>}
            {assessmentPending(doc) && <p className="notice">Assessment waiting for Derek to review. Your plan starts once he approves it.</p>}
            {assessmentApproved(doc) && !doc.workouts.length && <p>Your next step: do Day 1. It takes about 10 to 15 minutes.</p>}
            {assessmentApproved(doc) && doc.workouts.length > 0 && <p>Your next step: your Phase {phase} workout. {phaseInfo?.name}. Take 1 to 2 rest days between strength days.</p>}
            {assessmentApproved(doc) && vol.tier !== 'none' && <p className="small"><strong>{vol.line}</strong></p>}
            <div className="row">
              {!doc.assessmentDone && <button className="primary" onClick={() => go('train')}>Start the assessment</button>}
              {assessmentPending(doc) && <button className="primary" onClick={() => go('train')}>See my assessment</button>}
              {assessmentApproved(doc) && <button className="primary" onClick={() => go('train')}>Start my workout</button>}
              <button onClick={() => go('journey')}>See my journey</button>
            </div>
          </div>
        </div>
      </div>

      {yearWeek === 1 && (
        <div className="card gold-frame">
          <h3 style={{ margin: 0 }}>Your first week</h3>
          <p>You did {firstWeekDoneCount} of 3 this week.</p>
          {firstWeekDoneCount === 3 && <p><strong>First week done. Nice start.</strong></p>}
          <ul>
            <li>1 short workout: {firstWeekWorkoutDone ? 'Done' : 'Not done yet'}</li>
            <li>1 check-in: {firstWeekCheckinDone ? 'Done' : 'Not done yet'}</li>
            <li>1 balance hold: {firstWeekBalanceDone ? 'Done' : 'Not done yet'}</li>
          </ul>
        </div>
      )}

      {unfinished && (
        <div className="card gold-frame" id="resume-workout">
          <h3 style={{ margin: 0 }}>Continue where you left off</h3>
          <p>
            {(() => {
              const w = WORKOUTS.find((x) => x.id === unfinished.workoutId) || (unfinished.workoutId === 'core-balance-mobility' ? CORE_BALANCE_WORKOUT : undefined);
              return w ? `${w.title} · Exercise ${(unfinished.step || 0) + 1} of ${w.exercises.length}` : 'You left a workout partway.';
            })()}
          </p>
          <div className="row">
            <button className="primary" onClick={() => go('train')}>Resume workout</button>
            {!confirmDiscard ? (
              <button onClick={() => setConfirmDiscard(true)}>Discard it</button>
            ) : (
              <span>
                Discard this workout and lose your spot?{' '}
                <button className="primary" onClick={() => { update((d) => { d.sessions = null; }); setConfirmDiscard(false); toast('Unfinished workout discarded.'); }}>Yes, discard it</button>{' '}
                <button onClick={() => setConfirmDiscard(false)}>Keep it</button>
              </span>
            )}
          </div>
        </div>
      )}

      {doc.assessmentDone && (
        <div className="card gold-frame">
          <h3 style={{ margin: 0 }}>Where you are: Week {weekInCycle} · {yearCycle.name}</h3>
          <p className="small">Week {weekInCycle} of this stretch{isReview ? ' · Review stretch' : ''}. This stretch's goal: <strong>{yearCycle.goal}</strong> · {yearCycle.phases} · {yearCycle.track}</p>
          <p className="small">{nextRetestLabel(yearNextRetest)} {nextBossLabel(yearNextBoss)}</p>
          {pendingRetests(doc).length > 0 && <p className="small"><strong>Retest waiting for Derek to review:</strong> {pendingRetests(doc).map((r) => `Week ${Number((r as { week?: number }).week || 0)}`).join(', ')}. Your phase does not move until he approves it.</p>}
          {isDeloadWeek(yearWeek) && <p className="small"><strong>Deload week.</strong> Lighter loads this week, then your retest.</p>}
          <p className="small muted">Results so far: {doc.prs.length} personal record{doc.prs.length === 1 ? '' : 's'} · {yearCardioTotal.toLocaleString()} cardio minutes · Streak {yearStreak} {yearStreak === 1 ? 'day' : 'days'}{yearWaistChange !== null ? ` · Waist ${yearWaistChange > 0 ? '+' : ''}${yearWaistChange} in since your first measurement` : ''} · {doc.badges.length} badges</p>
          <p className="small">This month's challenge: <strong>{yearChallenge.title}</strong> · {yearChallenge.detail}</p>
          <div className="row"><button onClick={() => go('journey')}>See the road ahead</button><button onClick={() => go('progress')}>See my results</button></div>
        </div>
      )}

      {doc.assessmentDone && (
        <div className="card">
          <h3 style={{ margin: 0 }}>Your week at a glance</h3>
          <p>This week: {strengthDaysThisWeek} strength, 2 walks, 1 check-in.</p>
          <p className="small muted">Cardio target: 150 minutes this week. Weigh in once, same day each week. Take 1 to 2 rest days between strength days.</p>
        </div>
      )}

      {doc.nudges.filter((n) => !n.read).map((n) => (
        <div className="notice" key={n.id}>
          <strong>From Derek:</strong> {n.text}
          <div><button onClick={() => { update((d) => { const x = d.nudges.find((y) => y.id === n.id); if (x) x.read = true; }); toast('Noted.'); }}>Got it</button></div>
        </div>
      ))}


      {week12Done && !doc.week13Goal && (
        <div className="card gold-frame">
          <h3>{WEEK13.title}</h3>
          <p>{WEEK13.text}</p>
          <div className="row">
            {WEEK13.options.map((o) => (
              <button key={o} onClick={() => { update((d) => { d.week13Goal = o; d.week13PlanRequested = true; }); toast('Week 13 plan saved. Derek has your request.'); }}>{o}</button>
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

      {missedYesterday && (
        <p className="notice">Missed yesterday? No problem, do today's check-in, don't try to catch up.</p>
      )}

      <div className="card" id="today-checkin">
        <h3 style={{ margin: 0 }}>Daily check-in</h3>
        <p className="muted small">
          Recovery score from your last check-in: {lastCheckin ? `${rec}/100` : 'not set yet, log your first check-in below'}. Sleep 40, aches 25, energy 25, rest rhythm 10.
        </p>
        {lastCheckin && <p className="small"><strong>{vol.line}</strong></p>}
        <p className="small">Your daily check-in is in the app. Complete your tasks for the day, then log how it went here.</p>
        {lastLoggedLabel(doc.checkins) && <p className="small muted">{lastLoggedLabel(doc.checkins)}.</p>}
        <p className="small"><strong>{checkinPreferenceText(doc)}</strong></p>
        <label>How do you want to check in with Derek?</label>
        <div className="row">
          {([['text', 'Text check-in in the app'], ['live-call', 'Live video call with Derek']] as const).map(([v, label]) => (
            <button key={v} type="button" onClick={() => update((d) => { d.checkinMode = v; d.checkinFrequency = normalizeCheckinFrequency(v, d.checkinFrequency); })} style={doc.checkinMode === v ? { background: '#124571', color: '#fff' } : {}}>
              {label}
            </button>
          ))}
        </div>
        <p className="small muted">Daily check-in is in the app: you complete your tasks in the app, no call. Live video call with Derek, 30 minutes, up to once a week. Pick 1, 2, 3, or 4 a month. You request times in the app, Derek confirms the time and sends the call link, or you schedule it outside the app. The app itself does not do the video call. Recorded video is not a check-in type. It is only for form-check clips, in the assessment and attached to a message about form.</p>
        {doc.checkinMode === 'live-call' && (
          <>
            <label>How many video calls a month?</label>
            <p className="small muted">Video check-ins are 30 minutes each, at most once a week. Pick 1, 2, 3, or 4 a month.</p>
            <div className="row">
              {checkinFrequenciesForMode(doc.checkinMode).map(({ value: v, label }) => (
                <button key={v} type="button" onClick={() => update((d) => { d.checkinFrequency = v; })} style={doc.checkinFrequency === v ? { background: '#124571', color: '#fff' } : {}}>
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
        {doc.checkinMode === 'text' && (
          <p className="small muted">Daily only. Your check-in is in the app every day. There is nothing else to pick for text check-ins.</p>
        )}
        {loggedToday(doc.checkins) ? (
          <p className="small ok">Check-in logged today. Come back tomorrow for the next one.</p>
        ) : (
          <div>
            <label>Energy (1 to 10): {energy}</label>
            <input type="range" min={1} max={10} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} />
            <label>Soreness (1 to 10): {soreness}</label>
            <input type="range" min={1} max={10} value={soreness} onChange={(e) => setSoreness(Number(e.target.value))} />
            <label htmlFor="ci-note">Anything to tell Derek?</label>
            <input id="ci-note" value={checkinNote} onChange={(e) => setCheckinNote(e.target.value)} placeholder="Optional" />
            <p className="small muted">If you have sharp, new, or worsening pain, write it in the note and see a doctor or physical therapist.</p>
            <button
              className="primary"
              style={{ marginTop: 10 }}
              disabled={checkinBusy}
              onClick={() => {
                if (checkinBusy) return;
                setCheckinBusy(true);
                window.setTimeout(() => setCheckinBusy(false), 700);
                // One check-in a day earns XP. Tapping again tomorrow earns
                // again. Tapping twice today does not.
                // Sleep hours for the check-in come from last night's
                // logged sleep (Sleep tab), not a slider here: the sleep
                // slider moved to the Sleep tab. Default 7 until the
                // first sleep log.
                update((d) => {
                  d.checkins.push({ id: `c${Date.now()}`, date: new Date().toISOString(), energy, sleepHours: lastSleep?.hours ?? 7, soreness, note: checkinNote });
                  d.xp += met.has('hoot') ? 15 : 10;
                  d.mana = Math.min(10, d.mana + 1);
                });
                setCheckinNote('');
                setCheckinMsg('Check-in logged. +10 XP, and +1 mana for checking in.');
                toast(met.has('hoot') ? 'Check-in logged. +15 XP.' : 'Check-in logged. +10 XP.');
              }}
            >
              {checkinBusy ? 'Saving…' : `Log check-in (+10 XP${met.has('hoot') ? ', +5 from Hoot' : ''})`}
            </button>
            {checkinMsg && <p className="ok">{checkinMsg}</p>}
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
              disabled={questBusy}
              onClick={() => {
                if (questBusy) return;
                setQuestBusy(true);
                window.setTimeout(() => setQuestBusy(false), 700);
                // First daily quest of the day adds +1 mana, one attack
                // in Combat. Check before pushing, or the quest just
                // added would always make this look done already.
                const firstQuestToday = !loggedToday(doc.quests, 'food-quest') && !loggedToday(doc.quests, 'balance-quest');
                update((d) => {
                  d.quests.push({ id: `q${Date.now()}`, date: new Date().toISOString(), kind: 'balance-quest' });
                  d.xp += 15;
                  if (firstQuestToday) d.mana = Math.min(10, d.mana + 1);
                });
                toast('Balance quest done. +15 XP, +1 mana.');
              }}
            >
              {questBusy ? 'Saving…' : 'I did my 2-minute balance quest'}
            </button>
          );
        })()}
      </div>

      <div className="card">
        <h3>5-minute stretch</h3>
        <p className="small muted">Five minutes of easy stretching, from your corrective work or any stretch you know. Once a day, +1 attack in boss fights. {dailyUnlocked(doc, 'stretch') ? '' : `Unlocks at Level ${DAILY_UNLOCK_LEVELS.stretch}.`}</p>
        {(() => {
          const today = new Date().toISOString().slice(0, 10);
          const done = doc.quests.some((q) => q.kind === 'stretch-quest' && String(q.date).slice(0, 10) === today);
          if (done) return <p className="small ok">Done today. Stretch logged.</p>;
          if (!dailyUnlocked(doc, 'stretch')) {
            return (
              <button className="primary" disabled style={{ opacity: 0.5 }}>
                Unlocks at Level {DAILY_UNLOCK_LEVELS.stretch}
              </button>
            );
          }
          return (
            <button
              className="primary"
              disabled={questBusy}
              onClick={() => {
                if (questBusy) return;
                setQuestBusy(true);
                window.setTimeout(() => setQuestBusy(false), 700);
                update((d) => {
                  d.quests.push({ id: `q${Date.now()}`, date: new Date().toISOString(), kind: 'stretch-quest' });
                  d.mana = Math.min(10, d.mana + 1);
                });
                toast('Stretch done. +1 mana.');
              }}
            >
              {questBusy ? 'Saving…' : 'I did my 5-minute stretch (+1 mana)'}
            </button>
          );
        })()}
      </div>

      {doc.nutritionEnabled && (
        <div className="card">
          <h3>Today's food quest</h3>
          <p className="small muted">One small food step a day. No calorie counting, no tracking. Skip it any time.</p>
          {(() => {
            const quest = foodQuestForDate(new Date());
            const today = new Date().toISOString().slice(0, 10);
            const done = doc.quests.some((q) => (q as { kind?: string }).kind === 'food-quest' && String(q.date).slice(0, 10) === today);
            const skipped = doc.quests.some((q) => (q as { kind?: string }).kind === 'food-quest-skip' && String(q.date).slice(0, 10) === today);
            if (done) return <p className="small ok">Done today: {quest}.</p>;
            if (skipped) return <p className="small muted">Skipped today: {quest}. A new one comes tomorrow.</p>;
            return (
              <div>
                <p><strong>{quest}</strong></p>
                <div className="row">
                  <button
                    className="primary"
                    disabled={questBusy}
                    onClick={() => {
                      if (questBusy) return;
                      setQuestBusy(true);
                      window.setTimeout(() => setQuestBusy(false), 700);
                      const firstQuestToday = !loggedToday(doc.quests, 'food-quest') && !loggedToday(doc.quests, 'balance-quest');
                      update((d) => { d.quests.push({ id: `q${Date.now()}`, date: new Date().toISOString(), kind: 'food-quest', text: quest } as never); d.xp += 5; if (firstQuestToday) d.mana = Math.min(10, d.mana + 1); });
                      toast('Food quest done. +5 XP, +1 mana.');
                    }}
                  >
                    {questBusy ? 'Saving…' : 'I did it (+5 XP)'}
                  </button>
                  <button
                    onClick={() => {
                      update((d) => { d.quests.push({ id: `q${Date.now()}`, date: new Date().toISOString(), kind: 'food-quest-skip', text: quest } as never); });
                      toast('Skipped. A new food quest comes tomorrow.');
                    }}
                  >
                    Skip today
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

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

      {/* Sleep is logged in the Sleep tab now, not here. This card only
          shows last night and the recovery score, with a link there. */}
      <div className="card">
        <h3>Sleep and recovery</h3>
        <p className="muted small">Last night: {lastSleep?.hours ?? 'not logged yet'} hours. Recovery score: {lastCheckin ? `${rec}/100` : 'not set yet, log your first check-in above'}.</p>
        <button className="primary" onClick={() => go('health', 'sleep')}>Log sleep in Health</button>
      </div>

      <div className="card" id="today-messages">
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
        {/* Custom guardian emotes: one row of 6, your guardian's own face,
            not generic emoji. Tapping one sends it as a message to Derek,
            same +5 XP as a typed message. No custom upload. */}
        <div style={{ marginTop: 12 }}>
          <h4 style={{ margin: '0 0 4px' }}>Send a quick emote instead</h4>
          <p className="small muted">Your guardian's face, not a generic emoji. Tap one and it goes to Derek as a message.</p>
          <div className="row" style={{ gap: 6 }}>
            {EMOTES.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => sendEmote(e.id)}
                aria-label={`Send ${e.label} emote`}
                title={e.label}
                style={{ padding: 4, lineHeight: 0, minWidth: 0 }}
              >
                <GuardianEmote emote={e.id} guardian={doc.guardian} size={44} />
                <span style={{ display: 'block', fontSize: 11, lineHeight: '14px', marginTop: 2 }}>{e.label}</span>
              </button>
            ))}
          </div>
        </div>
        {met.has('quill') && <p className="small muted">Quill carries your message to Derek (+5 XP).</p>}
        {doc.messages.slice(0, 5).map((m) => (
          <div key={m.id} style={{ borderTop: '1px solid #d7e3ee', padding: '8px 0' }}>
            {m.emote && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <GuardianEmote emote={m.emote as never} guardian={doc.guardian} size={44} />
              </div>
            )}
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
        <p className="small muted">A live video call, not a recording. Each video check-in is 30 minutes, at most once a week. Derek replies within one business day to set a time and send the call link. The app itself does not do the video call.</p>
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

      <div className="card">
        <h3>Your plan</h3>
        <p>Phase {phase}: {phaseInfo?.name}. {phaseInfo?.description}</p>
        <p className="small muted">{phaseInfo?.why}</p>
        {nextWorkout && <p className="small">Next workout: {nextWorkout.title}, about {nextWorkout.minutes} minutes.</p>}
      </div>

      <div className="card">
        <h3>My goal</h3>
        {doc.goals.length > 0 && (
          <p className="small">Your main goal now: <strong>{doc.goals[0].label}</strong>{doc.goals[0].why ? `, ${doc.goals[0].why}` : ''}.</p>
        )}
        {doc.goals.length === 0 && <p className="small muted">No goal picked yet. Pick one here and it shapes your plan.</p>}
        <label htmlFor="today-goal">What is your main goal?</label>
        {/* No saved goal means no selection: the old code defaulted the
           dropdown to 'weight-loss', so it showed "Lose weight" as picked
           while the line above correctly said "No goal picked yet". */}
        <select id="today-goal" value={goalPick || doc.goals[0]?.type || ''} onChange={(e) => setGoalPick(e.target.value)}>
          <option value="" disabled>Pick a goal…</option>
          {GOAL_TYPES.map((g) => (
            <option key={g.id} value={g.id}>{g.label}</option>
          ))}
        </select>
        <label htmlFor="today-why">Why does it matter to you? (optional)</label>
        <input id="today-why" value={goalWhy} onChange={(e) => setGoalWhy(e.target.value)} placeholder="In your own words" />
        <button
          className="primary"
          style={{ marginTop: 10 }}
          onClick={() => {
            const type = goalPick || doc.goals[0]?.type || '';
            if (!type) {
              setGoalMsg('Pick a goal first, then save it.');
              toast('Pick a goal first, then save it.');
              return;
            }
            const gt = GOAL_TYPES.find((g) => g.id === type);
            update((d) => {
              d.goals = [{ type: type as never, label: gt?.label || 'My goal', why: goalWhy, started: new Date().toISOString() }];
              d.mainGoal = gt?.label || '';
            });
            setGoalMsg(`Goal saved: ${gt?.label || 'your goal'}.`);
            toast(`Goal saved: ${gt?.label || 'your goal'}.`);
            setGoalWhy('');
          }}
        >
          Save my goal
        </button>
        {goalMsg && <p className="ok">{goalMsg}</p>}
      </div>

      {/* Questions and settings used to be their own tab. They live here
          now, at the bottom of Today, closed behind one tap. */}
      <details className="card">
        <summary>
          <strong>Questions and settings</strong>
        </summary>
        <Faq ctx={ctx} />
      </details>
    </div>
  );
}
