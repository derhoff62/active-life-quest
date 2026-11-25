// Journey map, third round (Derek, Nov 25, 2026): the illustrated trail
// map is BACK, but easy to follow this time. Derek liked the old map
// with trails, castles, and monsters on it, it was just hard to follow.
// The old winding map failed because the path wandered and the pins,
// trail, and "You are here" were hard to find. This version keeps the
// fantasy look and fixes the followability:
//  - ONE path, no branches, no crossings, no loops. Step 1 is at the
//    BOTTOM, Step 6 at the TOP, you climb UP, one step at a time.
//  - Every step is numbered 1-6 in big clear numbers, in order along
//    the path, with arrows on the trail pointing UP the way to go.
//  - "You are here" is unmissable: gold border, gold glow, gold pin,
//    flag, and pill. Next step is the next one up the path. Locked
//    steps are greyed. Done steps have a green tick.
//  - Castles sit at the end of each land (boss steps: Forest Castle,
//    Lake Castle, Navy Castle), monsters stand ON the trail at their
//    boss steps, companions line the trail at their steps.
//  - The red travelled trail vs grey ahead trail stays, and the red
//    trail ends exactly at "You are here".
//  - The path spine is STRAIGHT, not a gentle S. The winding is inside
//    each step's scene strip (the dirt path snakes across the strip),
//    where it cannot make any step ambiguous. Clarity wins over
//    decoration.
// BUG FIX in this round: the old pins and trail were invisible live.
// They sat at left -45 / -31 inside cards with overflow: hidden, so
// the card clipped them off. The trail and pins now live in a gutter
// column OUTSIDE the cards, where nothing clips them. A live check
// Nov 25 found the old pins/trail missing from screenshots; this
// layout is the fix.
// Progression, bosses, companions, and XP are unchanged.
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
// Each land has its own terrain feel, and a little calm motion from the
// map classes in styles.css (glow, mist, waves, twinkles). Motion is
// gentle and stops under prefers-reduced-motion.
const LAND_THEME: Record<string, { tint: string; border: string; deep: string }> = {
  'Sapphire Forest': { tint: '#e9f4ec', border: '#1e7a46', deep: '#0f4d28' },
  'Crystal Shores': { tint: '#e7f1fd', border: '#2f6fd0', deep: '#1d4fa1' },
  'Navy Peaks': { tint: '#e6edf6', border: '#124571', deep: '#0b2f4d' },
};

const CASTLE_NAME: Record<string, string> = {
  'Sapphire Forest': 'Forest Castle',
  'Crystal Shores': 'Lake Castle',
  'Navy Peaks': 'Navy Castle',
};

function LandBadge({ land }: { land: string }) {
  const bg = land === 'Crystal Shores' ? '#2f6fd0' : land === 'Navy Peaks' ? '#124571' : '#1e7a46';
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" role="img" aria-label={land} style={{ display: 'block', borderRadius: 12, flexShrink: 0, boxShadow: '0 2px 8px rgba(18,69,113,0.35)', border: '2px solid #f2d878' }}>
      <rect width="56" height="56" rx="12" fill={bg} />
      {/* Soft gold glow behind the castle, gently pulsing. */}
      <ellipse className="map-land-glow" cx="28" cy="30" rx="20" ry="16" fill="#f2d878" opacity="0.35" />
      {/* Castle: gold tower with battlements, same in every land. */}
      <g fill="#f2d878" stroke="#8a6d00" strokeWidth="1">
        <rect x="20" y="22" width="16" height="22" />
        <rect x="17" y="18" width="5" height="6" />
        <rect x="25" y="18" width="5" height="6" />
        <rect x="34" y="18" width="5" height="6" />
        <rect x="26" y="32" width="4" height="12" fill="#8a6d00" stroke="none" />
      </g>
      {land === 'Sapphire Forest' && (
        <g>
          <g fill="#0f4d28">
            <path d="M8 44 L13 30 L18 44 Z" />
            <path d="M38 44 L43 30 L48 44 Z" />
          </g>
          {/* Drifting mist between the pines. */}
          <ellipse className="map-mist" cx="28" cy="46" rx="18" ry="3" fill="#fff" opacity="0.5" />
        </g>
      )}
      {land === 'Crystal Shores' && (
        <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
          <path className="map-wave" d="M6 48 Q12 44 18 48 Q24 52 30 48" />
          <path className="map-wave" d="M26 48 Q32 44 38 48 Q44 52 50 48" />
        </g>
      )}
      {land === 'Navy Peaks' && (
        <g>
          <g fill="#fff">
            <path d="M6 46 L16 28 L26 46 Z" />
            <path d="M30 46 L40 24 L50 46 Z" />
          </g>
          {/* Twinkling stars over the peaks. */}
          <g fill="#f2d878">
            <circle className="map-twinkle" cx="12" cy="10" r="1.6" />
            <circle className="map-twinkle" cx="28" cy="7" r="1.3" />
            <circle className="map-twinkle" cx="45" cy="12" r="1.6" />
          </g>
        </g>
      )}
    </svg>
  );
}

