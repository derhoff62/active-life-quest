import type { Ctx } from '../App';
import { NUTRITION, HIIT } from '../lib/data';
import { proteinRange, fiberTarget } from '../lib/store';

export default function Nutrition({ ctx }: { ctx: Ctx }) {
  const { doc, update } = ctx;
  const gw = doc.body.goalWeightLb;
  const enabled = doc.nutritionEnabled;

  return (
    <div>
      <div className="card">
        <div className="row space">
          <h2 style={{ margin: 0 }}>Nutrition, optional, always</h2>
          <button
            aria-label="Nutrition quests on/off"
            aria-pressed={enabled}
            onClick={() => update((d) => { d.nutritionEnabled = !d.nutritionEnabled; })}
            style={{ minWidth: 68, background: enabled ? '#124571' : '#fff', color: enabled ? '#fff' : '#124571' }}
          >
            {enabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <p className="muted">Nutrition is optional and off by default. Turn it on when you want it. No calorie counting unless Derek turns the calculator on for you in Coach.</p>
        <p>{enabled ? 'Nutrition is on.' : 'Nutrition is off.'}</p>
        <div className="card" style={{ margin: '8px 0' }}>
          <p><strong>Three rules:</strong></p>
          <p>1. Eat mostly whole foods. 2. Eat protein at most meals. 3. Eat until satisfied, about 80 percent full, then stop.</p>
          <p className="scale-center">80% · Satisfied, stop here</p>
          <div className="scale"><span>0% · Hungry</span><span>100% · Full</span></div>
        </div>
      </div>

      {enabled && (
        <>
          <div className="card">
            <h3>Your numbers</h3>
            <p>Protein: {proteinRange(gw)} {gw ? `(goal weight ${gw} lb)` : '(add your goal weight in the assessment to see grams)'}. Fiber: {fiberTarget(doc.body.sex)}. Portions scale with your size and height.</p>
            <p className="small muted">General guidance until you add body details in the assessment. Derek adjusts the details in coaching.</p>
          </div>

          {(Object.keys(NUTRITION) as (keyof typeof NUTRITION)[]).map((key) => {
            const s = NUTRITION[key];
            return (
              <details className="card" key={key}>
                <summary>{s.title}</summary>
                <p>{s.short}</p>
                <p>{s.detail}</p>
                <p><strong>Examples:</strong> {s.sources.join(', ')}.</p>
              </details>
            );
          })}

          <div className="card">
            <h3>Cardio</h3>
            <p>The best type of cardio is the one you stick to. Aim for 150 to 300 minutes a week of Zone 2, easy enough to talk. High intensity counts double: 20 minutes hard counts as 40.</p>
            <details>
              <summary>High-intensity (HIIT) examples and precautions</summary>
              <ul>{HIIT.examples.map((e, i) => <li key={i}>{e}</li>)}</ul>
              <ul>{HIIT.precautions.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </details>
          </div>

          {doc.calorieCalcEnabled && (
            <div className="card gold-frame">
              <h3>Calorie calculator (Coach turned this on for you)</h3>
              <p>
                About{' '}
                {doc.body.weightLb && doc.body.heightIn && doc.body.age
                  ? Math.round(
                      (doc.body.sex === 'male'
                        ? 66 + 6.2 * doc.body.weightLb + 12.7 * doc.body.heightIn - 6.76 * doc.body.age
                        : 655 + 4.35 * doc.body.weightLb + 4.7 * doc.body.heightIn - 4.7 * doc.body.age) * 1.4,
                    )
                  : '2,170'}{' '}
                calories a day to maintain your weight.
              </p>
              <p className="small muted">This is a rough estimate. It needs to be adjusted as you progress or regress. Derek adjusts it in check-ins. No daily calorie tracking, and you do not have to log food.</p>
            </div>
          )}
          {!doc.calorieCalcEnabled && (
            <p className="small muted" style={{ padding: '0 4px' }}>
              The calorie calculator is off. Derek can turn it on for you in Coach if you want it.
            </p>
          )}
        </>
      )}
    </div>
  );
}
