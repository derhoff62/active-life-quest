// Visual Journey map: pure SVG, no external images. Three lands in order,
// connected by a winding gold path, with castles, boss markers at Weeks
// 4/8/12, companion markers where they are met, and a "You are here" marker.
// Done lands look bright and checked, the current land glows, future lands
// are dimmed. The text lists stay below the map.
//
// Art direction: epic LOTR / Eragon / Elden Ring, warm and
// beginner-friendly, never grimdark. Sapphire Forest: layered pines, a
// river, drifting mist. Crystal Shores: waves, sand, shells, a lake with
// reflections. Navy Peaks: layered snow-capped mountains, clouds, a golden
// sky glow like a far-off Erdtree light.
import { CREATURES, BOSS_ROUNDS } from '../lib/data';
import { weekLabel } from '../lib/yearPlan';

// Every map label sits on a solid white pill with a dark navy border and
// dark navy text, so it stays readable on any land colour, even where the
// gold path, a castle, or a dot passes behind it. Pills are opaque, so
// nothing underneath shows through the text.
function MapLabel({
  x,
  y,
  w,
  h = 22,
  fontSize = 12,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  fontSize?: number;
  children: string;
}) {
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height={h} rx={h / 2} fill="#ffffff" stroke="#124571" strokeWidth="1.5" />
      <text x={x} y={y + h / 2 + fontSize * 0.35} textAnchor="middle" fontSize={fontSize} fontWeight="700" fill="#124571">
        {children}
      </text>
    </g>
  );
}

function weekToY(week: number): number {
  if (week <= 4) return 40 + (week - 1) * 38;
  if (week <= 8) return 216 + (week - 5) * 38;
  return 396 + (week - 9) * 38;
}

// A pine tree: layered triangles, a trunk, and a soft shadow, so the
// forest reads as trees, not flat triangles.
function Pine({ x, y, s = 1, tone = '#1e7a46' }: { x: number; y: number; s?: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="26" rx="12" ry="3" fill="#124571" opacity="0.12" />
      <rect x="-2.5" y="14" width="5" height="12" fill="#5b3a1e" />
      <polygon points="0,-16 11,6 -11,6" fill={tone} />
      <polygon points="0,-8 13,14 -13,14" fill={tone} opacity="0.85" />
      <polygon points="0,-2 14,20 -14,20" fill={tone} opacity="0.7" />
      <circle cx="-3" cy="2" r="1.6" fill="#c9a227" opacity="0.9" />
      <circle cx="4" cy="10" r="1.6" fill="#c9a227" opacity="0.9" />
    </g>
  );
}

function Castle({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      {/* Stone shading and a gold-trimmed base, so the castle reads as a
          built place, not a flat block. */}
      <ellipse cx={x} cy={y + 20} rx="24" ry="4" fill="#124571" opacity="0.12" />
      <rect x={x - 16} y={y - 6} width="32" height="26" rx="3" fill={color} stroke="#124571" strokeWidth="1.5" />
      <rect x={x - 16} y={y - 6} width="32" height="6" fill="#ffffff" opacity="0.18" />
      <rect x={x - 16} y={y + 14} width="32" height="6" fill="#c9a227" opacity="0.85" />
      {/* Crenellations on the main keep. */}
      <rect x={x - 16} y={y - 12} width="6" height="6" fill={color} stroke="#124571" strokeWidth="1" />
      <rect x={x - 3} y={y - 12} width="6" height="6" fill={color} stroke="#124571" strokeWidth="1" />
      <rect x={x + 10} y={y - 12} width="6" height="6" fill={color} stroke="#124571" strokeWidth="1" />
      {/* Side towers with pointed roofs. */}
      <rect x={x - 22} y={y - 14} width="10" height="32" fill={color} stroke="#124571" strokeWidth="1.5" />
      <polygon points={`${x - 23},${y - 14} ${x - 17},${y - 24} ${x - 11},${y - 14}`} fill="#a83232" />
      <rect x={x + 12} y={y - 14} width="10" height="32" fill={color} stroke="#124571" strokeWidth="1.5" />
      <polygon points={`${x + 11},${y - 14} ${x + 17},${y - 24} ${x + 23},${y - 14}`} fill="#a83232" />
      {/* Lit windows and a gold-trimmed door. */}
      <rect x={x - 10} y={y - 2} width="5" height="7" rx="2" fill="#ffe9a8" stroke="#124571" strokeWidth="0.8" />
      <rect x={x + 5} y={y - 2} width="5" height="7" rx="2" fill="#ffe9a8" stroke="#124571" strokeWidth="0.8" />
      <rect x={x - 4} y={y + 6} width="8" height="12" rx="3" fill="#124571" stroke="#c9a227" strokeWidth="1" />
      {/* Flag on a tall pole, waving in the breeze. */}
      <rect x={x - 1} y={y - 30} width="2" height="20" fill="#5b3a1e" />
      <polygon className="map-flag" points={`${x + 1},${y - 30} ${x + 15},${y - 26} ${x + 1},${y - 22}`} fill="#c9a227" />
    </g>
  );
}

