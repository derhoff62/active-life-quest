import { useState } from 'react';
import type { Ctx } from '../App';
import { ASSESSMENT_QUESTIONS, CES_TEMPLATES, CONTRAINDICATIONS, DEFAULT_EQUIPMENT, EQUIPMENT_OPTIONS, recommendPhase } from '../lib/data';
import type { FindingId, FormRating } from '../lib/types';

const FINDING_LABELS: { id: FindingId; label: string }[] = CES_TEMPLATES.map((t) => ({ id: t.id, label: t.plainName }));

export default function Assessment({ ctx }: { ctx: Ctx }) {
  const { doc, update } = ctx;
  const [step, setStep] = useState(0);
  const [parq, setParq] = useState<string[]>([]);
  const [flags, setFlags] = useState<string[]>([]);
  const [findings, setFindings] = useState<FindingId[]>([]);
  const [experience, setExperience] = useState<'new' | 'some' | 'regular'>('new');
  const [years, setYears] = useState<'under1' | '1to3' | 'over3'>('under1');
  const [squat, setSquat] = useState<FormRating>('ok');
  const [hinge, setHinge] = useState<FormRating>('ok');
  const [bench, setBench] = useState<FormRating>('ok');
  const [balL, setBalL] = useState('');
  const [balR, setBalR] = useState('');
  const [sex, setSex] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [age, setAge] = useState('');
  const [equipment, setEquipment] = useState<string[]>(
    doc.equipment && doc.equipment.length > 0 ? doc.equipment : [...DEFAULT_EQUIPMENT],
  );
  const [done, setDone] = useState(false);

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const result = doc.assessment;

  function finish() {
    const rec = recommendPhase(findings.length, experience, years, { squatForm: squat, hingeForm: hinge, benchForm: bench });
    const contra = CONTRAINDICATIONS.filter((c) => flags.some((f) => c.flag.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(c.flag.toLowerCase().split(' ')[0]))).map((c) => c.flag);
    update((d) => {
      d.assessment = {
        findings,
        balanceLeftSec: Number(balL) || 0,
        balanceRightSec: Number(balR) || 0,
        experience,
        yearsTraining: years,
        squatForm: squat,
        hingeForm: hinge,
        benchForm: bench,
        startingPhase: rec.phase,
        recommendedPhase: rec.phase,
        reason: rec.reason,
      };
      d.assessmentDone = true;
      d.healthFlags = flags;
      d.equipment = equipment.length > 0 ? equipment : [...DEFAULT_EQUIPMENT];
      d.contraindications = contra;
      d.balanceBaseline = { left: Number(balL) || 0, right: Number(balR) || 0 };
      d.body = {
        sex,
        heightIn: Number(height) || null,
        weightLb: Number(weight) || null,
        goalWeightLb: Number(goalWeight) || null,
        age: Number(age) || null,
        activity: d.body.activity,
      };
      d.xp += 60;
    });
    setDone(true);
  }

  if (result && (done || doc.assessmentDone)) {
    const templates = CES_TEMPLATES.filter((t) => result.findings.includes(t.id));
    return (
      <div>
        <div className="card gold-frame">
          <h2>Your assessment is done</h2>
          <p><strong>Starting phase: Phase {result.startingPhase}.</strong> {result.reason}</p>
          <p className="muted small">Total time: 30 to 45 minutes, goals and history plus the movement screen. You earned 60 XP.</p>
          {result.findings.length === 0 && <p>Your screen was clean. No corrective templates were flagged.</p>}
          {result.findings.length > 0 && <p>Movement patterns to work on: {result.findings.map((f) => FINDING_LABELS.find((x) => x.id === f)?.label).join(', ')}.</p>}
          <p>Balance baseline: {result.balanceLeftSec}s left, {result.balanceRightSec}s right. This is a general balance check, not a NASM test.</p>
          <p>Your equipment: {(doc.equipment && doc.equipment.length > 0 ? doc.equipment : DEFAULT_EQUIPMENT).join(', ')}. Workouts swap out moves you cannot do with this gear.</p>
          <button className="primary" onClick={() => { setDone(false); setStep(0); }}>Retake the assessment</button>
        </div>
        {templates.map((t) => (
          <details className="card" key={t.id}>
            <summary>{t.plainName} ({t.name})</summary>
            <p><strong>Inhibit:</strong> {t.inhibit}</p>
            <p><strong>Lengthen:</strong> {t.lengthen}</p>
            <p><strong>Activation:</strong> {t.activation}</p>
            <p><strong>Integration:</strong> {t.integration}</p>
            <p className="small muted">Next steps: {t.progression.join(' Then: ')}</p>
            <p className="small muted">Derek cannot fix pain. These moves help you move better with less discomfort. For sharp, new, worsening, or non-improving pain, see a doctor or physical therapist.</p>
          </details>
        ))}
        {doc.contraindications.length > 0 && (
          <div className="notice">
            <strong>Notes for your plan:</strong> {doc.contraindications.join(', ')}. Your workouts will be adjusted for these.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Assessment, 30 to 45 minutes</h2>
      <p className="muted small">Goals and history, then the movement screen: overhead squat, single-leg squat, and postural assessment. Filming is optional and never required. Skip any video and you can still finish.</p>

      {step === 0 && (
        <div>
          <h3>Step 1: Health screen</h3>
          <p>Answer honestly. A serious flag pauses the movement part until you have doctor clearance.</p>
          {ASSESSMENT_QUESTIONS.parq.map((q) => (
            <label key={q} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400 }}>
              <input type="checkbox" checked={parq.includes(q)} onChange={() => toggle(parq, q, setParq)} style={{ width: 'auto', minHeight: 0, marginTop: 4 }} />
              {q}
            </label>
          ))}
          <label>Health flags that change your plan (pick any)</label>
          <div className="row">
            {['High blood pressure', 'Diabetes', 'Pregnancy', 'Heart condition', 'Osteoporosis', 'Recent injury or surgery', 'Knee pain', 'Back pain'].map((f) => (
              <button key={f} type="button" onClick={() => toggle(flags, f, setFlags)} style={flags.includes(f) ? { background: '#124571', color: '#fff' } : {}}>
                {f}
              </button>
            ))}
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="primary" onClick={() => setStep(1)}>Next: your goals and history</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h3>Step 2: Goals, history, and body details (optional)</h3>
          {ASSESSMENT_QUESTIONS.questions.map((q) => (
            <p key={q} className="small">· {q}</p>
          ))}
          <label>Training experience</label>
          <select value={experience} onChange={(e) => setExperience(e.target.value as never)}>
            <option value="new">New to training</option>
            <option value="some">Some experience</option>
            <option value="regular">Train regularly</option>
          </select>
          <label>Years training</label>
          <select value={years} onChange={(e) => setYears(e.target.value as never)}>
            <option value="under1">Under 1 year</option>
            <option value="1to3">1 to 3 years</option>
            <option value="over3">Over 3 years</option>
          </select>
          <label>What equipment do you have? (pick all you have)</label>
          <p className="small muted">Your workouts swap out moves you cannot do. No cable machine, no cable row: you get a dumbbell row instead.</p>
          <div className="row">
            {EQUIPMENT_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => toggle(equipment, e, setEquipment)}
                style={equipment.includes(e) ? { background: '#124571', color: '#fff' } : {}}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="grid2">
            <div>
              <label htmlFor="a-sex">Sex (for nutrition numbers)</label>
              <select id="a-sex" value={sex} onChange={(e) => setSex(e.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
            <div>
              <label htmlFor="a-age">Age</label>
              <input id="a-age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 52" />
            </div>
            <div>
              <label htmlFor="a-height">Height (inches)</label>
              <input id="a-height" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 66" />
            </div>
            <div>
              <label htmlFor="a-weight">Weight (lb)</label>
              <input id="a-weight" inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 190" />
            </div>
            <div>
              <label htmlFor="a-goalw">Goal weight (lb)</label>
              <input id="a-goalw" inputMode="numeric" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} placeholder="e.g. 165" />
            </div>
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="primary" onClick={() => setStep(2)}>Next: movement screen</button>
            <button onClick={() => setStep(0)}>Back</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3>Step 3: Movement screen</h3>
          <p>Do an overhead squat, a single-leg squat, and a postural check, or watch Derek do them and mark what you see. Pick every pattern you notice.</p>
          <div className="row">
            {FINDING_LABELS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFindings((prev) => (prev.includes(f.id) ? prev.filter((x) => x !== f.id) : [...prev, f.id]))}
                style={findings.includes(f.id) ? { background: '#124571', color: '#fff' } : {}}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="small muted">No findings? Leave them all unpicked. That is a clean screen.</p>
          <div className="grid2">
            <div>
              <label htmlFor="a-squat">Squat form</label>
              <select id="a-squat" value={squat} onChange={(e) => setSquat(e.target.value as FormRating)}>
                <option value="good">Good</option>
                <option value="ok">Okay</option>
                <option value="poor">Needs work</option>
              </select>
            </div>
            <div>
              <label htmlFor="a-hinge">Hinge (deadlift) form</label>
              <select id="a-hinge" value={hinge} onChange={(e) => setHinge(e.target.value as FormRating)}>
                <option value="good">Good</option>
                <option value="ok">Okay</option>
                <option value="poor">Needs work</option>
              </select>
            </div>
            <div>
              <label htmlFor="a-bench">Bench / push form</label>
              <select id="a-bench" value={bench} onChange={(e) => setBench(e.target.value as FormRating)}>
                <option value="good">Good</option>
                <option value="ok">Okay</option>
                <option value="poor">Needs work</option>
              </select>
            </div>
          </div>
          <h3 style={{ marginTop: 16 }}>Balance baseline (general check, not a NASM test)</h3>
          <p className="small muted">Stand near something stable. Hold one leg up as long as you can. Stop if you feel unsteady.</p>
          <div className="grid2">
            <div>
              <label htmlFor="a-bal-l">Left leg (seconds)</label>
              <input id="a-bal-l" inputMode="numeric" value={balL} onChange={(e) => setBalL(e.target.value)} placeholder="e.g. 12" />
            </div>
            <div>
              <label htmlFor="a-bal-r">Right leg (seconds)</label>
              <input id="a-bal-r" inputMode="numeric" value={balR} onChange={(e) => setBalR(e.target.value)} placeholder="e.g. 9" />
            </div>
          </div>
          <div className="notice">
            <strong>Filming is never required.</strong> You can film a short form-check clip for Derek if you want, or skip it. Skipping never blocks you.
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="primary" onClick={finish}>Finish my assessment</button>
            <button onClick={() => setStep(1)}>Back</button>
          </div>
        </div>
      )}
    </div>
  );
}
