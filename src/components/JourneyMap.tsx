// Journey map, second round (Derek, Nov 25, 2026): the winding gold
// path was still hard to follow, so the map is now a straight vertical
// list, one clear row per step, no winding, no branches, no side to
// side movement. And the direction is flipped: Step 1 is at the BOTTOM
// and Step 6 is at the TOP, so the client climbs UP as they progress,
// like climbing. Past steps sit below, ticked. Future steps sit above,
// greyed and locked. The "Next:" line stays at the top of the card in
// Journey.tsx; only the map steps run bottom to top.
// Pictures are back inside the step rows (Derek, Nov 25, 2026): each step
// shows its land badge, its companions as portraits, and its boss as a
// portrait, so the map is a list you can follow and still looks like a
// map. The straight bottom-to-top list stays. Progression, bosses,
// companions, and XP are unchanged.
import { CREATURES, BOSS_ROUNDS } from '../lib/data';
import { weekLabel } from '../lib/yearPlan';
import CompanionAvatar, { BossAvatar } from './CompanionAvatar';

// Boss portrait for each boss round on this map, same mapping as
// Journey.tsx. Week 8 is the Mirror of Doubt round.
const BOSS_AVATAR: Record<string, string> = {
  'boss-week-4': 'the-slump',
  'boss-week-8': 'mirror-of-doubt',
  'boss-week-12': 'wobbly-balance-sprite',
};

