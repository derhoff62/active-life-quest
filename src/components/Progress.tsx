import { useState } from 'react';
import type { Ctx } from '../App';
import * as api from '../lib/api';
import Metrics from './Metrics';
import Community from './Community';
import { GOAL_TYPES, BADGES } from '../lib/data';
import { cycleForWeek, nextRetestWeek, nextBossWeek, nextRetestLabel, nextBossLabel } from '../lib/yearPlan';
import { levelForXp, titleForLevel, daysInMonthSet, streakDaysForDoc, currentWeekForDoc, cardioCreditedSum, latestWorkout } from '../lib/store';
import BackToTop from './BackToTop';

// The full badge list lives in ./Badges.tsx now, shown on the Gear tab,
// so this tab only shows the count and a link there. Unlock logic in
// store.ts is untouched.
export default function Progress({ ctx }: { ctx: Ctx }) {
  const { doc, update, toast, go } = ctx;
  // Old accounts saved before a field existed have it as undefined.
  // App normalizes on load, but never crash this tab on a missing list.
  const workouts = doc.workouts || [];
  const cardioArr = doc.cardio || [];
  const checkins = doc.checkins || [];
  const sleepArr = doc.sleep || [];
  const prs = doc.prs || [];
  const measurements = doc.measurements || [];
  const badges = doc.badges || [];
  const goals = doc.goals || [];
  const progressPhotos = doc.progressPhotos || [];
  const retests = doc.retests || [];
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoNote, setPhotoNote] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMsg, setPhotoMsg] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [showGoals, setShowGoals] = useState(false);
  // History (Derek, Nov 25, 2026): latest PR and latest photo stay
  // visible, the full history hides behind Show more.
  const [showAllPrs, setShowAllPrs] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  const level = levelForXp(doc.xp);
  // Streak is worked out from the dates of workouts and check-ins, so it
  // can never sit at 0 forever the way the stored field did.
  const streak = streakDaysForDoc(doc);
  const cardioTotal = cardioCreditedSum(cardioArr);
  // Where you are: week in this stretch, and the stretch name. No totals.
  const yearWeek = currentWeekForDoc(doc);
  const { cycle: yearCycle, weekInCycle: yearWeekInCycle } = cycleForWeek(yearWeek);
  const yearDoneRetests = new Set(retests.map((r) => (r as { week?: number }).week || 0));
  const yearNextRetest = nextRetestWeek(yearWeek, yearDoneRetests);
  const yearBeatenBossWeeks = new Set(
    Object.entries(doc.bossHp || {}).filter(([, hp]) => hp <= 0).map(([id]) => Number(id.replace('boss-week-', ''))),
  );
  const yearNextBoss = nextBossWeek(yearWeek, yearBeatenBossWeeks);
  const yearWaists = measurements.map((m) => Number((m as { waist?: string }).waist || 0)).filter((w) => w > 0);
  const yearWaistChange = yearWaists.length >= 2 ? yearWaists[yearWaists.length - 1] - yearWaists[0] : null;
  const workoutsThisWeek = workouts.filter((w) => {
    const d = new Date(String(w.date));
    return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;
  // Latest workout by DATE, not insertion order: a backdated workout
  // logged later must not hide a newer one.
  const last = latestWorkout(doc) as { title?: string; date?: string } | undefined;
  // What changed since last week: this week vs the week before.
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const inRange = (arr: { date?: string }[], from: number, to: number) => arr.filter((x) => { const t = new Date(String(x.date)).getTime(); return t >= from && t < to; });
  const workoutsThisWk = inRange(workouts, nowMs - weekMs, nowMs).length;
  const workoutsLastWk = inRange(workouts, nowMs - 2 * weekMs, nowMs - weekMs).length;
  const cardioThisWk = cardioCreditedSum(cardioArr, nowMs - weekMs);
  const cardioLastWk = cardioCreditedSum(inRange(cardioArr, nowMs - 2 * weekMs, nowMs - weekMs) as never);
  const weighIns = measurements.filter((m) => (m as { kind?: string }).kind === 'weigh-in');
  const lastWeigh = weighIns.length ? Number((weighIns[weighIns.length - 1] as { weight?: number }).weight || 0) : null;
  const prevWeigh = weighIns.length >= 2 ? Number((weighIns[weighIns.length - 2] as { weight?: number }).weight || 0) : null;
  const waistVals = measurements.map((m) => Number((m as { waist?: string }).waist || 0)).filter((w) => w > 0);
  const lastWaist = waistVals.length ? waistVals[waistVals.length - 1] : null;
  const prevWaist = waistVals.length >= 2 ? waistVals[waistVals.length - 2] : null;
  const fmtDelta = (d: number, unit: string) => `${d > 0 ? '+' : ''}${d} ${unit}`;
  const changedParts: string[] = [
    `Workouts: ${workoutsThisWk} this week, ${workoutsLastWk} last week`,
    `Cardio: ${cardioThisWk} min this week, ${cardioLastWk} last week`,
  ];
  if (lastWeigh !== null && prevWeigh !== null && lastWeigh > 0 && prevWeigh > 0) changedParts.push(`Weight: ${fmtDelta(Math.round((lastWeigh - prevWeigh) * 10) / 10, 'lb')} since your last weigh-in`);
  if (lastWaist !== null && prevWaist !== null) changedParts.push(`Waist: ${fmtDelta(Math.round((lastWaist - prevWaist) * 10) / 10, 'in')} since your last measurement`);
  changedParts.push(`Streak: ${streak} ${streak === 1 ? 'day' : 'days'}`);
  const lastSleep = sleepArr[sleepArr.length - 1] as { hours?: number } | undefined;
  // Latest PR by DATE, not insertion order: a backdated PR logged
  // later must not hide a newer one. Ties keep the last inserted.
  const latestPr = prs.length ? prs.reduce((best, p) => (String(p.date || '').slice(0, 10) >= String(best.date || '').slice(0, 10) ? p : best), prs[0]) : undefined;
  const latestMeasure = [...measurements].reverse()[0] as { waist?: string; weight?: number } | undefined;

  // Simple month calendar: trained days this month. Only entries from
  // this month light up: a workout on the 15th last month must not light
  // up the 15th now.
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const trained = daysInMonthSet(workouts, now.getFullYear(), now.getMonth());
  const restDays = daysInMonthSet(
    doc.quests.filter((q) => (q as { kind?: string }).kind === 'rest-day'),
    now.getFullYear(),
    now.getMonth(),
  );
  const activeDays = new Set([
    ...workouts.map((w) => new Date(String(w.date)).toDateString()),
    ...checkins.map((w) => new Date(String(w.date)).toDateString()),
  ]);

  return (
    <div>
      <div className="card">
        <h2>Progress</h2>
        <p>Level {level} · {titleForLevel(level)} · {doc.xp} XP · Streak {streak} {streak === 1 ? 'day' : 'days'}</p>
        <p>Week {yearWeekInCycle} · {yearCycle.name} · {yearCycle.goal}</p>
        <p className="small">{nextRetestLabel(yearNextRetest)} {nextBossLabel(yearNextBoss)}</p>
        <p>Workouts this week: {workoutsThisWeek} · Cardio logged: {cardioTotal} min · Check-ins: {checkins.length}</p>
        <p className="small"><strong>What changed since last week:</strong> {changedParts.join(' · ')}.</p>
        <p className="small muted">Results so far: {prs.length} personal record{prs.length === 1 ? '' : 's'} · {cardioTotal.toLocaleString()} cardio minutes total{yearWaistChange !== null ? ` · Waist ${yearWaistChange > 0 ? '+' : ''}${yearWaistChange} in since your first measurement` : ''} · {badges.length} badges · {workouts.length} workouts total</p>
        {last && <p className="muted small">Last workout: {last.title} on {new Date(String(last.date)).toLocaleDateString()}.</p>}
      </div>

      <div className="card">
        <h3>This month</h3>
        <div className="row" style={{ gap: 4 }}>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
            <span
              key={day}
              style={{
                width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8,
                background: trained.has(day) ? '#124571' : restDays.has(day) ? '#1e7a46' : '#eef5fb',
                color: trained.has(day) || restDays.has(day) ? '#fff' : '#124571',
                fontSize: 12,
              }}
            >
              {day}
            </span>
          ))}
        </div>
        <p className="small muted">Navy days are days you trained, green days are active rest days. {activeDays.size} active days in total logged.</p>
      </div>

      {/* Community board: opt-in only, anonymous, ranked on showing up.
          No new tab, it lives here in Progress. */}
      <Community ctx={ctx} />

      <div className="card">
        <div className="row space">
          <h3 style={{ margin: 0 }}>Per-goal progress</h3>
          <button onClick={() => setShowGoals((v) => !v)}>{showGoals ? 'Hide' : 'Show'}</button>
        </div>
        {showGoals && goals.length === 0 && <p className="muted">No goals yet. Pick one in the assessment or on Today.</p>}
        {showGoals && goals.map((g, i) => {
          const info = GOAL_TYPES.find((x) => x.id === g.type);
          return (
            <details key={i} open>
              <summary>{g.label}</summary>
              <p>Started: {new Date(g.started).toLocaleDateString()}. Why: {g.why || 'not written yet'}.</p>
              <p><strong>What counts:</strong> {info?.measures || 'Workouts, cardio, check-ins, and sleep.'}</p>
              <p><strong>Next small milestone:</strong> {info?.nextMilestone || 'One more workout this week.'}</p>
              {/* Live numbers for this goal. Progress is driven by the goal,
                  never by the class, so any class can make progress on any goal. */}
              {g.type === 'stronger' && (
                <p>Your numbers: {prs.length} personal {prs.length === 1 ? 'record' : 'records'}. {latestPr ? `Latest: ${latestPr.exercise}, ${latestPr.weight} lb x ${latestPr.reps}.` : 'Log a heavier weight or more reps than last time and it shows here.'}</p>
              )}
              {g.type === 'move-better' && (
                <p>Your numbers: {retests.length} {retests.length === 1 ? 'retest' : 'retests'} done. Balance baseline: {doc.balanceBaseline ? `${doc.balanceBaseline.left}s left, ${doc.balanceBaseline.right}s right.` : 'not set yet.'} Workouts finished: {workouts.length}.</p>
              )}
              {g.type === 'balance' && (
                <p>Your numbers: balance baseline {doc.balanceBaseline ? `${doc.balanceBaseline.left}s left, ${doc.balanceBaseline.right}s right.` : 'not set yet. Do the assessment to set it.'} Next milestone: hold 30 seconds on each leg.</p>
              )}
              {g.type === 'cardio' && (
                <p>Your numbers: {cardioTotal} minutes of cardio logged. Target 150 to 300 minutes a week, Zone 2.</p>
              )}
              {g.type === 'consistency' && (
                <p>Your numbers: {workoutsThisWeek} {workoutsThisWeek === 1 ? 'workout' : 'workouts'} this week, {checkins.length} check-ins, streak {streak} {streak === 1 ? 'day' : 'days'}.</p>
              )}
              {g.type === 'sleep' && (
                <p>Your numbers: last night {lastSleep?.hours ?? 'not logged yet'} hours of sleep. Sleep logs: {sleepArr.length}. Recovery is part of training for every class.</p>
              )}
              {g.type === 'weight-loss' && (
                <p>Your numbers: {measurements.length} measurements logged. {latestMeasure ? `Latest: ${latestMeasure.waist ? `waist ${latestMeasure.waist} in` : ''}${latestMeasure.waist && latestMeasure.weight ? ', ' : ''}${latestMeasure.weight ? `weight ${latestMeasure.weight} lb` : ''}.` : 'Log a measurement or weigh-in in Metrics to start the trend.'}</p>
              )}
              {g.type === 'own-words' && (
                <p>Your numbers: {workouts.length} workouts finished, {checkins.length} check-ins.</p>
              )}
              {g.type === 'endurance' && <p>Cardio this week: {cardioTotal} min of the 150 to 300 target. Milestones at 150, then 200, then 300.</p>}
              {g.type === 'eat-better' && <p>Your numbers: Nutrition is {doc.nutritionEnabled ? 'on' : 'off'}. {checkins.length} check-ins logged. Protein at most meals, whole foods most of the time, and eat until satisfied, about 80 percent full.</p>}
              {g.type === 'weight-loss' && <p>Weight loss, the steady way: measurements, photos, strength, and how clothes fit first. The scale is last, once a week, same day and time, and only the trend over weeks matters.</p>}
            </details>
          );
        })}
      </div>

      {/* Metrics tracker: one metric at a time, with a trend line.
          Measurements (waist, chest, hips, arms, thighs) and the once-a-week
          weigh-in are logged here. The old waist-only form lived here. */}
      <Metrics doc={doc} update={update} toast={toast} />

      <div className="card">
        <h3>Progress photos (optional)</h3>
        <p className="small muted">Private photos, only you and Derek see them. Same day and time each week works best. Only with your okay first, and only if you turned social permission on in the assessment.</p>
        <label>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPhotoMsg('');
              setPhotoError('');
              if (!f) return;
              if (!f.type.startsWith('image/')) { setPhotoError('That file is not a photo. Pick an image file.'); return; }
              if (f.size > 10 * 1024 * 1024) { setPhotoError('That photo is over 10 MB. Pick a smaller one.'); return; }
              if (photoPreview) URL.revokeObjectURL(photoPreview);
              setPhotoFile(f);
              setPhotoPreview(URL.createObjectURL(f));
            }}
          />
          <span className="button-like">Pick a photo</span>
        </label>
        {photoPreview && photoFile && (
          <div style={{ marginTop: 10 }}>
            <img src={photoPreview} alt="Progress photo preview" style={{ width: '100%', maxHeight: 280, objectFit: 'contain' }} />
            <p className="small muted">{photoFile.name} · {(photoFile.size / 1024 / 1024).toFixed(1)} MB</p>
            <label htmlFor="photo-note">Note (optional)</label>
            <input id="photo-note" value={photoNote} onChange={(e) => setPhotoNote(e.target.value)} placeholder="e.g. Week 4, same shirt" />
            <div className="row" style={{ marginTop: 8 }}>
              <button
                className="primary"
                disabled={photoUploading}
                onClick={async () => {
                  if (!photoFile || photoUploading) return;
                  setPhotoUploading(true);
                  setPhotoMsg('');
                  setPhotoError('');
                  try {
                    const r = await api.uploadProgressPhoto(photoFile, photoNote);
                    update((d) => {
                      d.progressPhotos = [r.photo, ...(d.progressPhotos || [])];
                    });
                    setPhotoMsg('Photo uploaded. Derek can see it in Coach.');
                    toast('Photo uploaded. Derek can see it in Coach.');
                    if (photoPreview) URL.revokeObjectURL(photoPreview);
                    setPhotoPreview('');
                    setPhotoFile(null);
                    setPhotoNote('');
                  } catch (e) {
                    setPhotoError(e instanceof Error ? e.message : 'The photo could not be uploaded. Try again.');
                  } finally {
                    setPhotoUploading(false);
                  }
                }}
              >
                {photoUploading ? 'Uploading...' : 'Upload this photo'}
              </button>
              <button onClick={() => { if (photoPreview) URL.revokeObjectURL(photoPreview); setPhotoPreview(''); setPhotoFile(null); }}>Remove</button>
            </div>
          </div>
        )}
        {photoMsg && <p className="ok">{photoMsg}</p>}
        {photoError && <p className="error">{photoError}</p>}
        {progressPhotos.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <p className="small">{new Date(progressPhotos[0].date).toLocaleDateString()}{progressPhotos[0].note ? ` · ${progressPhotos[0].note}` : ''} · {(progressPhotos[0].sizeBytes / 1024 / 1024).toFixed(1)} MB</p>
            {showAllPhotos && progressPhotos.slice(1).map((ph) => (
              <p key={ph.id} className="small">{new Date(ph.date).toLocaleDateString()}{ph.note ? ` · ${ph.note}` : ''} · {(ph.sizeBytes / 1024 / 1024).toFixed(1)} MB</p>
            ))}
            {progressPhotos.length > 1 && (
              <button onClick={() => setShowAllPhotos((v) => !v)}>{showAllPhotos ? 'Hide photos' : 'Show all photos'}</button>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Badges</h3>
        <p><strong>{badges.length} of {BADGES.length} earned.</strong> The full list, and what to do to earn the rest, is on the Gear tab.</p>
        <div className="row">
          <button className="primary" onClick={() => go('gear')}>See badges</button>
          <button onClick={() => go('journey')}>See companions</button>
        </div>
      </div>

      <div className="card">
        <h3>Personal records</h3>
        {prs.length === 0 && <p className="muted">No PRs yet. Log a heavier weight or more reps than last time and it counts here.</p>}
        {prs.length > 0 && latestPr && (
          <p>{latestPr.exercise}: {latestPr.weight} lb x {latestPr.reps} on {new Date(latestPr.date).toLocaleDateString()}</p>
        )}
        {showAllPrs && [...prs].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(1).map((p, i) => (
          <p key={i}>{p.exercise}: {p.weight} lb x {p.reps} on {new Date(p.date).toLocaleDateString()}</p>
        ))}
        {prs.length > 1 && (
          <button onClick={() => setShowAllPrs((v) => !v)}>{showAllPrs ? 'Hide personal records' : 'Show all personal records'}</button>
        )}
      </div>
      <BackToTop />
    </div>
  );
}
