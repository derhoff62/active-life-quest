// Cardio, its own tab: education, the one log form, and the trend.
// Logging used to live in Workouts, in Progress, and as an education
// card in Nutrition. Now it lives here only. Workouts and Progress
// link here instead, so there is no double-log confusion.
//
// HIIT credit: the client logs ACTUAL minutes plus the intensity
// (Zone 2 or HIIT). High-intensity minutes count double in the weekly
// total automatically, so 20 hard minutes count as 40. Nobody has to
// do the doubling in their head any more.
import { useState } from 'react';
import type { Ctx } from '../App';
import { HIIT } from '../lib/data';
import { metCompanionIds, dayKeyOf, cardioCreditMinutes, lastLoggedLabel, todayDayKey, clampWorkoutDate, workoutDateIso, workoutDateRange } from '../lib/store';
import { cardioThisWeek } from '../lib/badges';
import { metricSeries, TrendChart } from './Metrics';

export default function Cardio({ ctx }: { ctx: Ctx }) {
  const { doc, update, toast, go } = ctx;
  const [cardioMin, setCardioMin] = useState('');
  const [cardioZone, setCardioZone] = useState<'Zone 2' | 'HIIT'>('Zone 2');
  const [cardioDate, setCardioDate] = useState(() => todayDayKey());
  const [cardioMsg, setCardioMsg] = useState('');
  const [cardioBusy, setCardioBusy] = useState(false);
  // Backdate preview, clamped to the same 7-day window as workouts.
  // Local today by default, never a future or older date.
  const dateRange = workoutDateRange();
  const pickedDay = clampWorkoutDate(cardioDate);
  const isPastDay = pickedDay !== todayDayKey();

  const weekTotal = cardioThisWeek(doc);
  const cardioMilestone =
    weekTotal >= 300 ? '300 minute milestone done'
    : weekTotal >= 200 ? '200 done, next is 300'
    : weekTotal >= 150 ? '150 done, next is 200'
    : 'Next milestone is 150';
  const points = metricSeries(doc, 'cardio');
  const recent = [...(doc.cardio || [])].reverse().slice(0, 5);
  const lastLogged = lastLoggedLabel(doc.cardio);

  function logCardio() {
    if (cardioBusy) return;
    const mins = Number(cardioMin);
    if (!cardioMin || Number.isNaN(mins) || mins <= 0 || mins > 600) {
      setCardioMsg('Enter minutes from 1 to 600.');
      return;
    }
    setCardioBusy(true);
    window.setTimeout(() => setCardioBusy(false), 700);
    // Minutes always count toward that week's total. XP and mana are
    // for today only, once a day: a backdated entry earns neither, so
    // logging a past day cannot farm XP, mana, or boss attacks. The
    // day key is compared, not just "today", so the first-log check
    // follows the picked day. Entries are stamped at midday UTC on
    // the picked day (same as workouts), so the weekly total, recent
    // list, and trend land on the right day.
    const chosenDay = clampWorkoutDate(cardioDate);
    const isToday = chosenDay === todayDayKey();
    const firstThatDay = !(doc.cardio || []).some((e) => dayKeyOf(e.date) === chosenDay);
    const earn = isToday && firstThatDay;
    const credited = cardioZone === 'HIIT' ? mins * 2 : mins;
    update((d) => {
      d.cardio.push({ id: `k${Date.now()}`, date: workoutDateIso(chosenDay), minutes: mins, zone: cardioZone });
      if (earn) d.xp += metCompanionIds(doc).has('sylva') ? 15 : 10;
      // First cardio log of the day also adds +1 mana, one attack in
      // Combat. Logging again today adds minutes, not mana, and a
      // past day adds minutes only.
      if (earn) d.mana = Math.min(10, d.mana + 1);
    });
    if (!isToday) {
      setCardioMsg(`Cardio logged for ${chosenDay}: ${mins} actual minutes (${cardioZone}) = ${credited} minutes toward that week. No XP or mana for a past day.`);
      toast(`Cardio logged for ${chosenDay}: ${mins} minutes${cardioZone === 'HIIT' ? ' HIIT, counts double' : ''}. No XP for a past day.`);
    } else {
      setCardioMsg(`Cardio logged: ${mins} actual minutes (${cardioZone}) = ${credited} minutes toward this week${earn ? ` (+10 XP${metCompanionIds(doc).has('sylva') ? ', +5 from Sylva' : ''}, +1 mana)` : ' (already earned cardio XP today)'}.`);
      toast(`Cardio logged: ${mins} minutes${cardioZone === 'HIIT' ? ' HIIT, counts double' : ''}${earn ? ', +10 XP, +1 mana' : ''}.`);
    }
    setCardioMin('');
  }

  return (
    <div>
      <div className="card">
        <h2>Cardio</h2>
        <p>The best type of cardio is the one you stick to.</p>
        <p>Aim for 150 to 300 minutes a week of Zone 2, easy enough to talk.</p>
        <p>High intensity counts double: 20 minutes hard counts as 40. Log your actual minutes and pick the intensity, the app does the doubling.</p>
      </div>

      <div className="card">
        <h3>What is Zone 2, and what is HIIT?</h3>
        <details>
          <summary>Zone 2: steady, easy effort</summary>
          <p>Zone 2 is steady cardio at an easy effort. You can talk in full sentences the whole time, and breathing through your nose still works. Brisk walking, easy cycling, and easy swimming all count.</p>
          <p>How to find it: use the talk test first. If you can talk in full sentences, you are in Zone 2. If you can only get out a few words, you are going too hard for Zone 2, slow down.</p>
          <p>Effort is about 4 or 5 out of 10. Heart rate is only a rough guide, see the heart rate section below for the numbers. The talk test matters more than the number.</p>
          <p>Heart rate: about 60 to 70 percent of your max heart rate (220 minus your age). Example, age 40: about 108 to 126 beats per minute.</p>
          <p>Target: 150 to 300 minutes a week in total. Short walks add up, ten minutes here and there still counts.</p>
        </details>
        <details>
          <summary>HIIT: short hard efforts, with rest between</summary>
          <p>HIIT is short hard efforts with easy rest between them. For example, 30 seconds hard, 90 seconds easy, repeat 4 to 6 times. During the hard part you should only manage a few words. During the easy part you should be able to talk in full sentences.</p>
          <p>Heart rate: hard efforts about 80 to 90 percent or more of your max heart rate (220 minus your age), easy recovery back down toward Zone 2. Example, age 40: hard about 144 to 162 or more, easy back to about 108 to 126.</p>
          <p>When to use it: only on non-strength days, or after a strength workout, 1 to 2 times a week at most, never every day. Always warm up for 5 minutes and cool down for 5 minutes.</p>
          <p>One HIIT minute counts double toward your weekly cardio total, so 10 hard minutes count as 20. Log your actual minutes and pick HIIT, the app does the doubling.</p>
          <p>Stop if you feel sharp, new, or worsening pain, chest pain, or dizziness. See a doctor or physical therapist about it. If a move hurts your joints, swap to a joint-friendly option or back to Zone 2 cardio.</p>
          <h4>Examples</h4>
          <ul className="nut-examples">
            {HIIT.examples.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
          <h4>Be careful with HIIT</h4>
          <ul className="nut-examples">
            {HIIT.precautions.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </details>
        <details>
          <summary>Find your zones with heart rate</summary>
          <p>First, estimate your max heart rate: 220 minus your age. It is a rough estimate, not exact. It is different for everyone, and a watch or monitor reading can be off.</p>
          <p>Zone 2 is roughly 60 to 70 percent of your max heart rate. Example, age 40: max is about 180, so Zone 2 is about 108 to 126 beats per minute.</p>
          <p>HIIT hard efforts are roughly 80 to 90 percent or more of your max heart rate, then easy recovery back down toward Zone 2. Example, age 40: hard is about 144 to 162 or more, then easy back to about 108 to 126.</p>
          <p>These numbers are rough guides only. If the number and the talk test disagree, trust the talk test. Zone 2 means you can talk in full sentences. A HIIT hard effort means you can only get out a few words. If you do not have a watch, use the talk test instead.</p>
        </details>
      </div>

      <div className="card" id="log-cardio">
        <h3>Log cardio</h3>
        <p><strong>{weekTotal} of 150 to 300 minutes this week.</strong> {cardioMilestone}.</p>
        <div className="progress-bar"><div style={{ width: `${Math.min(100, (weekTotal / 300) * 100)}%` }} /></div>
        <p className="small muted">Milestones at 150, then 200, then 300 minutes. Zone 2, easy enough to talk. High intensity counts double automatically: log your actual minutes and pick HIIT.</p>
        {lastLogged && <p className="small muted">{lastLogged}.</p>}
        <div className="row">
          <input inputMode="numeric" value={cardioMin} onChange={(e) => { setCardioMin(e.target.value); setCardioMsg(''); }} placeholder="Minutes" style={{ maxWidth: 140 }} aria-label="Cardio minutes" />
          <div className="row" role="group" aria-label="Cardio intensity">
            {(['Zone 2', 'HIIT'] as const).map((z) => (
              <button key={z} type="button" onClick={() => setCardioZone(z)} style={cardioZone === z ? { background: '#124571', color: '#fff' } : {}}>
                {z === 'HIIT' ? 'HIIT (counts double)' : 'Zone 2'}
              </button>
            ))}
          </div>
        </div>
        <p className="small muted">Log your actual minutes. {cardioZone === 'HIIT' ? 'HIIT counts double, so what you enter counts as twice as much toward the week.' : 'Zone 2 counts as logged.'}</p>
        <label htmlFor="cardio-date" style={{ margin: 0 }}>When did you do this cardio?</label>
        <input
          id="cardio-date"
          type="date"
          value={cardioDate}
          min={dateRange.min}
          max={dateRange.max}
          onChange={(e) => { setCardioDate(e.target.value); setCardioMsg(''); }}
          style={{ maxWidth: 170 }}
        />
        <p className="small muted" style={{ margin: 0 }}>Pick today, or up to 7 days ago if you forgot to log it. Minutes from a past day count toward that week, but XP and mana are for today only.</p>
        <button className="primary" disabled={cardioBusy} onClick={logCardio}>
          {cardioBusy ? 'Saving…' : isPastDay ? 'Log cardio (no XP, past day)' : `Log cardio (+10 XP${metCompanionIds(doc).has('sylva') ? ', +5 from Sylva' : ''})`}
        </button>
        {cardioMsg && <p className={cardioMsg.startsWith('Enter') ? 'error' : 'ok'}>{cardioMsg}</p>}
        {recent.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {recent.map((c) => {
              const credited = cardioCreditMinutes(c as { minutes?: unknown; zone?: unknown });
              return (
                <p key={c.id} className="small" style={{ margin: '2px 0' }}>
                  {new Date(String(c.date)).toLocaleDateString()}: {Number(c.minutes || 0)} min{(c as { zone?: string }).zone === 'HIIT' ? ` HIIT = ${credited} credited` : ''}
                </p>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Your cardio trend</h3>
        {points.length === 0 ? (
          <p className="muted">No cardio logged yet. Log it above and the trend shows up here.</p>
        ) : (
          <>
            <p className="small">Last 7 days: {weekTotal} minutes of the 150 to 300 target.</p>
            <TrendChart points={points} unit="min" />
          </>
        )}
        <p className="small muted">The full trend, with every metric, is in Progress, under Metrics.</p>
        <button onClick={() => go('progress')}>See Metrics in Progress</button>
      </div>

    </div>
  );
}
