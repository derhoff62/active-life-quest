import { useState } from 'react';
import type { Ctx } from '../App';
import * as api from '../lib/api';
import Switch from './Switch';
import { GOAL_TYPES, BADGES } from '../lib/data';
import { levelForXp, titleForLevel, metCompanionIds, loggedToday, daysInMonthSet, streakDaysForDoc } from '../lib/store';

export default function Progress({ ctx }: { ctx: Ctx }) {
  const { doc, update, toast } = ctx;
  // Old accounts saved before a field existed have it as undefined.
  // App normalizes on load, but never crash this tab on a missing list.
  const workouts = doc.workouts || [];
  const cardioArr = doc.cardio || [];
  const checkins = doc.checkins || [];
  const sleepArr = doc.sleep || [];
  const prs = doc.prs || [];
  const measurements = doc.measurements || [];
  const stepsArr = doc.steps || [];
  const badges = doc.badges || [];
  const goals = doc.goals || [];
  const progressPhotos = doc.progressPhotos || [];
  const retests = doc.retests || [];
  const [waist, setWaist] = useState('');
  const [clothes, setClothes] = useState('');
  const [weigh, setWeigh] = useState('');
  const [cardioMin, setCardioMin] = useState('');
  const [stepsToday, setStepsToday] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoNote, setPhotoNote] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMsg, setPhotoMsg] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [showGoals, setShowGoals] = useState(true);
  const [cardioMsg, setCardioMsg] = useState('');
  const [weighMsg, setWeighMsg] = useState('');
  const [cardioBusy, setCardioBusy] = useState(false);

  const level = levelForXp(doc.xp);
  // Streak is worked out from the dates of workouts and check-ins, so it
  // can never sit at 0 forever the way the stored field did.
  const streak = streakDaysForDoc(doc);
  const cardioTotal = cardioArr.reduce((s, c) => s + Number(c.minutes || 0), 0);
  const workoutsThisWeek = workouts.filter((w) => {
    const d = new Date(String(w.date));
    return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const last = workouts[workouts.length - 1] as { title?: string; date?: string } | undefined;
  const lastSleep = sleepArr[sleepArr.length - 1] as { hours?: number } | undefined;
  const latestPr = prs[prs.length - 1];
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
        <p>Workouts this week: {workoutsThisWeek} · Cardio logged: {cardioTotal} min · Check-ins: {checkins.length}</p>
        {last && <p className="muted small">Last workout: {last.title} on {new Date(String(last.date)).toLocaleDateString()}.</p>}
        <div className="switch-row">
          <span><strong>Bigger text</strong></span>
          <Switch
            checked={doc.largeText}
            onChange={() => { update((d) => { d.largeText = !d.largeText; }); toast(doc.largeText ? 'Bigger text turned off.' : 'Bigger text turned on.'); }}
            label="Bigger text on or off"
            hint="Tap to turn bigger text on or off"
          />
        </div>
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
                <p>Your numbers: {measurements.length} measurements logged. {latestMeasure ? `Latest: ${latestMeasure.waist ? `waist ${latestMeasure.waist} in` : ''}${latestMeasure.waist && latestMeasure.weight ? ', ' : ''}${latestMeasure.weight ? `weight ${latestMeasure.weight} lb` : ''}.` : 'Log a waist measurement or weigh-in below to start the trend.'}</p>
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

      <div className="card">
        <h3>Weight loss, the steady way</h3>
        <p>Do not live on the scale. Weight swings a few pounds day to day with water, food, and sleep, and muscle gain can hide fat loss. Track measurements, photos, how clothes fit, and strength first.</p>
        <label htmlFor="p-waist">Waist (inches)</label>
        <input id="p-waist" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="e.g. 38.5" />
        <label htmlFor="p-clothes">How do clothes fit?</label>
        <input id="p-clothes" value={clothes} onChange={(e) => setClothes(e.target.value)} placeholder="e.g. Belt one notch tighter" />
        <button
          className="primary"
          style={{ marginTop: 10 }}
          onClick={() => {
            if (!waist && !clothes) return;
            update((d) => {
              d.measurements.push({ id: `m${Date.now()}`, date: new Date().toISOString(), waist: waist || undefined, clothesFit: clothes });
            });
            toast('Measurement logged.');
            setWaist('');
            setClothes('');
          }}
        >
          Log measurement
        </button>
        <label htmlFor="p-weigh" style={{ marginTop: 14 }}>Optional once-a-week weigh-in (lb, same day and time)</label>
        <input id="p-weigh" inputMode="decimal" value={weigh} onChange={(e) => { setWeigh(e.target.value); setWeighMsg(''); }} placeholder="e.g. 188" />
        <button
          style={{ marginTop: 8 }}
          onClick={() => {
            if (!weigh || Number.isNaN(Number(weigh)) || Number(weigh) <= 0) {
              setWeighMsg('Enter your weight in pounds.');
              return;
            }
            // Once a week, same day and time: a weigh-in in the last 6 days
            // is already this week's one.
            const sixDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000;
            const recent = measurements.some(
              (m) => (m as { kind?: string }).kind === 'weigh-in' && new Date(String(m.date)).getTime() >= sixDaysAgo,
            );
            if (recent) {
              setWeighMsg('You already weighed in this week. Same day and time next week, and only the trend over weeks matters.');
              return;
            }
            update((d) => {
              d.measurements.push({ id: `m${Date.now()}`, date: new Date().toISOString(), weight: Number(weigh), kind: 'weigh-in' });
            });
            setWeigh('');
            setWeighMsg('Weigh-in logged.');
            toast('Weigh-in logged.');
          }}
        >
          Log weigh-in
        </button>
        {weighMsg && <p className={weighMsg.startsWith('You already') || weighMsg.startsWith('Enter') ? 'error' : 'ok'}>{weighMsg}</p>}
        {measurements.slice(-5).reverse().map((m) => (
          <p key={m.id as string} className="small">
            {new Date(String(m.date)).toLocaleDateString()}: {m.waist ? `waist ${m.waist} in` : ''} {m.weight ? `weight ${m.weight} lb` : ''} {m.clothesFit ? `, ${m.clothesFit}` : ''}
          </p>
        ))}
        <p className="small muted">Progress photos are private to you and Derek. Upload one below and it shows in Coach.</p>
      </div>

      <div className="card">
        <h3>Log cardio</h3>
        <div className="row">
          <input inputMode="numeric" value={cardioMin} onChange={(e) => { setCardioMin(e.target.value); setCardioMsg(''); }} placeholder="Minutes" style={{ maxWidth: 140 }} aria-label="Cardio minutes" />
          <button
            className="primary"
            disabled={cardioBusy}
            onClick={() => {
              if (cardioBusy) return;
              const mins = Number(cardioMin);
              if (!cardioMin || Number.isNaN(mins) || mins <= 0 || mins > 600) {
                setCardioMsg('Enter minutes from 1 to 600.');
                return;
              }
              setCardioBusy(true);
              window.setTimeout(() => setCardioBusy(false), 700);
              const xpToday = !loggedToday(doc.cardio);
              update((d) => {
                d.cardio.push({ id: `k${Date.now()}`, date: new Date().toISOString(), minutes: mins, zone: 'Zone 2' });
                if (xpToday) d.xp += metCompanionIds(doc).has('sylva') ? 15 : 10;
              });
              setCardioMsg(`Cardio logged: ${mins} minutes${xpToday ? ` (+10 XP${metCompanionIds(doc).has('sylva') ? ', +5 from Sylva' : ''})` : ' (already earned cardio XP today)'}.`);
              toast(`Cardio logged: ${mins} minutes${xpToday ? ', +10 XP' : ''}.`);
              setCardioMin('');
            }}
          >
            {cardioBusy ? 'Saving…' : `Log cardio (+10 XP${metCompanionIds(doc).has('sylva') ? ', +5 from Sylva' : ''})`}
          </button>
        </div>
        {cardioMsg && <p className={cardioMsg.startsWith('Enter') ? 'error' : 'ok'}>{cardioMsg}</p>}
        <p className="small muted">Zone 2, easy enough to talk. High intensity counts double: log the doubled minutes.</p>
      </div>

      <div className="card">
        <h3>Steps (optional)</h3>
        <p className="small muted">Steps are optional. Log today's count if you track them.</p>
        <div className="row">
          <input inputMode="numeric" value={stepsToday} onChange={(e) => setStepsToday(e.target.value)} placeholder="Steps today" style={{ maxWidth: 140 }} aria-label="Steps today" />
          <button
            className="primary"
            onClick={() => {
              if (!stepsToday) return;
              update((d) => {
                d.steps.push({ id: `s${Date.now()}`, date: new Date().toISOString(), steps: Number(stepsToday) });
              });
              toast(`Steps logged: ${stepsToday}.`);
              setStepsToday('');
            }}
          >
            Log steps
          </button>
        </div>
        {stepsArr.length > 0 && (
          <p className="small">Last 7 days: {stepsArr.filter((s) => Date.now() - new Date(String(s.date)).getTime() < 7 * 24 * 60 * 60 * 1000).reduce((t, s) => t + Number((s as { steps?: number }).steps || 0), 0).toLocaleString()} steps.</p>
        )}
      </div>

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
            {progressPhotos.map((ph) => (
              <p key={ph.id} className="small">{new Date(ph.date).toLocaleDateString()}{ph.note ? ` · ${ph.note}` : ''} · {(ph.sizeBytes / 1024 / 1024).toFixed(1)} MB</p>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Badges</h3>
        {BADGES.map((b) => (
          <p key={b.id} className="small" style={{ margin: '6px 0', opacity: badges.includes(b.id) ? 1 : 0.55 }}>
            <strong>{badges.includes(b.id) ? '✓ ' : ''}{b.name}</strong> · {b.how}
          </p>
        ))}
        <p className="small muted">Earned: {badges.length} of {BADGES.length}. Tap a workout, check-in, or PR to earn more.</p>
      </div>

      <div className="card">
        <h3>Personal records</h3>
        {prs.length === 0 && <p className="muted">No PRs yet. Log a heavier weight or more reps than last time and it counts here.</p>}
        {prs.map((p, i) => (
          <p key={i}>{p.exercise}: {p.weight} lb x {p.reps} on {new Date(p.date).toLocaleDateString()}</p>
        ))}
      </div>
    </div>
  );
}
