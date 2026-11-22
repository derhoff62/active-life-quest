import { useState } from 'react';
import type { Ctx } from '../App';
import Switch from './Switch';
import { GOAL_TYPES, BADGES } from '../lib/data';
import { levelForXp, titleForLevel, metCompanionIds } from '../lib/store';

export default function Progress({ ctx }: { ctx: Ctx }) {
  const { doc, update } = ctx;
  const [waist, setWaist] = useState('');
  const [clothes, setClothes] = useState('');
  const [weigh, setWeigh] = useState('');
  const [cardioMin, setCardioMin] = useState('');
  const [showGoals, setShowGoals] = useState(true);

  const level = levelForXp(doc.xp);
  const cardioTotal = doc.cardio.reduce((s, c) => s + Number(c.minutes || 0), 0);
  const workoutsThisWeek = doc.workouts.filter((w) => {
    const d = new Date(String(w.date));
    return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const last = doc.workouts[doc.workouts.length - 1] as { title?: string; date?: string } | undefined;
  const lastSleep = doc.sleep[doc.sleep.length - 1] as { hours?: number } | undefined;
  const latestPr = doc.prs[doc.prs.length - 1];
  const latestMeasure = [...doc.measurements].reverse()[0] as { waist?: string; weight?: number } | undefined;

  // Simple month calendar: trained days this month
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const trained = new Set(doc.workouts.map((w) => new Date(String(w.date)).getDate()));
  const activeDays = new Set([
    ...doc.workouts.map((w) => new Date(String(w.date)).toDateString()),
    ...doc.checkins.map((w) => new Date(String(w.date)).toDateString()),
  ]);

  return (
    <div>
      <div className="card">
        <h2>Progress</h2>
        <p>Level {level} · {titleForLevel(level)} · {doc.xp} XP · Streak {doc.streakDays} days</p>
        <p>Workouts this week: {workoutsThisWeek} · Cardio logged: {cardioTotal} min · Check-ins: {doc.checkins.length}</p>
        {last && <p className="muted small">Last workout: {last.title} on {new Date(String(last.date)).toLocaleDateString()}.</p>}
        <div className="switch-row">
          <span><strong>Bigger text</strong></span>
          <Switch
            checked={doc.largeText}
            onChange={() => update((d) => { d.largeText = !d.largeText; })}
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
                borderRadius: 8, background: trained.has(day) ? '#124571' : '#eef5fb', color: trained.has(day) ? '#fff' : '#124571',
                fontSize: 12,
              }}
            >
              {day}
            </span>
          ))}
        </div>
        <p className="small muted">Navy days are days you trained. {activeDays.size} active days in total logged.</p>
      </div>

      <div className="card">
        <div className="row space">
          <h3 style={{ margin: 0 }}>Per-goal progress</h3>
          <button onClick={() => setShowGoals((v) => !v)}>{showGoals ? 'Hide' : 'Show'}</button>
        </div>
        {showGoals && doc.goals.length === 0 && <p className="muted">No goals yet. Pick one in the assessment or on Today.</p>}
        {showGoals && doc.goals.map((g, i) => {
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
                <p>Your numbers: {doc.prs.length} personal {doc.prs.length === 1 ? 'record' : 'records'}. {latestPr ? `Latest: ${latestPr.exercise}, ${latestPr.weight} lb x ${latestPr.reps}.` : 'Log a heavier weight or more reps than last time and it shows here.'}</p>
              )}
              {g.type === 'move-better' && (
                <p>Your numbers: {doc.retests.length} {doc.retests.length === 1 ? 'retest' : 'retests'} done. Balance baseline: {doc.balanceBaseline ? `${doc.balanceBaseline.left}s left, ${doc.balanceBaseline.right}s right.` : 'not set yet.'} Workouts finished: {doc.workouts.length}.</p>
              )}
              {g.type === 'balance' && (
                <p>Your numbers: balance baseline {doc.balanceBaseline ? `${doc.balanceBaseline.left}s left, ${doc.balanceBaseline.right}s right.` : 'not set yet. Do the assessment to set it.'} Next milestone: hold 30 seconds on each leg.</p>
              )}
              {g.type === 'cardio' && (
                <p>Your numbers: {cardioTotal} minutes of cardio logged. Target 150 to 300 minutes a week, Zone 2.</p>
              )}
              {g.type === 'consistency' && (
                <p>Your numbers: {workoutsThisWeek} {workoutsThisWeek === 1 ? 'workout' : 'workouts'} this week, {doc.checkins.length} check-ins, streak {doc.streakDays} {doc.streakDays === 1 ? 'day' : 'days'}.</p>
              )}
              {g.type === 'sleep' && (
                <p>Your numbers: last night {lastSleep?.hours ?? 'not logged yet'} hours of sleep. Sleep logs: {doc.sleep.length}. Recovery is part of training for every class.</p>
              )}
              {g.type === 'weight-loss' && (
                <p>Your numbers: {doc.measurements.length} measurements logged. {latestMeasure ? `Latest: ${latestMeasure.waist ? `waist ${latestMeasure.waist} in` : ''}${latestMeasure.waist && latestMeasure.weight ? ', ' : ''}${latestMeasure.weight ? `weight ${latestMeasure.weight} lb` : ''}.` : 'Log a waist measurement or weigh-in below to start the trend.'}</p>
              )}
              {g.type === 'own-words' && (
                <p>Your numbers: {doc.workouts.length} workouts finished, {doc.checkins.length} check-ins.</p>
              )}
              {g.type === 'endurance' && <p>Cardio this week: {cardioTotal} min of the 150 to 300 target. Milestones at 150, then 200, then 300.</p>}
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
            setWaist('');
            setClothes('');
          }}
        >
          Log measurement
        </button>
        <label htmlFor="p-weigh" style={{ marginTop: 14 }}>Optional once-a-week weigh-in (lb, same day and time)</label>
        <input id="p-weigh" inputMode="decimal" value={weigh} onChange={(e) => setWeigh(e.target.value)} placeholder="e.g. 188" />
        <button
          style={{ marginTop: 8 }}
          onClick={() => {
            if (!weigh) return;
            update((d) => {
              d.measurements.push({ id: `m${Date.now()}`, date: new Date().toISOString(), weight: Number(weigh), kind: 'weigh-in' });
            });
            setWeigh('');
          }}
        >
          Log weigh-in
        </button>
        {doc.measurements.slice(-5).reverse().map((m) => (
          <p key={m.id as string} className="small">
            {new Date(String(m.date)).toLocaleDateString()}: {m.waist ? `waist ${m.waist} in` : ''} {m.weight ? `weight ${m.weight} lb` : ''} {m.clothesFit ? `, ${m.clothesFit}` : ''}
          </p>
        ))}
        <p className="small muted">Progress photos are private to you and Derek. In this version, note the date you took one in a check-in message to Derek.</p>
      </div>

      <div className="card">
        <h3>Log cardio</h3>
        <div className="row">
          <input inputMode="numeric" value={cardioMin} onChange={(e) => setCardioMin(e.target.value)} placeholder="Minutes" style={{ maxWidth: 140 }} aria-label="Cardio minutes" />
          <button
            className="primary"
            onClick={() => {
              if (!cardioMin) return;
              update((d) => {
                d.cardio.push({ id: `k${Date.now()}`, date: new Date().toISOString(), minutes: Number(cardioMin), zone: 'Zone 2' });
                d.xp += metCompanionIds(doc).has('sylva') ? 15 : 10;
              });
              setCardioMin('');
            }}
          >
            Log cardio (+10 XP{metCompanionIds(doc).has('sylva') ? ', +5 from Sylva' : ''})
          </button>
        </div>
        <p className="small muted">Zone 2, easy enough to talk. High intensity counts double: log the doubled minutes.</p>
      </div>

      <div className="card">
        <h3>Badges</h3>
        <div className="row">
          {BADGES.map((b) => (
            <span key={b.id} className="pill" style={doc.badges.includes(b.id) ? {} : { opacity: 0.45 }}>
              {b.name}
            </span>
          ))}
        </div>
        <p className="small muted">Earned: {doc.badges.length} of {BADGES.length}. Tap a workout, check-in, or PR to earn more.</p>
      </div>

      <div className="card">
        <h3>Personal records</h3>
        {doc.prs.length === 0 && <p className="muted">No PRs yet. Log a heavier weight or more reps than last time and it counts here.</p>}
        {doc.prs.map((p, i) => (
          <p key={i}>{p.exercise}: {p.weight} lb x {p.reps} on {new Date(p.date).toLocaleDateString()}</p>
        ))}
      </div>
    </div>
  );
}
