import { useState } from 'react';
import type { Ctx } from '../App';
import { FAQS } from '../lib/data';
import Switch from './Switch';

export default function Faq({ ctx }: { ctx: Ctx }) {
  const { doc, update, toast } = ctx;
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div>
      <div className="card">
        <h2>Frequently asked questions</h2>
        {FAQS.map((f, i) => (
          <div key={i} style={{ borderTop: '1px solid #d7e3ee', padding: '10px 0' }}>
            <button
              style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', padding: 0, minHeight: 0, color: '#124571', fontWeight: 700 }}
              onClick={() => setOpen(open === f.q ? null : f.q)}
            >
              {f.q}
            </button>
            {open === f.q && <p style={{ marginTop: 6 }}>{f.a}</p>}
          </div>
        ))}
      </div>
      <div className="card">
        <h3>Settings</h3>
        <div className="switch-row">
          <span><strong>Bigger text</strong></span>
          <Switch
            checked={doc.largeText}
            onChange={() => { update((d) => { d.largeText = !d.largeText; }); toast(doc.largeText ? 'Bigger text turned off.' : 'Bigger text turned on.'); }}
            label="Bigger text on or off"
            hint="Tap to turn bigger text on or off"
          />
        </div>
        <div className="switch-row">
          <span><strong>Reduced motion</strong></span>
          <Switch
            checked={doc.reducedMotion}
            onChange={() => { update((d) => { d.reducedMotion = !d.reducedMotion; }); toast(doc.reducedMotion ? 'Reduced motion turned off.' : 'Reduced motion turned on.'); }}
            label="Reduced motion on or off"
            hint="Tap to turn reduced motion on or off"
          />
        </div>
        <p className="small muted">Reduced motion turns off the bobbing, glowing, and shimmer animations.</p>
        <h4>Reminders</h4>
        <p>Email and phone for reminders if you forget to log in. We only use them to remind you, never to share them.</p>
        <label htmlFor="reminder-email">Email for reminders</label>
        <input id="reminder-email" type="email" value={doc.reminderEmail || ''} onChange={(e) => { update((d) => { d.reminderEmail = e.target.value; }); toast('Reminder contact saved.'); }} />
        <label htmlFor="reminder-phone">Phone for reminders</label>
        <input id="reminder-phone" type="tel" value={doc.reminderPhone || ''} onChange={(e) => { update((d) => { d.reminderPhone = e.target.value; if (!e.target.value.trim()) d.reminderTextOk = false; }); toast('Reminder contact saved.'); }} />
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: 0 }}>
          <input type="checkbox" checked={doc.reminderEmailOk === true} onChange={(e) => { update((d) => { d.reminderEmailOk = e.target.checked; }); toast('Reminder contact saved.'); }} style={{ width: 'auto', minHeight: 0 }} />
          <span>Email me a reminder if I forget to log in or check in.</span>
        </label>
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: 0 }}>
          <input type="checkbox" checked={doc.reminderTextOk === true} disabled={!(doc.reminderPhone || '').trim()} onChange={(e) => { update((d) => { d.reminderTextOk = e.target.checked; }); toast('Reminder contact saved.'); }} style={{ width: 'auto', minHeight: 0 }} />
          <span>Text me a reminder if I forget to log in or check in.</span>
        </label>
        {!(doc.reminderPhone || '').trim() && <p className="small muted">Add a phone number above to turn this on.</p>}
        <p className="small muted">No reminders are sent yet. Derek will turn them on later.</p>
      </div>
    </div>
  );
}
