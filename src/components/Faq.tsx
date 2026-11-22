import { useState } from 'react';
import type { Ctx } from '../App';
import { FAQS } from '../lib/data';
import Switch from './Switch';

export default function Faq({ ctx }: { ctx: Ctx }) {
  const { doc, update, toast, go } = ctx;
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
        <p className="small muted">Reduced motion turns off the bobbing, glowing, and shimmer animations. Bigger text is the same switch as the one in Progress.</p>
      </div>
      <div className="card gold-frame">
        <h3>Still have a question?</h3>
        <p>Ask Derek. He replies within one business day.</p>
        <button className="primary" onClick={() => go('today')}>Ask Derek a question</button>
      </div>
    </div>
  );
}
