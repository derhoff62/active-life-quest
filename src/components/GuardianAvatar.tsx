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

// Custom backgrounds: one scene per class, plus one per Journey land.
// All pure SVG/CSS shapes and gradients, no external images.
export type GuardianScene = 'guardian' | 'ranger' | 'spellweaver' | 'forest' | 'shores' | 'peaks';

const SCENE_LABEL: Record<GuardianScene, string> = {
  guardian: 'Training Ground',
  ranger: 'Sapphire Forest',
  spellweaver: 'Starry Night',
  forest: 'Sapphire Forest',
  shores: 'Crystal Shores',
  peaks: 'Navy Peaks',
};

const CLASS_SCENE: Record<string, GuardianScene> = {
  Guardian: 'guardian',
  Ranger: 'ranger',
  Spellweaver: 'spellweaver',
};

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
  background,
}: {
  guardian: GuardianState | null;
  level: number;
  size?: GuardianAvatarSize;
  label?: string;
  background?: GuardianScene;
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
  const scene: GuardianScene = background ?? CLASS_SCENE[g.classId] ?? 'guardian';

  // Background scene shapes, drawn behind the figure.
  const sceneArt = (
    <>
      {scene === 'guardian' && (
        <g>
          <rect x="14" y="96" width="34" height="72" fill="#8a9aa8" />
          <rect x="10" y="88" width="42" height="12" fill="#6d7d8c" />
          <rect x="152" y="96" width="34" height="72" fill="#8a9aa8" />
          <rect x="148" y="88" width="42" height="12" fill="#6d7d8c" />
          <rect x="20" y="112" width="10" height="14" fill="#124571" opacity="0.7" />
          <rect x="158" y="112" width="10" height="14" fill="#124571" opacity="0.7" />
          <rect x="18" y="70" width="3" height="22" fill="#5b3a1e" />
          <polygon points="21,70 36,76 21,82" fill={main} />
          <rect x="179" y="70" width="3" height="22" fill="#5b3a1e" />
          <polygon points="182,70 167,76 182,82" fill={main} />
          <circle cx="100" cy="34" r="13" fill="#f2d878" opacity="0.9" />
          <rect x="0" y="168" width="200" height="32" fill="#b9a06a" opacity="0.55" />
        </g>
      )}
      {(scene === 'ranger' || scene === 'forest') && (
        <g>
          <circle cx="166" cy="30" r="14" fill="#f2d878" opacity="0.9" />
          <polygon points="28,168 46,104 64,168" fill="#1e7a46" />
          <polygon points="34,132 46,96 58,132" fill="#2a9e5f" />
          <polygon points="140,168 158,108 176,168" fill="#1e7a46" />
          <polygon points="146,136 158,102 170,136" fill="#2a9e5f" />
          <circle cx="46" cy="100" r="4" fill={gem} opacity="0.8" />
          <circle cx="158" cy="104" r="4" fill={gem} opacity="0.8" />
          <circle cx="86" cy="60" r="3" fill={gemLight} className="guardian-sparkle" />
          <circle cx="120" cy="48" r="2.5" fill={gemLight} className="guardian-sparkle" style={{ animationDelay: '0.9s' }} />
          <rect x="0" y="168" width="200" height="32" fill="#1e7a46" opacity="0.4" />
        </g>
      )}
      {scene === 'spellweaver' && (
        <g>
          <circle cx="100" cy="102" r="88" fill="none" />
          {[
            [24, 28], [52, 16], [86, 24], [120, 14], [152, 26], [176, 44],
            [34, 62], [64, 44], [140, 40], [168, 76], [20, 100], [180, 110],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.6 : 1.8} fill="#fff" className="guardian-sparkle" style={{ animationDelay: `${(i % 5) * 0.45}s` }} />
          ))}
          <circle cx="164" cy="34" r="15" fill="#f2d878" />
          <circle cx="158" cy="30" r="13" fill="#0b1e3a" opacity="0.85" />
          <rect x="0" y="168" width="200" height="32" fill="#124571" opacity="0.5" />
        </g>
      )}
      {scene === 'shores' && (
        <g>
          <circle cx="36" cy="30" r="14" fill="#f2d878" opacity="0.95" />
          <rect x="0" y="118" width="200" height="50" fill="#2f6fd0" opacity="0.55" />
          <path d="M0 128 Q25 122 50 128 T100 128 T150 128 T200 128" fill="none" stroke="#fff" strokeWidth="2" opacity="0.6" />
          <path d="M0 144 Q25 138 50 144 T100 144 T150 144 T200 144" fill="none" stroke="#fff" strokeWidth="2" opacity="0.4" />
          <rect x="0" y="168" width="200" height="32" fill="#e8d9a8" opacity="0.8" />
          <circle cx="164" cy="60" r="4" fill={gem} opacity="0.8" />
        </g>
      )}
      {scene === 'peaks' && (
        <g>
          <circle cx="166" cy="30" r="14" fill="#f2d878" opacity="0.9" />
          <ellipse cx="46" cy="40" rx="22" ry="8" fill="#fff" opacity="0.85" />
          <ellipse cx="70" cy="48" rx="18" ry="7" fill="#fff" opacity="0.7" />
          <polygon points="10,168 58,84 106,168" fill="#5b6b7a" />
          <polygon points="46,108 58,84 70,108 64,102 58,110 52,102" fill="#fff" />
          <polygon points="96,168 148,72 200,168" fill="#3a4a5a" />
          <polygon points="134,98 148,72 162,98 156,92 148,100 140,92" fill="#fff" />
          <rect x="0" y="168" width="200" height="32" fill="#dbe9f5" opacity="0.7" />
        </g>
      )}
    </>
  );

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
          <clipPath id={id('frame')}>
            <rect x="0" y="0" width="200" height="200" rx="18" />
          </clipPath>
          <linearGradient id={id('bg')} x1="0" y1="0" x2="0" y2="1">
            {scene === 'spellweaver' ? (
              <>
                <stop offset="0%" stopColor="#0b1e3a" />
                <stop offset="100%" stopColor="#124571" />
              </>
            ) : scene === 'peaks' ? (
              <>
                <stop offset="0%" stopColor="#bcd6ea" />
                <stop offset="100%" stopColor="#eef5fb" />
              </>
            ) : scene === 'shores' ? (
              <>
                <stop offset="0%" stopColor="#bfe3f5" />
                <stop offset="100%" stopColor="#eef5fb" />
              </>
            ) : scene === 'ranger' || scene === 'forest' ? (
              <>
                <stop offset="0%" stopColor="#cfeeda" />
                <stop offset="100%" stopColor="#eef5fb" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#dbe9f5" />
                <stop offset="100%" stopColor="#f6ecd0" />
              </>
            )}
          </linearGradient>
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

        {/* Custom background scene, clipped to the rounded frame */}
        <g clipPath={`url(#${id('frame')})`}>
          <rect x="0" y="0" width="200" height="200" fill={`url(#${id('bg')})`} />
          {sceneArt}
        </g>
        {/* Glowing aura behind the figure */}
        <circle className="guardian-aura" cx="100" cy="102" r="88" fill={`url(#${id('aura')})`} />
        {/* Ground shadow, shrinks as the figure bobs up */}
        <ellipse className="guardian-shadow" cx="100" cy="188" rx="44" ry="6" fill="#124571" opacity="0.18" />

        <g className="guardian-bob">
          {/* Cape with folds */}
          {g.cape && (
            <g>
              <path d="M100 60 L142 78 L136 170 Q100 182 64 170 L58 78 Z" fill={`url(#${id('cape')})`} opacity="0.96" />
              <path d="M82 74 Q79 120 81 168" fill="none" stroke={dark} strokeWidth="2" opacity="0.5" />
              <path d="M100 76 Q100 122 100 176" fill="none" stroke={dark} strokeWidth="2" opacity="0.4" />
              <path d="M118 74 Q121 120 119 168" fill="none" stroke={dark} strokeWidth="2" opacity="0.5" />
              <path d="M64 170 Q100 182 136 170" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.25" />
            </g>
          )}
          {/* Wings, Level 8+ : layered feathers */}
          {showWings && (
            <g>
              <g fill="#ffffff" stroke={main} strokeWidth="2.5" opacity="0.95">
                <ellipse cx="56" cy="96" rx="20" ry="40" transform="rotate(-28 56 96)" />
                <ellipse cx="144" cy="96" rx="20" ry="40" transform="rotate(28 144 96)" />
              </g>
              <g fill={gem} opacity="0.35">
                <ellipse cx="56" cy="104" rx="10" ry="24" transform="rotate(-28 56 104)" />
                <ellipse cx="144" cy="104" rx="10" ry="24" transform="rotate(28 144 104)" />
              </g>
              <path d="M50 84 Q56 104 52 126 M150 84 Q144 104 148 126" fill="none" stroke={main} strokeWidth="1.5" opacity="0.5" />
            </g>
          )}
          {/* Arms, slim */}
          <path d="M76 94 Q66 116 70 136 L80 134 Q78 116 82 100 Z" fill={`url(#${id('tunic')})`} stroke={dark} strokeWidth="2" />
          <path d="M124 94 Q134 116 130 136 L120 134 Q122 116 118 100 Z" fill={`url(#${id('tunic')})`} stroke={dark} strokeWidth="2" />
          {/* Body: slim tunic with shading and highlight, longer legs */}
          <path d="M100 80 L122 90 L128 164 Q100 174 72 164 L78 90 Z" fill={`url(#${id('tunic')})`} stroke={dark} strokeWidth="2.5" />
          <path d="M82 96 Q79 128 81 160 Q89 163 92 161 Q87 128 90 98 Z" fill="#fff" opacity="0.22" />
          <path d="M118 96 Q121 128 119 160 Q111 163 108 161 Q113 128 110 98 Z" fill="#000" opacity="0.14" />
          {/* Belt */}
          <rect x="74" y="130" width="52" height="10" rx="5" fill={`url(#${id('gold')})`} stroke="#8a6d00" strokeWidth="1.5" />
          <rect x="94" y="131" width="12" height="8" rx="2" fill="#fffdf4" stroke="#8a6d00" strokeWidth="1.5" />
          {/* Glowing gem on chest */}
          <g className="guardian-gem" filter={`url(#${id('glow')})`}>
            <polygon points="100,102 111,113 100,126 89,113" fill={`url(#${id('gem')})`} stroke="#fff" strokeWidth="2" />
            <polygon points="100,107 105,113 100,119 95,113" fill="#fff" opacity="0.55" />
          </g>
          {/* Hands */}
          <circle cx="71" cy="138" r="6" fill={`url(#${id('skin')})`} stroke={dark} strokeWidth="1.5" />
          <circle cx="129" cy="138" r="6" fill={`url(#${id('skin')})`} stroke={dark} strokeWidth="1.5" />
          {/* Head, smaller for slimmer proportions */}
          <circle cx="100" cy="54" r="24" fill={`url(#${id('skin')})`} stroke={dark} strokeWidth="2.5" />
          <ellipse cx="89" cy="63" rx="4.5" ry="2.8" fill="#e88a7a" opacity="0.35" />
          <ellipse cx="111" cy="63" rx="4.5" ry="2.8" fill="#e88a7a" opacity="0.35" />
          {/* Hair with strands, or hood for Ranger */}
          {g.classId === 'Ranger' ? (
            <g>
              <path d="M75 56 Q73 28 100 28 Q127 28 125 56 L117 50 Q112 34 100 34 Q88 34 83 50 Z" fill={`url(#${id('cape')})`} stroke={dark} strokeWidth="2.5" />
              <path d="M85 40 Q92 33 100 33" fill="none" stroke={light} strokeWidth="2" opacity="0.6" />
              <path d="M80 54 Q85 60 92 62" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.4" />
            </g>
          ) : (
            <g>
              <path d="M76 56 Q73 30 100 30 Q127 30 124 56 Q118 38 100 38 Q82 38 76 56 Z" fill="#5b3a1e" />
              <path d="M82 38 Q90 32 100 32 Q110 32 118 38" fill="none" stroke="#8a6238" strokeWidth="2.5" opacity="0.8" />
              <path d="M76 52 Q74 44 78 40 M124 52 Q126 44 122 40" fill="none" stroke="#5b3a1e" strokeWidth="2" />
            </g>
          )}
          {/* Crown, Level 10+ */}
          {showCrown && (
            <g>
              <polygon points="80,32 87,15 95,28 100,13 105,28 113,15 120,32 120,40 80,40" fill={`url(#${id('gold')})`} stroke="#8a6d00" strokeWidth="2" />
              <circle cx="100" cy="32" r="3.2" fill={gem} stroke="#fff" strokeWidth="1.5" />
              <circle cx="88" cy="32" r="2.3" fill={gem} stroke="#fff" strokeWidth="1" />
              <circle cx="112" cy="32" r="2.3" fill={gem} stroke="#fff" strokeWidth="1" />
            </g>
          )}
          {/* Face: brows, eyes with highlights, smile */}
          <path d="M85 48 Q90 45 95 48 M105 48 Q110 45 115 48" fill="none" stroke="#5b3a1e" strokeWidth="2" strokeLinecap="round" />
          <circle cx="90" cy="55" r="3" fill="#1c2b3a" />
          <circle cx="110" cy="55" r="3" fill="#1c2b3a" />
          <circle cx="91" cy="53.8" r="1" fill="#fff" />
          <circle cx="111" cy="53.8" r="1" fill="#fff" />
          <path d="M97 58 Q100 62 103 58" fill="none" stroke="#c98a5a" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M92 66 Q100 72 108 66" fill="none" stroke="#1c2b3a" strokeWidth="2.5" strokeLinecap="round" />
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
          {/* Legs, slim and longer, and boots */}
          <path d="M84 164 L83 182 L94 182 L94 164 Z" fill={dark} />
          <path d="M106 164 L106 182 L117 182 L116 164 Z" fill={dark} />
          <ellipse cx="89" cy="184" rx="11" ry="5" fill="#3a2410" />
          <ellipse cx="111" cy="184" rx="11" ry="5" fill="#3a2410" />
          <ellipse cx="86" cy="182" rx="5" ry="2" fill="#a8763e" opacity="0.6" />
          <ellipse cx="108" cy="182" rx="5" ry="2" fill="#a8763e" opacity="0.6" />
        </g>
      </svg>
      <p className="guardian-caption">
        {caption}
        {showWings && ' · Wings'}
        {showCrown && ' · Crown'}
      </p>
      <p className="small muted" style={{ margin: '2px 0 0' }}>{SCENE_LABEL[scene]}</p>
    </div>
  );
}
