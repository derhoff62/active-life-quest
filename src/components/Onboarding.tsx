import { useState } from 'react';
import type { Ctx } from '../App';
import { CLASSES, CLASS_GOOD_FOR, CLASS_SUGGESTED_GOALS, DEFAULT_EQUIPMENT, EQUIPMENT_NOTES, EQUIPMENT_OPTIONS, GOAL_TYPES } from '../lib/data';
import { checkinFrequenciesForMode, normalizeCheckinFrequency } from '../lib/store';
import type { ClassId } from '../lib/types';
import GuardianAvatar from './GuardianAvatar';
import {
  BUILD_OPTIONS,
  DEFAULT_HAIR,
  GUARDIAN_COLORS,
  GUARDIAN_GEMS,
  HAIR_LABELS,
  HAIR_OPTIONS,
  SKIN_HEX,
  SKIN_TONES,
} from '../lib/guardianOptions';

const COLORS = [...GUARDIAN_COLORS];
const GEMS = [...GUARDIAN_GEMS];

export default function Onboarding({ ctx }: { ctx: Ctx }) {
  const { doc, update, go } = ctx;
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [classId, setClassId] = useState<ClassId>('Guardian');
  const [color, setColor] = useState('Navy');
  const [gem, setGem] = useState('Sapphire');
  const [cape, setCape] = useState(true);
  const [look, setLook] = useState<'Female' | 'Male'>('Female');
  const [hair, setHair] = useState('Long');
  const [build, setBuild] = useState<'Slim' | 'Athletic' | 'Strong'>('Athletic');
  const [skinColor, setSkinColor] = useState('Light');
  const [bodyColor, setBodyColor] = useState('Navy');
  const [armColor, setArmColor] = useState('Navy');
  const [legColor, setLegColor] = useState('Navy');
  const [capeColor, setCapeColor] = useState('Navy');
  const setOverallColor = (c: string) => {
    setColor(c);
    setBodyColor(c);
    setArmColor(c);
    setLegColor(c);
    setCapeColor(c);
  };
  const [goal, setGoal] = useState('weight-loss');
  const [why, setWhy] = useState('');
  const [equipment, setEquipment] = useState<string[]>([...DEFAULT_EQUIPMENT]);
  const [checkinMode, setCheckinMode] = useState<'text' | 'live-call'>('text');
  const [checkinFrequency, setCheckinFrequency] = useState<'daily' | '1x-month' | '2x-month' | '3x-month' | '4x-month'>('daily');
  const [reminderPhone, setReminderPhone] = useState('');
  const [reminderEmailOk, setReminderEmailOk] = useState(false);
  const [reminderTextOk, setReminderTextOk] = useState(false);

  const EQUIP = EQUIPMENT_OPTIONS;

  if (step === 0) {
    return (
      <div className="card">
        <h2>Your first 5 minutes</h2>
        <p>1. Pick your guardian. 2. Do the assessment. 3. Find your next step on Today. 4. Start your first workout.</p>
        <p className="small muted">Nothing here is a test you can fail. The assessment finds where to start, so the plan fits you.</p>
        <button className="primary" onClick={() => setStep(1)} style={{ width: '100%' }}>Pick my guardian</button>
        <p style={{ marginTop: 10 }}>
          <button onClick={() => update((d) => { d.tutorialDone = true; d.guardianPicked = true; d.guardian = { name: 'Brave Beginner', classId: 'Guardian', color: 'Navy', gem: 'Sapphire', cape: true, look: 'Female', hair: 'Long', build: 'Athletic', skinColor: 'Light', bodyColor: 'Navy', armColor: 'Navy', legColor: 'Navy', capeColor: 'Navy' }; })}>Skip for now</button>
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
        <div className="guardian-sticky-preview">
          <GuardianAvatar guardian={{ name: name.trim() || 'Your guardian', classId, color, gem, cape, look, hair, build, skinColor, bodyColor, armColor, legColor, capeColor }} level={1} size="compact" label={`${name.trim() || 'Your guardian'} the ${classId} · Level 1`} />
          <div className="guardian-preview-text">
            <strong>{name.trim() || 'Your guardian'} the {classId}</strong>
            <p className="small muted" style={{ margin: '2px 0 0' }}>Level 1 · {look} · {HAIR_LABELS[hair] || hair}</p>
          </div>
        </div>
        <label>Guardian look</label>
        <div className="row">
          {(['Female', 'Male'] as const).map((l) => (
            <button key={l} type="button" onClick={() => { setLook(l); setHair(DEFAULT_HAIR[l]); }} style={look === l ? { background: '#124571', color: '#fff' } : {}}>
              {l}
            </button>
          ))}
        </div>
        <label>Hair style</label>
        <div className="row">
          {HAIR_OPTIONS[look].map((h) => (
            <button key={h} type="button" onClick={() => setHair(h)} style={hair === h ? { background: '#124571', color: '#fff' } : {}}>
              {HAIR_LABELS[h] || h}
            </button>
          ))}
        </div>
        <label>Skin color</label>
        <div className="row">
          {SKIN_TONES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSkinColor(s)}
              style={skinColor === s ? { background: '#124571', color: '#fff', borderColor: '#c9a227', borderWidth: 2 } : {}}
              aria-pressed={skinColor === s}
            >
              <span aria-hidden style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: SKIN_HEX[s], marginRight: 6, verticalAlign: 'middle', border: '1px solid #5b6b7a' }} />
              {s}
            </button>
          ))}
        </div>
        <label>Build</label>
        <div className="row">
          {BUILD_OPTIONS.map((b) => (
            <button key={b} type="button" onClick={() => setBuild(b)} style={build === b ? { background: '#124571', color: '#fff' } : {}}>
              {b}
            </button>
          ))}
        </div>
        <label htmlFor="g-name">Guardian name</label>
        <input id="g-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Brave Beginner" />
        <div className="grid2">
          <div>
            <label htmlFor="g-color">Overall color</label>
            <select id="g-color" value={color} onChange={(e) => setOverallColor(e.target.value)}>
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
        <h4 style={{ margin: '14px 0 4px' }}>Colors, by part</h4>
        <p className="small muted">Each part starts as your overall color. Change any part on its own, or tap Match all to set them back.</p>
        {([
          ['Body', bodyColor, setBodyColor],
          ['Arms', armColor, setArmColor],
          ['Legs', legColor, setLegColor],
          ['Cape', capeColor, setCapeColor],
        ] as const).map(([label, value, set]) => (
          <div key={label}>
            <label htmlFor={`g-${label.toLowerCase()}-color`}>{label} color</label>
            <select id={`g-${label.toLowerCase()}-color`} value={value} onChange={(e) => set(e.target.value)}>
              {COLORS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        ))}
        <div className="row" style={{ marginTop: 8 }}>
          <button type="button" onClick={() => { setArmColor(bodyColor); setLegColor(bodyColor); setCapeColor(bodyColor); setColor(bodyColor); }}>
            Match all to Body color
          </button>
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
      <label>How do you want to check in with Derek?</label>
      <div className="row">
        {([['text', 'Text check-in in the app'], ['live-call', 'Live video call with Derek']] as const).map(([v, label]) => (
          <button key={v} type="button" onClick={() => { setCheckinMode(v); setCheckinFrequency(normalizeCheckinFrequency(v, checkinFrequency)); }} style={checkinMode === v ? { background: '#124571', color: '#fff' } : {}}>
            {label}
          </button>
        ))}
      </div>
      <p className="small muted">Daily check-in is in the app: you complete your tasks in the app, no call. Live video call with Derek, 30 minutes, up to once a week. Pick 1, 2, 3, or 4 a month. You request times in the app, Derek confirms the time and sends the call link, or you schedule it outside the app. You can change this later on Today.</p>
      {checkinMode === 'live-call' && (
        <>
          <label>How many video calls a month?</label>
          <p className="small muted">Video check-ins are 30 minutes each, at most once a week. Pick 1, 2, 3, or 4 a month.</p>
          <div className="row">
            {checkinFrequenciesForMode(checkinMode).map(({ value: v, label }) => (
              <button key={v} type="button" onClick={() => setCheckinFrequency(v)} style={checkinFrequency === v ? { background: '#124571', color: '#fff' } : {}}>
                {label}
              </button>
            ))}
          </div>
        </>
      )}
      {checkinMode === 'text' && (
        <p className="small muted">Daily only. Your check-in is in the app every day.</p>
      )}
      <label>What equipment do you have?</label>
      <div className="equip-list">
        {EQUIP.map((e) => (
          <label key={e}>
            <input
              type="checkbox"
              checked={equipment.includes(e)}
              onChange={() => setEquipment((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]))}
            />
            <span>
              <span className="equip-name">{e}</span>{' '}
              <span className="equip-note">{EQUIPMENT_NOTES[e] || ''}</span>
            </span>
          </label>
        ))}
      </div>
      <h4 style={{ margin: '14px 0 4px' }}>Reminders</h4>
      <p className="small muted">Optional. We only use these to remind you if you forget to log in or check in. Nothing is sent yet.</p>
      <label htmlFor="g-reminder-phone">Phone (optional)</label>
      <input id="g-reminder-phone" type="tel" value={reminderPhone} onChange={(e) => { setReminderPhone(e.target.value); if (!e.target.value.trim()) setReminderTextOk(false); }} placeholder="Phone (optional)" />
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: 0 }}>
        <input type="checkbox" checked={reminderEmailOk} onChange={(e) => setReminderEmailOk(e.target.checked)} style={{ width: 'auto', minHeight: 0 }} />
        <span>Email me a reminder if I forget to log in or check in.</span>
      </label>
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: 0 }}>
        <input type="checkbox" checked={reminderTextOk} disabled={!reminderPhone.trim()} onChange={(e) => setReminderTextOk(e.target.checked)} style={{ width: 'auto', minHeight: 0 }} />
        <span>Text me a reminder if I forget to log in or check in.</span>
      </label>
      {!reminderPhone.trim() && <p className="small muted">Add a phone number above to turn this on.</p>}
      <div className="row" style={{ marginTop: 14 }}>
        <button
          className="primary"
          onClick={() => {
            update((d) => {
              d.guardian = { name: name.trim(), classId, color, gem, cape, look, hair, build, skinColor, bodyColor, armColor, legColor, capeColor };
              d.guardianPicked = true;
              d.tutorialDone = true;
              d.equipment = equipment;
              d.checkinMode = checkinMode;
              d.checkinFrequency = checkinFrequency;
              const phone = reminderPhone.trim();
              d.reminderPhone = phone;
              d.reminderEmailOk = reminderEmailOk;
              d.reminderTextOk = phone ? reminderTextOk : false;
              if (phone && !(d.reminderEmail || '').trim() && (d.email || '').trim()) d.reminderEmail = d.email.trim();
              const gt = GOAL_TYPES.find((g) => g.id === goal);
              d.goals = [{ type: goal as never, label: gt?.label || 'My goal', why, started: new Date().toISOString() }];
              d.mainGoal = gt?.label || '';
              d.xp += 20;
            });
            go('train');
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
