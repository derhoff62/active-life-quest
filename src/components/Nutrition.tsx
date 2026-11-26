import { useState } from 'react';
import type { Ctx } from '../App';
import Switch from './Switch';
import { NUTRITION } from '../lib/data';
import { proteinRange, fiberTarget, PROTEIN_MEALS, proteinToday, proteinGramsToday, workoutDateIso, todayDayKey, isTodayLocal, DAILY_UNLOCK_LEVELS, dailyUnlocked } from '../lib/store';

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

// A sample day of eating. An example only, not a meal plan to follow.
// Every meal has a protein in it, so it shows what "protein at most
// meals" looks like in a normal day.
const SAMPLE_DAY = [
  { meal: 'Breakfast', food: 'Greek yogurt with oats and berries, or eggs with whole wheat toast.' },
  { meal: 'Lunch', food: 'Chicken breast or tuna sandwich on whole wheat bread, with an apple.' },
  { meal: 'Snack', food: 'Cottage cheese with fruit, or a handful of nuts and a piece of fruit.' },
  { meal: 'Dinner', food: 'Lean ground beef or salmon, brown rice, and broccoli or green beans.' },
];

// Whole foods grocery list, grouped so shopping is simple. No brands.
const GROCERY_LIST = [
  { group: 'Protein', foods: 'Chicken breast, eggs, Greek yogurt, cottage cheese, tuna, lean ground beef, tofu, lentils, beans.' },
  { group: 'Carbs', foods: 'Oats, brown rice, sweet potatoes, whole wheat bread, quinoa, fruit.' },
  { group: 'Healthy fats', foods: 'Olive oil, avocados, nuts, seeds, salmon, nut butter.' },
  { group: 'Fruit and veg', foods: 'Berries, apples, bananas, broccoli, green beans, carrots, spinach, tomatoes.' },
];

// Eating out, plain swaps. Nothing to count, nothing to weigh.
const EATING_OUT_SWAPS = [
  'Grilled, not fried. Grilled chicken or fish instead of breaded or fried.',
  'Sauce on the side. You decide how much goes on.',
  'Water instead of a sugary drink.',
  'Start with a salad or vegetables when they are on the menu.',
  'Take half home when the portion is big. Stop at satisfied, about 80 percent full.',
];

// Supplements, in one place. Same four from the macro card, with
// what each one does. No amounts: specific doses and medical
// supplements are outside Derek's scope as a trainer.
// None of these are required.
const SUPPLEMENTS_LIST = [
  { name: 'Creatine monohydrate', text: 'Supports strength and muscle. Take it every day, training day or not.' },
  { name: 'Fish oil', text: 'Supports joints and heart health.' },
  { name: 'Magnesium glycinate', text: 'Can help sleep. Often taken in the evening.' },
  { name: 'Protein powder', text: 'Whey or plant protein. Useful when a meal is short on protein. A palm-sized portion of real food does the same job.' },
];

