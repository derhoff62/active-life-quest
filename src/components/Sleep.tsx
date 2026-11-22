// Sleep and recovery, its own tab: the recovery score, the one sleep
// log form, and the sleep trend. The sleep log used to live on Today.
// Now it lives here only. Today links here instead, so there is no
// double-log confusion. The daily check-in itself stays on Today: the
// recovery score is worked out from the last check-in you actually
// logged, not from the slider positions.
import { useState } from 'react';
import type { Ctx } from '../App';
import { metCompanionIds, loggedToday, recoveryScore, lastLoggedLabel } from '../lib/store';
import { metricSeries, TrendChart } from './Metrics';

export default function Sleep({ ctx }: { ctx: Ctx }) {
  const { doc, update, toast, go } = ctx;
  const [sleepH, setSleepH] = useState(7);
  const [sleepMsg, setSleepMsg] = useState('');
  const [sleepBusy, setSleepBusy] = useState(false);

  const lastSleep = (doc.sleep || [])[(doc.sleep || []).length - 1] as { hours?: number } | undefined;
  const lastCheckin = (doc.checkins || [])[(doc.checkins || []).length - 1] as { energy?: number; sleepHours?: number; soreness?: number } | undefined;
  // Recovery score comes from the last check-in you actually logged, not
  // from the slider positions. Until the first check-in, it uses last
  // night's sleep and a neutral middle for energy and soreness.
  const rec = recoveryScore(
    lastCheckin?.sleepHours ?? lastSleep?.hours ?? 7,
    lastCheckin?.soreness ?? 3,
    lastCheckin?.energy ?? 7,
    !!lastCheckin,
  );
  const points = metricSeries(doc, 'sleep');
  const recent = [...(doc.sleep || [])].reverse().slice(0, 5);
  const met = metCompanionIds(doc);

  function logSleep() {
    if (sleepBusy) return;
    setSleepBusy(true);
    window.setTimeout(() => setSleepBusy(false), 700);
    update((d) => {
      d.sleep.push({ id: `s${Date.now()}`, date: new Date().toISOString(), hours: sleepH });
      d.xp += met.has('mara') ? 10 : 5;
      d.mana = Math.min(10, d.mana + 1);
    });
    setSleepMsg('Sleep logged. +5 XP, and +1 mana for resting well.');
    toast(met.has('mara') ? 'Sleep logged. +10 XP.' : 'Sleep logged. +5 XP.');
  }

  return (
    <div>
      <div className="card">
        <h2>Sleep and recovery</h2>
        <p>Recovery is part of training. The gym gives the stimulus, recovery builds on it.</p>
        <p>
          Recovery score from your last check-in: {lastCheckin ? `${rec}/100` : 'not set yet, log your first check-in on Today'}. Sleep 40, aches 25, energy 25, rest rhythm 10.
        </p>
        <p className="small muted">Last night: {lastSleep?.hours ?? 'not logged yet'} hours. Most adults do best on 7 to 9 hours.</p>
        {lastLoggedLabel(doc.sleep) && <p className="small muted">{lastLoggedLabel(doc.sleep)}.</p>}
        {!lastCheckin && (
          <button onClick={() => go('today')}>Log today&apos;s check-in on Today</button>
        )}
      </div>

      <div className="card" id="log-sleep">
        <h3>Log sleep</h3>
        {loggedToday(doc.sleep) ? (
          <p className="small ok">Sleep logged today. Log again tomorrow morning.</p>
        ) : (
          <div>
            <label>Hours slept: {sleepH}</label>
            <input type="range" min={0} max={12} step={0.5} value={sleepH} onChange={(e) => setSleepH(Number(e.target.value))} />
            <button
              className="primary"
              style={{ marginTop: 10 }}
              disabled={sleepBusy}
              onClick={logSleep}
            >
              {sleepBusy ? 'Saving…' : `Log sleep (+5 XP${met.has('mara') ? ', +5 from Mara' : ''})`}
            </button>
            {sleepMsg && <p className="ok">{sleepMsg}</p>}
          </div>
        )}
        {recent.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {recent.map((s) => (
              <p key={s.id} className="small" style={{ margin: '2px 0' }}>
                {new Date(String(s.date)).toLocaleDateString()}: {Number((s as { hours?: number }).hours ?? 0)} hours
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Your sleep trend</h3>
        {points.length === 0 ? (
          <p className="muted">No sleep logged yet. Log it above and the trend shows up here.</p>
        ) : (
          <TrendChart points={points} unit="hours" />
        )}
        <p className="small muted">The full trend, with every metric, is in Progress, under Metrics.</p>
        <button onClick={() => go('progress')}>See Metrics in Progress</button>
      </div>

      <div className="card">
        <h3>Rest well</h3>
        <p>Keep a steady bedtime and wake time, even on rest days. A dark, cool room helps. A short walk and some stretching on a rest day beat doing nothing, and a hard workout the day after a bad night is better done easy, or skipped.</p>
        <p className="small muted">If sleep is a struggle most nights, or you snore heavily and wake up tired, tell Derek in a check-in. He can point you to the right next step.</p>
      </div>
    </div>
  );
}
