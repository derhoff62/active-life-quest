import type { Ctx } from '../App';
import Switch from './Switch';
import { NUTRITION } from '../lib/data';
import { proteinRange, fiberTarget } from '../lib/store';

const RULES = [
  { n: 1, title: 'Eat mostly whole foods', text: 'Food that looks like food, most of the time.' },
  { n: 2, title: 'Eat protein at most meals', text: 'A palm-sized portion at each meal gets most people close.' },
  { n: 3, title: 'Eat until satisfied, then stop', text: 'About 80 percent full. Not stuffed, not still hungry.' },
];

const MACRO_ICONS: Record<string, string> = {
  protein: 'P',
  carbs: 'C',
  fats: 'F',
  fiber: 'Fi',
  supplements: 'S',
};

export default function Nutrition({ ctx }: { ctx: Ctx }) {
  const { doc, update, toast } = ctx;
  const gw = doc.body.goalWeightLb;
  const enabled = doc.nutritionEnabled;

  return (
    <div className="nut">
      {/* Header: title and toggle, separate from everything else. */}
      <div className="card nut-header">
        <div className="switch-row">
          <h2 style={{ margin: 0 }}>Nutrition, optional, always</h2>
          <Switch
            checked={enabled}
            onChange={() => { update((d) => { d.nutritionEnabled = !d.nutritionEnabled; }); toast(enabled ? 'Nutrition turned off.' : 'Nutrition turned on.'); }}
            label="Nutrition on or off"
            hint="Tap to turn Nutrition on or off"
          />
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          Nutrition is optional and off by default. Turn it on when you want it. No calorie counting unless Derek turns the calculator on for you in Coach.
        </p>
        <p style={{ marginBottom: 0 }}>
          {enabled ? 'Nutrition is on.' : 'Nutrition is off. Turn it on when you want it.'}
        </p>
      </div>

      {/* Three rules: one rule per card, vertical, not a paragraph. */}
      <div className="card">
        <h3>Three rules</h3>
        <p className="muted small">Keep these three in mind. Everything else below is detail.</p>
        <ol className="nut-rules">
          {RULES.map((r) => (
            <li key={r.n} className="nut-rule">
              <span className="nut-rule-num" aria-hidden>{r.n}</span>
              <span>
                <strong>{r.title}</strong>
                <span className="nut-rule-text">{r.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* 80% scale: its own card, with a clear visual bar. */}
      <div className="card">
        <h3>How full is satisfied?</h3>
        <p>Stop when you feel satisfied, about 80 percent full.</p>
        <div className="nut-scale-bar" aria-label="Fullness scale: stop at 80 percent, satisfied">
          <div className="nut-scale-fill" />
          <div className="nut-scale-marker" />
        </div>
        <div className="nut-scale-labels">
          <span>0% · Hungry</span>
          <span className="nut-scale-stop">80% · Satisfied, stop here</span>
          <span>100% · Full</span>
        </div>
      </div>

      {enabled && (
        <>
          {/* Your numbers: Protein and Fiber on separate lines. */}
          <div className="card">
            <h3>Your numbers</h3>
            <dl className="nut-stats">
              <div className="nut-stat">
                <dt>Protein</dt>
                <dd>
                  <strong>{proteinRange(gw)}</strong>
                  <span className="nut-stat-note">{gw ? `Goal weight ${gw} lb` : 'Add your goal weight in the assessment to see grams'}</span>
                </dd>
              </div>
              <div className="nut-stat">
                <dt>Fiber</dt>
                <dd>
                  <strong>{fiberTarget(doc.body.sex)}</strong>
                  <span className="nut-stat-note">Portions scale with your size and height.</span>
                </dd>
              </div>
            </dl>
            <p className="small muted" style={{ marginBottom: 0 }}>
              General guidance until you add body details in the assessment. Derek adjusts the details in coaching.
            </p>
          </div>

          {/* One spacious card per macro. Examples are a vertical list. */}
          {(Object.keys(NUTRITION) as (keyof typeof NUTRITION)[]).map((key) => {
            const s = NUTRITION[key];
            return (
              <details className="card nut-macro" key={key}>
                <summary>
                  <span className="nut-macro-icon" aria-hidden>{MACRO_ICONS[key] || '•'}</span>
                  {s.title}
                </summary>
                <p className="nut-macro-short">{s.short}</p>
                <p>{s.detail}</p>
                <h4>Examples</h4>
                <ul className="nut-examples">
                  {s.sources.map((src) => <li key={src}>{src}</li>)}
                </ul>
              </details>
            );
          })}

          {/* Cardio lives in its own tab now, with its log form and
              HIIT examples. It used to be a card here, in Nutrition. */}

          {doc.calorieCalcEnabled ? (
            <div className="card gold-frame">
              <h3>Calorie calculator</h3>
              <p className="muted small">Coach turned this on for you.</p>
              {doc.body.weightLb && doc.body.heightIn && doc.body.age ? (
                <p className="nut-cal">
                  About{' '}
                  {Math.round(
                    (doc.body.sex === 'male'
                      ? 66 + 6.2 * doc.body.weightLb + 12.7 * doc.body.heightIn - 6.76 * doc.body.age
                      : 655 + 4.35 * doc.body.weightLb + 4.7 * doc.body.heightIn - 4.7 * doc.body.age) * 1.4,
                  )}{' '}
                  calories a day to maintain your weight.
                </p>
              ) : (
                <p>Add your height, weight, and age in the assessment to see your number.</p>
              )}
              <p className="small muted" style={{ marginBottom: 0 }}>
                This is a rough estimate. It needs to be adjusted as you progress or regress. Derek adjusts it in check-ins. No daily calorie tracking, and you do not have to log food.
              </p>
            </div>
          ) : (
            <p className="small muted" style={{ padding: '0 4px' }}>
              The calorie calculator is off. Derek can turn it on for you in Coach if you want it.
            </p>
          )}
        </>
      )}
    </div>
  );
}