export default function Nutrition({ ctx }: { ctx: Ctx }) {
  const { doc, update, toast } = ctx;
  const gw = doc.body.goalWeightLb;
  const enabled = doc.nutritionEnabled;
  // Protein grams typed but not ticked yet, per meal. The tick is the
  // main action; grams are optional and never block it.
  const [gramsDraft, setGramsDraft] = useState<Record<string, string>>({});
  const todayProtein = proteinToday(doc);
  const proteinGrams = proteinGramsToday(doc);
  const proteinLow = gw ? Math.round(gw * 0.7) : null;
  const proteinHigh = gw ? Math.round(gw * 1) : null;
  const waterDone = (doc.quests || []).some((q) => (q as { kind?: string }).kind === 'water' && isTodayLocal(q.date));
  const proteinOpen = dailyUnlocked(doc, 'protein');
  const waterOpen = dailyUnlocked(doc, 'water');

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

      {/* Protein and water today: NOT behind the Nutrition toggle.
          Protein is small enough that it stays visible whether
          Nutrition is on or off (Derek, Nov 25, 2026). The rest of
          Nutrition below stays gated, as before. */}
      <div className="card">
        <h3>Protein and water today</h3>
        <p className="small muted">Protein is optional. You do not need Nutrition on to log it. Tick each meal where you had protein. Each meal gives +1 attack in boss fights. {proteinOpen ? '' : `Protein unlocks at Level ${DAILY_UNLOCK_LEVELS.protein}. `}{waterOpen ? '' : `Water unlocks at Level ${DAILY_UNLOCK_LEVELS.water}.`}</p>
        <p><strong>{todayProtein.length} of 4 meals today.</strong>{' '}
          {proteinGrams.total > 0 || proteinHigh
            ? proteinHigh
              ? `About ${proteinGrams.total}g so far today, target ${proteinLow} to ${proteinHigh}g.`
              : `About ${proteinGrams.total}g logged today.`
            : 'Add your goal weight in the assessment to see your daily target.'}
          {todayProtein.length > proteinGrams.withGrams && todayProtein.length > 0 && ' Grams not entered for some meals.'}
        </p>
        {PROTEIN_MEALS.map((m) => {
          const entry = todayProtein.find((p) => p.meal === m.id);
          const draft = gramsDraft[m.id] ?? (entry && typeof entry.grams === 'number' ? String(entry.grams) : '');
          return (
            <div key={m.id} className="row" style={{ marginBottom: 8, alignItems: 'center' }}>
              <span style={{ minWidth: 110 }}><strong>{m.label}</strong></span>
              {entry ? (
                <span className="small ok">Logged</span>
              ) : proteinOpen ? (
                <button
                  className="primary"
                  onClick={() => {
                    const g = Number(draft);
                    const grams = draft !== '' && Number.isFinite(g) ? Math.max(0, Math.min(200, Math.round(g))) : undefined;
                    update((d) => {
                      d.proteinMeals.push({ id: `p${Date.now()}`, date: workoutDateIso(todayDayKey()), meal: m.id, grams });
                      d.mana = Math.min(10, d.mana + 1);
                    });
                    toast(`Protein at ${m.label.toLowerCase()} logged. +1 mana.`);
                  }}
                >
                  I had protein
                </button>
              ) : (
                <button className="primary" disabled style={{ opacity: 0.5 }}>
                  Unlocks at Level {DAILY_UNLOCK_LEVELS.protein}
                </button>
              )}
              <label className="small muted" htmlFor={`protein-grams-${m.id}`}>Grams (optional)</label>
              <input
                id={`protein-grams-${m.id}`}
                inputMode="numeric"
                value={draft}
                disabled={!proteinOpen && !entry}
                onChange={(e) => {
                  const v = e.target.value;
                  setGramsDraft((prev) => ({ ...prev, [m.id]: v }));
                  // If the meal is already ticked, save the grams on
                  // the entry. Grams never add attacks, the tick does.
                  if (entry) {
                    const g = Number(v);
                    const grams = v !== '' && Number.isFinite(g) ? Math.max(0, Math.min(200, Math.round(g))) : undefined;
                    update((d) => {
                      const found = (d.proteinMeals || []).find((p) => p.id === entry.id);
                      if (found) found.grams = grams;
                    });
                  }
                }}
                placeholder="g"
                style={{ maxWidth: 80 }}
                aria-label={`Protein grams at ${m.label}`}
              />
            </div>
          );
        })}
        <div className="row" style={{ marginTop: 8, alignItems: 'center' }}>
          <span style={{ minWidth: 110 }}><strong>Water</strong></span>
          {waterDone ? (
            <span className="small ok">Logged today</span>
          ) : waterOpen ? (
            <button
              className="primary"
              onClick={() => {
                update((d) => {
                  d.quests.push({ id: `q${Date.now()}`, date: workoutDateIso(todayDayKey()), kind: 'water' });
                  d.mana = Math.min(10, d.mana + 1);
                });
                toast('Water logged. +1 mana.');
              }}
            >
              I drank water today (+1 mana)
            </button>
          ) : (
            <button className="primary" disabled style={{ opacity: 0.5 }}>
              Unlocks at Level {DAILY_UNLOCK_LEVELS.water}
            </button>
          )}
        </div>
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

          {/* A sample day of eating. An example only, not a plan
              to follow. Every meal has a protein in it. */}
          <div className="card">
            <h3>A sample day of eating</h3>
            <p className="small muted">This is an example, not a meal plan you must follow. Use it to see what a day with protein at every meal looks like, then build your own day the same way.</p>
            <ul>
              {SAMPLE_DAY.map((s) => (
                <li key={s.meal}><strong>{s.meal}:</strong> {s.food}</li>
              ))}
            </ul>
          </div>

          {/* Whole foods grocery list, grouped by food type. */}
          <div className="card">
            <h3>Whole foods grocery list</h3>
            <p className="small muted">Buy from these groups and most meals take care of themselves. No brands, just food that looks like food.</p>
            <ul>
              {GROCERY_LIST.map((g) => (
                <li key={g.group}><strong>{g.group}:</strong> {g.foods}</li>
              ))}
            </ul>
          </div>

          {/* Before and after a workout. Simple timing, nothing fancy. */}
          <div className="card">
            <h3>Before and after a workout</h3>
            <p><strong>Before:</strong> eat a small snack 1 to 2 hours before you train. Something with carbs and a little protein, like toast with peanut butter or yogurt with fruit. Drink water. Do not train on a full stomach.</p>
            <p style={{ marginBottom: 0 }}><strong>After:</strong> eat a normal meal with protein and carbs within a couple of hours. Your next meal already does this. A palm-sized portion of protein, some carbs, and water is enough. No special shake is needed.</p>
          </div>

          {/* Eating out, without blowing it up. Plain swaps only. */}
          <div className="card">
            <h3>Eating out</h3>
            <p className="small muted">You do not need a perfect meal when you eat out. A few swaps keep it close to normal.</p>
            <ul>
              {EATING_OUT_SWAPS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>

          {/* Supplements in one place. None of these are required. */}
          <div className="card">
            <h3>Supplements</h3>
            <p className="small muted">Food first. A few basics can help, but none of them replace real meals or training. None of these are required, and none of them burn fat on their own.</p>
            <p className="small muted">Derek can talk general nutrition with you. For specific amounts, or if you take medication or have a health condition, ask your doctor.</p>
            <ul>
              {SUPPLEMENTS_LIST.map((s) => (
                <li key={s.name}><strong>{s.name}:</strong> {s.text}</li>
              ))}
            </ul>
          </div>

          {/* Water, in Nutrition too. Points at the tick above, so
              there is only one water tick in the whole app. */}
          <div className="card">
            <h3>Water</h3>
            <p>Aim for water with every meal, and a glass when you wake up. Most people do well with about 6 to 8 glasses a day. Drink more when it is hot or you sweat a lot. Water with fiber helps digestion, so drink water with high fiber meals.</p>
            <p style={{ marginBottom: 0 }}>Tick it off in the Protein and water today card at the top of this page. It is there even when Nutrition is off, so you never lose it.</p>
          </div>

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
