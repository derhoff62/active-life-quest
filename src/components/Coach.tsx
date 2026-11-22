import { useEffect, useState } from 'react';
import type { Ctx } from '../App';
import * as api from '../lib/api';
import { CES_TEMPLATES } from '../lib/data';
import type { ProfileDoc } from '../lib/store';
import { checkinPreferenceText, checkinFrequenciesForMode, normalizeCheckinFrequency, phaseForDoc } from '../lib/store';

interface ClientRow {
  id: string;
  email: string;
  displayName: string;
  data: ProfileDoc;
  updatedAt: string;
}

export default function Coach({ ctx }: { ctx: Ctx }) {
  const { doc } = ctx;
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
  const [cesNotes, setCesNotes] = useState('');
  const [phase5Msg, setPhase5Msg] = useState('');
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
  const [resetMsg, setResetMsg] = useState('');

  useEffect(() => {
    if (unlocked && api.getMode() === 'server') {
      api.coachClients().then((r) => setClients(r.clients)).catch(() => undefined);
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
        <button className="primary" style={{ marginTop: 12, width: '100%' }} onClick={unlock}>
          Unlock Coach
        </button>
        <p className="small muted">First time here? Enter a new PIN and it becomes your Coach PIN.</p>
      </div>
    );
  }

  const localClients: ClientRow[] = api.getMode() === 'local'
    ? [{ id: 'local', email: doc.email, displayName: doc.displayName || 'This device', data: doc, updatedAt: doc.lastActive }]
    : clients;

  const alerts: string[] = [];
  localClients.forEach((c) => {
    c.data.messages.filter((m) => !m.coachReply).forEach((m) => alerts.push(`New ${m.kind} from ${c.displayName || c.email}`));
    c.data.checkins.slice(-1).forEach(() => alerts.push(`Check-in to reply to from ${c.displayName || c.email}`));
    if (c.data.week13PlanRequested) alerts.push(`Week 13 plan to send to ${c.displayName || c.email}`);
    if (c.data.sessions) alerts.push(`Unfinished workout for ${c.displayName || c.email}`);
    if (c.data.assessment?.findings.length) alerts.push(`Balance warning: check balance moves for ${c.displayName || c.email}`);
    if (c.data.assessmentDone && c.data.retests.length === 0) alerts.push(`Week 4 retest due for ${c.displayName || c.email}`);
    const cleanWeeks = c.data.retests.filter((r) => (r as { clean?: boolean }).clean).map((r) => (r as { week?: number }).week || 0);
    const nextPhase = cleanWeeks.includes(12) ? 4 : cleanWeeks.includes(8) ? 3 : cleanWeeks.includes(4) ? 2 : 0;
    const curPhase = phaseForDoc(c.data);
    if (nextPhase > curPhase) alerts.push(`${c.displayName || c.email} passed a retest and is ready for Phase ${nextPhase}`);
  });

  return (
    <div>
      <div className="card gold-frame">
        <h2>Coach dashboard</h2>
        <p>Needs you: {alerts.length} {alerts.length === 1 ? 'item' : 'items'}</p>
        {alerts.length === 0 && <p>Nothing needs you right now.</p>}
        {alerts.map((a, i) => <p key={i}>· {a}</p>)}
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
              onClick={async () => {
                try {
                  await api.coachSetBeta(newBetaCode.trim().toUpperCase() || betaInfo?.code || 'ACTIVEBETA', Number(newBetaUses) || 25, newBetaExpires);
                  const s = await api.coachSettings();
                  setBetaInfo(s);
                  setBetaMsg('Beta code updated.');
                } catch {
                  setBetaMsg('That could not be saved. Check the code, uses, and expiry.');
                }
              }}
            >
              Save beta code
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
              <strong>{c.displayName || c.email}</strong> · {c.email} · Phase {c.data.assessment?.startingPhase || 'not assessed'} · {c.data.xp} XP · last active {new Date(c.updatedAt).toLocaleDateString()}
            </p>
            <p className="small muted">Check-ins: {checkinPreferenceText(c.data).replace('Your check-ins: ', '')}</p>
            <div className="row">
              <button onClick={() => { setSelected(c); setCesMarks(c.data.cesSheet?.marks || []); setCesNotes(c.data.cesSheet?.notes || ''); setCesSaved(''); setPhase5Msg(''); }}>Open client</button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="card gold-frame">
          <h3>{selected.displayName || selected.email}</h3>
          <p>Phase {selected.data.assessment?.startingPhase || 'not assessed'} · Findings: {selected.data.assessment?.findings.join(', ') || 'none'} · Workouts: {selected.data.workouts.length} · Check-ins: {selected.data.checkins.length} · Cardio: {selected.data.cardio.reduce((s, c) => s + Number(c.minutes || 0), 0)} min</p>
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
                      const patch = (d: ProfileDoc) => ({ ...d, checkinMode: v, checkinFrequency: freq });
                      setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: patch(cl.data) } : cl)));
                      setSelected((prev) => (prev ? { ...prev, data: patch(prev.data) } : prev));
                      setPrefMsg('Check-in preference saved.');
                    } catch { setPrefMsg('That could not be saved. Try again.'); }
                  }}
                  style={selected.data.checkinMode === v ? { background: '#124571', color: '#fff' } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
            <label>How often</label>
            <div className="row">
              {checkinFrequenciesForMode(selected.data.checkinMode).map(({ value: v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={async () => {
                    try {
                      if (api.getMode() === 'server') await api.coachSetCheckinPreference(selected.id, selected.data.checkinMode || 'text', v);
                      const patch = (d: ProfileDoc) => ({ ...d, checkinFrequency: v });
                      setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: patch(cl.data) } : cl)));
                      setSelected((prev) => (prev ? { ...prev, data: patch(prev.data) } : prev));
                      setPrefMsg('Check-in preference saved.');
                    } catch { setPrefMsg('That could not be saved. Try again.'); }
                  }}
                  style={selected.data.checkinFrequency === v ? { background: '#124571', color: '#fff' } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
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
                ['Check-ins', ci, 3],
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
            <h4 style={{ margin: '0 0 4px' }}>Phase 5 approval</h4>
            <p className="small muted">Phase 5 also needs a clean form retest. {selected.data.retests.some((r) => (r as { clean?: boolean }).clean === true) ? 'This client has a clean retest.' : 'No clean retest yet.'}</p>
            <p className="small"><strong>{selected.data.phase5Approved ? 'Approved for Phase 5.' : 'Not approved for Phase 5.'}</strong></p>
            <div className="row">
              <button
                className="primary"
                onClick={async () => {
                  try {
                    if (api.getMode() === 'server') await api.coachSetPhase5(selected.id, true);
                    const patch = (d: ProfileDoc) => ({ ...d, phase5Approved: true });
                    setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: patch(cl.data) } : cl)));
                    setSelected((prev) => (prev ? { ...prev, data: patch(prev.data) } : prev));
                    setPhase5Msg('Phase 5 approved. The client also needs a clean retest to open it.');
                  } catch { setPhase5Msg('That could not be saved. Try again.'); }
                }}
              >
                Approve Phase 5
              </button>
              <button
                onClick={async () => {
                  try {
                    if (api.getMode() === 'server') await api.coachSetPhase5(selected.id, false);
                    const patch = (d: ProfileDoc) => ({ ...d, phase5Approved: false });
                    setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: patch(cl.data) } : cl)));
                    setSelected((prev) => (prev ? { ...prev, data: patch(prev.data) } : prev));
                    setPhase5Msg('Phase 5 approval removed.');
                  } catch { setPhase5Msg('That could not be saved. Try again.'); }
                }}
              >
                Remove approval
              </button>
            </div>
            {phase5Msg && <p className="ok">{phase5Msg}</p>}
          </div>

          <div className="card">
            <h4 style={{ margin: '0 0 4px' }}>Reset this client's password</h4>
            <p className="small muted">No reset email is sent in beta. Make a one-time code here, send it to the client in a message, and they enter it on the sign-in screen under "Set a new password". It works for 1 hour, once.</p>
            {api.getMode() === 'server' ? (
              <>
                <button
                  className="primary"
                  onClick={async () => {
                    try {
                      const r = await api.coachResetToken(selected.id);
                      setResetToken(r.token);
                      setResetMsg('Code made. Send it to the client. It works for 1 hour, once.');
                    } catch {
                      setResetMsg('That could not be made. Try again.');
                    }
                  }}
                >
                  Make a reset code
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
              <p><strong>{m.kind === 'video-call-request' ? 'Video call request' : m.kind}:</strong> {m.body}</p>
              {m.kind === 'video-call-request' && m.callStatus === 'confirmed' && m.callTime && <p className="ok">Confirmed: {m.callTime}</p>}
              {m.video && api.getMode() === 'server' && (
                <video src={api.coachCheckinVideoUrl(selected.id, m.video.key)} controls style={{ width: '100%', maxHeight: 280 }} />
              )}
              {m.video && api.getMode() !== 'server' && <p className="small muted">Video attached ({(m.video.sizeBytes / 1024 / 1024).toFixed(1)} MB). Playback needs the live app with video storage set up.</p>}
              {m.video && (
                <div className="row" style={{ marginTop: 4 }}>
                  <button onClick={async () => {
                    try {
                      if (api.getMode() === 'server') await api.coachDeleteCheckinVideo(selected.id, m.video!.key);
                      setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: { ...cl.data, messages: cl.data.messages.map((x) => (x.id === m.id ? { ...x, video: undefined } : x)) } } : cl)));
                      setSelected((prev) => (prev ? { ...prev, data: { ...prev.data, messages: prev.data.messages.map((x) => (x.id === m.id ? { ...x, video: undefined } : x)) } } : prev));
                      setVideoMsg('Video deleted.');
                    } catch { setVideoMsg('That video could not be deleted. Try again.'); }
                  }}>Delete this video</button>
                </div>
              )}
              {m.kind === 'video-call-request' && m.callStatus !== 'confirmed' && (
                <div className="row" style={{ marginTop: 8 }}>
                  <input value={callFor === m.id ? callTime : ''} onChange={(e) => { setCallFor(m.id); setCallTime(e.target.value); }} placeholder="e.g. Tue Nov 24 at 10:00 AM" />
                  <button
                    className="primary"
                    onClick={async () => {
                      if (!callTime.trim()) return;
                      if (api.getMode() === 'server') await api.coachReply(selected.id, m.id, `Video call confirmed for ${callTime.trim()}. I will send the call link before then.`);
                      const patch = (arr: typeof selected.data.messages) => arr.map((x) => (x.id === m.id ? { ...x, callStatus: 'confirmed' as const, callTime: callTime.trim(), coachReply: `Video call confirmed for ${callTime.trim()}. I will send the call link before then.` } : x));
                      setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: { ...cl.data, messages: patch(cl.data.messages) } } : cl)));
                      setSelected((prev) => (prev ? { ...prev, data: { ...prev.data, messages: patch(prev.data.messages) } } : prev));
                      setCallTime('');
                      setCallFor('');
                    }}
                  >
                    Confirm this call
                  </button>
                </div>
              )}
              {m.coachReply ? <p className="ok">You replied: {m.coachReply}</p> : (
                <div className="row">
                  <input value={replyFor === m.id ? reply : ''} onChange={(e) => { setReplyFor(m.id); setReply(e.target.value); }} placeholder="Reply to this client" />
                  <button
                    className="primary"
                    onClick={async () => {
                      if (!reply.trim()) return;
                      if (api.getMode() === 'server') await api.coachReply(selected.id, m.id, reply.trim());
                      setClients((prev) => prev.map((c) => (c.id === selected.id ? { ...c, data: { ...c.data, messages: c.data.messages.map((x) => (x.id === m.id ? { ...x, coachReply: reply.trim(), repliedAt: new Date().toISOString() } : x)) } } : c)));
                      setReply('');
                      setReplyFor('');
                    }}
                  >
                    Send reply
                  </button>
                </div>
              )}
            </div>
          ))}

          <h3 style={{ marginTop: 16 }}>Send a nudge</h3>
          <div className="row">
            <input value={nudge} onChange={(e) => setNudge(e.target.value)} placeholder="e.g. Nice work this week, keep the streak going" />
            <button
              onClick={async () => {
                if (!nudge.trim()) return;
                if (api.getMode() === 'server') await api.coachNudge(selected.id, nudge.trim());
                setNudge('');
                setNudgeMsg('Nudge sent. It shows on the client Today screen.');
              }}
            >
              Send nudge
            </button>
          </div>
          {nudgeMsg && <p className="ok">{nudgeMsg}</p>}

          <h3 style={{ marginTop: 16 }}>CES assessment check sheet</h3>
          <p className="small muted">Coach only. Mark what you see, add notes, save it to the client file. Never a required client self-assessment.</p>
          <div className="row">
            {CES_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setCesMarks((prev) => (prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]))}
                style={cesMarks.includes(t.id) ? { background: '#124571', color: '#fff' } : {}}
              >
                {t.plainName}
              </button>
            ))}
          </div>
          <label htmlFor="ces-notes">Notes (optional)</label>
          <input id="ces-notes" value={cesNotes} onChange={(e) => setCesNotes(e.target.value)} placeholder="What you saw, in your own words" />
          <button
            className="primary"
            style={{ marginTop: 10 }}
            onClick={async () => {
              if (cesMarks.length === 0) {
                setCesSaved('Mark at least one finding first.');
                return;
              }
              try {
                if (api.getMode() === 'server') await api.coachSaveCesSheet(selected.id, cesMarks, cesNotes);
                const sheet = { marks: cesMarks, notes: cesNotes, date: new Date().toISOString() };
                setClients((prev) => prev.map((cl) => (cl.id === selected.id ? { ...cl, data: { ...cl.data, cesSheet: sheet } } : cl)));
                setSelected((prev) => (prev ? { ...prev, data: { ...prev.data, cesSheet: sheet } } : prev));
                setCesSaved(`Saved ${cesMarks.length} ${cesMarks.length === 1 ? 'finding' : 'findings'} to ${selected.displayName || selected.email}'s file.`);
              } catch {
                setCesSaved('That could not be saved. Try again.');
              }
            }}
          >
            Save check sheet
          </button>
          {cesSaved && <p className="ok">{cesSaved}</p>}
          {selected.data.cesSheet && <p className="small muted">Last saved check sheet: {new Date(selected.data.cesSheet.date).toLocaleDateString()} · {selected.data.cesSheet.marks.length} findings.</p>}
        </div>
      )}
    </div>
  );
}
