import { useState } from 'react';
import type { Ctx } from '../App';
import { FAQS } from '../lib/data';

export default function Faq({ ctx }: { ctx: Ctx }) {
  const { go } = ctx;
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
      <div className="card gold-frame">
        <h3>Still have a question?</h3>
        <p>Ask Derek. He replies within one business day.</p>
        <button className="primary" onClick={() => go('today')}>Ask Derek a question</button>
      </div>
    </div>
  );
}
