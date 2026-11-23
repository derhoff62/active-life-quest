// GuardianAvatar: flat cartoon fantasy illustration, in the style of Derek's
// reference sheets (Nov 22, 2026): full-body characters, clean flat colours
// with one shade and one highlight, person-like proportions, simple faces.
// Image 1 (12 flat characters) is the readability lead at 56px; image 2
// (9 cartoon characters) adds shading detail, stronger poses and richer
// outfits at large size; image 3 adds outfit/weapon variety; image 4 adds
// fierce cartoon bosses (blue dragon model); image 5 adds creatures and
// flat weapons/shields/gear. Common ground: full-body, clean illustrated
// cartoon, simple faces, NO white sclera, NO realistic nose/ears, NO
// photorealism, NO uncanny realistic eyes (that was the creepy v49 face).
// Derek Nov 22: "Things don't have to look friendly" — the guardian is a
// warrior: determined/serious face, strong brows, firm mouth, not a smile.
// Male has a stronger jaw, Female is serious too, not just soft. No
// external images, no AI images, no new dependencies.
import { useId } from 'react';
import type { GuardianState } from '../lib/store';
import {
  COLOR_HEX,
  GEM_HEX,
  GEM_LIGHT_HEX,
  HAIR_WITH_BEARD,
  buildWidth,
  hairForLook,
} from '../lib/guardianOptions';

const COLOR_MAP: Record<string, string> = COLOR_HEX;
const GEM_MAP: Record<string, string> = GEM_HEX;
const GEM_LIGHT: Record<string, string> = GEM_LIGHT_HEX;

const SIZES = { large: 180, medium: 120, small: 72 } as const;

export type GuardianAvatarSize = keyof typeof SIZES;

// Custom backgrounds: one scene per class, plus one per Journey land.
// All pure SVG flat shapes, no external images.
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

