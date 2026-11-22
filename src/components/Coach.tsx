import { useEffect, useState } from 'react';
import type { Ctx } from '../App';
import * as api from '../lib/api';
import { CES_TEMPLATES } from '../lib/data';
import type { ProfileDoc } from '../lib/store';

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
  const [cesSaved, setCesSaved] = useState('');

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
  });

  return (
    <div>
      <div className="card gold-frame">
        <h2>Coach dashboard</h2>
        <p>Needs you: {alerts.length} {alerts.length === 1 ? 'item' : 'items'}</p>
        {alerts.length === 0 && <p>Nothing needs you right now.</p>}
        {alerts.map((a, i) => <p key={i}>· {a}</p>)}
        {betaInfo && <p className="small muted">Beta code {betaInfo.code}: {betaInfo.uses} of {betaInfo.maxUses} uses, expires {betaInfo.expires}.</p>}
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
            <div className="row">
              <button onClick={() => setSelected(c)}>Open client</button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="card gold-frame">
          <h3>{selected.displayName || selected.email}</h3>
          <p>Phase {selected.data.assessment?.startingPhase || 'not assessed'} · Findings: {selected.data.assessment?.findings.join(', ') || 'none'} · Workouts: {selected.data.workouts.length} · Check-ins: {selected.data.checkins.length} · Cardio: {selected.data.cardio.reduce((s, c) => s + Number(c.minutes || 0), 0)} min</p>

          <h3>Messages and questions</h3>
          {selected.data.messages.length === 0 && <p className="muted">No messages yet.</p>}
          {selected.data.messages.map((m) => (
            <div key={m.id} style={{ borderTop: '1px solid #d7e3ee', padding: '8px 0' }}>
              <p><strong>{m.kind}:</strong> {m.body}</p>
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
                window.alert('Nudge sent. It shows on the client Today screen.');
              }}
            >
              Send nudge
            </button>
          </div>

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
          <button
            className="primary"
            style={{ marginTop: 10 }}
            onClick={() => {
              if (cesMarks.length === 0) {
                setCesSaved('Mark at least one finding first.');
                return;
              }
              setCesSaved(`Saved ${cesMarks.length} ${cesMarks.length === 1 ? 'finding' : 'findings'} to ${selected.displayName || selected.email}'s file.`);
            }}
          >
            Save check sheet
          </button>
          {cesSaved && <p className="ok">{cesSaved}</p>}
        </div>
      )}
    </div>
  );
}
