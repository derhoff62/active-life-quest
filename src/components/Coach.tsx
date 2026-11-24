import { useEffect, useState } from 'react';
import type { Ctx } from '../App';
import * as api from '../lib/api';
import { CES_TEMPLATES } from '../lib/data';
import Metrics, { latestMetric, TrendChart, metricSeries } from './Metrics';
import type { ProfileDoc } from '../lib/store';
import { checkinPreferenceText, checkinFrequenciesForMode, normalizeCheckinFrequency, normalizeProfile, phaseForDoc, recoveryScoreForDoc, cardioCreditedSum, pendingRetests, applyRetestReview, hasCleanApprovedRetest, retestNextPhase } from '../lib/store';
import { weekLabel } from '../lib/yearPlan';
import { coachReminders, retestWeeksDue } from '../lib/coachReminders';
import GuardianEmote from './GuardianEmote';

interface ClientRow {
  id: string;
  email: string;
  displayName: string;
  data: ProfileDoc;
  updatedAt: string;
}

export default function Coach({ ctx }: { ctx: Ctx }) {
  const { doc, update, toast } = ctx;
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [firstSet, setFirstSet] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [selected, setSelected] = useState<ClientRow | null>(null);
  const [reply, setReply] = useState('');
  const [replyFor, setReplyFor] = useState('');
  const [nudge, setNudge] = useState('');
  const [betaInfo, setBetaInfo] = useState<{ code: string; uses: number; maxUses: number; expires: string } | null>(null);
  const [cesMarks, setCesMarks] = useState<string[]>([]);
  const [cesSides, setCesSides] = useState<Record<string, 'right' | 'left' | 'both'>>({});
  const [daviesR, setDaviesR] = useState('');
  const [daviesL, setDaviesL] = useState('');
  const [cesNotes, setCesNotes] = useState('');
  const [phase5Msg, setPhase5Msg] = useState('');
  const [retestMsg, setRetestMsg] = useState('');
  const [cesSaved, setCesSaved] = useState('');
  const [videoMsg, setVideoMsg] = useState('');
  const [nudgeMsg, setNudgeMsg] = useState('');
  const [callTime, setCallTime] = useState('');
  const [prefMsg, setPrefMsg] = useState('');
  const [callFor, setCallFor] = useState('');
  const [deleteVideoKey, setDeleteVideoKey] = useState('');
  const [newBetaCode, setNewBetaCode] = useState('');
  const [newBetaUses, setNewBetaUses] = useState('25');
  const [newBetaExpires, setNewBetaExpires] = useState('2027-02-19');
  const [betaMsg, setBetaMsg] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [strengthEx, setStrengthEx] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  // Busy key for server calls: the button shows "Saving…" / "Sending…"
  // and cannot be double-tapped while the request is in flight. Without
  // this a tap on a slow call looks dead, and a second tap double-saves.
  const [busy, setBusy] = useState('');
  async function withBusy(key: string, fn: () => Promise<void>) {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy('');
    }
  }

  useEffect(() => {
    if (unlocked && api.getMode() === 'server') {
      api.coachClients().then((r) => setClients(r.clients.map((c) => ({ ...c, data: normalizeProfile(c.data) })))).catch(() => undefined);
      api.coachSettings().then(setBetaInfo).catch(() => undefined);
    }
  }, [unlocked]);

  async function unlock() {
    setError('');
    if (api.getMode() === 'local') {
      // Local mode: PIN is stored on this device only.
      const stored = localStorage.getItem('alq-coach-pin');
      if (!stored) {
        if (!/^\d{4,8}$/.test(pin)) {
          setError('Pick a PIN of 4 to 8 digits.');
          return;
        }
        localStorage.setItem('alq-coach-pin', pin);
        setFirstSet(true);
        setUnlocked(true);
        return;
      }
      if (pin === stored) setUnlocked(true);
      else setError('That PIN did not work. Try again.');
      return;
    }
    try {
      const r = await api.coachUnlock(pin);
      setFirstSet(!!r.firstSet);
      setUnlocked(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That PIN did not work.');
    }
  }

  if (!unlocked) {
    return (
      <div className="card">
        <h2>Coach sign-in (Derek only)</h2>
        <p className="muted">Clients never see this tab. Enter your Coach PIN.</p>
        {firstSet && <div className="ok">PIN created. Keep it somewhere safe.</div>}
        {error && <div className="error">{error}</div>}
        <label htmlFor="coach-pin">Coach PIN (4 to 8 digits)</label>
        <input id="coach-pin" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={8} />
        <button className="primary" style={{ marginTop: 12, width: '100%' }} onClick={() => withBusy('unlock', unlock)} disabled={busy === 'unlock'}>
          {busy === 'unlock' ? 'Unlocking…' : 'Unlock Coach'}
        </button>
        <p className="small muted">First time here? Enter a new PIN and it becomes your Coach PIN.</p>
      </div>
    );
  }

  const localClients: ClientRow[] = api.getMode() === 'local'
    ? [{ id: 'local', email: doc.email, displayName: doc.displayName || 'This device', data: doc, updatedAt: doc.lastActive }]
    : clients;

  // Reminders engine: who needs Derek today, across all clients.
  const reminders = coachReminders(localClients);
  const alerts = reminders.map((r) => r.text);

  return (
    <div>
      <div className="card gold-frame">
        <h2>Coach dashboard</h2>
        <p><strong>Reminders — who needs you today</strong></p>
        <p>Needs you: {alerts.length} {alerts.length === 1 ? 'item' : 'items'}</p>
        {alerts.length === 0 && <p>Nothing needs you right now.</p>}
        {reminders.map((r, i) => <p key={i}>· {r.text}</p>)}
        {betaInfo && <p className="small muted">Beta code {betaInfo.code}: {betaInfo.uses} of {betaInfo.maxUses} uses, expires {betaInfo.expires}.</p>}
        {api.getMode() === 'server' && (
          <div className="card">
            <h4 style={{ margin: '0 0 4px' }}>Change the beta code</h4>
            <p className="small muted">Clients enter this code to unlock beta access. Changing it does not lock out clients who already unlocked.</p>
            <div className="grid2">
              <div>
                <label htmlFor="beta-code">New code</label>
                <input id="beta-code" value={newBetaCode} onChange={(e) => setNewBetaCode(e.target.value)} placeholder={betaInfo?.code || 'ACTIVEBETA'} autoCapitalize="characters" />
              </div>
              <div>
                <label htmlFor="beta-uses">Max uses</label>
                <input id="beta-uses" inputMode="numeric" value={newBetaUses} onChange={(e) => setNewBetaUses(e.target.value)} />
              </div>
              <div>
                <label htmlFor="beta-exp">Expires</label>
                <input id="beta-exp" type="date" value={newBetaExpires} onChange={(e) => setNewBetaExpires(e.target.value)} />
              </div>
            </div>
            <button
              className="primary"
              style={{ marginTop: 10 }}
              onClick={() => withBusy('beta', async () => {
                try {
                  await api.coachSetBeta(newBetaCode.trim().toUpperCase() || betaInfo?.code || 'ACTIVEBETA', Number(newBetaUses) || 25, newBetaExpires);
                  const s = await api.coachSettings();
                  setBetaInfo(s);
                  setBetaMsg('Beta code updated.');
                  toast('Beta code updated.');
                } catch {
                  setBetaMsg('That could not be saved. Check the code, uses, and expiry.');
                }
              })}
              disabled={busy === 'beta'}
            >
              {busy === 'beta' ? 'Saving…' : 'Save beta code'}
            </button>
            {betaMsg && <p className="ok">{betaMsg}</p>}
          </div>
        )}
        {api.getMode() === 'local' && (
          <p className="small muted">Local mode: only this device's client is visible here. Connect the Neon database to see all clients.</p>
        )}
        <button onClick={() => { api.coachLogout(); setUnlocked(false); setPin(''); }}>Lock Coach</button>
      </div>

      <div className="card">
        <h3>Clients ({localClients.length})</h3>
        {localClients.map((c) => (
          <div key={c.id} style={{ borderTop: '1px solid #d7e3ee', padding: '10px 0' }}>
            <p>
              <strong>{c.displayName || c.email}</strong> · {c.email} · Phase {phaseForDoc(c.data)} · {c.data.xp} XP · last active {new Date(c.updatedAt).toLocaleDateString()}
            </p>
            <p className="small muted">Check-ins: {checkinPreferenceText(c.data).replace('Your check-ins: ', '')}</p>
            <div className="row">
              <button onClick={() => { setSelected(c); setCesMarks(c.data.cesSheet?.marks || []); setCesSides(c.data.cesSheet?.sides || {}); setDaviesR(c.data.cesSheet?.davies?.right != null ? String(c.data.cesSheet.davies.right) : ''); setDaviesL(c.data.cesSheet?.davies?.left != null ? String(c.data.cesSheet.davies.left) : ''); setCesNotes(c.data.cesSheet?.notes || ''); setCesSaved(''); setPhase5Msg(''); setStrengthEx(''); }}>Open client</button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="card gold-frame">
          <h3>{selected.displayName || selected.email}</h3>
          <p>Phase {phaseForDoc(selected.data)} · Findings: {selected.data.assessment?.findings.join(', ') || 'none'} · Workouts: {selected.data.workouts.length} · Check-ins: {selected.data.checkins.length} · Cardio: {cardioCreditedSum(selected.data.cardio)} min</p>
          {(() => {
            const parts = [(selected.data.reminderEmail || '').trim(), (selected.data.reminderPhone || '').trim()].filter(Boolean);
            const emailOk = selected.data.reminderEmailOk === true;
            const textOk = selected.data.reminderTextOk === true;
            if (parts.length === 0 && !emailOk && !textOk) return <p className="small">Reminders: none given yet.</p>;
            return <p className="small">Reminders: {parts.length ? parts.join(' · ') : 'no contact given'} (email reminders: {emailOk ? 'on' : 'off'}, text reminders: {textOk ? 'on' : 'off'})</p>;
          })()}
          <p className="small"><strong>Check-in preference: {checkinPreferenceText(selected.data).replace('Your check-ins: ', '')}</strong></p>
          <div className="card">
            <h4 style={{ margin: '0 0 4px' }}>Change this client's check-ins</h4>
            <p className="small muted">Daily check-in is in the app, where the client completes their tasks. Live video calls are 30 minutes each, at most once a week. Pick 1, 2, 3, or 4 a month.</p>
            <label>Check-in type</label>
            <div className="row">
              {([['text', 'Text check-in in the app'], ['live-call', 'Live video call']] as const).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={async () => {
                    const freq = normalizeCheckinFrequency(v, selected.data.checkinFrequency);
                    try {
                      if (api.getMode() === 'server') await api.coachSetCheckinPreference(selected.id, v, freq);
                      if (api.getMode() === 'local') update((d) => { d.checkinMode = v; d.checkinFrequency = freq; });
                      const patch = (d: ProfileDoc) => ({ ...d, checkinMode: v, checkinFrequency: freq });
                      setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: patch(cl.data) } : cl)));
                      setSelected((prev) => (prev ? { ...prev, data: patch(prev.data) } : prev));
                      setPrefMsg('Check-in preference saved.');
                      toast('Check-in preference saved.');
                    } catch { setPrefMsg('That could not be saved. Try again.'); }
                  }}
                  style={selected.data.checkinMode === v ? { background: '#124571', color: '#fff' } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
            {selected.data.checkinMode === 'live-call' && (
              <>
                <label>How many video calls a month?</label>
                <p className="small muted">Video check-ins are 30 minutes each, at most once a week. Pick 1, 2, 3, or 4 a month.</p>
                <div className="row">
                  {checkinFrequenciesForMode(selected.data.checkinMode).map(({ value: v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={async () => {
                        try {
                          if (api.getMode() === 'server') await api.coachSetCheckinPreference(selected.id, selected.data.checkinMode || 'text', v);
                          if (api.getMode() === 'local') update((d) => { d.checkinFrequency = v; });
                          const patch = (d: ProfileDoc) => ({ ...d, checkinFrequency: v });
                          setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: patch(cl.data) } : cl)));
                          setSelected((prev) => (prev ? { ...prev, data: patch(prev.data) } : prev));
                          setPrefMsg('Check-in preference saved.');
                          toast('Check-in preference saved.');
                        } catch { setPrefMsg('That could not be saved. Try again.'); }
                      }}
                      style={selected.data.checkinFrequency === v ? { background: '#124571', color: '#fff' } : {}}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {selected.data.checkinMode === 'text' && (
              <p className="small muted">Daily only. The daily check-in is in the app every day. There is no other text frequency to pick.</p>
            )}
            {prefMsg && <p className="ok">{prefMsg}</p>}
          </div>

          <div className="card">
            <h4 style={{ margin: '0 0 4px' }}>Stats this week</h4>
            {(() => {
              const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
              const w = selected.data.workouts.filter((x) => new Date(String(x.date)).getTime() >= weekAgo).length;
              const cardio = selected.data.cardio.filter((x) => new Date(String(x.date)).getTime() >= weekAgo).reduce((t, x) => t + Number(x.minutes || 0), 0);
              const ci = selected.data.checkins.filter((x) => new Date(String(x.date)).getTime() >= weekAgo).length;
              const rows: [string, number, number][] = [
                ['Workouts', w, 3],
                ['Cardio minutes', cardio, 150],
                // Daily check-in means 7 in a week, not 3.
                ['Check-ins', ci, 7],
              ];
              return (
                <div>
                  <p className="small">XP: {selected.data.xp} · PRs: {selected.data.prs.length} · Badges: {selected.data.badges.length}</p>
                  {rows.map(([label, val, target]) => (
                    <div key={label} style={{ margin: '6px 0' }}>
                      <p className="small" style={{ margin: '2px 0' }}>{label}: {val} of {target}</p>
                      <div className="progress-bar"><div style={{ width: `${Math.min(100, (val / target) * 100)}%` }} /></div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="card">
            <h4 style={{ margin: '0 0 4px' }}>Stats and trends</h4>
            {(() => {
              const DAY = 24 * 60 * 60 * 1000;
              const nowMs = Date.now();
              const weekCounts: number[] = [];
              const cardioWeeks: number[] = [];
              for (let w = 3; w >= 0; w -= 1) {
                const from = nowMs - (w + 1) * 7 * DAY;
                const to = nowMs - w * 7 * DAY;
                weekCounts.push(selected.data.workouts.filter((x) => { const t = new Date(String(x.date)).getTime(); return t >= from && t < to; }).length);
                cardioWeeks.push(cardioCreditedSum(selected.data.cardio, from) - cardioCreditedSum(selected.data.cardio, to));
              }
              const ciWeek = selected.data.checkins.filter((x) => new Date(String(x.date)).getTime() >= nowMs - 7 * DAY).length;
              const rec = recoveryScoreForDoc(selected.data);
              const maxW = Math.max(1, ...weekCounts);
              const maxC = Math.max(150, ...cardioWeeks);
              const bar = (vals: number[], max: number, target?: number) => (
                <svg viewBox="0 0 340 120" width="100%" role="img" aria-label={`Bar chart, last 4 weeks: ${vals.join(', ')}`}>
                  {vals.map((v, i) => {
                    const h = Math.max(4, (v / max) * 90);
                    const x = 20 + i * 80;
                    return (
                      <g key={i}>
                        <rect x={x} y={100 - h} width={48} height={h} rx={4} fill="#124571" />
                        <text x={x + 24} y={94 - h} fontSize="12" fill="#124571" textAnchor="middle">{v}</text>
                        <text x={x + 24} y={114} fontSize="11" fill="#124571" textAnchor="middle">{i === 3 ? 'This week' : `${3 - i} wk ago`}</text>
                      </g>
                    );
                  })}
                  {target !== undefined && (
                    <line x1={10} y1={100 - (target / max) * 90} x2={330} y2={100 - (target / max) * 90} stroke="#c9a227" strokeWidth={2} strokeDasharray="5 4" />
                  )}
                </svg>
              );
              const exList = [...new Set((selected.data.prs || []).map((x) => x.exercise))].sort();
              const pickedEx = strengthEx || exList[0] || '';
              const strPoints = pickedEx ? metricSeries(selected.data, 'strength', pickedEx) : [];
              return (
                <div>
                  <p className="small">Check-ins this week: {ciWeek} of 7 · Recovery score: {rec !== null ? `${rec}/100` : 'no check-in yet'} · Retests due: {(() => { const due = retestWeeksDue(selected.data); return due.length ? due.map((w) => (w === 52 ? 'review' : `Week ${w}`)).join(', ') : 'none'; })()}</p>
                  <h5 style={{ margin: '10px 0 2px' }}>Workouts, last 4 weeks</h5>
                  {bar(weekCounts, maxW)}
                  <h5 style={{ margin: '10px 0 2px' }}>Cardio minutes, last 4 weeks (gold line: 150 target)</h5>
                  {bar(cardioWeeks, maxC, 150)}
                  <h5 style={{ margin: '10px 0 2px' }}>Strength trend per lift</h5>
                  {exList.length === 0 ? (
                    <p className="small muted">No personal records yet. A PR is logged when the client finishes a workout heavier, or with more reps, than last time.</p>
                  ) : (
                    <>
                      <label htmlFor="coach-strength-ex">Which lift?</label>
                      <select id="coach-strength-ex" value={pickedEx} onChange={(e) => setStrengthEx(e.target.value)}>
                        {exList.map((e) => <option key={e} value={e}>{e}</option>)}
                      </select>
                      <div style={{ marginTop: 8 }}>
                        <TrendChart points={strPoints} unit="lb" />
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Metrics tracker, read-only: the same numbers the client sees
              in Progress, with the same trend lines. Weight, waist, chest,
              hips, arms, thighs, strength per lift, sleep, steps, cardio. */}
          <div className="card">
            <h4 style={{ margin: '0 0 4px' }}>Metrics</h4>
            {(() => {
              const w = latestMetric(selected.data, 'weight');
              const waist = latestMetric(selected.data, 'waist');
              return (
                <p className="small">
                  Latest: {w ? `weight ${w.label}` : 'no weigh-in yet'}
                  {waist ? ` · waist ${waist.label}` : ''} · {selected.data.measurements.length} measurement entries · {selected.data.prs.length} PRs.
                </p>
              );
            })()}
            <Metrics doc={selected.data} />
          </div>

          <div className="card">
            <h4 style={{ margin: '0 0 4px' }}>Retests to review</h4>
            <p className="small muted">A client cannot always see their own imbalance, so no retest moves a phase until you review it. Approve a clean one and the phase, corrective steps and +20 XP apply. Not yet leaves the phase put. If you need to see the movement, ask for a form-check clip in Messages, or watch an assessment video below. Video: the client emails it to activelifepersonal@gmail.com – check there if you need to see the movement.</p>
            {pendingRetests(selected.data).length === 0 && (
              <p className="small"><strong>No retests waiting for review.</strong></p>
            )}
            {pendingRetests(selected.data).map((r) => {
              const w = Number((r as { week?: number }).week || 0);
              const balL = Number((r as { balanceLeftSec?: number }).balanceLeftSec || 0);
              const balR = Number((r as { balanceRightSec?: number }).balanceRightSec || 0);
              const base = selected.data.assessment;
              return (
                <div key={`${w}-${String(r.date)}`} style={{ borderTop: '1px solid #d7e3ee', padding: '8px 0' }}>
                  <p className="small" style={{ margin: '2px 0' }}><strong>{weekLabel(w)} retest</strong> · {new Date(String(r.date)).toLocaleDateString()}</p>
                  <p className="small" style={{ margin: '2px 0' }}>Balance: {balL}s left, {balR}s right{base && ((Number(base.balanceLeftSec || 0) > 0) || (Number(base.balanceRightSec || 0) > 0)) ? ` (was ${base.balanceLeftSec}s left, ${base.balanceRightSec}s right)` : ''}.</p>
                  <p className="small" style={{ margin: '2px 0' }}>Client said: {(r as { clean?: boolean }).clean ? 'I think my movement looks clean.' : 'I did not say my movement looks clean.'}</p>
                  <p className="small muted" style={{ margin: '2px 0' }}>Approving a clean one moves them to Phase {retestNextPhase(selected.data, w)}.</p>
                  <div className="row">
                    <button
                      className="primary"
                      disabled={busy === `retest-${w}`}
                      onClick={() => withBusy(`retest-${w}`, async () => {
                        try {
                          const clean = (r as { clean?: boolean }).clean === true;
                          if (api.getMode() === 'server') await api.coachReviewRetest(selected.id, w, true);
                          if (api.getMode() === 'local') update((d) => { applyRetestReview(d, w, true); });
                          const patch = (d: ProfileDoc) => { const next = JSON.parse(JSON.stringify(d)) as ProfileDoc; applyRetestReview(next, w, true); return next; };
                          setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: patch(cl.data) } : cl)));
                          setSelected((prev) => (prev ? { ...prev, data: patch(prev.data) } : prev));
                          setRetestMsg(clean ? `${weekLabel(w)} retest approved. Client moves to Phase ${retestNextPhase(selected.data, w)}. +20 XP.` : `${weekLabel(w)} retest approved. Client did not say clean, so the phase stays put.`);
                          toast('Retest approved.');
                        } catch { setRetestMsg('That could not be saved. Try again.'); }
                      })}
                    >
                      {busy === `retest-${w}` ? 'Saving…' : 'Approve'}
                    </button>
                    <button
                      disabled={busy === `retest-${w}`}
                      onClick={() => withBusy(`retest-${w}`, async () => {
                        try {
                          if (api.getMode() === 'server') await api.coachReviewRetest(selected.id, w, false);
                          if (api.getMode() === 'local') update((d) => { applyRetestReview(d, w, false); });
                          const patch = (d: ProfileDoc) => { const next = JSON.parse(JSON.stringify(d)) as ProfileDoc; applyRetestReview(next, w, false); return next; };
                          setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: patch(cl.data) } : cl)));
                          setSelected((prev) => (prev ? { ...prev, data: patch(prev.data) } : prev));
                          setRetestMsg(`${weekLabel(w)} retest marked not yet. Client stays in their phase until the next retest.`);
                          toast('Retest marked not yet.');
                        } catch { setRetestMsg('That could not be saved. Try again.'); }
                      })}
                    >
                      {busy === `retest-${w}` ? 'Saving…' : 'Not yet'}
                    </button>
                  </div>
                </div>
              );
            })}
            {retestMsg && <p className="ok">{retestMsg}</p>}
          </div>

          <div className="card">
            <h4 style={{ margin: '0 0 4px' }}>Phase 5 approval</h4>
            <p className="small muted">Phase 5 also needs a clean form retest. {hasCleanApprovedRetest(selected.data) ? 'This client has a clean approved retest.' : 'No clean approved retest yet.'}</p>
            <p className="small"><strong>{selected.data.phase5Approved ? 'Approved for Phase 5.' : 'Not approved for Phase 5.'}</strong></p>
            <div className="row">
              <button
                className="primary"
                disabled={busy === 'phase5'}
                onClick={() => withBusy('phase5', async () => {
                  try {
                    if (api.getMode() === 'server') await api.coachSetPhase5(selected.id, true);
                    if (api.getMode() === 'local') update((d) => { d.phase5Approved = true; });
                    const patch = (d: ProfileDoc) => ({ ...d, phase5Approved: true });
                    setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: patch(cl.data) } : cl)));
                    setSelected((prev) => (prev ? { ...prev, data: patch(prev.data) } : prev));
                    setPhase5Msg('Phase 5 approved. The client also needs a clean retest to open it.');
                    toast('Phase 5 approved.');
                  } catch { setPhase5Msg('That could not be saved. Try again.'); }
                })}
              >
                {busy === 'phase5' ? 'Saving…' : 'Approve Phase 5'}
              </button>
              <button
                disabled={busy === 'phase5'}
                onClick={() => withBusy('phase5', async () => {
                  try {
                    if (api.getMode() === 'server') await api.coachSetPhase5(selected.id, false);
                    if (api.getMode() === 'local') update((d) => { d.phase5Approved = false; });
                    const patch = (d: ProfileDoc) => ({ ...d, phase5Approved: false });
                    setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: patch(cl.data) } : cl)));
                    setSelected((prev) => (prev ? { ...prev, data: patch(prev.data) } : prev));
                    setPhase5Msg('Phase 5 approval removed.');
                    toast('Phase 5 approval removed.');
                  } catch { setPhase5Msg('That could not be saved. Try again.'); }
                })}
              >
                {busy === 'phase5' ? 'Saving…' : 'Remove approval'}
              </button>
            </div>
            {phase5Msg && <p className="ok">{phase5Msg}</p>}
          </div>

          <div className="card">
            <h4 style={{ margin: '0 0 4px' }}>Calorie calculator</h4>
            <p className="small muted">Off by default, no daily tracking. Turning it on shows this client a rough calorie estimate in Nutrition. It still needs their height, weight, and age from the assessment.</p>
            <p className="small"><strong>{selected.data.calorieCalcEnabled ? 'On for this client.' : 'Off for this client.'}</strong></p>
            <div className="row">
              <button
                className="primary"
                disabled={busy === 'calorie'}
                onClick={() => withBusy('calorie', async () => {
                  try {
                    if (api.getMode() === 'server') await api.coachSetCalorieCalc(selected.id, true);
                    if (api.getMode() === 'local') update((d) => { d.calorieCalcEnabled = true; });
                    const patch = (d: ProfileDoc) => ({ ...d, calorieCalcEnabled: true });
                    setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: patch(cl.data) } : cl)));
                    setSelected((prev) => (prev ? { ...prev, data: patch(prev.data) } : prev));
                    setPhase5Msg('Calorie calculator turned on for this client.');
                    toast('Calorie calculator turned on.');
                  } catch { setPhase5Msg('That could not be saved. Try again.'); }
                })}
              >
                {busy === 'calorie' ? 'Saving…' : 'Turn calculator on'}
              </button>
              <button
                disabled={busy === 'calorie'}
                onClick={() => withBusy('calorie', async () => {
                  try {
                    if (api.getMode() === 'server') await api.coachSetCalorieCalc(selected.id, false);
                    if (api.getMode() === 'local') update((d) => { d.calorieCalcEnabled = false; });
                    const patch = (d: ProfileDoc) => ({ ...d, calorieCalcEnabled: false });
                    setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: patch(cl.data) } : cl)));
                    setSelected((prev) => (prev ? { ...prev, data: patch(prev.data) } : prev));
                    setPhase5Msg('Calorie calculator turned off for this client.');
                    toast('Calorie calculator turned off.');
                  } catch { setPhase5Msg('That could not be saved. Try again.'); }
                })}
              >
                {busy === 'calorie' ? 'Saving…' : 'Turn calculator off'}
              </button>
            </div>
          </div>

          <div className="card">
            <h4 style={{ margin: '0 0 4px' }}>Reset this client's password</h4>
            <p className="small muted">No reset email is sent in beta. Make a one-time code here, send it to the client in a message, and they enter it on the sign-in screen under "Set a new password". It works for 1 hour, once.</p>
            {api.getMode() === 'server' ? (
              <>
                <button
                  className="primary"
                  disabled={busy === 'reset'}
                  onClick={() => withBusy('reset', async () => {
                    try {
                      const r = await api.coachResetToken(selected.id);
                      setResetToken(r.token);
                      setResetMsg('Code made. Send it to the client. It works for 1 hour, once.');
                      toast('Reset code made.');
                    } catch {
                      setResetMsg('That could not be made. Try again.');
                    }
                  })}
                >
                  {busy === 'reset' ? 'Making a code…' : 'Make a reset code'}
                </button>
                {resetToken && <p className="notice" style={{ wordBreak: 'break-all' }}>Reset code: <strong>{resetToken}</strong></p>}
                {resetMsg && <p className="ok">{resetMsg}</p>}
              </>
            ) : (
              <p className="small muted">Reset codes need the live app with the database connected.</p>
            )}
          </div>

          <h3>Assessment videos</h3>
          {(selected.data.assessmentVideos || []).length === 0 && (
            <p className="muted">No assessment videos from this client yet. Filming is optional.</p>
          )}
          {(selected.data.assessmentVideos || []).map((v) => (
            <div key={v.id} style={{ borderTop: '1px solid #d7e3ee', padding: '8px 0' }}>
              <p>
                <strong>{v.label}</strong> · Week {v.week} · {new Date(v.date).toLocaleDateString()} · {(v.sizeBytes / 1024 / 1024).toFixed(1)} MB
              </p>
              {api.getMode() === 'server' ? (
                <video src={api.coachVideoUrl(selected.id, v.key)} controls style={{ width: '100%', maxHeight: 280 }} />
              ) : (
                <p className="small muted">Video playback needs the live app with video storage set up.</p>
              )}
              <div className="row" style={{ marginTop: 8 }}>
                {deleteVideoKey === v.key ? (
                  <span>
                    Delete this video?{' '}
                    <button
                      className="primary"
                      onClick={async () => {
                        try {
                          if (api.getMode() === 'server') await api.coachDeleteVideo(selected.id, v.key);
                          setClients((prev) => prev.map((c) => (c.id === selected.id ? { ...c, data: { ...c.data, assessmentVideos: (c.data.assessmentVideos || []).filter((x) => x.key !== v.key) } } : c)));
                          setSelected((prev) => (prev ? { ...prev, data: { ...prev.data, assessmentVideos: (prev.data.assessmentVideos || []).filter((x) => x.key !== v.key) } } : prev));
                          setVideoMsg('Video deleted.');
                        } catch {
                          setVideoMsg('That video could not be deleted. Try again.');
                        }
                        setDeleteVideoKey('');
                      }}
                    >
                      Yes, delete
                    </button>{' '}
                    <button onClick={() => setDeleteVideoKey('')}>Cancel</button>
                  </span>
                ) : (
                  <button onClick={() => setDeleteVideoKey(v.key)}>Delete video</button>
                )}
              </div>
            </div>
          ))}
          {videoMsg && <p className="ok">{videoMsg}</p>}

          <h3>Check-in videos</h3>
          {selected.data.checkins.filter((c) => (c as { video?: { key: string } }).video).length === 0 && (
            <p className="muted">No check-in videos from this client yet.</p>
          )}
          {selected.data.checkins.filter((c) => (c as { video?: { key: string } }).video).map((c) => {
            const v = (c as unknown as { video: { id: string; key: string; label: string; date: string; sizeBytes: number } }).video;
            return (
              <div key={c.id} style={{ borderTop: '1px solid #d7e3ee', padding: '8px 0' }}>
                <p><strong>{v.label}</strong> · {new Date(c.date).toLocaleDateString()} · {(v.sizeBytes / 1024 / 1024).toFixed(1)} MB</p>
                {api.getMode() === 'server' ? (
                  <video src={api.coachCheckinVideoUrl(selected.id, v.key)} controls style={{ width: '100%', maxHeight: 280 }} />
                ) : (
                  <p className="small muted">Video playback needs the live app with video storage set up.</p>
                )}
                <div className="row" style={{ marginTop: 8 }}>
                  {deleteVideoKey === v.key ? (
                    <span>
                      Delete this video?{' '}
                      <button className="primary" onClick={async () => {
                        try {
                          if (api.getMode() === 'server') await api.coachDeleteCheckinVideo(selected.id, v.key);
                          const strip = (arr: unknown[]) => (arr as { video?: { key: string } }[]).map((x) => (x.video && x.video.key === v.key ? { ...x, video: undefined } : x)) as never;
                          setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: { ...cl.data, checkins: strip(cl.data.checkins as never), messages: strip(cl.data.messages as never) } } : cl)));
                          setSelected((prev) => (prev ? { ...prev, data: { ...prev.data, checkins: strip(prev.data.checkins as never), messages: strip(prev.data.messages as never) } } : prev));
                          setVideoMsg('Video deleted.');
                        } catch { setVideoMsg('That video could not be deleted. Try again.'); }
                        setDeleteVideoKey('');
                      }}>Yes, delete</button>{' '}
                      <button onClick={() => setDeleteVideoKey('')}>Cancel</button>
                    </span>
                  ) : (
                    <button onClick={() => setDeleteVideoKey(v.key)}>Delete video</button>
                  )}
                </div>
              </div>
            );
          })}

          <h3>Progress photos</h3>
          {(selected.data.progressPhotos || []).length === 0 && (
            <p className="muted">No progress photos from this client yet.</p>
          )}
          {(selected.data.progressPhotos || []).map((ph) => (
            <div key={ph.id} style={{ borderTop: '1px solid #d7e3ee', padding: '8px 0' }}>
              <p><strong>{new Date(ph.date).toLocaleDateString()}</strong>{ph.note ? ` · ${ph.note}` : ''} · {(ph.sizeBytes / 1024 / 1024).toFixed(1)} MB</p>
              {api.getMode() === 'server' ? (
                <img src={api.coachPhotoUrl(selected.id, ph.key)} alt={`Progress photo ${new Date(ph.date).toLocaleDateString()}`} style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }} />
              ) : (
                <p className="small muted">Photo viewing needs the live app with photo storage set up.</p>
              )}
              <div className="row" style={{ marginTop: 8 }}>
                {deleteVideoKey === ph.key ? (
                  <span>
                    Delete this photo?{' '}
                    <button className="primary" onClick={async () => {
                      try {
                        if (api.getMode() === 'server') await api.coachDeletePhoto(selected.id, ph.key);
                        setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: { ...cl.data, progressPhotos: (cl.data.progressPhotos || []).filter((x) => x.key !== ph.key) } } : cl)));
                        setSelected((prev) => (prev ? { ...prev, data: { ...prev.data, progressPhotos: (prev.data.progressPhotos || []).filter((x) => x.key !== ph.key) } } : prev));
                        setVideoMsg('Photo deleted.');
                      } catch { setVideoMsg('That photo could not be deleted. Try again.'); }
                      setDeleteVideoKey('');
                    }}>Yes, delete</button>{' '}
                    <button onClick={() => setDeleteVideoKey('')}>Cancel</button>
                  </span>
                ) : (
                  <button onClick={() => setDeleteVideoKey(ph.key)}>Delete photo</button>
                )}
              </div>
            </div>
          ))}

          <h3>Messages and questions</h3>
          {selected.data.messages.length === 0 && <p className="muted">No messages yet.</p>}
          {selected.data.messages.map((m) => (
            <div key={m.id} style={{ borderTop: '1px solid #d7e3ee', padding: '8px 0' }}>
              {m.emote && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <GuardianEmote emote={m.emote as never} guardian={selected.data.guardian} size={44} />
                </div>
              )}
              <p><strong>{m.kind === 'video-call-request' ? 'Video call request' : m.kind}:</strong> {m.body}</p>
              {m.kind === 'video-call-request' && m.callStatus === 'confirmed' && m.callTime && <p className="ok">Confirmed: {m.callTime}</p>}
              {m.video && api.getMode() === 'server' && (
                <video src={api.coachCheckinVideoUrl(selected.id, m.video.key)} controls style={{ width: '100%', maxHeight: 280 }} />
              )}
              {m.video && api.getMode() !== 'server' && <p className="small muted">Video attached ({(m.video.sizeBytes / 1024 / 1024).toFixed(1)} MB). Playback needs the live app with video storage set up.</p>}
              {m.video && (
                <div className="row" style={{ marginTop: 4 }}>
                  {deleteVideoKey === `msg-${m.id}` ? (
                    <span>
                      Delete this video?{' '}
                      <button
                        className="primary"
                        onClick={async () => {
                          try {
                            if (api.getMode() === 'server') await api.coachDeleteCheckinVideo(selected.id, m.video!.key);
                            setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: { ...cl.data, messages: cl.data.messages.map((x) => (x.id === m.id ? { ...x, video: undefined } : x)) } } : cl)));
                            setSelected((prev) => (prev ? { ...prev, data: { ...prev.data, messages: prev.data.messages.map((x) => (x.id === m.id ? { ...x, video: undefined } : x)) } } : prev));
                            setVideoMsg('Video deleted.');
                          } catch { setVideoMsg('That video could not be deleted. Try again.'); }
                          setDeleteVideoKey('');
                        }}
                      >
                        Yes, delete
                      </button>{' '}
                      <button onClick={() => setDeleteVideoKey('')}>Cancel</button>
                    </span>
                  ) : (
                    <button onClick={() => setDeleteVideoKey(`msg-${m.id}`)}>Delete this video</button>
                  )}
                </div>
              )}
              {m.kind === 'video-call-request' && m.callStatus !== 'confirmed' && (
                <div className="row" style={{ marginTop: 8 }}>
                  <input value={callFor === m.id ? callTime : ''} onChange={(e) => { setCallFor(m.id); setCallTime(e.target.value); }} placeholder="e.g. Tue Nov 24 at 10:00 AM" />
                  <button
                    className="primary"
                    disabled={busy === 'call'}
                    onClick={() => withBusy('call', async () => {
                      if (!callTime.trim()) return;
                      if (api.getMode() === 'server') await api.coachReply(selected.id, m.id, `Video call confirmed for ${callTime.trim()}. I will send the call link before then.`);
                      if (api.getMode() === 'local') {
                        update((d) => {
                          const x = d.messages.find((y) => y.id === m.id);
                          if (x) { x.callStatus = 'confirmed'; x.callTime = callTime.trim(); x.coachReply = `Video call confirmed for ${callTime.trim()}. I will send the call link before then.`; }
                        });
                      }
                      const patch = (arr: typeof selected.data.messages) => arr.map((x) => (x.id === m.id ? { ...x, callStatus: 'confirmed' as const, callTime: callTime.trim(), coachReply: `Video call confirmed for ${callTime.trim()}. I will send the call link before then.` } : x));
                      setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: { ...cl.data, messages: patch(cl.data.messages) } } : cl)));
                      setSelected((prev) => (prev ? { ...prev, data: { ...prev.data, messages: patch(prev.data.messages) } } : prev));
                      setCallTime('');
                      setCallFor('');
                      toast('Video call confirmed.');
                    })}
                  >
                    {busy === 'call' ? 'Confirming…' : 'Confirm this call'}
                  </button>
                </div>
              )}
              {m.coachReply ? <p className="ok">You replied: {m.coachReply}</p> : (
                <div className="row">
                  <input value={replyFor === m.id ? reply : ''} onChange={(e) => { setReplyFor(m.id); setReply(e.target.value); }} placeholder="Reply to this client" />
                  <button
                    className="primary"
                    disabled={busy === 'reply'}
                    onClick={() => withBusy('reply', async () => {
                      if (!reply.trim()) return;
                      if (api.getMode() === 'server') await api.coachReply(selected.id, m.id, reply.trim());
                      if (api.getMode() === 'local') {
                        update((d) => {
                          const x = d.messages.find((y) => y.id === m.id);
                          if (x) { x.coachReply = reply.trim(); x.repliedAt = new Date().toISOString(); }
                        });
                      }
                      setClients((prev) => prev.map((c) => (c.id === selected.id ? { ...c, data: { ...c.data, messages: c.data.messages.map((x) => (x.id === m.id ? { ...x, coachReply: reply.trim(), repliedAt: new Date().toISOString() } : x)) } } : c)));
                      setReply('');
                      setReplyFor('');
                      toast('Reply sent.');
                    })}
                  >
                    {busy === 'reply' ? 'Sending…' : 'Send reply'}
                  </button>
                </div>
              )}
            </div>
          ))}

          <h3 style={{ marginTop: 16 }}>Send a nudge</h3>
          <div className="row">
            <input value={nudge} onChange={(e) => setNudge(e.target.value)} placeholder="e.g. Nice work this week, keep the streak going" />
            <button
              disabled={busy === 'nudge'}
              onClick={() => withBusy('nudge', async () => {
                if (!nudge.trim()) return;
                if (api.getMode() === 'server') await api.coachNudge(selected.id, nudge.trim());
                if (api.getMode() === 'local') {
                  update((d) => {
                    d.nudges.push({ id: `n${Date.now()}`, text: nudge.trim(), date: new Date().toISOString(), read: false });
                  });
                }
                setNudge('');
                setNudgeMsg('Nudge sent. It shows on the client Today screen.');
                toast('Nudge sent.');
              })}
            >
              {busy === 'nudge' ? 'Sending…' : 'Send nudge'}
            </button>
          </div>
          {nudgeMsg && <p className="ok">{nudgeMsg}</p>}

          {(selected.data.exerciseFeedback || []).length > 0 && (
            <div className="card">
              <h4 style={{ margin: '0 0 4px' }}>Moves the client flagged</h4>
              {selected.data.exerciseFeedback.map((fb, i) => (
                <p key={i} className="small" style={{ margin: '4px 0' }}>
                  <strong>{fb.exerciseName}</strong> · {fb.kind === 'hurts' ? 'This hurts' : "Doesn't like it"} · {fb.reason === 'too-hard' ? 'too hard' : fb.reason === 'hurts' ? 'hurts' : fb.reason === 'no-equipment' ? 'no equipment' : "doesn't like it"} · {new Date(fb.date).toLocaleDateString()}
                  {fb.kind === 'hurts' && <span style={{ color: '#a11', fontWeight: 700 }}> · PAIN FLAG: check in before it is swapped again.</span>}
                </p>
              ))}
            </div>
          )}

          <h3 style={{ marginTop: 16 }}>CES assessment check sheet</h3>
          <p className="small muted">Coach only. Mark what you see, add notes, save it to the client file. Never a required client self-assessment.</p>
          {CES_TEMPLATES.map((t) => (
            <div key={t.id} style={{ borderTop: '1px solid #d7e3ee', padding: '8px 0' }}>
              <div className="row space">
                <span><strong>{t.plainName}</strong></span>
                <button
                  type="button"
                  onClick={() => setCesMarks((prev) => (prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]))}
                  style={cesMarks.includes(t.id) ? { background: '#124571', color: '#fff' } : {}}
                >
                  {cesMarks.includes(t.id) ? 'Marked' : 'Mark it'}
                </button>
              </div>
              {cesMarks.includes(t.id) && (
                <div className="row" style={{ marginTop: 6 }}>
                  <span className="small">Which side?</span>
                  {(['right', 'left', 'both'] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setCesSides((prev) => ({ ...prev, [t.id]: side }))}
                      style={cesSides[t.id] === side ? { background: '#124571', color: '#fff' } : {}}
                    >
                      {side === 'right' ? 'Right' : side === 'left' ? 'Left' : 'Both'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="grid2" style={{ marginTop: 10 }}>
            <div>
              <label htmlFor="davies-r">Davies test: right hand (touches in 15 seconds)</label>
              <input id="davies-r" inputMode="numeric" value={daviesR} onChange={(e) => setDaviesR(e.target.value)} placeholder="e.g. 12" />
            </div>
            <div>
              <label htmlFor="davies-l">Davies test: left hand (touches in 15 seconds)</label>
              <input id="davies-l" inputMode="numeric" value={daviesL} onChange={(e) => setDaviesL(e.target.value)} placeholder="e.g. 12" />
            </div>
          </div>
          <label htmlFor="ces-notes">Notes (optional)</label>
          <input id="ces-notes" value={cesNotes} onChange={(e) => setCesNotes(e.target.value)} placeholder="What you saw, in your own words" />
          <button
            className="primary"
            style={{ marginTop: 10 }}
            disabled={busy === 'ces'}
            onClick={() => withBusy('ces', async () => {
              if (cesMarks.length === 0) {
                setCesSaved('Mark at least one finding first.');
                return;
              }
              try {
                const davies = { right: daviesR ? Number(daviesR) : null, left: daviesL ? Number(daviesL) : null };
                if (api.getMode() === 'server') await api.coachSaveCesSheet(selected.id, cesMarks, cesNotes, cesSides, davies);
                if (api.getMode() === 'local') update((d) => { d.cesSheet = { marks: cesMarks, sides: cesSides, davies, notes: cesNotes, date: new Date().toISOString() }; });
                const sheet = { marks: cesMarks, sides: cesSides, davies, notes: cesNotes, date: new Date().toISOString() };
                setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: { ...cl.data, cesSheet: sheet } } : cl)));
                setSelected((prev) => (prev ? { ...prev, data: { ...prev.data, cesSheet: sheet } } : prev));
                setCesSaved(`Saved ${cesMarks.length} ${cesMarks.length === 1 ? 'finding' : 'findings'} to ${selected.displayName || selected.email}'s file.`);
                toast('Check sheet saved.');
              } catch {
                setCesSaved('That could not be saved. Try again.');
              }
            })}
          >
            {busy === 'ces' ? 'Saving…' : 'Save check sheet'}
          </button>
          {cesSaved && <p className="ok">{cesSaved}</p>}
          {selected.data.cesSheet && (
            <p className="small muted">
              Last saved check sheet: {new Date(selected.data.cesSheet.date).toLocaleDateString()} · {selected.data.cesSheet.marks.length} findings
              {selected.data.cesSheet.sides ? ` · ${Object.keys(selected.data.cesSheet.sides).length} with a side noted` : ''}
              {selected.data.cesSheet.davies && (selected.data.cesSheet.davies.right != null || selected.data.cesSheet.davies.left != null)
                ? ` · Davies: right ${selected.data.cesSheet.davies.right ?? '—'}, left ${selected.data.cesSheet.davies.left ?? '—'} touches`
                : ''}
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}