// Flat cartoon palette: solid skin, solid steel, solid gold, solid wood.
const SKIN = '#f7d9ae';
const STEEL = '#b9c9d8';
const STEEL_DARK = '#7d93a8';
const GOLD = '#c9a227';
const GOLD_DARK = '#8a6d00';
const WOOD = '#7a4a21';
const WOOD_DARK = '#5b3a1e';
const BOOT = '#3a2410';

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
  const main = COLOR_MAP[g.bodyColor ?? g.color] ?? COLOR_MAP.Navy;
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
  // Female: slimmer shoulders and waist, narrower neck, softer jaw. Both
  // serious, battle-ready, fully clothed. Never sexualized.
  const isFemale = g.look === 'Female';
  // Hair style, per look, with a safe default for old profiles that never
  // picked one. Build changes torso width only, a little either way.
  const hair = hairForLook(g.look, g.hair);
  const hasBeard = !isFemale && HAIR_WITH_BEARD.includes(hair);
  const bw = buildWidth(g.build);
  // Per-part colors: each part defaults to the overall color, so old
  // profiles and a single overall pick still look the same, and each part
  // can then be changed on its own in Customize guardian / Onboarding.
  const partName = (v: string | undefined) => (v && COLOR_HEX[v] ? v : g.color);
  const armName = partName(g.armColor);
  const legName = partName(g.legColor);
  const capeName = partName(g.capeColor);
  const armMain = COLOR_HEX[armName];
  const armDark = shade(armMain, -45);
  const legMain = COLOR_HEX[legName];
  const legDark = shade(legMain, -45);
  const capeMain = COLOR_HEX[capeName];
  const capeDark = shade(capeMain, -45);
  const f = (n: number) => Math.round(n * 100) / 100;
  // Person-like proportions (reference sheets): head ~1/6-1/7 of body height.
  // Head centre y31 r13 (26px of ~176px total = ~1/6.8), shoulders y56,
  // waist/belt y108, boots y180.
  // Head/hair/face art is drawn at the old (100,36) centre and scaled 0.8
  // about (100,30) in the render, so the head shrinks without redrawing
  // every hair style. Neck top sits just below the chin, never over the mouth.
  const torsoD = isFemale
    ? `M100 54 L${f(100 + 13 * bw)} 58 L${f(100 + 15 * bw)} 92 L${f(100 + 10 * bw)} 118 L${f(100 - 10 * bw)} 118 L${f(100 - 15 * bw)} 92 L${f(100 - 13 * bw)} 58 Z`
    : `M100 54 L${f(100 + 21 * bw)} 58 L${f(100 + 23 * bw)} 94 L${f(100 + 17 * bw)} 118 L${f(100 - 17 * bw)} 118 L${f(100 - 23 * bw)} 94 L${f(100 - 21 * bw)} 58 Z`;
  const beltW = (isFemale ? 26 : 34) * bw;
  const pauldronRx = (isFemale ? 11 : 13) * bw;
  const pauldronDx = (isFemale ? 14 : 21) * bw;

  // Hair, flat with strand lines, not a flat cap. Each style has its own
  // silhouette so it reads at 72px too. Hair colour is a warm brown for
  // every style; the shape is what tells them apart. Head: centre (100,36),
  // r15, top y21, sides x85/115.
  const HAIR_C = '#5b3a1e';
  const HAIR_L = '#8a6238';
  const hairArt = isFemale ? (
    <g>
      {/* Top cap, shared by every Female style */}
      <path d="M85 40 Q83 21 100 21 Q117 21 115 40 Q110 27 100 27 Q90 27 85 40 Z" fill={HAIR_C} />
      <path d="M100 22 Q94 23 90 27" fill="none" stroke={HAIR_L} strokeWidth="2.5" opacity="0.9" strokeLinecap="round" />
      <path d="M100 22 Q106 23 110 27" fill="none" stroke={HAIR_L} strokeWidth="2.5" opacity="0.9" strokeLinecap="round" />
      {hair === 'Long' && (
        <g>
          <path d="M84 38 Q78 64 82 100 Q86 108 91 102 Q90 72 89 42 Z" fill={HAIR_C} />
          <path d="M116 38 Q122 64 118 100 Q114 108 109 102 Q110 72 111 42 Z" fill={HAIR_C} />
          <path d="M86 50 Q84 70 86 90 M114 50 Q116 70 114 90" fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
        </g>
      )}
      {hair === 'Ponytail' && (
        <g>
          <path d="M114 38 Q122 70 117 108 Q111 112 109 102 Q112 70 110 42 Z" fill={HAIR_C} />
          <circle cx="114" cy="52" r="4.5" fill={gem} stroke="#fff" strokeWidth="1" />
          <path d="M86 44 Q84 60 86 80 Q90 84 92 78 Q91 60 91 44 Z" fill={HAIR_C} />
        </g>
      )}
      {hair === 'Bun' && (
        <g>
          <circle cx="100" cy="15" r="9" fill={HAIR_C} />
          <path d="M93 10 Q100 6 107 10" fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.8" strokeLinecap="round" />
          <path d="M86 44 Q84 60 86 80 Q90 84 92 78 Q91 60 91 44 Z" fill={HAIR_C} />
          <path d="M114 44 Q116 60 114 80 Q110 84 108 78 Q109 60 109 44 Z" fill={HAIR_C} />
        </g>
      )}
      {hair === 'Curly' && (
        <g fill={HAIR_C}>
          <circle cx="87" cy="28" r="6" />
          <circle cx="95" cy="23" r="6.5" />
          <circle cx="105" cy="23" r="6.5" />
          <circle cx="113" cy="28" r="6" />
          <circle cx="82" cy="38" r="5.5" />
          <circle cx="118" cy="38" r="5.5" />
          <circle cx="82" cy="56" r="5" />
          <circle cx="118" cy="56" r="5" />
          <circle cx="84" cy="74" r="4.5" />
          <circle cx="116" cy="74" r="4.5" />
          <path d="M90 25 Q95 22 100 25 M104 25 Q109 22 113 25" fill="none" stroke={HAIR_L} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}
      {hair === 'Braided' && (
        <g fill={HAIR_C}>
          <path d="M86 44 Q84 60 86 80 Q90 84 92 78 Q91 60 91 44 Z" />
          <circle cx="114" cy="50" r="5.5" />
          <circle cx="111" cy="60" r="5.5" />
          <circle cx="115" cy="70" r="5.5" />
          <circle cx="111" cy="80" r="5.5" />
          <circle cx="115" cy="90" r="5.5" />
          <circle cx="112" cy="100" r="5" />
          <circle cx="114" cy="48" r="3" fill={gem} stroke="#fff" strokeWidth="1" />
          <circle cx="112" cy="104" r="3" fill={gem} stroke="#fff" strokeWidth="1" />
        </g>
      )}
      {hair === 'ShortBob' && (
        <g fill={HAIR_C}>
          <path d="M85 40 Q82 52 86 56 Q90 58 91 53 Q89 46 90 40 Z" />
          <path d="M115 40 Q118 52 114 56 Q110 58 109 53 Q111 46 110 40 Z" />
          <path d="M87 48 Q89 54 91 52 M113 48 Q111 54 109 52" fill="none" stroke={HAIR_L} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}
      {hair === 'Topknot' && (
        <g fill={HAIR_C}>
          <circle cx="100" cy="11" r="9" />
          <path d="M94 7 Q100 4 106 7" fill="none" stroke={HAIR_L} strokeWidth="2" strokeLinecap="round" />
          <path d="M93 18 Q100 15 107 18" fill="none" stroke={gem} strokeWidth="3" strokeLinecap="round" />
          <path d="M86 44 Q84 58 86 72 Q90 76 92 70 Q91 56 91 44 Z" />
          <path d="M114 44 Q116 58 114 72 Q110 76 108 70 Q109 56 109 44 Z" />
        </g>
      )}
    </g>
  ) : hair === 'Bald' ? (
    <g>
      <ellipse cx="100" cy="27" rx="9" ry="2.5" fill="#fff" opacity="0.2" />
    </g>
  ) : (
    <g>
      {hair === 'Buzz' ? (
        <path d="M85 39 Q85 25 100 24 Q115 25 115 39 Q109 29 100 29 Q91 29 85 39 Z" fill={HAIR_C} />
      ) : (
        <>
          <path d="M85 40 Q83 21 100 21 Q117 21 115 40 Q110 27 100 27 Q90 27 85 40 Z" fill={HAIR_C} />
          <path d="M89 27 Q94 23 100 23 Q106 23 111 27" fill="none" stroke={HAIR_L} strokeWidth="2.5" opacity="0.8" />
          <path d="M85 38 L86 46 L88 46 L88 38 Z" fill={HAIR_C} />
          <path d="M115 38 L114 46 L112 46 L112 38 Z" fill={HAIR_C} />
        </>
      )}
      {hair === 'Curly' && (
        <g fill={HAIR_C}>
          <circle cx="87" cy="28" r="5.5" />
          <circle cx="95" cy="23" r="6" />
          <circle cx="105" cy="23" r="6" />
          <circle cx="113" cy="28" r="5.5" />
          <circle cx="83" cy="38" r="5" />
          <circle cx="117" cy="38" r="5" />
        </g>
      )}
      {hair === 'Long' && (
        <g fill={HAIR_C}>
          <path d="M84 38 Q78 64 82 100 Q86 108 91 102 Q90 72 89 42 Z" />
          <path d="M116 38 Q122 64 118 100 Q114 108 109 102 Q110 72 111 42 Z" />
          <path d="M86 50 Q84 70 86 90 M114 50 Q116 70 114 90" fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
        </g>
      )}
      {hair === 'ManBun' && (
        <g fill={HAIR_C}>
          <circle cx="100" cy="13" r="7.5" />
          <path d="M95 9 Q100 6 105 9" fill="none" stroke={HAIR_L} strokeWidth="2" strokeLinecap="round" />
          <path d="M94 19 Q100 16 106 19" fill="none" stroke={gem} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M85 42 Q83 54 85 64 Q89 68 91 62 Q90 50 90 42 Z" />
          <path d="M115 42 Q117 54 115 64 Q111 68 109 62 Q110 50 110 42 Z" />
        </g>
      )}
    </g>
  );

  // Ranger hood: the hood covers most of the hair, so only the bits that
  // peek out are drawn — side locks, a braid, a bob, curls, or a topknot
  // poking above the hood. Buzz / Short / Bald show nothing extra.
  const hoodHair = (
    <g>
      <path d="M80 40 Q78 21 100 21 Q122 21 120 40 L113 34 Q109 25 100 25 Q91 25 87 34 Z" fill={capeMain} stroke={dark} strokeWidth="2.5" />
      <path d="M89 27 Q94 23 100 23" fill="none" stroke={light} strokeWidth="2" opacity="0.6" />
      {isFemale && hair === 'Long' && (
        <g fill={HAIR_C}>
          <path d="M85 42 Q81 70 84 100 Q89 104 91 96 Q91 68 90 44 Z" />
          <path d="M115 42 Q119 70 116 100 Q111 104 109 96 Q109 68 110 44 Z" />
        </g>
      )}
      {isFemale && hair === 'Ponytail' && (
        <g fill={HAIR_C}>
          <path d="M114 42 Q120 72 116 106 Q110 110 108 100 Q110 70 109 44 Z" />
          <circle cx="113" cy="54" r="4" fill={gem} stroke="#fff" strokeWidth="1" />
        </g>
      )}
      {isFemale && hair === 'Bun' && (
        <g fill={HAIR_C}>
          <circle cx="100" cy="14" r="8" />
          <path d="M85 42 Q83 62 85 84 Q89 88 91 82 Q90 60 90 44 Z" />
          <path d="M115 42 Q117 62 115 84 Q111 88 109 82 Q110 60 110 44 Z" />
        </g>
      )}
      {isFemale && hair === 'Curly' && (
        <g fill={HAIR_C}>
          <circle cx="82" cy="56" r="5" />
          <circle cx="118" cy="56" r="5" />
          <circle cx="84" cy="74" r="4.5" />
          <circle cx="116" cy="74" r="4.5" />
        </g>
      )}
      {isFemale && hair === 'Braided' && (
        <g fill={HAIR_C}>
          <circle cx="114" cy="54" r="5.5" />
          <circle cx="111" cy="64" r="5.5" />
          <circle cx="115" cy="74" r="5.5" />
          <circle cx="111" cy="84" r="5.5" />
          <circle cx="114" cy="94" r="5" />
          <circle cx="112" cy="98" r="3" fill={gem} stroke="#fff" strokeWidth="1" />
        </g>
      )}
      {isFemale && hair === 'ShortBob' && (
        <g fill={HAIR_C}>
          <path d="M85 42 Q82 52 86 56 Q90 58 91 53 Q89 46 90 42 Z" />
          <path d="M115 42 Q118 52 114 56 Q110 58 109 53 Q111 46 110 42 Z" />
        </g>
      )}
      {isFemale && hair === 'Topknot' && (
        <g fill={HAIR_C}>
          <circle cx="100" cy="12" r="8" />
          <path d="M94 18 Q100 15 106 18" fill="none" stroke={gem} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
      {!isFemale && hair === 'Curly' && (
        <g fill={HAIR_C}>
          <circle cx="84" cy="40" r="4" />
          <circle cx="116" cy="40" r="4" />
        </g>
      )}
      {!isFemale && hair === 'Long' && (
        <g fill={HAIR_C}>
          <path d="M83 42 Q77 64 81 98 Q85 106 90 100 Q89 70 88 44 Z" />
          <path d="M117 42 Q123 64 119 98 Q115 106 110 100 Q111 70 112 44 Z" />
        </g>
      )}
      {!isFemale && hair === 'ManBun' && (
        <g fill={HAIR_C}>
          <circle cx="100" cy="13" r="7.5" />
          <path d="M94 19 Q100 16 106 19" fill="none" stroke={gem} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
    </g>
  );

  // Background scene shapes, flat, drawn behind the figure.
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
          <rect x="18" y="70" width="3" height="22" fill={WOOD} />
          <polygon points="21,70 36,76 21,82" fill={main} />
          <rect x="179" y="70" width="3" height="22" fill={WOOD} />
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
          <rect x="0" y="168" width="200" height="32" fill="#1e7a46" opacity="0.4" />
        </g>
      )}
      {scene === 'spellweaver' && (
        <g>
          {[
            [24, 28], [52, 16], [86, 24], [120, 14], [152, 26], [176, 44],
            [34, 62], [64, 44], [140, 40], [168, 76], [20, 100], [180, 110],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.6 : 1.8} fill="#fff" />
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

  // Flat scene background colour (no gradient wash, like the reference sheets).
  const sceneBg =
    scene === 'spellweaver' ? '#124571'
    : scene === 'peaks' ? '#eef5fb'
    : scene === 'shores' ? '#eef5fb'
    : scene === 'ranger' || scene === 'forest' ? '#eef5fb'
    : '#f6ecd0';

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
        </defs>

        {/* Flat background scene, clipped to the rounded frame */}
        <g clipPath={`url(#${id('frame')})`}>
          <rect x="0" y="0" width="200" height="200" fill={sceneBg} />
          {sceneArt}
        </g>
        {/* Thin gold frame, the one epic touch kept: flat, clean, reads at any size */}
        <rect x="2" y="2" width="196" height="196" rx="16" fill="none" stroke={GOLD} strokeWidth="3" opacity="0.8" />
        {/* Ground shadow */}
        <ellipse className="guardian-shadow" cx="100" cy="188" rx="44" ry="6" fill="#124571" opacity="0.18" />

        <g className="guardian-bob">
          {/* Cape with folds, flat */}
          {g.cape && (
            <g>
              <path d="M100 58 L126 66 L122 140 Q100 148 78 140 L74 66 Z" fill={capeMain} opacity="0.96" />
              <path d="M86 72 Q84 106 86 136" fill="none" stroke={capeDark} strokeWidth="2" opacity="0.6" />
              <path d="M114 72 Q116 106 114 136" fill="none" stroke={capeDark} strokeWidth="2" opacity="0.6" />
            </g>
          )}
          {/* Wings, Level 8+ : flat white feathers */}
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
            </g>
          )}
          {/* Neck: connects the head to the shoulders, so the head never floats.
              Drawn before the torso and head, so it fills the seam.
              Male neck is wider and thicker; female neck is narrower. */}
          <rect x={isFemale ? 96 : 93} y="43" width={isFemale ? 8 : 14} height="12" rx="3" fill={SKIN} stroke={dark} strokeWidth="1.5" />
          {/* Arms: male arms are thicker and more muscular; female arms slimmer. */}
          {isFemale ? (
            <>
              <path d="M86 64 Q79 82 81 100 L86 99 Q85 82 90 68 Z" fill={armMain} stroke={armDark} strokeWidth="2" />
              <path d="M114 64 Q121 82 119 100 L114 99 Q115 82 110 68 Z" fill={armMain} stroke={armDark} strokeWidth="2" />
            </>
          ) : (
            <>
              <path d="M82 62 Q72 82 75 102 L84 101 Q83 82 90 67 Z" fill={armMain} stroke={armDark} strokeWidth="2" />
              <path d="M118 62 Q128 82 125 102 L116 101 Q117 82 110 67 Z" fill={armMain} stroke={armDark} strokeWidth="2" />
              <path d="M76 82 Q74 92 76 100" fill="none" stroke={dark} strokeWidth="3" opacity="0.35" strokeLinecap="round" />
              <path d="M124 82 Q126 92 124 100" fill="none" stroke={dark} strokeWidth="3" opacity="0.35" strokeLinecap="round" />
            </>
          )}
          {/* Body: flat tunic in the main colour, one light strip on the left,
              one dark strip on the right (reference image 2 shading). Top
              edge (y54) overlaps the bottom of the head (y51). */}
          <path d={torsoD} fill={main} stroke={dark} strokeWidth="2.5" />
          <path d="M88 66 Q86 90 88 112 Q93 114 95 112 Q91 90 93 68 Z" fill="#fff" opacity="0.22" />
          <path d="M112 66 Q114 90 112 112 Q107 114 105 112 Q109 90 107 68 Z" fill="#000" opacity="0.14" />
          {/* Belt */}
          <rect x={100 - beltW / 2} y="106" width={beltW} height="9" rx="4.5" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.5" />
          <rect x="94" y="107" width="12" height="7" rx="2" fill="#fffdf4" stroke={GOLD_DARK} strokeWidth="1.5" />
          {/* Glowing gem on chest: flat diamond with a white facet */}
          <g className="guardian-gem">
            <polygon points="100,76 109,85 100,96 91,85" fill={gem} stroke="#fff" strokeWidth="2" />
            <polygon points="100,81 104,85 100,90 96,85" fill="#fff" opacity="0.55" />
          </g>
          {/* Hands */}
          <circle cx={isFemale ? 81 : 75} cy="102" r={isFemale ? 4.5 : 5.5} fill={SKIN} stroke={dark} strokeWidth="1.5" />
          <circle cx={isFemale ? 119 : 125} cy="102" r={isFemale ? 4.5 : 5.5} fill={SKIN} stroke={dark} strokeWidth="1.5" />
          {/* Pauldrons are drawn after the hair/face below, so long hair
              never covers them (Female/Long bug in v51). */}
          {/* Cloak clasp at the neck, so shoulders, neck, and head read as
              one connected figure. */}
          <circle cx="100" cy="60" r="5" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.5" />
          <circle cx="100" cy="60" r="2.5" fill={gem} stroke="#fff" strokeWidth="1" />
          {/* Head: flat skin, r15 at (100,36). Male has a squarer, stronger
              jaw (jaw lines); female a softer, rounder face. Same size, so
              the difference reads at 72px too. */}
          <circle cx="100" cy="31" r="13" fill={SKIN} stroke={dark} strokeWidth="2" />
          {!isFemale && (
            <g stroke={dark} strokeWidth="1.5" opacity="0.35" fill="none" strokeLinecap="round">
              <path d="M89 35 L92 40" />
              <path d="M111 35 L108 40" />
            </g>
          )}
          {/* Hair: Ranger hood for Ranger, wizard hat for Spellweaver, else
              the picked hair style. */}
          <g transform="translate(100 30) scale(0.8) translate(-100 -36)">
            {g.classId === 'Ranger' ? hoodHair : g.classId === 'Spellweaver' ? null : hairArt}
          </g>
          {/* Spellweaver hat: a pointed wizard hat, NOT the flat wide-brimmed
              hat from v51. Tall cone with a bent tip, gem band at the base. */}
          {g.classId === 'Spellweaver' && (
            <g>
              <path d="M75 21 Q82 4 100 1 Q105 1 107 5 Q109 9 105 12 Q101 15 103 21 Z" fill={main} stroke={dark} strokeWidth="2" />
              <path d="M82 10 Q90 4 100 3" fill="none" stroke={light} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
              <ellipse cx="100" cy="21" rx="26" ry="5" fill={main} stroke={dark} strokeWidth="2" />
              <path d="M78 19 Q100 15 122 19" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.5" />
              <circle cx="100" cy="17" r="3.5" fill={gem} stroke="#fff" strokeWidth="1" />
            </g>
          )}
          {/* Beard: only when the picked hair style has one (Short + beard,
              Bald, or Long for Male). Short, Buzz, Curly, and Man bun are
              clean-shaven. Female has no beard. Drawn before the face, so
              the firm mouth reads over it. */}
          {hasBeard && (
            <g transform="translate(100 30) scale(0.8) translate(-100 -36)" fill={HAIR_C}>
              <path d="M86 42 Q85 54 100 56 Q115 54 114 42 L110 46 Q108 52 100 53 Q92 52 90 46 Z" />
              <path d="M92 46 Q96 44 100 46 Q104 44 108 46 Q104 49 100 49 Q96 49 92 46 Z" />
            </g>
          )}
          {/* Crown, Level 10+ */}
          {showCrown && (
            <g transform="translate(100 30) scale(0.8) translate(-100 -36)">
              <polygon points="86,22 91,10 96,19 100,8 104,19 109,10 114,22 114,27 86,27" fill={GOLD} stroke={GOLD_DARK} strokeWidth="2" />
              <circle cx="100" cy="22" r="2.6" fill={gem} stroke="#fff" strokeWidth="1.5" />
              <circle cx="91" cy="22" r="2" fill={gem} stroke="#fff" strokeWidth="1" />
              <circle cx="109" cy="22" r="2" fill={gem} stroke="#fff" strokeWidth="1" />
            </g>
          )}
          {/* Face: determined warrior, like the reference sheets. Small dark
              dot eyes (NO white sclera, NO iris ring, NO highlight — the
              v49 realistic eyes were the creepy part). Strong brows angled
              down toward the centre. A firm straight mouth, not a smile.
              NO nose, NO ears, NO blush. Female is serious too, with
              slimmer brows; male brows are thick. */}
          {isFemale ? (
            <g transform="translate(100 30) scale(0.8) translate(-100 -36)">
              <path d="M87 32 L95 34 M105 34 L113 32" fill="none" stroke={HAIR_C} strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="91" cy="40" r="2.2" fill="#1c2b3a" />
              <circle cx="109" cy="40" r="2.2" fill="#1c2b3a" />
              <path d="M94 49 L106 49" fill="none" stroke="#1c2b3a" strokeWidth="2.2" strokeLinecap="round" />
            </g>
          ) : (
            <g transform="translate(100 30) scale(0.8) translate(-100 -36)">
              <path d="M86 31 L95 34 M105 34 L114 31" fill="none" stroke={HAIR_C} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="91" cy="40" r="2.2" fill="#1c2b3a" />
              <circle cx="109" cy="40" r="2.2" fill="#1c2b3a" />
              <path d="M94 49 L106 49" fill="none" stroke="#1c2b3a" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}
          {/* Guardian pauldrons, drawn AFTER hair/face so long hair can
              never hide them. Big steel, both looks, all hairstyles. */}
          {g.classId === 'Guardian' && (
            <g>
              <ellipse cx={100 - pauldronDx} cy="64" rx={pauldronRx} ry={isFemale ? 7.5 : 8} fill={STEEL} stroke={dark} strokeWidth="2" />
              <ellipse cx={100 + pauldronDx} cy="64" rx={pauldronRx} ry={isFemale ? 7.5 : 8} fill={STEEL} stroke={dark} strokeWidth="2" />
              <circle cx={100 - pauldronDx} cy="64" r="2.5" fill={gem} />
              <circle cx={100 + pauldronDx} cy="64" r="2.5" fill={gem} />
            </g>
          )}
          {/* Class weapon, flat like reference image 5: HELD in the hands,
              not standing on the scenery. Hand circles are redrawn on top
              of each grip, so the hand reads as holding the weapon. */}
          <circle cx={isFemale ? 81 : 75} cy="102" r="0" fill="none" />
          {/* Class weapon, flat like reference image 5: a distinct item at a glance */}
          {g.classId === 'Guardian' && (
            <g>
              {/* Shield, left hand: flat, gold rim, main-colour panel, gem centre */}
              <path d="M48 80 L76 80 L76 100 Q62 114 48 100 Z" fill={STEEL} stroke={GOLD} strokeWidth="3" />
              <path d="M53 85 L71 85 L71 99 Q62 108 53 99 Z" fill={main} opacity="0.9" />
              <circle cx="62" cy="95" r="5.5" fill={gem} stroke="#fff" strokeWidth="1.5" />
              <circle cx={isFemale ? 81 : 75} cy="102" r={isFemale ? 4.5 : 5.5} fill={SKIN} stroke={dark} strokeWidth="1.5" />
              {/* Sword, right hand: flat blade, gold crossguard, brown grip */}
              <g transform="rotate(12 122 80)">
                <rect x="119" y="48" width="6" height="50" rx="3" fill={STEEL} stroke={STEEL_DARK} strokeWidth="1.5" />
                <rect x="121" y="50" width="1.8" height="44" fill="#fff" opacity="0.7" />
                <rect x="112" y="96" width="20" height="6" rx="3" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.5" />
                <rect x="118" y="102" width="8" height="12" rx="3" fill={WOOD} />
              </g>
              <circle cx={isFemale ? 119 : 125} cy="102" r={isFemale ? 4.5 : 5.5} fill={SKIN} stroke={dark} strokeWidth="1.5" />
              {/* Steel chest plate over the tunic, gem trim */}
              <path d="M86 60 L114 60 L117 88 L100 96 L83 88 Z" fill={STEEL} stroke={STEEL_DARK} strokeWidth="2" opacity="0.95" />
              <path d="M86 60 L114 60 L116 74 L84 74 Z" fill={main} opacity="0.85" />
              <circle cx="100" cy="84" r="4" fill={gem} stroke="#fff" strokeWidth="1.5" />
            </g>
          )}
          {g.classId === 'Ranger' && (
            <g>
              {/* Bow, right hand, flat brown arc with string and arrow */}
              <path d="M128 68 Q152 102 128 136" fill="none" stroke={WOOD} strokeWidth="4.5" strokeLinecap="round" />
              <path d="M128 68 Q148 102 128 136" fill="none" stroke="#a8763e" strokeWidth="2" strokeLinecap="round" />
              <line x1="128" y1="68" x2="128" y2="136" stroke="#e8e2d4" strokeWidth="1.5" />
              <line x1="128" y1="102" x2="152" y2="102" stroke={gem} strokeWidth="2.5" strokeLinecap="round" />
              <polygon points="152,102 145,99 145,105" fill={STEEL_DARK} />
              <circle cx={isFemale ? 119 : 125} cy="102" r={isFemale ? 4.5 : 5.5} fill={SKIN} stroke={dark} strokeWidth="1.5" />
              {/* Quiver worn on the back: peeks over the left shoulder with
                  arrows sticking up, strap diagonal across the chest. */}
              <g transform="rotate(-18 78 72)">
                <rect x="71" y="60" width="14" height="30" rx="7" fill={WOOD} stroke={WOOD_DARK} strokeWidth="1.5" />
              </g>
              <line x1="74" y1="62" x2="70" y2="52" stroke="#e8e2d4" strokeWidth="2" strokeLinecap="round" />
              <line x1="79" y1="60" x2="78" y2="50" stroke="#e8e2d4" strokeWidth="2" strokeLinecap="round" />
              <line x1="84" y1="62" x2="86" y2="52" stroke="#e8e2d4" strokeWidth="2" strokeLinecap="round" />
              <path d="M84 62 L116 108" fill="none" stroke={WOOD_DARK} strokeWidth="4" opacity="0.7" strokeLinecap="round" />
            </g>
          )}
          {g.classId === 'Spellweaver' && (
            <g>
              {/* Staff, right hand: flat brown shaft, star gem on top */}
              <rect x="122" y="42" width="6" height="116" rx="3" fill={WOOD} stroke={WOOD_DARK} strokeWidth="1.5" />
              <rect x="124" y="44" width="2" height="110" fill="#a8763e" opacity="0.7" />
              <circle cx={isFemale ? 119 : 125} cy="102" r={isFemale ? 4.5 : 5.5} fill={SKIN} stroke={dark} strokeWidth="1.5" />
              <polygon
                points="125,18 129,30 141,30 132,38 136,50 125,43 114,50 118,38 109,30 121,30"
                fill={gem} stroke="#fff" strokeWidth="2"
              />
              <polygon points="125,26 128,32 125,38 122,32" fill="#fff" opacity="0.5" />
              <circle cx="106" cy="56" r="3" fill={gemLight} />
              <circle cx="100" cy="74" r="2.2" fill={gem} />
              <circle cx="110" cy="88" r="1.8" fill={gemLight} />
            </g>
          )}
          {/* Legs: male legs thicker, female slimmer, both with boots */}
          <path d={isFemale ? "M89 118 L88 174 L95 174 L95 118 Z" : "M87 118 L86 174 L97 174 L97 118 Z"} fill={legMain} stroke={legDark} strokeWidth="1.5" />
          <path d={isFemale ? "M105 118 L105 174 L112 174 L111 118 Z" : "M103 118 L103 174 L114 174 L113 118 Z"} fill={legMain} stroke={legDark} strokeWidth="1.5" />
          <ellipse cx="91" cy="178" rx="9" ry="4.5" fill={BOOT} />
          <ellipse cx="109" cy="178" rx="9" ry="4.5" fill={BOOT} />
          <ellipse cx="88" cy="176" rx="4" ry="1.6" fill="#a8763e" opacity="0.6" />
          <ellipse cx="106" cy="176" rx="4" ry="1.6" fill="#a8763e" opacity="0.6" />
          {/* Spellweaver wizard robe: flows from the waist to the ankles over
              the legs, boots peeking out below. Flat, with fold lines. */}
          {g.classId === 'Spellweaver' && (
            <g>
              <path d="M84 114 L116 114 L128 164 Q100 172 72 164 Z" fill={main} stroke={dark} strokeWidth="2.5" />
              <path d="M92 120 Q90 142 92 160 M100 122 Q100 142 100 164 M108 120 Q110 142 108 160" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.4" />
              <path d="M88 126 Q86 144 88 158" fill="#fff" opacity="0.18" />
              <circle cx="100" cy="136" r="4" fill={gem} stroke="#fff" strokeWidth="1.5" />
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