// Illustrated scene strip for one step, round 4 (Derek, Nov 25, 2026):
// "It's the map strips" – the old ~72px strips were sparse and
// unreadable on his phone: tiny flag tick, one thin arc for a trail,
// empty Step 4 sky, clipped sun. This version is TALLER (120px) and
// much simpler: FEWER, BIGGER shapes, one land per strip, instantly
// recognisable. Forest = big pines + green ground. Shores = blue
// water waves + sand. Peaks = big snow-capped mountains + stars.
// Castle = BIG gold castle with a large waving red flag, boss steps
// only. Signpost = BIG brown signpost with an arrow board, walk
// steps only. Never both. The dirt trail is a WIDE tan path with a
// dashed centre line, snaking across the strip. The big red arrow
// is GONE from inside the strip (it duplicated the gutter arrows
// and confused the picture). The sun sits fully inside the strip,
// never clipped. Every strip also gets a plain-words label directly
// under it, so nobody has to guess what the picture is. Flat style,
// land colours, no new images.
const STRIP_LABEL: Record<number, string> = {
  1: 'Sapphire Forest, start here',
  2: 'Forest Castle, Week 4 boss waits here',
  3: 'Crystal Shores',
  4: 'Lake Castle, Week 8 boss waits here',
  5: 'Navy Peaks',
  6: 'Navy Castle, Week 12 boss waits here',
};

