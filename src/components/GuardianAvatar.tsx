// GuardianAvatar: a modern, glowing, animated inline SVG drawing of the
// client's guardian. No external images, no AI images, no new dependencies.
// Reflects class, color, gem, cape, wings (Level 8+) and crown (Level 10+).
// Calm, clearly visible motion: bob + glow pulse + gem shimmer, all disabled
// under prefers-reduced-motion.
import { useId } from 'react';
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

const GEM_LIGHT: Record<string, string> = {
  Sapphire: '#8db4f2',
  Ruby: '#f08a9d',
  Emerald: '#7ed3a4',
  Topaz: '#f7cf6b',
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
  const light = shade(main, 55);
  const dark = shade(main, -45);
  const gem = GEM_MAP[g.gem] ?? GEM_MAP.Sapphire;
  const gemLight = GEM_LIGHT[g.gem] ?? GEM_LIGHT.Sapphire;
  const px = SIZES[size];
  const showWings = level >= 8;
  const showCrown = level >= 10;
  const name = guardian ? `${g.name} the ${g.classId}` : 'Your guardian';
  const caption = label ?? `${name} · Level ${level}`;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (n: string) => `${n}-${uid}`;

  return (
    <div className="guardian-wrap">
      <svg
        width={px}
        height={px}
        viewBox="0 0 200 200"
        role="img"
        aria-label={caption}
      >
        <defs>
          <radialGradient id={id('aura')} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={gem} stopOpacity="0.45" />
            <stop offset="55%" stopColor={gem} stopOpacity="0.16" />
            <stop offset="100%" stopColor={gem} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id('tunic')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={light} />
            <stop offset="45%" stopColor={main} />
            <stop offset="100%" stopColor={dark} />
          </linearGradient>
          <linearGradient id={id('cape')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={main} />
            <stop offset="100%" stopColor={dark} />
          </linearGradient>
          <linearGradient id={id('skin')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7d9ae" />
            <stop offset="100%" stopColor="#e8b478" />
          </linearGradient>
          <linearGradient id={id('gold')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f2d878" />
            <stop offset="100%" stopColor="#a8840a" />
          </linearGradient>
          <linearGradient id={id('steel')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f4f8fc" />
            <stop offset="50%" stopColor="#b9c9d8" />
            <stop offset="100%" stopColor="#7d93a8" />
          </linearGradient>
          <radialGradient id={id('gem')} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={gemLight} />
            <stop offset="55%" stopColor={gem} />
            <stop offset="100%" stopColor={shade(gem, -45)} />
          </radialGradient>
          <filter id={id('glow')} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Glowing aura behind the figure */}
        <circle className="guardian-aura" cx="100" cy="102" r="88" fill={`url(#${id('aura')})`} />
        {/* Ground shadow, shrinks as the figure bobs up */}
        <ellipse className="guardian-shadow" cx="100" cy="188" rx="44" ry="6" fill="#124571" opacity="0.18" />

        <g className="guardian-bob">
          {/* Cape with folds */}
          {g.cape && (
            <g>
              <path d="M100 60 L154 78 L148 170 Q100 184 52 170 L46 78 Z" fill={`url(#${id('cape')})`} opacity="0.96" />
              <path d="M78 74 Q74 120 76 168" fill="none" stroke={dark} strokeWidth="2" opacity="0.5" />
              <path d="M100 76 Q100 122 100 176" fill="none" stroke={dark} strokeWidth="2" opacity="0.4" />
              <path d="M122 74 Q126 120 124 168" fill="none" stroke={dark} strokeWidth="2" opacity="0.5" />
              <path d="M52 170 Q100 184 148 170" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.25" />
            </g>
          )}
          {/* Wings, Level 8+ : layered feathers */}
          {showWings && (
            <g>
              <g fill="#ffffff" stroke={main} strokeWidth="2.5" opacity="0.95">
                <ellipse cx="48" cy="96" rx="24" ry="42" transform="rotate(-28 48 96)" />
                <ellipse cx="152" cy="96" rx="24" ry="42" transform="rotate(28 152 96)" />
              </g>
              <g fill={gem} opacity="0.35">
                <ellipse cx="48" cy="104" rx="12" ry="26" transform="rotate(-28 48 104)" />
                <ellipse cx="152" cy="104" rx="12" ry="26" transform="rotate(28 152 104)" />
              </g>
              <path d="M40 84 Q48 104 44 128 M160 84 Q152 104 156 128" fill="none" stroke={main} strokeWidth="1.5" opacity="0.5" />
            </g>
          )}
          {/* Arms */}
          <path d="M70 96 Q58 118 64 140 L76 138 Q72 118 78 102 Z" fill={`url(#${id('tunic')})`} stroke={dark} strokeWidth="2" />
          <path d="M130 96 Q142 118 136 140 L124 138 Q128 118 122 102 Z" fill={`url(#${id('tunic')})`} stroke={dark} strokeWidth="2" />
          {/* Body: tunic with shading and highlight */}
          <path d="M100 82 L130 94 L138 166 Q100 178 62 166 L70 94 Z" fill={`url(#${id('tunic')})`} stroke={dark} strokeWidth="2.5" />
          <path d="M76 96 Q72 130 74 162 Q84 166 88 164 Q82 130 86 100 Z" fill="#fff" opacity="0.22" />
          <path d="M124 96 Q130 130 128 162 Q118 166 114 164 Q120 130 116 100 Z" fill="#000" opacity="0.14" />
          {/* Belt */}
          <rect x="68" y="130" width="64" height="11" rx="5.5" fill={`url(#${id('gold')})`} stroke="#8a6d00" strokeWidth="1.5" />
          <rect x="94" y="131" width="12" height="9" rx="2" fill="#fffdf4" stroke="#8a6d00" strokeWidth="1.5" />
          {/* Glowing gem on chest */}
          <g className="guardian-gem" filter={`url(#${id('glow')})`}>
            <polygon points="100,100 113,114 100,130 87,114" fill={`url(#${id('gem')})`} stroke="#fff" strokeWidth="2" />
            <polygon points="100,106 106,114 100,122 94,114" fill="#fff" opacity="0.55" />
          </g>
          {/* Hands */}
          <circle cx="65" cy="142" r="7" fill={`url(#${id('skin')})`} stroke={dark} strokeWidth="1.5" />
          <circle cx="135" cy="142" r="7" fill={`url(#${id('skin')})`} stroke={dark} strokeWidth="1.5" />
          {/* Head */}
          <circle cx="100" cy="56" r="27" fill={`url(#${id('skin')})`} stroke={dark} strokeWidth="2.5" />
          <ellipse cx="88" cy="66" rx="5" ry="3" fill="#e88a7a" opacity="0.35" />
          <ellipse cx="112" cy="66" rx="5" ry="3" fill="#e88a7a" opacity="0.35" />
          {/* Hair with strands, or hood for Ranger */}
          {g.classId === 'Ranger' ? (
            <g>
              <path d="M72 58 Q70 26 100 26 Q130 26 128 58 L119 52 Q114 34 100 34 Q86 34 81 52 Z" fill={`url(#${id('cape')})`} stroke={dark} strokeWidth="2.5" />
              <path d="M84 40 Q92 32 100 32" fill="none" stroke={light} strokeWidth="2" opacity="0.6" />
              <path d="M78 56 Q84 62 92 64" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.4" />
            </g>
          ) : (
            <g>
              <path d="M73 58 Q69 28 100 28 Q131 28 127 58 Q120 38 100 38 Q80 38 73 58 Z" fill="#5b3a1e" />
              <path d="M82 38 Q90 32 100 32 Q110 32 118 38" fill="none" stroke="#8a6238" strokeWidth="2.5" opacity="0.8" />
              <path d="M76 52 Q74 44 78 40 M124 52 Q126 44 122 40" fill="none" stroke="#5b3a1e" strokeWidth="2" />
            </g>
          )}
          {/* Crown, Level 10+ */}
          {showCrown && (
            <g>
              <polygon points="78,34 86,16 95,30 100,14 105,30 114,16 122,34 122,42 78,42" fill={`url(#${id('gold')})`} stroke="#8a6d00" strokeWidth="2" />
              <circle cx="100" cy="34" r="3.5" fill={gem} stroke="#fff" strokeWidth="1.5" />
              <circle cx="87" cy="34" r="2.5" fill={gem} stroke="#fff" strokeWidth="1" />
              <circle cx="113" cy="34" r="2.5" fill={gem} stroke="#fff" strokeWidth="1" />
            </g>
          )}
          {/* Face: brows, eyes with highlights, smile */}
          <path d="M84 50 Q90 47 96 50 M104 50 Q110 47 116 50" fill="none" stroke="#5b3a1e" strokeWidth="2" strokeLinecap="round" />
          <circle cx="90" cy="57" r="3.2" fill="#1c2b3a" />
          <circle cx="110" cy="57" r="3.2" fill="#1c2b3a" />
          <circle cx="91" cy="55.8" r="1.1" fill="#fff" />
          <circle cx="111" cy="55.8" r="1.1" fill="#fff" />
          <path d="M97 60 Q100 64 103 60" fill="none" stroke="#c98a5a" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M91 69 Q100 76 109 69" fill="none" stroke="#1c2b3a" strokeWidth="2.5" strokeLinecap="round" />
          {/* Class weapon */}
          {g.classId === 'Guardian' && (
            <g>
              <path d="M34 94 L64 94 L64 122 Q49 136 34 122 Z" fill={`url(#${id('steel')})`} stroke={`url(#${id('gold')})`} strokeWidth="3.5" />
              <path d="M40 100 L58 100 L58 118 Q49 128 40 118 Z" fill={main} opacity="0.85" />
              <g className="guardian-gem" filter={`url(#${id('glow')})`}>
                <circle cx="49" cy="109" r="6.5" fill={`url(#${id('gem')})`} stroke="#fff" strokeWidth="2" />
              </g>
              <g transform="rotate(18 156 92)">
                <rect x="153" y="62" width="7" height="54" rx="3" fill={`url(#${id('steel')})`} stroke="#5b6b7a" strokeWidth="1.5" />
                <rect x="155" y="64" width="2" height="48" fill="#fff" opacity="0.7" />
                <rect x="145" y="114" width="22" height="7" rx="3.5" fill={`url(#${id('gold')})`} stroke="#8a6d00" strokeWidth="1.5" />
                <rect x="152" y="121" width="9" height="12" rx="3" fill="#5b3a1e" />
              </g>
            </g>
          )}
          {g.classId === 'Ranger' && (
            <g>
              <path d="M150 68 Q180 100 150 134" fill="none" stroke="#7a4a21" strokeWidth="5" strokeLinecap="round" />
              <path d="M150 68 Q176 100 150 134" fill="none" stroke="#a8763e" strokeWidth="2" strokeLinecap="round" />
              <line x1="150" y1="68" x2="150" y2="134" stroke="#e8e2d4" strokeWidth="1.5" />
              <line x1="150" y1="100" x2="126" y2="100" stroke={gem} strokeWidth="3" strokeLinecap="round" />
              <polygon points="126,100 134,96 134,104" fill="#5b6b7a" />
              <rect x="38" y="90" width="17" height="42" rx="8.5" fill="#5b3a1e" stroke="#3a2410" strokeWidth="1.5" />
              <line x1="44" y1="88" x2="44" y2="78" stroke="#e8e2d4" strokeWidth="2" />
              <line x1="50" y1="88" x2="50" y2="76" stroke="#e8e2d4" strokeWidth="2" />
            </g>
          )}
          {g.classId === 'Spellweaver' && (
            <g>
              <rect x="151" y="50" width="7" height="116" rx="3.5" fill="#5b3a1e" stroke="#3a2410" strokeWidth="1.5" />
              <rect x="153" y="52" width="2" height="110" fill="#a8763e" opacity="0.7" />
              <g className="guardian-gem" filter={`url(#${id('glow')})`}>
                <polygon
                  points="154,24 159,38 173,38 162,47 166,61 154,53 142,61 146,47 135,38 149,38"
                  fill={`url(#${id('gem')})`}
                  stroke="#fff"
                  strokeWidth="2"
                />
              </g>
              <circle className="guardian-sparkle" cx="134" cy="64" r="3.5" fill={gemLight} />
              <circle className="guardian-sparkle" style={{ animationDelay: '0.7s' }} cx="126" cy="84" r="2.5" fill={gem} />
              <circle className="guardian-sparkle" style={{ animationDelay: '1.3s' }} cx="138" cy="98" r="2" fill={gemLight} />
            </g>
          )}
          {/* Legs and boots */}
          <path d="M82 166 L80 178 L94 178 L94 166 Z" fill={dark} />
          <path d="M106 166 L106 178 L120 178 L118 166 Z" fill={dark} />
          <ellipse cx="87" cy="180" rx="13" ry="6" fill="#3a2410" />
          <ellipse cx="113" cy="180" rx="13" ry="6" fill="#3a2410" />
          <ellipse cx="84" cy="178" rx="6" ry="2.5" fill="#a8763e" opacity="0.6" />
          <ellipse cx="110" cy="178" rx="6" ry="2.5" fill="#a8763e" opacity="0.6" />
        </g>
      </svg>
      <p className="guardian-caption">
        {caption}
        {showWings && ' · Wings'}
        {showCrown && ' · Crown'}
      </p>
    </div>
  );
}