export default function JourneyMap({
  currentWeek,
  met,
  bossHp,
}: {
  currentWeek: number;
  met: Set<string>;
  bossHp: Record<string, number>;
}) {
  const landState = (from: number, to: number): 'done' | 'current' | 'future' =>
    currentWeek > to ? 'done' : currentWeek >= from ? 'current' : 'future';
  const lands = [
    { from: 1, to: 4, y: 8, h: 170, fill: 'url(#forestGrad)', label: 'Sapphire Forest', sub: 'Forest Castle · Weeks 1 to 4' },
    { from: 5, to: 8, y: 186, h: 170, fill: 'url(#shoresGrad)', label: 'Crystal Shores', sub: 'Lake Castle · Weeks 5 to 8' },
    { from: 9, to: 12, y: 364, h: 186, fill: 'url(#peaksGrad)', label: 'Navy Peaks', sub: 'Navy Castle · Weeks 9 to 12' },
  ];
  const castles = [
    { x: 248, y: 96, color: '#1e7a46' },
    { x: 112, y: 272, color: '#2f6fd0' },
    { x: 248, y: 452, color: '#3a4a5a' },
  ];
  const hereY = weekToY(Math.min(12, Math.max(1, currentWeek)));
  const hereLand = lands.find((l) => currentWeek >= l.from && currentWeek <= l.to) ?? lands[0];
  // The shield marks the current week, but it must never sit on the land
  // title pills at the top of its land. If the week point falls in the
  // title band (top 80px of the land), drop the shield just below it.
  const shieldY = hereY <= hereLand.y + 80 ? hereLand.y + 84 : hereY;

  return (
    <div>
      {/* "You are here" as a real HTML pill above the map, so it can never
          be clipped by the SVG or overlapped by dots and the path. */}
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
        You are here: {hereLand.label} · {weekLabel(currentWeek)}
      </p>
      <svg width="100%" viewBox="0 0 360 560" role="img" aria-label="Journey map: three lands, Forest, Shores, and Peaks" style={{ display: 'block', maxWidth: 420, margin: '0 auto' }}>
        <defs>
          <linearGradient id="forestGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d9f2e2" />
            <stop offset="55%" stopColor="#b8e6c8" />
            <stop offset="100%" stopColor="#8fd0a8" />
          </linearGradient>
          <linearGradient id="shoresGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fdf3d0" />
            <stop offset="45%" stopColor="#cfe6f5" />
            <stop offset="100%" stopColor="#8fc3e8" />
          </linearGradient>
          <linearGradient id="peaksGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe9a8" />
            <stop offset="40%" stopColor="#dbe4ef" />
            <stop offset="100%" stopColor="#aebfd4" />
          </linearGradient>
          <linearGradient id="riverGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7fb8e8" />
            <stop offset="50%" stopColor="#cfe6f5" />
            <stop offset="100%" stopColor="#7fb8e8" />
          </linearGradient>
          <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c9a227" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#c9a227" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bossGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e8702a" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#e8702a" stopOpacity="0" />
          </radialGradient>
          <filter id="softGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Golden sky glow over the Peaks, like a far-off golden light. */}
        <ellipse cx="180" cy="380" rx="150" ry="40" fill="url(#goldGlow)" />

        {lands.map((l) => {
          const state = landState(l.from, l.to);
          return (
            <g key={l.label}>
              {/* Only the land itself is dimmed when it is in the future.
                  The title pills are drawn in a separate top layer below,
                  at full strength, so a future land stays readable. */}
              <rect x="8" y={l.y} width="344" height={l.h} rx="16" fill={l.fill} stroke={state === 'current' ? '#c9a227' : '#d7e3ee'} strokeWidth={state === 'current' ? 3 : 1.5} opacity={state === 'future' ? 0.55 : 1} />
              {state === 'current' && (
                <rect className="map-land-glow" x="8" y={l.y} width="344" height={l.h} rx="16" fill="none" stroke="#c9a227" strokeWidth="3" />
              )}
              {state === 'done' && (
                <g>
                  <circle cx="330" cy={l.y + 22} r="10" fill="#1e7a46" stroke="#fff" strokeWidth="2" />
                  <text x="330" y={l.y + 26} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">✓</text>
                </g>
              )}
            </g>
          );
        })}

        {/* ---- Sapphire Forest scenery: layered pines, a winding river,
            drifting mist, and golden leaves. ---- */}
        <g>
          <Pine x={42} y={150} s={1.15} />
          <Pine x={318} y={150} s={1.05} tone="#2a8a52" />
          <Pine x={66} y={128} s={0.75} tone="#2a8a52" />
          <Pine x={296} y={126} s={0.7} />
          <path d="M14 168 Q60 158 110 168 T210 168 T346 168" fill="none" stroke="url(#riverGrad)" strokeWidth="10" strokeLinecap="round" opacity="0.9" />
          <path className="map-wave" d="M30 168 Q60 162 90 168 T150 168 T210 168 T270 168 T330 168" fill="none" stroke="#fff" strokeWidth="2" opacity="0.8" />
          <ellipse className="map-mist" cx="90" cy="140" rx="34" ry="7" fill="#fff" opacity="0.55" />
          <ellipse className="map-mist" cx="270" cy="156" rx="28" ry="6" fill="#fff" opacity="0.45" />
          <circle className="map-twinkle" cx="150" cy="120" r="2.5" fill="#c9a227" />
          <circle className="map-twinkle" cx="210" cy="138" r="2" fill="#c9a227" />
          <circle className="map-twinkle" cx="120" cy="150" r="2" fill="#fff" />
        </g>

        {/* ---- Crystal Shores scenery: sand, waves, shells, and a lake
            with reflections. ---- */}
        <g>
          <ellipse cx="180" cy="352" rx="160" ry="16" fill="#fdf3d0" opacity="0.85" />
          <path d="M14 236 Q60 226 110 236 T210 236 T346 236" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" opacity="0.8" />
          <path className="map-wave" d="M14 250 Q60 242 110 250 T210 250 T346 250" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
          <path className="map-wave" d="M14 264 Q60 258 110 264 T210 264 T346 264" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
          <path d="M30 300 Q90 292 150 300 T260 300 T340 300" fill="none" stroke="#7fb8e8" strokeWidth="2" opacity="0.6" />
          <path d="M50 318 Q110 312 170 318 T290 318" fill="none" stroke="#fff" strokeWidth="2" opacity="0.6" />
          <g>
            <circle cx="36" cy="330" r="6" fill="#fff" stroke="#c9a227" strokeWidth="1.5" />
            <circle cx="36" cy="330" r="2.5" fill="#c9a227" />
            <circle cx="326" cy="322" r="5" fill="#ffe9a8" stroke="#c9a227" strokeWidth="1.5" />
            <path d="M318 342 q4 -6 8 0 q-4 4 -8 0" fill="#fff" stroke="#c9a227" strokeWidth="1.2" />
          </g>
        </g>

        {/* ---- Navy Peaks scenery: layered snow-capped mountains, clouds,
            and a golden sky. ---- */}
        <g>
          <polygon points="24,550 80,436 136,550" fill="#6b7f96" />
          <polygon points="68,464 80,436 92,464 86,456 80,466 74,456" fill="#fff" />
          <polygon points="120,550 180,420 240,550" fill="#3a4a5a" />
          <polygon points="164,452 180,420 196,452 188,442 180,454 172,442" fill="#fff" />
          <polygon points="226,550 288,442 350,550" fill="#5b6b7a" />
          <polygon points="274,470 288,442 302,470 294,462 288,472 282,462" fill="#fff" />
          <ellipse className="map-mist" cx="80" cy="410" rx="36" ry="8" fill="#fff" opacity="0.7" />
          <ellipse className="map-mist" cx="280" cy="400" rx="30" ry="7" fill="#fff" opacity="0.6" />
          <circle className="map-twinkle" cx="180" cy="386" r="3" fill="#c9a227" />
          <circle className="map-twinkle" cx="150" cy="400" r="2" fill="#fff" />
          <circle className="map-twinkle" cx="220" cy="404" r="2" fill="#fff" />
        </g>

        {/* Winding golden road: a stone underlay, a gold centre, paving
            stones, and a glowing trail, with footprints along the way. */}
        <path d="M180 30 C 110 80 250 120 180 170 C 110 220 250 260 180 310 C 110 360 250 400 180 450 C 140 490 220 520 180 545" fill="none" stroke="#8a6d1f" strokeWidth="11" strokeLinecap="round" opacity="0.35" />
        <path d="M180 30 C 110 80 250 120 180 170 C 110 220 250 260 180 310 C 110 360 250 400 180 450 C 140 490 220 520 180 545" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" opacity="0.9" />
        <path className="map-path-glow" d="M180 30 C 110 80 250 120 180 170 C 110 220 250 260 180 310 C 110 360 250 400 180 450 C 140 490 220 520 180 545" fill="none" stroke="#c9a227" strokeWidth="5" strokeLinecap="round" />
        <path d="M180 30 C 110 80 250 120 180 170 C 110 220 250 260 180 310 C 110 360 250 400 180 450 C 140 490 220 520 180 545" fill="none" stroke="#7a5c00" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 14" opacity="0.7" />
        <g fill="#8a6d1f" opacity="0.8">
          <ellipse cx="168" cy="70" rx="3" ry="4.5" transform="rotate(-18 168 70)" />
          <ellipse cx="192" cy="92" rx="3" ry="4.5" transform="rotate(14 192 92)" />
          <ellipse cx="170" cy="240" rx="3" ry="4.5" transform="rotate(-14 170 240)" />
          <ellipse cx="192" cy="262" rx="3" ry="4.5" transform="rotate(18 192 262)" />
          <ellipse cx="168" cy="420" rx="3" ry="4.5" transform="rotate(-16 168 420)" />
          <ellipse cx="192" cy="444" rx="3" ry="4.5" transform="rotate(12 192 444)" />
        </g>

        {castles.map((c) => <Castle key={c.y} x={c.x} y={c.y} color={c.color} />)}

        {/* Boss markers at Weeks 4, 8, 12: glowing red stars. The map
            shows Cycle 1 only; later cycles repeat the road with new lands
            and boss rounds, listed in the year road below the map. */}
        {BOSS_ROUNDS.filter((r) => r.week <= 12).map((r) => {
          const hp = bossHp[r.id] ?? r.maxHp;
          const beaten = hp <= 0;
          const y = weekToY(r.week);
          return (
            <g key={r.id}>
              {!beaten && <circle className="map-boss-glow" cx="180" cy={y} r="16" fill="url(#bossGlow)" />}
              <circle cx="180" cy={y} r="12" fill={beaten ? '#1e7a46' : '#a83232'} stroke="#fff" strokeWidth="2" filter="url(#softGlow)" />
              <text x="180" y={y + 4.5} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">{beaten ? '✓' : '★'}</text>
              <MapLabel x={180} y={y + 16} w={180} h={20} fontSize={11}>
                {beaten ? `Week ${r.week} boss beaten` : `Boss · Week ${r.week}`}
              </MapLabel>
            </g>
          );
        })}

        {/* Companion markers where they are met. Kept at the far edges
            (x 52 / 308) so they never overlap the centered land titles.
            The name pill sits below its dot, but if the dot falls in the
            land's title band (top 72px of the land, where the title and
            subtitle pills live) the name pill is pushed just below that
            band. Bram and Sylva meet in Week 1, right in the Forest
            title band, and their pills used to sit under the "Forest
            Castle · Weeks 1 to 4" pill, covering its first and last
            letters. The title pills are drawn last, so a name pill can
            never paint over them, and the name pill can never be
            painted over by them. */}
        {CREATURES.filter((c) => c.meetWeek <= 12).map((c, i) => {
          const isMet = met.has(c.id);
          const y = weekToY(c.meetWeek);
          const x = i % 2 === 0 ? 52 : 308;
          const land = lands.find((l) => c.meetWeek >= l.from && c.meetWeek <= l.to) ?? lands[0];
          const labelY = Math.max(y + 14, land.y + 72);
          return (
            <g key={c.id}>
              {isMet && <circle className="map-companion-glow" cx={x} cy={y} r="13" fill="#124571" opacity="0.25" />}
              <circle cx={x} cy={y} r="9" fill={isMet ? '#124571' : '#9aa5b1'} stroke="#fff" strokeWidth="2" />
              <text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{isMet ? c.name[0] : '?'}</text>
              {isMet && (
                <MapLabel x={x} y={labelY} w={c.name.length * 8 + 24} h={18} fontSize={11}>
                  {c.name}
                </MapLabel>
              )}
            </g>
          );
        })}

        {/* You are here: the shield is centered on the path point, unless
            that point falls in the land's title band, in which case it is
            dropped just below the titles (see shieldY). The words live in
            the HTML pill above the map, not inside the SVG. */}
        <g className="map-you">
          <circle cx="180" cy={shieldY} r="22" fill="#c9a227" opacity="0.35" />
          <path d="M180 0 L196 6 L196 20 Q196 34 180 42 Q164 34 164 20 L164 6 Z" transform={`translate(0 ${shieldY - 21})`} fill="#124571" stroke="#c9a227" strokeWidth="2" />
          <text x="180" y={shieldY + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">★</text>
        </g>

        {/* Land titles, drawn LAST and at full strength, so no path,
            marker, castle, companion dot, or shield can ever cover them.
            The pills are opaque white with dark navy text, even on a
            dimmed future land, so every land stays readable. */}
        {lands.map((l) => (
          <g key={l.label}>
            <MapLabel x={180} y={l.y + 10} w={190} h={24} fontSize={15}>
              {l.label}
            </MapLabel>
            <MapLabel x={180} y={l.y + 38} w={230} h={20} fontSize={11.5}>
              {l.sub}
            </MapLabel>
          </g>
        ))}
      </svg>
      <div className="map-legend">
        <div><strong>Gold line:</strong> your path</div>
        <div><strong>Castle:</strong> each land&apos;s castle</div>
        <div><strong>Red star:</strong> boss round</div>
        <div><strong>Blue dot:</strong> a companion you met</div>
        <div><strong>Shield:</strong> you are here</div>
      </div>
    </div>
  );
}
