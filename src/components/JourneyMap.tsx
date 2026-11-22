// Visual Journey map: pure SVG, no external images. Three lands in order,
// connected by a winding gold path, with castles, boss markers at Weeks
// 4/8/12, companion markers where they are met, and a "You are here" marker.
// Done lands look bright and checked, the current land glows, future lands
// are dimmed. The text lists stay below the map.
import { CREATURES, BOSS_ROUNDS } from '../lib/data';

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

function Castle({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <rect x={x - 14} y={y - 8} width="28" height="26" rx="3" fill={color} stroke="#124571" strokeWidth="1.5" />
      <rect x={x - 18} y={y - 16} width="10" height="12" fill={color} stroke="#124571" strokeWidth="1.5" />
      <rect x={x + 8} y={y - 16} width="10" height="12" fill={color} stroke="#124571" strokeWidth="1.5" />
      <rect x={x - 1} y={y - 26} width="2" height="12" fill="#5b3a1e" />
      <polygon points={`${x + 1},${y - 26} ${x + 13},${y - 22} ${x + 1},${y - 18}`} fill="#c9a227" />
      <rect x={x - 4} y={y + 6} width="8" height="12" rx="3" fill="#124571" />
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
    { from: 1, to: 4, y: 8, h: 170, fill: '#cfeeda', label: 'Sapphire Forest', sub: 'Forest Castle · Weeks 1 to 4' },
    { from: 5, to: 8, y: 186, h: 170, fill: '#cfe6f5', label: 'Crystal Shores', sub: 'Lake Castle · Weeks 5 to 8' },
    { from: 9, to: 12, y: 364, h: 186, fill: '#dbe4ef', label: 'Navy Peaks', sub: 'Navy Castle · Weeks 9 to 12' },
  ];
  const castles = [
    { x: 248, y: 96, color: '#1e7a46' },
    { x: 112, y: 272, color: '#2f6fd0' },
    { x: 248, y: 452, color: '#3a4a5a' },
  ];
  const hereY = weekToY(Math.min(12, Math.max(1, currentWeek)));
  const hereLand = lands.find((l) => currentWeek >= l.from && currentWeek <= l.to) ?? lands[0];

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
        You are here: {hereLand.label} · Week {currentWeek}
      </p>
      <svg width="100%" viewBox="0 0 360 560" role="img" aria-label="Journey map: three lands, Forest, Shores, and Peaks" style={{ display: 'block', maxWidth: 420, margin: '0 auto' }}>
        {lands.map((l) => {
          const state = landState(l.from, l.to);
          return (
            <g key={l.label} opacity={state === 'future' ? 0.55 : 1}>
              <rect x="8" y={l.y} width="344" height={l.h} rx="16" fill={l.fill} stroke={state === 'current' ? '#c9a227' : '#d7e3ee'} strokeWidth={state === 'current' ? 3 : 1.5} />
              {/* Land title and subtitle on solid white pills, centred at the
                  top of the land. The pills are opaque, so the gold path
                  passing behind them never shows through the text. */}
              <MapLabel x={180} y={l.y + 10} w={190} h={24} fontSize={15}>
                {l.label}
              </MapLabel>
              <MapLabel x={180} y={l.y + 38} w={200} h={20} fontSize={11}>
                {l.sub}
              </MapLabel>
              {state === 'done' && (
                <g>
                  <circle cx="330" cy={l.y + 22} r="10" fill="#1e7a46" />
                  <text x="330" y={l.y + 26} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">✓</text>
                </g>
              )}
            </g>
          );
        })}
        {/* Land scenery */}
        <g opacity="0.8">
          <polygon points="40,178 58,128 76,178" fill="#1e7a46" />
          <polygon points="300,178 318,132 336,178" fill="#1e7a46" />
          <path d="M20 220 Q40 212 60 220 T100 220 T140 220 T180 220 T220 220 T260 220 T300 220 T340 220" fill="none" stroke="#fff" strokeWidth="2" opacity="0.7" />
          <polygon points="30,550 90,430 150,550" fill="#5b6b7a" />
          <polygon points="76,462 90,430 104,462 98,454 90,464 82,454" fill="#fff" />
          <polygon points="220,550 280,440 340,550" fill="#3a4a5a" />
          <polygon points="266,472 280,440 294,472 288,464 280,474 272,464" fill="#fff" />
        </g>
        {/* Winding gold path */}
        <path d="M180 30 C 110 80 250 120 180 170 C 110 220 250 260 180 310 C 110 360 250 400 180 450 C 140 490 220 520 180 545" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" opacity="0.9" />
        <path d="M180 30 C 110 80 250 120 180 170 C 110 220 250 260 180 310 C 110 360 250 400 180 450 C 140 490 220 520 180 545" fill="none" stroke="#c9a227" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 9" />
        {castles.map((c) => <Castle key={c.y} x={c.x} y={c.y} color={c.color} />)}
        {/* Boss markers at Weeks 4, 8, 12 */}
        {BOSS_ROUNDS.map((r) => {
          const hp = bossHp[r.id] ?? r.maxHp;
          const beaten = hp <= 0;
          const y = weekToY(r.week);
          return (
            <g key={r.id}>
              <circle cx="180" cy={y} r="12" fill={beaten ? '#1e7a46' : '#a83232'} stroke="#fff" strokeWidth="2" />
              <text x="180" y={y + 4.5} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">{beaten ? '✓' : '★'}</text>
              <MapLabel x={180} y={y + 16} w={180} h={20} fontSize={11}>
                {beaten ? `Week ${r.week} boss beaten` : `Boss · Week ${r.week}`}
              </MapLabel>
            </g>
          );
        })}
        {/* Companion markers where they are met. Kept at the far edges
            (x 52 / 308) so they never overlap the centered land titles. */}
        {CREATURES.map((c, i) => {
          const isMet = met.has(c.id);
          const y = weekToY(c.meetWeek);
          const x = i % 2 === 0 ? 52 : 308;
          return (
            <g key={c.id}>
              <circle cx={x} cy={y} r="9" fill={isMet ? '#124571' : '#9aa5b1'} stroke="#fff" strokeWidth="2" />
              <text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{isMet ? c.name[0] : '?'}</text>
              {isMet && (
                <MapLabel x={x} y={y + 14} w={c.name.length * 8 + 16} h={18} fontSize={11}>
                  {c.name}
                </MapLabel>
              )}
            </g>
          );
        })}
        {/* You are here: the shield is centered on the path point, so it
            can never be cut off at the top of the map. The words live in
            the HTML pill above the map, not inside the SVG. */}
        <g className="map-you">
          <path d="M180 0 L196 6 L196 20 Q196 34 180 42 Q164 34 164 20 L164 6 Z" transform={`translate(0 ${hereY - 21})`} fill="#124571" stroke="#c9a227" strokeWidth="2" />
          <text x="180" y={hereY + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">★</text>
        </g>
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
