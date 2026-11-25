import Cardio from './Cardio';
import Sleep from './Sleep';
import Nutrition from './Nutrition';
import type { Ctx } from '../App';

// Health: the daily habits, in one tab. One section at a time, picked
// with three short buttons at the top: Cardio, Sleep, Food. Cardio is
// first because it is the one with a weekly target. Food is optional
// and off by default, same as before.
// Note: switching sections unmounts the other log forms, the same as
// switching tabs did before, so a half-typed log does not carry over.
export type HealthSection = 'cardio' | 'sleep' | 'food';

const SECTIONS: { id: HealthSection; label: string }[] = [
  { id: 'cardio', label: 'Cardio' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'food', label: 'Food' },
];

export default function Health({ ctx, section, onSection }: { ctx: Ctx; section: HealthSection; onSection: (s: HealthSection) => void }) {
  return (
    <div>
      <p className="small muted">Daily habits, in one place: cardio, sleep, and food. Pick one below.</p>
      <div className="row" role="tablist" aria-label="Daily habits">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={section === s.id ? 'primary' : ''}
            onClick={() => onSection(s.id)}
            aria-current={section === s.id ? 'true' : undefined}
          >
            {s.label}
          </button>
        ))}
      </div>
      {section === 'cardio' && <Cardio ctx={ctx} />}
      {section === 'sleep' && <Sleep ctx={ctx} />}
      {section === 'food' && <Nutrition ctx={ctx} />}
    </div>
  );
}