// Land picture: a small flat badge with the land's castle and its motif.
// No land image files exist, so the badge is drawn here, reusing the same
// flat style as the companion portraits. No new image files, no base64.
function LandBadge({ land }: { land: string }) {
  const bg = land === 'Crystal Shores' ? '#2f6fd0' : land === 'Navy Peaks' ? '#124571' : '#1e7a46';
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" role="img" aria-label={land} style={{ display: 'block', borderRadius: 12, flexShrink: 0 }}>
      <rect width="56" height="56" rx="12" fill={bg} />
      {/* Castle: gold tower with battlements, same in every land. */}
      <g fill="#f2d878" stroke="#8a6d00" strokeWidth="1">
        <rect x="20" y="22" width="16" height="22" />
        <rect x="17" y="18" width="5" height="6" />
        <rect x="25" y="18" width="5" height="6" />
        <rect x="34" y="18" width="5" height="6" />
        <rect x="26" y="32" width="4" height="12" fill="#8a6d00" stroke="none" />
      </g>
      {land === 'Sapphire Forest' && (
        <g fill="#0f4d28">
          <path d="M8 44 L13 30 L18 44 Z" />
          <path d="M38 44 L43 30 L48 44 Z" />
        </g>
      )}
      {land === 'Crystal Shores' && (
        <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
          <path d="M6 48 Q12 44 18 48 Q24 52 30 48" />
          <path d="M26 48 Q32 44 38 48 Q44 52 50 48" />
        </g>
      )}
      {land === 'Navy Peaks' && (
        <g fill="#fff">
          <path d="M6 46 L16 28 L26 46 Z" />
          <path d="M30 46 L40 24 L50 46 Z" />
        </g>
      )}
    </svg>
  );
}

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
        {/* Progress trail (Derek, Nov 25, 2026): the trail is RED where you
            have been, grey where you have not. Each step row draws its own
            piece of the trail, so the red runs from Step 1 at the bottom up
            to "You are here", and the grey runs from there to the top. */}
        {shown.map((s, idx) => {
          const status = pastFirstStretch ? 'done' : statusOf(s);
          const boss = BOSS_ROUNDS.find((r) => r.week >= s.from && r.week <= s.to && r.week <= 12);
          const bossBeaten = boss ? (bossHp[boss.id] ?? boss.maxHp) <= 0 : false;
          // Boss health bar (Derek, Nov 25, 2026): the bar is the boss's
          // real HP from doc.bossHp, the same number Combat uses. Spells
          // drop it, full when the round opens, empty when beaten. No new
          // rules, no new XP.
          const bossHpLeft = boss ? (bossHp[boss.id] ?? boss.maxHp) : 0;
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
              {/* This row's piece of the trail, behind the step number.
                  Done rows are red all the way through. The current row is
                  grey above its number circle and red below it, so the red
                  stops exactly where you are. Future rows are grey. */}
              {status === 'done' && (
                <div aria-hidden style={{ position: 'absolute', left: -37, top: idx === 0 ? 20 : 0, bottom: idx === shown.length - 1 ? 20 : -12, width: 4, background: '#a83232', borderRadius: 2 }} />
              )}
              {status === 'current' && (
                <>
                  <div aria-hidden style={{ position: 'absolute', left: -37, top: idx === 0 ? 20 : 0, height: 28 - (idx === 0 ? 20 : 0), width: 4, background: '#d7e3ee', borderRadius: 2 }} />
                  <div aria-hidden style={{ position: 'absolute', left: -37, top: 28, bottom: idx === shown.length - 1 ? 20 : -12, width: 4, background: '#a83232', borderRadius: 2 }} />
                </>
              )}
              {(status === 'next' || status === 'locked') && (
                <div aria-hidden style={{ position: 'absolute', left: -37, top: idx === 0 ? 20 : 0, bottom: idx === shown.length - 1 ? 20 : -12, width: 4, background: '#d7e3ee', borderRadius: 2 }} />
              )}
              {/* Step number on the trail. */}
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
              <p className="small" style={{ margin: '0 0 8px' }}>{s.doLine}</p>
              {/* Pictures for this step: land badge, companion portraits,
                  boss portrait. Met companions show their picture, unmet
                  ones show a grey ? portrait, never a blank. */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ textAlign: 'center', width: 56 }}>
                  <LandBadge land={LAND_FOR_STEP[s.n]} />
                  <p className="small muted" style={{ margin: '4px 0 0', lineHeight: 1.2 }}>{LAND_FOR_STEP[s.n]}</p>
                </div>
                {companions.map((c) => {
                  const isMet = met.has(c.id);
                  return (
                    <div key={c.id} style={{ textAlign: 'center', width: 56 }}>
                      <CompanionAvatar id={isMet ? c.id : 'unknown'} />
                      <p className="small muted" style={{ margin: '4px 0 0', lineHeight: 1.2 }}>{isMet ? c.name : '?'}</p>
                    </div>
                  );
                })}
                {boss && (
                  <div style={{ textAlign: 'center', width: 56 }}>
                    <BossAvatar id={BOSS_AVATAR[boss.id] || 'the-slump'} />
                    <div className="progress-bar boss-bar" style={{ width: 56, margin: '6px auto 0' }} role="img" aria-label={`${bossHpLeft} of ${boss.maxHp} HP`}>
                      <div style={{ width: `${(bossHpLeft / boss.maxHp) * 100}%` }} />
                    </div>
                    <p className="small" style={{ margin: '2px 0 0', lineHeight: 1.2 }}>
                      ★ Boss, Week {boss.week}: {bossBeaten ? 'Beaten.' : `${bossHpLeft} of ${boss.maxHp} HP`}
                    </p>
                  </div>
                )}
              </div>
              {companions.some((c) => !met.has(c.id)) && (
                <p className="small muted" style={{ margin: '8px 0 0' }}>A ? is someone you have not met yet.</p>
              )}
            </div>
          );
        })}
      </div>
      {pastFirstStretch && (
        <p className="small">You are past Week 12. The road keeps going below, in Your road ahead.</p>
      )}
      <div className="map-legend">
        <div><strong>Red line:</strong> the path you have travelled, bottom to top, step 1 to where you are now</div>
        <div><strong>Grey line:</strong> the path ahead of you</div>
        <div><strong>Pictures:</strong> each step shows its land, its companions, and its boss</div>
        <div><strong>Red star:</strong> boss round, at Weeks 4, 8, and 12</div>
        <div><strong>Red bar:</strong> boss health. It drops every time you hit the boss with a spell, and hits 0 when you beat it</div>
        <div><strong>Name:</strong> a companion you met. A ? is someone you have not met yet</div>
        <div><strong>Green tick:</strong> a step you have finished. You are here is the step with the gold border</div>
      </div>
    </div>
  );
}
