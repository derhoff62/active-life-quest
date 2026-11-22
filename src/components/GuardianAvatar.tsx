// GuardianAvatar: a pure CSS/SVG drawing of the client's guardian.
// No external images. Reflects class, color, gem, cape, wings (Level 8+)
// and crown (Level 10+). Gentle idle bob, disabled for reduced motion.
import type { GuardianState } from '../lib/store';

const COLOR_MAP: Record<string, string> = {
  Navy: '#124571',
  Forest: '#1e7a46',
  Crimson: '#a83232',
  Gold: '#c9a227',
  Teal: '#0e7a7a',
};

const GEM_MAP: Record<string, string> = {
  Sapphire: '#2f6fd0',
  Ruby: '#c22747',
  Emerald: '#1e9e5a',
  Topaz: '#e8a91c',
};

const SIZES = { large: 180, medium: 120, small: 72 } as const;

export type GuardianAvatarSize = keyof typeof SIZES;

export const DEFAULT_GUARDIAN: GuardianState = {
  name: 'Your guardian',
  classId: 'Guardian',
  color: 'Navy',
  gem: 'Sapphire',
  cape: true,
};

function shade(hex: string, amount: number): string {
  const n = hex.replace('#', '');
  const num = parseInt(n.length === 3 ? n.split('').map((c) => c + c).join('') : n, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default function GuardianAvatar({
  guardian,
  level,
  size = 'large',
  label,
}: {
  guardian: GuardianState | null;
  level: number;
  size?: GuardianAvatarSize;
  label?: string;
}) {
  const g = guardian ?? DEFAULT_GUARDIAN;
  const main = COLOR_MAP[g.color] ?? COLOR_MAP.Navy;
  const dark = shade(main, -40);
  const gem = GEM_MAP[g.gem] ?? GEM_MAP.Sapphire;
  const px = SIZES[size];
  const showWings = level >= 8;
  const showCrown = level >= 10;
  const name = guardian ? `${g.name} the ${g.classId}` : 'Your guardian';
  const caption = label ?? `${name} · Level ${level}`;

  return (
    <div className="guardian-wrap">
      <svg
        className="guardian-bob"
        width={px}
        height={px}
        viewBox="0 0 200 200"
        role="img"
        aria-label={caption}
      >
        {/* Cape */}
        {g.cape && (
          <path d="M100 62 L152 78 L146 168 Q100 182 54 168 L48 78 Z" fill={dark} opacity="0.9" />
        )}
        {/* Wings, Level 8+ */}
        {showWings && (
          <g fill="#eef5fb" stroke={main} strokeWidth="3">
            <ellipse cx="52" cy="98" rx="26" ry="40" transform="rotate(-28 52 98)" />
            <ellipse cx="148" cy="98" rx="26" ry="40" transform="rotate(28 148 98)" />
          </g>
        )}
        {/* Body: friendly tunic */}
        <path d="M100 84 L128 96 L136 168 Q100 178 64 168 L72 96 Z" fill={main} stroke={dark} strokeWidth="3" />
        {/* Belt */}
        <rect x="70" y="132" width="60" height="10" rx="5" fill="#c9a227" />
        {/* Gem on chest */}
        <polygon points="100,102 112,114 100,128 88,114" fill={gem} stroke="#fff" strokeWidth="2" />
        {/* Head */}
        <circle cx="100" cy="58" r="26" fill="#f2c89b" stroke={dark} strokeWidth="3" />
        {/* Hood for Ranger, hair for others */}
        {g.classId === 'Ranger' ? (
          <path d="M74 58 Q74 28 100 28 Q126 28 126 58 L118 52 Q112 36 100 36 Q88 36 82 52 Z" fill={main} stroke={dark} strokeWidth="3" />
        ) : (
          <path d="M74 56 Q72 30 100 30 Q128 30 126 56 Q116 40 100 40 Q84 40 74 56 Z" fill="#5b3a1e" />
        )}
        {/* Crown, Level 10+ */}
        {showCrown && (
          <polygon points="80,34 88,18 96,32 104,16 112,32 120,34 120,40 80,40" fill="#c9a227" stroke="#8a6d00" strokeWidth="2" />
        )}
        {/* Eyes and smile */}
        <circle cx="90" cy="58" r="3" fill="#1c2b3a" />
        <circle cx="110" cy="58" r="3" fill="#1c2b3a" />
        <path d="M92 70 Q100 76 108 70" fill="none" stroke="#1c2b3a" strokeWidth="2.5" strokeLinecap="round" />
        {/* Class weapon */}
        {g.classId === 'Guardian' && (
          <g>
            {/* Shield, left hand */}
            <path d="M38 96 L62 96 L62 122 Q50 134 38 122 Z" fill={main} stroke="#c9a227" strokeWidth="3" />
            <circle cx="50" cy="110" r="6" fill={gem} stroke="#fff" strokeWidth="2" />
            {/* Sword, right hand */}
            <rect x="152" y="66" width="6" height="52" rx="3" fill="#d7e3ee" stroke="#5b6b7a" strokeWidth="2" transform="rotate(18 155 92)" />
            <rect x="146" y="116" width="18" height="6" rx="3" fill="#5b3a1e" transform="rotate(18 155 119)" />
          </g>
        )}
        {g.classId === 'Ranger' && (
          <g fill="none" stroke="#5b3a1e" strokeWidth="4" strokeLinecap="round">
            {/* Bow, right hand */}
            <path d="M150 70 Q178 100 150 132" />
            <line x1="150" y1="70" x2="150" y2="132" strokeWidth="2" />
            <line x1="150" y1="100" x2="128" y2="100" stroke="#2f6fd0" strokeWidth="3" />
            {/* Quiver, left side */}
            <rect x="40" y="92" width="16" height="40" rx="8" fill="#5b3a1e" stroke="none" />
          </g>
        )}
        {g.classId === 'Spellweaver' && (
          <g>
            {/* Staff, right hand */}
            <rect x="152" y="52" width="6" height="112" rx="3" fill="#5b3a1e" />
            {/* Star on top */}
            <polygon
              points="155,28 159,40 172,40 162,48 166,60 155,53 144,60 148,48 138,40 151,40"
              fill={gem}
              stroke="#fff"
              strokeWidth="2"
            />
            {/* Spell sparkles */}
            <circle cx="136" cy="66" r="3" fill={gem} />
            <circle cx="128" cy="84" r="2" fill={gem} />
          </g>
        )}
        {/* Boots */}
        <ellipse cx="84" cy="176" rx="12" ry="6" fill="#5b3a1e" />
        <ellipse cx="116" cy="176" rx="12" ry="6" fill="#5b3a1e" />
        {/* Ground shadow */}
        <ellipse cx="100" cy="186" rx="42" ry="6" fill="#d7e3ee" opacity="0.7" />
      </svg>
      <p className="guardian-caption">
        {caption}
        {showWings && ' · Wings'}
        {showCrown && ' · Crown'}
      </p>
    </div>
  );
}
