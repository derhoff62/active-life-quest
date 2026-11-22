// GuardianAvatar: an epic, fantastical inline SVG drawing of the client's
// guardian. No external images, no AI images, no new dependencies.
// Anatomy: neck connects head to shoulders, torso overlaps the head, so the
// head never floats. Inspiration: Lord of the Rings (cloaked ranger, sturdy
// armor, journey feel), Eragon (dragon-scale trim, glowing dragon-egg gem),
// Harry Potter (wizard robe and staff for Spellweaver), Elden Ring (golden
// light, big sky, epic scale). NOT Dark Souls: nothing dark, grim, or
// punishing. Warm and beginner-friendly throughout.
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
  // Male vs Female: clearly different silhouettes, not just hair length.
  // Male: broader shoulders, thicker arms, wider neck, strong jaw + neat beard.
  // Female: slimmer shoulders and waist, narrower neck, softer jaw, long
  // hair that falls past the shoulders, lashes and lips. Both strong,
  // heroic, friendly, and fully clothed. Never sexualized.
  const isFemale = g.look === 'Female';

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
          <radialGradient id={id('goldlight')} cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#f2d878" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#f2d878" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f2d878" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id('aura')} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={gem} stopOpacity="0.85" />
            <stop offset="55%" stopColor={gem} stopOpacity="0.45" />
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
        {/* Elden Ring style golden light: a soft golden glow behind the
            figure, like a big sky at dawn. Warm, never dark. */}
        <circle className="guardian-aura" cx="100" cy="100" r="95" fill={`url(#${id('goldlight')})`} />
        {/* Glowing aura behind the figure, plus a visible halo ring in the gem color.
            A soft solid gem-colored glow blob sits behind the figure too, so
            the glow reads clearly even on a light card, not just as a thin ring. */}
        <circle className="guardian-aura" cx="100" cy="105" r="92" fill={`url(#${id('aura')})`} />
        <circle cx="100" cy="105" r="58" fill={gem} opacity="0.3" filter={`url(#${id('glow')})`} />
        <circle className="guardian-halo" cx="100" cy="105" r="80" fill="none" stroke={gem} strokeWidth="5" />
        <circle className="guardian-halo" cx="100" cy="105" r="70" fill="none" stroke={gemLight} strokeWidth="2.5" opacity="0.7" style={{ animationDelay: '1.2s' }} />
        {/* Ground shadow, shrinks as the figure bobs up */}
        <ellipse className="guardian-shadow" cx="100" cy="188" rx="44" ry="6" fill="#124571" opacity="0.18" />

        <g className="guardian-bob">
          {/* Cape with folds */}
          {g.cape && (
            <g>
              <path d="M100 62 L128 72 L124 148 Q100 156 76 148 L72 72 Z" fill={`url(#${id('cape')})`} opacity="0.96" />
              <path d="M86 76 Q84 110 86 144" fill="none" stroke={dark} strokeWidth="2" opacity="0.5" />
              <path d="M100 78 Q100 112 100 150" fill="none" stroke={dark} strokeWidth="2" opacity="0.4" />
              <path d="M114 76 Q116 110 114 144" fill="none" stroke={dark} strokeWidth="2" opacity="0.5" />
              <path d="M76 148 Q100 156 124 148" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.25" />
            </g>
          )}
          {/* Wings, Level 8+ : layered feathers */}
          {showWings && (
            <g>
              <g fill="#ffffff" stroke={main} strokeWidth="2.5" opacity="0.95">
                <ellipse cx="66" cy="92" rx="13" ry="30" transform="rotate(-25 66 92)" />
                <ellipse cx="134" cy="92" rx="13" ry="30" transform="rotate(25 134 92)" />
              </g>
              <g fill={gem} opacity="0.35">
                <ellipse cx="66" cy="98" rx="7" ry="18" transform="rotate(-25 66 98)" />
                <ellipse cx="134" cy="98" rx="7" ry="18" transform="rotate(25 134 98)" />
              </g>
              <path d="M60 82 Q66 98 62 118 M140 82 Q134 98 138 118" fill="none" stroke={main} strokeWidth="1.5" opacity="0.5" />
            </g>
          )}
          {/* Neck: connects the head to the shoulders, so the head never floats.
              Drawn before the torso and head, so it fills the seam.
              Male neck is wider and thicker; female neck is narrower. */}
          <rect x={isFemale ? 95 : 92} y="48" width={isFemale ? 10 : 16} height="20" rx="4" fill={`url(#${id('skin')})`} stroke={dark} strokeWidth="2" />
          {/* Arms: male arms are thicker and more muscular; female arms slimmer. */}
          {isFemale ? (
            <>
              <path d="M84 70 Q77 88 79 106 L84 105 Q83 88 88 74 Z" fill={`url(#${id('tunic')})`} stroke={dark} strokeWidth="2" />
              <path d="M116 70 Q123 88 121 106 L116 105 Q117 88 112 74 Z" fill={`url(#${id('tunic')})`} stroke={dark} strokeWidth="2" />
            </>
          ) : (
            <>
              <path d="M80 68 Q70 88 73 108 L82 107 Q81 88 88 73 Z" fill={`url(#${id('tunic')})`} stroke={dark} strokeWidth="2" />
              <path d="M120 68 Q130 88 127 108 L118 107 Q119 88 112 73 Z" fill={`url(#${id('tunic')})`} stroke={dark} strokeWidth="2" />
              {/* Muscular forearms: thicker upper arm shading */}
              <path d="M74 88 Q72 98 74 106" fill="none" stroke={dark} strokeWidth="3" opacity="0.35" strokeLinecap="round" />
              <path d="M126 88 Q128 98 126 106" fill="none" stroke={dark} strokeWidth="3" opacity="0.35" strokeLinecap="round" />
            </>
          )}
          {/* Body: male has broad shoulders and a straight, muscular torso;
              female has narrower shoulders, a slimmer waist, and a fitted
              tunic. Top edge (y58) overlaps the bottom of the head (y59). */}
          {isFemale ? (
            <path d="M100 58 L114 62 L116 96 L110 122 L90 122 L84 96 L86 62 Z" fill={`url(#${id('tunic')})`} stroke={dark} strokeWidth="2.5" />
          ) : (
            <path d="M100 58 L122 62 L124 98 L118 122 L82 122 L76 98 L78 62 Z" fill={`url(#${id('tunic')})`} stroke={dark} strokeWidth="2.5" />
          )}
          <path d="M86 72 Q84 96 86 118 Q92 120 94 118 Q90 96 92 74 Z" fill="#fff" opacity="0.22" />
          <path d="M114 72 Q116 96 114 118 Q108 120 106 118 Q110 96 108 74 Z" fill="#000" opacity="0.14" />
          {/* Belt */}
          <rect x={isFemale ? 86 : 82} y="110" width={isFemale ? 28 : 36} height="9" rx="4.5" fill={`url(#${id('gold')})`} stroke="#8a6d00" strokeWidth="1.5" />
          <rect x="94" y="111" width="12" height="7" rx="2" fill="#fffdf4" stroke="#8a6d00" strokeWidth="1.5" />
          {/* Glowing gem on chest */}
          <g className="guardian-gem" filter={`url(#${id('glow')})`}>
            <polygon points="100,80 109,89 100,100 91,89" fill={`url(#${id('gem')})`} stroke="#fff" strokeWidth="2" />
            <polygon points="100,85 104,89 100,94 96,89" fill="#fff" opacity="0.55" />
          </g>
          {/* Hands */}
          <circle cx={isFemale ? 79 : 73} cy="108" r={isFemale ? 4.5 : 5.5} fill={`url(#${id('skin')})`} stroke={dark} strokeWidth="1.5" />
          <circle cx={isFemale ? 121 : 127} cy="108" r={isFemale ? 4.5 : 5.5} fill={`url(#${id('skin')})`} stroke={dark} strokeWidth="1.5" />
          {/* LOTR style shoulder armor and a cloak clasp at the neck, so the
              shoulders, neck, and head read as one connected figure.
              Male pauldrons are bigger and broader; female are smaller. */}
          <ellipse cx={isFemale ? 86 : 78} cy="68" rx={isFemale ? 9 : 13} ry={isFemale ? 6 : 8} fill={`url(#${id('steel')})`} stroke={dark} strokeWidth="2" />
          <ellipse cx={isFemale ? 114 : 122} cy="68" rx={isFemale ? 9 : 13} ry={isFemale ? 6 : 8} fill={`url(#${id('steel')})`} stroke={dark} strokeWidth="2" />
          <circle cx="100" cy="64" r="5" fill={`url(#${id('gold')})`} stroke="#8a6d00" strokeWidth="1.5" />
          <circle cx="100" cy="64" r="2.5" fill={gem} stroke="#fff" strokeWidth="1" />
          {/* Head: male has a squarer, stronger jaw; female a softer, rounder face.
              Same size, different jaw shading so the difference reads at 72px too. */}
          <circle cx="100" cy="42" r="17" fill={`url(#${id('skin')})`} stroke={dark} strokeWidth="2.5" />
          {!isFemale && (
            <g stroke={dark} strokeWidth="1.5" opacity="0.35" fill="none" strokeLinecap="round">
              <path d="M86 48 L90 56" />
              <path d="M114 48 L110 56" />
            </g>
          )}
          <ellipse cx="89" cy="50" rx="3.5" ry="2.2" fill="#e88a7a" opacity={isFemale ? 0.5 : 0.2} />
          <ellipse cx="111" cy="50" rx="3.5" ry="2.2" fill="#e88a7a" opacity={isFemale ? 0.5 : 0.2} />
          {/* Hair: Ranger hood first, then sex-specific hair.
              Female: long hair with a centre part, falling past the shoulders
              in two shaped locks (not a short blob). Male: short neat hair. */}
          {g.classId === 'Ranger' ? (
            <g>
              <path d="M78 44 Q76 24 100 24 Q124 24 122 44 L115 38 Q111 28 100 28 Q89 28 85 38 Z" fill={`url(#${id('cape')})`} stroke={dark} strokeWidth="2.5" />
              <path d="M88 30 Q94 25 100 25" fill="none" stroke={light} strokeWidth="2" opacity="0.6" />
              <path d="M83 42 Q87 46 92 48" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.4" />
              {isFemale && (
                <g fill="#5b3a1e">
                  <path d="M84 44 Q80 72 83 104 Q88 108 90 100 Q90 70 89 46 Z" />
                  <path d="M116 44 Q120 72 117 104 Q112 108 110 100 Q110 70 111 46 Z" />
                </g>
              )}
            </g>
          ) : isFemale ? (
            <g>
              {/* Long hair behind the shoulders, drawn as shaped locks */}
              <path d="M82 40 Q76 66 80 102 Q84 110 89 104 Q88 74 87 44 Z" fill="#5b3a1e" />
              <path d="M118 40 Q124 66 120 102 Q116 110 111 104 Q112 74 113 44 Z" fill="#5b3a1e" />
              <path d="M83 44 Q81 24 100 24 Q119 24 117 44 Q112 30 100 30 Q88 30 83 44 Z" fill="#5b3a1e" />
              <path d="M100 25 Q94 26 90 30" fill="none" stroke="#8a6238" strokeWidth="2.5" opacity="0.9" strokeLinecap="round" />
              <path d="M100 25 Q106 26 110 30" fill="none" stroke="#8a6238" strokeWidth="2.5" opacity="0.9" strokeLinecap="round" />
              <path d="M84 52 Q82 72 84 92 M116 52 Q118 72 116 92" fill="none" stroke="#8a6238" strokeWidth="2" opacity="0.7" strokeLinecap="round" />
            </g>
          ) : (
            <g>
              <path d="M83 44 Q81 24 100 24 Q119 24 117 44 Q112 30 100 30 Q88 30 83 44 Z" fill="#5b3a1e" />
              <path d="M88 30 Q94 25 100 25 Q106 25 112 30" fill="none" stroke="#8a6238" strokeWidth="2.5" opacity="0.8" />
              {/* Short sideburns */}
              <path d="M83 42 L84 50 L86 50 L86 42 Z" fill="#5b3a1e" />
              <path d="M117 42 L116 50 L114 50 L114 42 Z" fill="#5b3a1e" />
            </g>
          )}
          {/* Male beard: neat short beard framing the jaw and chin, with a
              mustache above the mouth. Mouth is drawn over the beard so the
              smile still shows. Female has no beard. */}
          {!isFemale && (
            <g fill="#5b3a1e">
              <path d="M85 46 Q84 60 100 62 Q116 60 115 46 L111 50 Q109 57 100 58 Q91 57 89 50 Z" />
              <path d="M92 51 Q96 49 100 51 Q104 49 108 51 Q104 54 100 54 Q96 54 92 51 Z" />
            </g>
          )}
          {/* Crown, Level 10+ */}
          {showCrown && (
            <g>
              <polygon points="84,26 90,12 96,22 100,10 104,22 110,12 116,26 116,32 84,32" fill={`url(#${id('gold')})`} stroke="#8a6d00" strokeWidth="2" />
              <circle cx="100" cy="26" r="2.6" fill={gem} stroke="#fff" strokeWidth="1.5" />
              <circle cx="90" cy="26" r="2" fill={gem} stroke="#fff" strokeWidth="1" />
              <circle cx="110" cy="26" r="2" fill={gem} stroke="#fff" strokeWidth="1" />
            </g>
          )}
          {/* Face: male has thick straight brows; female has arched brows,
              lashes, and pink lips. */}
          {isFemale ? (
            <g>
              <path d="M87 37 Q91 34 95 37 M105 37 Q109 34 113 37" fill="none" stroke="#5b3a1e" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="91" cy="44" r="2.6" fill="#1c2b3a" />
              <circle cx="109" cy="44" r="2.6" fill="#1c2b3a" />
              <circle cx="92" cy="43" r="0.9" fill="#fff" />
              <circle cx="110" cy="43" r="0.9" fill="#fff" />
              <path d="M88 42 L85 40 M112 42 L115 40" stroke="#1c2b3a" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M98 47 Q100 50 102 47" fill="none" stroke="#c98a5a" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M93 53 Q100 58 107 53 Q100 56 93 53 Z" fill="#c25a6b" />
              <path d="M94 54 Q100 57 106 54" fill="none" stroke="#8a2f3f" strokeWidth="1" strokeLinecap="round" />
            </g>
          ) : (
            <g>
              <path d="M86 38 L95 37 M105 37 L114 38" fill="none" stroke="#5b3a1e" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="91" cy="44" r="2.6" fill="#1c2b3a" />
              <circle cx="109" cy="44" r="2.6" fill="#1c2b3a" />
              <circle cx="92" cy="43" r="0.9" fill="#fff" />
              <circle cx="110" cy="43" r="0.9" fill="#fff" />
              <path d="M98 47 Q100 50 102 47" fill="none" stroke="#c98a5a" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M94 54 Q100 58 106 54" fill="none" stroke="#1c2b3a" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}
          {/* Class weapon */}
          {g.classId === 'Guardian' && (
            <g>
              <path d="M36 84 L60 84 L60 106 Q48 118 36 106 Z" fill={`url(#${id('steel')})`} stroke={`url(#${id('gold')})`} strokeWidth="3" />
              <path d="M41 89 L55 89 L55 104 Q48 112 41 104 Z" fill={main} opacity="0.85" />
              <g className="guardian-gem" filter={`url(#${id('glow')})`}>
                <circle cx="48" cy="97" r="5.5" fill={`url(#${id('gem')})`} stroke="#fff" strokeWidth="1.5" />
              </g>
              <g transform="rotate(18 150 84)">
                <rect x="147" y="52" width="6" height="48" rx="3" fill={`url(#${id('steel')})`} stroke="#5b6b7a" strokeWidth="1.5" />
                <rect x="149" y="54" width="1.8" height="42" fill="#fff" opacity="0.7" />
                <rect x="140" y="98" width="20" height="6" rx="3" fill={`url(#${id('gold')})`} stroke="#8a6d00" strokeWidth="1.5" />
                <rect x="146" y="104" width="8" height="11" rx="3" fill="#5b3a1e" />
              </g>
            </g>
          )}
          {g.classId === 'Ranger' && (
            <g>
              <path d="M146 62 Q172 88 146 116" fill="none" stroke="#7a4a21" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M146 62 Q168 88 146 116" fill="none" stroke="#a8763e" strokeWidth="2" strokeLinecap="round" />
              <line x1="146" y1="62" x2="146" y2="116" stroke="#e8e2d4" strokeWidth="1.5" />
              <line x1="146" y1="88" x2="126" y2="88" stroke={gem} strokeWidth="2.5" strokeLinecap="round" />
              <polygon points="126,88 133,85 133,91" fill="#5b6b7a" />
              <rect x="40" y="84" width="15" height="36" rx="7.5" fill="#5b3a1e" stroke="#3a2410" strokeWidth="1.5" />
              <line x1="45" y1="82" x2="45" y2="74" stroke="#e8e2d4" strokeWidth="2" />
              <line x1="50" y1="82" x2="50" y2="72" stroke="#e8e2d4" strokeWidth="2" />
            </g>
          )}
          {g.classId === 'Spellweaver' && (
            <g>
              <rect x="148" y="44" width="6" height="118" rx="3" fill="#5b3a1e" stroke="#3a2410" strokeWidth="1.5" />
              <rect x="150" y="46" width="2" height="112" fill="#a8763e" opacity="0.7" />
              <g className="guardian-gem" filter={`url(#${id('glow')})`}>
                <polygon
                  points="151,20 155,32 167,32 158,40 162,52 151,45 140,52 144,40 135,32 147,32"
                  fill={`url(#${id('gem')})`}
                  stroke="#fff"
                  strokeWidth="2"
                />
              </g>
              <circle className="guardian-sparkle" cx="132" cy="58" r="3" fill={gemLight} />
              <circle className="guardian-sparkle" style={{ animationDelay: '0.7s' }} cx="126" cy="76" r="2.2" fill={gem} />
              <circle className="guardian-sparkle" style={{ animationDelay: '1.3s' }} cx="136" cy="90" r="1.8" fill={gemLight} />
            </g>
          )}
          {/* Legs: male legs thicker, female slimmer, both with boots */}
          <path d={isFemale ? "M89 122 L88 178 L95 178 L95 122 Z" : "M87 122 L86 178 L97 178 L97 122 Z"} fill={dark} />
          <path d={isFemale ? "M105 122 L105 178 L112 178 L111 122 Z" : "M103 122 L103 178 L114 178 L113 122 Z"} fill={dark} />
          <ellipse cx="91" cy="182" rx="9" ry="4.5" fill="#3a2410" />
          <ellipse cx="109" cy="182" rx="9" ry="4.5" fill="#3a2410" />
          <ellipse cx="88" cy="180" rx="4" ry="1.6" fill="#a8763e" opacity="0.6" />
          <ellipse cx="106" cy="180" rx="4" ry="1.6" fill="#a8763e" opacity="0.6" />
          {/* Spellweaver wizard robe (Harry Potter / Eragon): flows from the
              waist to the ankles over the legs, boots peeking out below. */}
          {g.classId === 'Spellweaver' && (
            <g>
              <path d="M84 118 L116 118 L128 166 Q100 176 72 166 Z" fill={`url(#${id('tunic')})`} stroke={dark} strokeWidth="2.5" />
              <path d="M92 124 Q90 146 92 164 M100 126 Q100 146 100 168 M108 124 Q110 146 108 164" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.4" />
              <path d="M88 130 Q86 148 88 162" fill="#fff" opacity="0.18" />
              <circle cx="100" cy="140" r="4" fill={`url(#${id('gem')})`} stroke="#fff" strokeWidth="1.5" />
            </g>
          )}
          {/* Guardian dragon-scale trim (Eragon): small scale marks on the
              chest and shoulders, in the gem color. Friendly, not scary. */}
          {g.classId === 'Guardian' && (
            <g fill={gem} opacity="0.5">
              <path d="M90 76 q4 5 8 0 q-4 5 -8 0 Z" />
              <path d="M102 76 q4 5 8 0 q-4 5 -8 0 Z" />
              <path d="M96 84 q4 5 8 0 q-4 5 -8 0 Z" />
            </g>
          )}
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