function TrailScene({ step }: { step: number }) {
  // Round 5 (Derek, Nov 25, 2026): "They look good but some repeat".
  // Steps 1/2 were both Sapphire Forest, 3/4 both Crystal Shores, 5/6
  // both Navy Peaks, differing only in castle vs signpost. Now EACH
  // step is its own scene: same land family, different picture.
  // Vary: terrain layout, castle design, signpost style and position,
  // trail shape, sun/moon/stars, and one unique landmark per step.
  // Step 1: wooden start gate. Step 2: Forest Castle with a moat.
  // Step 3: wooden bridge over the water. Step 4: Lake Castle with
  // a waterfall. Step 5: mountain trail with a stone cairn. Step 6:
  // Navy Castle on the summit with a beacon torch.
  // Desktop slice crop: at desktop width preserveAspectRatio="slice"
  // shows only the middle ~60 units (y30 to y90) of the 120-unit
  // viewBox, so the flag, sun, and castle tops all sit at y32 or
  // lower in this version. Nothing important lives above y30.
  const land = LAND_FOR_STEP[step];
  const theme = LAND_THEME[land];
  const ground: Record<number, string> = { 1: '#4c8a4f', 2: '#3f7a44', 3: '#e8d9a8', 4: '#d9c98f', 5: '#7d8ea3', 6: '#5a6b7d' };
  // One trail path per step, all wide tan dirt with a dashed centre.
  const trail: Record<number, string> = {
    1: 'M-10 106 C 60 86, 130 110, 200 90 S 310 84, 370 102',
    2: 'M-10 96 C 70 112, 140 82, 210 98 S 310 112, 370 94',
    3: 'M-10 108 C 60 96, 110 78, 160 70 S 250 70, 300 88 S 340 100, 370 104',
    4: 'M-10 102 C 70 86, 140 106, 210 90 S 310 82, 370 100',
    5: 'M-10 110 L 70 88 L 140 104 L 210 82 L 290 98 L 370 86',
    6: 'M-10 112 C 80 102, 150 82, 220 86 S 310 96, 370 90',
  };
  const d = trail[step];
  return (
    <svg width="100%" height="120" viewBox="0 0 360 120" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${land} trail scene`} style={{ display: 'block', borderRadius: 12, border: `2px solid ${theme.border}` }}>
      <rect width="360" height="120" fill={theme.tint} />
      <rect x="0" y="82" width="360" height="38" fill={ground[step]} />
      {/* Step 1: Sapphire Forest, start gate. Sun low and left, two
          pines centre-right, wooden gate with a hanging sign, left. */}
      {step === 1 && (
        <g>
          <circle cx="128" cy="44" r="10" fill="#f2d878" stroke="#c9a227" strokeWidth="1.5" />
          <g fill={theme.deep}>
            <path d="M170 84 L188 38 L206 84 Z" />
            <path d="M215 84 L233 44 L251 84 Z" />
            <path d="M285 84 L298 52 L311 84 Z" />
          </g>
          <g fill="#5b3a1e">
            <rect x="184" y="82" width="7" height="10" />
            <rect x="229" y="82" width="7" height="10" />
            <rect x="294" y="82" width="7" height="10" />
          </g>
          <g fill="#5b3a1e">
            <rect x="14" y="40" width="8" height="54" />
            <rect x="66" y="40" width="8" height="54" />
            <rect x="8" y="34" width="72" height="10" />
          </g>
          <rect x="28" y="48" width="32" height="16" fill="#1e7a46" stroke="#0f4d28" strokeWidth="1.5" />
          <path d="M52 53 L60 56 L52 59 Z" fill="#fff" />
        </g>
      )}
      {/* Step 2: Forest Castle with a moat. Stone base, wooden top,
          green banner, red flag, blue moat in front, one tall pine. */}
      {step === 2 && (
        <g>
          <circle cx="210" cy="44" r="10" fill="#f2d878" stroke="#c9a227" strokeWidth="1.5" />
          <g fill={theme.deep}>
            <path d="M168 84 L188 36 L208 84 Z" />
            <path d="M248 84 L264 50 L280 84 Z" />
          </g>
          <g fill="#5b3a1e">
            <rect x="184" y="82" width="7" height="10" />
            <rect x="260" y="82" width="7" height="10" />
          </g>
          <g fill="#9a8a68" stroke="#6b5a3a" strokeWidth="1.5">
            <rect x="12" y="52" width="72" height="40" />
            <rect x="6" y="44" width="10" height="10" />
            <rect x="28" y="44" width="10" height="10" />
            <rect x="50" y="44" width="10" height="10" />
            <rect x="72" y="44" width="10" height="10" />
          </g>
          <rect x="18" y="44" width="60" height="12" fill="#5b3a1e" />
          <rect x="36" y="58" width="12" height="22" fill="#1e7a46" stroke="#0f4d28" strokeWidth="1" />
          <rect x="42" y="72" width="12" height="20" fill="#6b5a3a" stroke="none" />
          <rect x="44" y="32" width="3" height="22" fill="#124571" />
          <path d="M47 32 L78 39 L47 47 Z" fill="#a83232" stroke="#7d2424" strokeWidth="1" />
          <rect x="6" y="94" width="84" height="12" fill="#4a90d9" />
          <path d="M14 100 Q24 96 34 100 Q44 104 54 100 Q64 96 74 100" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {/* Step 3: Crystal Shores, wooden bridge. Water band, waves,
          arched plank bridge centre, signpost on the RIGHT pointing
          back along the trail. */}
      {step === 3 && (
        <g>
          <circle cx="84" cy="44" r="10" fill="#f2d878" stroke="#c9a227" strokeWidth="1.5" />
          <rect x="0" y="54" width="360" height="30" fill="#4a90d9" />
          <g fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round">
            <path className="map-wave" d="M20 64 Q40 56 60 64 Q80 72 100 64" />
            <path className="map-wave" d="M280 74 Q300 66 320 74 Q340 82 355 74" />
          </g>
          <g fill="#5b3a1e">
            <rect x="308" y="48" width="7" height="44" fill="#5b3a1e" />
          </g>
          <path d="M312 52 L262 52 L250 61 L262 70 L312 70 Z" fill="#8a6238" stroke="#5b3a1e" strokeWidth="1.5" />
          <path d="M258 57 L268 61 L258 65 Z" fill="#fff" />
        </g>
      )}
      {/* Step 4: Lake Castle with a waterfall. Tall blue tower, lower
          wall, blue banner, red flag, white waterfall into a pool. */}
      {step === 4 && (
        <g>
          <circle cx="190" cy="44" r="10" fill="#f2d878" stroke="#c9a227" strokeWidth="1.5" />
          <rect x="0" y="54" width="360" height="30" fill="#4a90d9" />
          <g fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
            <path className="map-wave" d="M180 64 Q200 56 220 64 Q240 72 260 64" />
            <path className="map-wave" d="M260 74 Q280 66 300 74 Q320 82 340 74" />
          </g>
          <ellipse cx="210" cy="98" rx="95" ry="12" fill="#4a90d9" />
          <g fill="#5a7fa6" stroke="#2f4d6b" strokeWidth="1.5">
            <rect x="12" y="40" width="34" height="52" />
            <rect x="8" y="34" width="9" height="8" />
            <rect x="22" y="34" width="9" height="8" />
            <rect x="36" y="34" width="9" height="8" />
            <rect x="46" y="58" width="48" height="34" fill="#6b8fb5" />
          </g>
          <rect x="24" y="56" width="10" height="20" fill="#2f6fd0" stroke="#1d4fa1" strokeWidth="1" />
          <rect x="28" y="32" width="3" height="22" fill="#124571" />
          <path d="M31 32 L62 39 L31 47 Z" fill="#a83232" stroke="#7d2424" strokeWidth="1" />
          <rect x="94" y="58" width="18" height="34" fill="#bfe3f5" stroke="#fff" strokeWidth="1" />
          <path d="M99 62 L99 88 M105 62 L105 88 M111 62 L111 88" stroke="#fff" strokeWidth="2" />
        </g>
      )}
      {/* Step 5: Navy Peaks, cairn. Pale moon, stars, two big peaks,
          stacked stone cairn left, zigzag mountain trail. */}
      {step === 5 && (
        <g>
          <circle cx="290" cy="44" r="10" fill="#f2f0d8" stroke="#c9a227" strokeWidth="1.5" />
          <g fill="#f2d878">
            <circle className="map-twinkle" cx="120" cy="38" r="2.2" />
            <circle className="map-twinkle" cx="180" cy="46" r="1.8" />
            <circle className="map-twinkle" cx="240" cy="36" r="2.2" />
          </g>
          <g fill="#eef3f8" stroke={theme.deep} strokeWidth="1.5">
            <path d="M110 84 L170 34 L230 84 Z" />
            <path d="M220 84 L270 44 L320 84 Z" />
          </g>
          <g fill="#fff">
            <path d="M170 34 L184 52 L170 47 L156 54 Z" />
            <path d="M270 44 L281 60 L270 56 L259 61 Z" />
          </g>
          <g fill="#8a9aa8" stroke="#5a6b7d" strokeWidth="1.5">
            <rect x="20" y="76" width="48" height="16" />
            <rect x="28" y="62" width="32" height="14" />
            <rect x="36" y="50" width="16" height="12" />
          </g>
        </g>
      )}
      {/* Step 6: Navy Castle on the summit, beacon torch. Dark navy
          twin towers, gold banner, red flag, flaming beacon, rock
          platform under the castle, one peak behind. */}
      {step === 6 && (
        <g>
          <g fill="#f2d878">
            <circle className="map-twinkle" cx="150" cy="38" r="2.2" />
            <circle className="map-twinkle" cx="210" cy="46" r="1.8" />
            <circle className="map-twinkle" cx="320" cy="36" r="2.2" />
          </g>
          <g fill="#eef3f8" stroke={theme.deep} strokeWidth="1.5">
            <path d="M180 84 L225 40 L270 84 Z" />
          </g>
          <path d="M225 40 L236 54 L225 50 L214 56 Z" fill="#fff" />
          <path d="M0 120 L0 94 L140 84 L220 84 L360 96 L360 120 Z" fill="#5a6b7d" />
          <g fill="#124571" stroke="#0b2f4d" strokeWidth="1.5">
            <rect x="16" y="44" width="22" height="48" />
            <rect x="72" y="44" width="22" height="48" />
            <rect x="38" y="58" width="34" height="34" fill="#1d4f7a" />
            <rect x="12" y="38" width="8" height="8" />
            <rect x="26" y="38" width="8" height="8" />
            <rect x="76" y="38" width="8" height="8" />
            <rect x="90" y="38" width="8" height="8" />
          </g>
          <rect x="48" y="62" width="14" height="20" fill="#c9a227" stroke="#8a6d00" strokeWidth="1" />
          <rect x="52" y="76" width="10" height="16" fill="#0b2f4d" stroke="none" />
          <rect x="54" y="32" width="3" height="22" fill="#124571" />
          <path d="M57 32 L88 39 L57 47 Z" fill="#a83232" stroke="#7d2424" strokeWidth="1" />
          <rect x="108" y="48" width="4" height="40" fill="#5b3a1e" />
          <path d="M110 34 C 100 44, 104 52, 110 56 C 116 52, 120 44, 110 34 Z" fill="#e86a1e" stroke="#a83232" strokeWidth="1" />
        </g>
      )}
      {/* Dirt trail, per step, drawn over the ground and under the
          landmark where they overlap. Step 3's bridge is drawn over
          the trail, below, so the path crosses the water on it. */}
      <path d={d} fill="none" stroke="#d9b96a" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#8a6d00" strokeWidth="2.5" strokeDasharray="10 8" strokeLinecap="round" strokeLinejoin="round" />
      {step === 2 && (
        <g>
          <rect x="6" y="104" width="84" height="14" fill="#4a90d9" />
          <path d="M14 111 Q24 107 34 111 Q44 115 54 111 Q64 107 74 111" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <rect x="38" y="102" width="22" height="6" fill="#8a6238" stroke="#5b3a1e" strokeWidth="1" />
        </g>
      )}
      {step === 4 && (
        <ellipse cx="215" cy="109" rx="80" ry="8" fill="#4a90d9" />
      )}
      {step === 3 && (
        <g>
          <path d="M130 84 Q195 52 260 84" fill="none" stroke="#8a6238" strokeWidth="10" strokeLinecap="round" />
          <g fill="#5b3a1e">
            <rect x="136" y="62" width="6" height="24" />
            <rect x="192" y="54" width="6" height="30" />
            <rect x="248" y="62" width="6" height="24" />
          </g>
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

// Pin centre, in px from the top of a step row: pin top 14 + half of 34.
const PIN_Y = 31;

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
          boxShadow: '0 2px 10px rgba(18,69,113,0.25)',
        }}
      >
        You are here: {hereLand} · {weekLabel(week)}
      </p>
      <p className="small muted" style={{ textAlign: 'center', margin: '0 0 12px' }}>
        The map runs bottom to top. Follow the trail up, one step at a time, to the castle at the top.
      </p>
      <div>
        {/* One step row: a trail gutter on the left (the path, its
            arrows, and the step pin, all OUTSIDE the card so nothing
            clips them) and the step's scene card on the right. */}
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
          const theme = LAND_THEME[LAND_FOR_STEP[s.n]];
          const isBossStep = !!boss;
          const isFirst = idx === 0;
          const isLast = idx === shown.length - 1;
          // Trail pieces in the gutter. The trail starts at the top
          // step's pin and ends at the bottom step's pin. Red is the
          // path travelled (from Step 1 up to You are here), grey is
          // the path ahead. On the current row the red runs below the
          // pin and the grey above it, so the red ends exactly where
          // you are.
          const trailTop = isFirst ? PIN_Y : 0;
          const trailBottom = isLast ? `calc(100% - ${PIN_Y}px)` : 0;
          return (
            <div key={s.n} style={{ display: 'flex', marginBottom: 12, alignItems: 'stretch' }}>
              {/* Trail gutter: 56px wide, nothing here is clipped. */}
              <div aria-hidden style={{ position: 'relative', width: 56, flexShrink: 0 }}>
                {status === 'done' && (
                  <div style={{ position: 'absolute', left: 25, top: trailTop, bottom: trailBottom, width: 6, background: '#a83232', borderRadius: 3, boxShadow: '0 0 6px rgba(168,50,50,0.55)' }} />
                )}
                {status === 'current' && (
                  <>
                    {!isFirst && (
                      <div style={{ position: 'absolute', left: 25, top: 0, height: PIN_Y, width: 6, background: '#d7e3ee', borderRadius: 3 }} />
                    )}
                    <div style={{ position: 'absolute', left: 25, top: PIN_Y, bottom: trailBottom, width: 6, background: '#a83232', borderRadius: 3, boxShadow: '0 0 6px rgba(168,50,50,0.55)' }} />
                  </>
                )}
                {(status === 'next' || status === 'locked') && (
                  <div style={{ position: 'absolute', left: 25, top: trailTop, bottom: trailBottom, width: 6, background: '#d7e3ee', borderRadius: 3 }} />
                )}
                {/* Arrow on the trail, pointing UP the way to go. Red
                    on travelled trail, grey on the path ahead. */}
                <div style={{ position: 'absolute', left: 20, top: '62%', fontSize: 16, lineHeight: 1, color: status === 'done' || status === 'current' ? '#a83232' : '#8a9aa8', fontWeight: 700 }}>▲</div>
                {/* Step number as a map pin on the trail. Done = green
                    pin with a tick, current = gold pin, next = navy,
                    locked = grey. Number upright and bold inside. */}
                <div
                  style={{
                    position: 'absolute',
                    left: 11,
                    top: 14,
                    width: 34,
                    height: 34,
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(-45deg)',
                    background: isDone ? '#1e7a46' : isCurrent ? '#c9a227' : status === 'locked' ? '#8a9aa8' : '#124571',
                    color: isCurrent ? '#124571' : '#fff',
                    border: '2px solid #fff',
                    boxShadow: isCurrent ? '0 0 12px rgba(201,162,39,0.7)' : '0 2px 6px rgba(18,69,113,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* inline-block: transforms do nothing on an inline
                      span, so without this the digit would stay
                      rotated -45deg. */}
                  <span style={{ display: 'inline-block', transform: 'rotate(45deg)', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>{isDone ? '✓' : s.n}</span>
                </div>
              </div>
              {/* Step scene card. */}
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  minWidth: 0,
                  padding: 12,
                  paddingTop: 18,
                  overflow: 'hidden',
                  // Each land has its own terrain tint; boss steps get a
                  // red-tinted wash over it so they read as boss steps.
                  background: isCurrent
                    ? '#fffdf4'
                    : isBossStep
                      ? `linear-gradient(180deg, ${theme.tint}, #fbe9e7)`
                      : theme.tint,
                  border: isCurrent
                    ? '3px solid #c9a227'
                    : isBossStep
                      ? '2px solid #a83232'
                      : `2px solid ${theme.border}`,
                  borderRadius: 16,
                  opacity: status === 'locked' ? 0.55 : 1,
                  boxShadow: isCurrent
                    ? '0 4px 18px rgba(201,162,39,0.45)'
                    : isBossStep
                      ? '0 2px 10px rgba(168,50,50,0.25)'
                      : '0 1px 4px rgba(18,69,113,0.12)',
                }}
              >
                {/* Terrain band across the top of the card, in the land colour. */}
                <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 7, background: theme.border }} />
                {/* Illustrated trail scene for this step. The monster
                    stands ON the trail here, at the right end of the
                    scene, on boss steps. */}
                <div style={{ position: 'relative', marginBottom: 4 }}>
                  <TrailScene step={s.n} />
                  {boss && (
                    <div style={{ position: 'absolute', right: 8, top: 8, width: 56, height: 56, borderRadius: '50%', background: '#fff3c4', boxShadow: '0 0 0 2px rgba(168,50,50,0.75), 0 0 12px rgba(168,50,50,0.45)' }}>
                      <BossAvatar id={BOSS_AVATAR[boss.id] || 'the-slump'} />
                    </div>
                  )}
                </div>
                {/* Plain-words label for the strip, directly under it,
                    so nobody has to guess what the picture is. */}
                <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#124571' }}>{STRIP_LABEL[s.n]}</p>
                <p style={{ margin: '0 0 4px' }}>
                  <strong>Step {s.n}: {s.title}</strong>{' '}
                  <span
                    className="pill"
                    style={isCurrent ? { background: '#124571', color: '#fff', borderColor: '#124571' } : {}}
                  >
                    {statusText[status]}
                  </span>
                  {isCurrent && (
                    <svg className="map-flag" aria-hidden width="20" height="20" viewBox="0 0 20 20" style={{ verticalAlign: '-4px', marginLeft: 4 }}>
                      <rect x="4" y="2" width="2" height="16" fill="#124571" />
                      <path d="M6 3 L17 6 L6 10 Z" fill="#c9a227" stroke="#8a6d00" strokeWidth="0.8" />
                    </svg>
                  )}
                </p>
                <p className="small" style={{ margin: '0 0 8px' }}>{s.doLine}</p>
                {/* Pictures for this step: land badge and companion
                    portraits along the trail. Met companions show their
                    picture, unmet ones show a grey ? portrait, never a
                    blank. The boss portrait is up in the scene above,
                    so its health bar and line sit here, full width. */}
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
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <p className="small" style={{ margin: '0 0 4px' }}>
                        ★ Boss, Week {boss.week}: {bossBeaten ? 'Beaten.' : `${bossHpLeft} of ${boss.maxHp} HP`}
                      </p>
                      <div className="progress-bar boss-bar" style={{ width: '100%' }} role="img" aria-label={`${bossHpLeft} of ${boss.maxHp} HP`}>
                        <div style={{ width: `${(bossHpLeft / boss.maxHp) * 100}%` }} />
                      </div>
                      {isBossStep && (
                        <p className="small muted" style={{ margin: '4px 0 0' }}>{CASTLE_NAME[LAND_FOR_STEP[s.n]]} is at the end of this land. Beat the boss to open the next land.</p>
                      )}
                    </div>
                  )}
                </div>
                {companions.some((c) => !met.has(c.id)) && (
                  <p className="small muted" style={{ margin: '8px 0 0' }}>A ? is someone you have not met yet.</p>
                )}
              </div>
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
        <div><strong>Arrows:</strong> follow the arrows up the trail, one step at a time, to the castle at the top</div>
        <div><strong>Castles:</strong> a castle stands at the end of each land, where the boss waits</div>
        <div><strong>Pictures:</strong> each step shows its land, its companions, and its boss on the trail</div>
        <div><strong>Red star:</strong> boss round, at Weeks 4, 8, and 12</div>
        <div><strong>Red bar:</strong> boss health. It drops every time you hit the boss with a spell, and hits 0 when you beat it</div>
        <div><strong>Name:</strong> a companion you met. A ? is someone you have not met yet</div>
        <div><strong>Green tick:</strong> a step you have finished. You are here is the step with the gold border</div>
      </div>
    </div>
  );
}
