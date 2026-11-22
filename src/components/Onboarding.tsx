import { useState } from 'react';
import type { Ctx } from '../App';
import { CLASSES, CLASS_GOOD_FOR, CLASS_SUGGESTED_GOALS, DEFAULT_EQUIPMENT, EQUIPMENT_OPTIONS, GOAL_TYPES } from '../lib/data';
import type { ClassId } from '../lib/types';

const COLORS = ['Navy', 'Forest', 'Crimson', 'Gold', 'Teal'];
const GEMS = ['Sapphire', 'Ruby', 'Emerald', 'Topaz'];

export default function Onboarding({ ctx }: { ctx: Ctx }) {
  const { doc, update, go } = ctx;
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [classId, setClassId] = useState<ClassId>('Guardian');
  const [color, setColor] = useState('Navy');
  const [gem, setGem] = useState('Sapphire');
  const [cape, setCape] = useState(true);
  const [goal, setGoal] = useState('weight-loss');
  const [why, setWhy] = useState('');
  const [equipment, setEquipment] = useState<string[]>([...DEFAULT_EQUIPMENT]);

  const EQUIP = EQUIPMENT_OPTIONS;

  if (step === 0) {
    return (
      <div className="card">
        <h2>Your first 5 minutes</h2>
        <p>1. Pick your guardian. 2. Do the assessment. 3. Find your next step on Today. 4. Start your first workout.</p>
        <p className="small muted">Nothing here is a test you can fail. The assessment finds where to start, so the plan fits you.</p>
        <button className="primary" onClick={() => setStep(1)} style={{ width: '100%' }}>Pick my guardian</button>
        <p style={{ marginTop: 10 }}>
          <button onClick={() => update((d) => { d.tutorialDone = true; d.guardianPicked = true; d.guardian = { name: 'Brave Beginner', classId: 'Guardian', color: 'Navy', gem: 'Sapphire', cape: true }; })}>Skip for now</button>
        </p>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="card">
        <h2>Pick your guardian</h2>
        <p>Your guardian walks the journey with you. Pick a class, then give them a name.</p>
        {CLASSES.map((c) => (
          <div key={c.id} className="card" style={{ margin: '8px 0' }}>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: 0 }}>
              <input type="radio" name="class" checked={classId === c.id} onChange={() => setClassId(c.id)} style={{ width: 'auto', minHeight: 0 }} />
              <span>
                <strong>{c.name}</strong>: {c.description}
                <br /><span className="small">{CLASS_GOOD_FOR[c.id] || ''}</span>
                <br /><span className="small muted">Spells: {c.spells.join(', ')}</span>
              </span>
            </label>
          </div>
        ))}
        <label htmlFor="g-name">Guardian name</label>
        <input id="g-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Brave Beginner" />
        <div className="grid2">
          <div>
            <label htmlFor="g-color">Color</label>
            <select id="g-color" value={color} onChange={(e) => setColor(e.target.value)}>
              {COLORS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="g-gem">Gem</label>
            <select id="g-gem" value={gem} onChange={(e) => setGem(e.target.value)}>
              {GEMS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="checkbox" checked={cape} onChange={(e) => setCape(e.target.checked)} style={{ width: 'auto', minHeight: 0 }} /> Cape
        </label>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="primary" disabled={!name.trim()} onClick={() => { setGoal(CLASS_SUGGESTED_GOALS[classId]?.[0] || 'weight-loss'); setStep(2); }}>Next: my goal</button>
          <button onClick={() => setStep(0)}>Back</button>
        </div>
      </div>
    );
  }

  const suggested = CLASS_SUGGESTED_GOALS[classId] || [];
  const suggestedGoals = [...GOAL_TYPES.filter((g) => suggested.includes(g.id)), ...GOAL_TYPES.filter((g) => !suggested.includes(g.id))];

  return (
    <div className="card">
      <h2>Your goal and your gear</h2>
      <p className="small">Good for your {classId}: {suggested.map((id) => GOAL_TYPES.find((g) => g.id === id)?.label).filter(Boolean).join(', ')}. These are suggested first. You can still pick any goal.</p>
      <label htmlFor="g-goal">What is your main goal?</label>
      <select
        id="g-goal"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
      >
        {suggestedGoals.map((g) => (
          <option key={g.id} value={g.id}>
            {suggested.includes(g.id) ? `★ ${g.label}` : g.label}
          </option>
        ))}
      </select>
      <label htmlFor="g-why">Why does it matter to you? (optional)</label>
      <input id="g-why" value={why} onChange={(e) => setWhy(e.target.value)} placeholder="In your own words" />
      <label>What equipment do you have?</label>
      <div className="row">
        {EQUIP.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEquipment((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]))}
            style={equipment.includes(e) ? { background: '#124571', color: '#fff' } : {}}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        <button
          className="primary"
          onClick={() => {
            update((d) => {
              d.guardian = { name: name.trim(), classId, color, gem, cape };
              d.guardianPicked = true;
              d.tutorialDone = true;
              d.equipment = equipment;
              const gt = GOAL_TYPES.find((g) => g.id === goal);
              d.goals = [{ type: goal as never, label: gt?.label || 'My goal', why, started: new Date().toISOString() }];
              d.mainGoal = gt?.label || '';
              d.xp += 20;
            });
            go('assessment');
          }}
        >
          Save and do the assessment
        </button>
        <button onClick={() => setStep(1)}>Back</button>
      </div>
      {doc.xp > 0 && <p className="small muted">You earned 20 XP for picking your guardian.</p>}
    </div>
  );
}
