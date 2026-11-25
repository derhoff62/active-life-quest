// Journey map, second round (Derek, Nov 25, 2026): the winding gold
// path was still hard to follow, so the map is now a straight vertical
// list, one clear row per step, no winding, no branches, no side to
// side movement. And the direction is flipped: Step 1 is at the BOTTOM
// and Step 6 is at the TOP, so the client climbs UP as they progress,
// like climbing. Past steps sit below, ticked. Future steps sit above,
// greyed and locked. The "Next:" line stays at the top of the card in
// Journey.tsx; only the map steps run bottom to top.
// Boss stars and companion dots live inside the step rows, not floating
// on a picture. Progression, bosses, companions, and XP are unchanged.
import { CREATURES, BOSS_ROUNDS } from '../lib/data';
import { weekLabel } from '../lib/yearPlan';

type Step = {
  n: number;
  from: number;
  to: number;
  title: string;
  doLine: string;
};

const STEPS: Step[] = [
  { n: 1, from: 1, to: 3, title: 'Weeks 1 to 3, Sapphire Forest', doLine: 'Train in Sapphire Forest. Do your Phase 1 workouts, check in each day, and log your cardio.' },
  { n: 2, from: 4, to: 4, title: 'Week 4, boss round and retest', doLine: 'Beat the Week 4 boss round, then do the Week 4 retest. The next land opens when Derek approves it.' },
  { n: 3, from: 5, to: 7, title: 'Weeks 5 to 8, Crystal Shores', doLine: 'Train in Crystal Shores. Phase 2 workouts, balance holds, and cardio.' },
  { n: 4, from: 8, to: 8, title: 'Week 8, boss round and retest', doLine: 'Beat the Week 8 boss round, then do the Week 8 retest.' },
  { n: 5, from: 9, to: 11, title: 'Weeks 9 to 12, Navy Peaks', doLine: 'Train in Navy Peaks. Phase 3 workouts, your hardest stretch yet.' },
  { n: 6, from: 12, to: 12, title: 'Week 12, boss round, retest, and a lighter week', doLine: 'Beat the Week 12 boss round, do the Week 12 retest, then take a lighter week.' },
];

const LAND_FOR_STEP: Record<number, string> = {
  1: 'Sapphire Forest',
  2: 'Sapphire Forest',
  3: 'Crystal Shores',
  4: 'Crystal Shores',
  5: 'Navy Peaks',
  6: 'Navy Peaks',
};

export default function JourneyMap({
  currentWeek,
  met,
  bossHp,
}: {
  currentWeek: number;
  met: Set<string>;
  bossHp: Record<string, number>;
}) {
  const week = Math.min(52, Math.max(1, currentWeek));
  const pastFirstStretch = week > 12;
  const hereLand = pastFirstStretch ? 'past Week 12, on the next stretch' : LAND_FOR_STEP[STEPS.find((s) => week >= s.from && week <= s.to)?.n ?? 1];

  // Status per step, from the client's real week. Done steps sit below
  // the current one, future steps above it.
  const statusOf = (s: Step): 'done' | 'current' | 'next' | 'locked' => {
    if (week > s.to) return 'done';
    if (week >= s.from && week <= s.to) return 'current';
    const firstFuture = STEPS.find((x) => week < x.from);
    return firstFuture?.n === s.n ? 'next' : 'locked';
  };
  const statusText: Record<string, string> = {
    done: 'Done',
    current: 'You are here',
    next: 'Next',
    locked: 'Locked',
  };

  // Render bottom to top: Step 6 first in the DOM, Step 1 last, so the
  // client climbs UP the list as they progress.
  const shown = [...STEPS].reverse();

  return (
    <div>
      <p
        className="pill"
        style={{
          display: 'block',
          width: 'fit-content',
          margin: '0 auto 10px',
          padding: '10px 18px',
          fontSize: '1.05rem',
          background: '#ffffff',
          color: '#124571',
          border: '2px solid #124571',
        }}
      >
        You are here: {hereLand} · {weekLabel(week)}
      </p>
      <p className="small muted" style={{ textAlign: 'center', margin: '0 0 12px' }}>
        The map runs bottom to top. You start at the bottom and climb up, one step at a time.
      </p>
      <div style={{ position: 'relative', paddingLeft: 56 }}>
        {/* One straight gold line, top to bottom, behind the step numbers. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 19,
            top: 20,
            bottom: 20,
            width: 4,
            background: '#c9a227',
            borderRadius: 2,
          }}
        />
        {shown.map((s) => {
          const status = pastFirstStretch ? 'done' : statusOf(s);
          const boss = BOSS_ROUNDS.find((r) => r.week >= s.from && r.week <= s.to && r.week <= 12);
          const bossBeaten = boss ? (bossHp[boss.id] ?? boss.maxHp) <= 0 : false;
          const companions = CREATURES.filter((c) => c.meetWeek >= s.from && c.meetWeek <= s.to);
          const isCurrent = status === 'current';
          const isDone = status === 'done';
          return (
            <div
              key={s.n}
              style={{
                position: 'relative',
                marginBottom: 12,
                padding: 12,
                background: isCurrent ? '#fffdf4' : '#fff',
                border: isCurrent ? '3px solid #c9a227' : '1px solid #d7e3ee',
                borderRadius: 14,
                opacity: status === 'locked' ? 0.55 : 1,
              }}
            >
              {/* Step number on the gold line. */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  left: -44,
                  top: 12,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isDone ? '#1e7a46' : '#124571',
                  color: '#fff',
                  border: '2px solid #fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1rem',
                }}
              >
                {isDone ? '✓' : s.n}
              </div>
              <p style={{ margin: '0 0 4px' }}>
                <strong>Step {s.n}: {s.title}</strong>{' '}
                <span
                  className="pill"
                  style={isCurrent ? { background: '#124571', color: '#fff', borderColor: '#124571' } : {}}
                >
                  {statusText[status]}
                </span>
              </p>
              <p className="small" style={{ margin: '0 0 4px' }}>{s.doLine}</p>
              {boss && (
                <p className="small" style={{ margin: '0 0 4px' }}>
                  ★ Boss, Week {boss.week}: {bossBeaten ? 'Beaten.' : 'Not beaten yet.'}
                </p>
              )}
              {companions.length > 0 && (
                <p className="small muted" style={{ margin: 0 }}>
                  Companions: {companions.map((c) => (met.has(c.id) ? c.name : '?')).join(', ')}
                  {companions.some((c) => !met.has(c.id)) ? ' (a ? is someone you have not met yet)' : ''}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {pastFirstStretch && (
        <p className="small">You are past Week 12. The road keeps going below, in Your road ahead.</p>
      )}
      <div className="map-legend">
        <div><strong>Gold line:</strong> your path, bottom to top, step 1 to step 6</div>
        <div><strong>Red star:</strong> boss round, at Weeks 4, 8, and 12</div>
        <div><strong>Name:</strong> a companion you met. A ? is someone you have not met yet</div>
        <div><strong>Green tick:</strong> a step you have finished. You are here is the step with the gold border</div>
      </div>
    </div>
  );
}
