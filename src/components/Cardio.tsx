// Cardio, its own tab: education, the one log form, and the trend.
// Logging used to live in Workouts, in Progress, and as an education
// card in Nutrition. Now it lives here only. Workouts and Progress
// link here instead, so there is no double-log confusion.
import { useState } from 'react';
import type { Ctx } from '../App';
import { HIIT } from '../lib/data';
import { metCompanionIds, loggedToday } from '../lib/store';
import { metricSeries, TrendChart } from './Metrics';

export default function Cardio({ ctx }: { ctx: Ctx }) {
  const { doc, update, toast, go } = ctx;
  const [cardioMin, setCardioMin] = useState('');
  const [cardioMsg, setCardioMsg] = useState('');
  const [cardioBusy, setCardioBusy] = useState(false);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const cardioThisWeek = (doc.cardio || [])
    .filter((c) => new Date(String(c.date)).getTime() >= weekAgo)
    .reduce((s, c) => s + Number(c.minutes || 0), 0);
  const cardioMilestone =
    cardioThisWeek >= 300 ? '300 minute milestone done'
    : cardioThisWeek >= 200 ? '200 done, next is 300'
    : cardioThisWeek >= 150 ? '150 done, next is 200'
    : 'Next milestone is 150';
  const points = metricSeries(doc, 'cardio');
  const recent = [...(doc.cardio || [])].reverse().slice(0, 5);

  function logCardio() {
    if (cardioBusy) return;
    const mins = Number(cardioMin);
    if (!cardioMin || Number.isNaN(mins) || mins <= 0 || mins > 600) {
      setCardioMsg('Enter minutes from 1 to 600.');
      return;
    }
    setCardioBusy(true);
    window.setTimeout(() => setCardioBusy(false), 700);
    // Minutes always count. XP is once a day: logging twice does not
    // earn twice.
    const xpToday = !loggedToday(doc.cardio);
    update((d) => {
      d.cardio.push({ id: `k${Date.now()}`, date: new Date().toISOString(), minutes: mins, zone: 'Zone 2' });
      if (xpToday) d.xp += metCompanionIds(doc).has('sylva') ? 15 : 10;
    });
    setCardioMsg(`Cardio logged: ${mins} minutes${xpToday ? ` (+10 XP${metCompanionIds(doc).has('sylva') ? ', +5 from Sylva' : ''})` : ' (already earned cardio XP today)'}.`);
    toast(`Cardio logged: ${mins} minutes${xpToday ? ', +10 XP' : ''}.`);
    setCardioMin('');
  }

  return (
    <div>
      <div className="card">
        <h2>Cardio</h2>
        <p>The best type of cardio is the one you stick to.</p>
        <p>Aim for 150 to 300 minutes a week of Zone 2, easy enough to talk.</p>
        <p>High intensity counts double: 20 minutes hard counts as 40.</p>
      </div>

      <div className="card">
        <h3>Log cardio</h3>
        <p><strong>{cardioThisWeek} of 150 to 300 minutes this week.</strong> {cardioMilestone}.</p>
        <div className="progress-bar"><div style={{ width: `${Math.min(100, (cardioThisWeek / 300) * 100)}%` }} /></div>
        <p className="small muted">Milestones at 150, then 200, then 300 minutes. Zone 2, easy enough to talk. High intensity counts double: log the doubled minutes.</p>
        <div className="row">
          <input inputMode="numeric" value={cardioMin} onChange={(e) => { setCardioMin(e.target.value); setCardioMsg(''); }} placeholder="Minutes" style={{ maxWidth: 140 }} aria-label="Cardio minutes" />
          <button className="primary" disabled={cardioBusy} onClick={logCardio}>
            {cardioBusy ? 'Saving…' : `Log cardio (+10 XP${metCompanionIds(doc).has('sylva') ? ', +5 from Sylva' : ''})`}
          </button>
        </div>
        {cardioMsg && <p className={cardioMsg.startsWith('Enter') ? 'error' : 'ok'}>{cardioMsg}</p>}
        {recent.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {recent.map((c) => (
              <p key={c.id} className="small" style={{ margin: '2px 0' }}>
                {new Date(String(c.date)).toLocaleDateString()}: {Number(c.minutes || 0)} min
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Your cardio trend</h3>
        {points.length === 0 ? (
          <p className="muted">No cardio logged yet. Log it above and the trend shows up here.</p>
        ) : (
          <>
            <p className="small">Last 7 days: {cardioThisWeek} minutes of the 150 to 300 target.</p>
            <TrendChart points={points} unit="min" />
          </>
        )}
        <p className="small muted">The full trend, with every metric, is in Progress, under Metrics.</p>
        <button onClick={() => go('progress')}>See Metrics in Progress</button>
      </div>

      <div className="card">
        <h3>High-intensity (HIIT) examples</h3>
        <ul className="nut-examples">
          {HIIT.examples.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
        <h4>Be careful with HIIT</h4>
        <ul className="nut-examples">
          {HIIT.precautions.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      </div>
    </div>
  );
}
