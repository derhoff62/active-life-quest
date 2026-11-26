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

  // Feedback for the sleep just logged, worked out from the entry
  // itself, so it is still there if the client comes back to this tab
  // later today (the form hides once sleep is logged today).
  // Hours are whole or half hours from the slider.
  const fmtH = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  const sleepEntries = doc.sleep || [];
  const todaySleep = loggedToday(sleepEntries)
    ? (sleepEntries[sleepEntries.length - 1] as { hours?: number })
    : null;
  const priorSleep = todaySleep ? sleepEntries.slice(0, -1) : [];
  const prevSleep = priorSleep.length
    ? (priorSleep[priorSleep.length - 1] as { hours?: number }).hours
    : undefined;
  const avgSleep =
    priorSleep.length >= 2
      ? priorSleep.slice(-7).reduce((sum, s) => sum + Number((s as { hours?: number }).hours ?? 0), 0) /
        Math.min(7, priorSleep.length)
      : null;
  // Feedback by hours logged, tied to the recovery and volume rules
  // already in the app: good trains as planned, a bit short means a
  // little easier, a short night means the short session or a Zone 2
  // walk and no PR attempt. No new volume rules, no medical claims.
  function sleepFeedback(hours: number): { short: string; line: string } {
    if (hours >= 7 && hours <= 9) {
      return {
        short: `${fmtH(hours)} hours, in range.`,
        line: `Good night. ${fmtH(hours)} hours is in the 7 to 9 hour range. Train as planned today.`,
      };
    }
    if (hours >= 6 && hours < 7) {
      return {
        short: `${fmtH(hours)} hours, a bit short.`,
        line: `A bit short. ${fmtH(hours)} hours is under the 7 to 9 hour range, so recovery will be a bit lower today. Take the next workout a little easier.`,
      };
    }
    if (hours < 6) {
      return {
        short: `${fmtH(hours)} hours, a short night.`,
        line: `Short night. ${fmtH(hours)} hours is well under the 7 to 9 hour range, so recovery is down today. Do the short session or a Zone 2 walk instead, no PR attempt today, and keep a steady bedtime.`,
      };
    }
    return {
      short: `${fmtH(hours)} hours, a long night.`,
      line: `Long night. ${fmtH(hours)} hours is over the 7 to 9 hour range. That is fine on its own. If you feel groggy, or you sleep this long most nights, tell Derek in a check-in.`,
    };
  }
  const feedback = todaySleep ? sleepFeedback(Number(todaySleep.hours ?? 0)) : null;
  const feedbackCompare: string[] = [];
  if (todaySleep && prevSleep !== undefined) {
    const diff = Number(todaySleep.hours ?? 0) - Number(prevSleep);
    if (diff > 0) feedbackCompare.push(`That is ${fmtH(diff)} hour${diff === 1 ? '' : 's'} more than last night.`);
    else if (diff < 0) feedbackCompare.push(`That is ${fmtH(-diff)} hour${-diff === 1 ? '' : 's'} less than last night.`);
    else feedbackCompare.push('That is the same as last night.');
  }
  if (todaySleep && avgSleep !== null) {
    const diff = Number(todaySleep.hours ?? 0) - avgSleep;
    if (diff < -0.25) feedbackCompare.push(`That is below your recent average of ${avgSleep.toFixed(1)} hours.`);
    else if (diff > 0.25) feedbackCompare.push(`That is above your recent average of ${avgSleep.toFixed(1)} hours.`);
    else feedbackCompare.push(`That is about your recent average of ${avgSleep.toFixed(1)} hours.`);
  }

  function logSleep() {
    if (sleepBusy) return;
    setSleepBusy(true);
    window.setTimeout(() => setSleepBusy(false), 700);
    const fb = sleepFeedback(sleepH);
    const xpText = met.has('mara') ? '+10 XP' : '+5 XP';
    update((d) => {
      d.sleep.push({ id: `s${Date.now()}`, date: new Date().toISOString(), hours: sleepH });
      d.xp += met.has('mara') ? 10 : 5;
      d.mana = Math.min(10, d.mana + 1);
    });
    setSleepMsg(`Sleep logged. ${xpText}, and +1 mana for resting well.`);
    toast(`Sleep logged. ${fb.short} ${xpText}`);
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
          <div>
            <p className="small ok">Sleep logged today. Log again tomorrow morning.</p>
            {sleepMsg && <p className="ok">{sleepMsg}</p>}
            {feedback && (
              <div>
                <p>{feedback.line}</p>
                {feedbackCompare.map((c) => (
                  <p key={c} className="small muted" style={{ margin: '2px 0' }}>{c}</p>
                ))}
                {lastCheckin && (
                  <p className="small muted">Your recovery score still shows your last check-in. Log tomorrow&apos;s check-in and this sleep will count in it.</p>
                )}
              </div>
            )}
          </div>
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
