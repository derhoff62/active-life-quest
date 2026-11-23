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
  HAIR_WITH_BEARD,
  buildWidth,
  hairForLook,
} from '../lib/guardianOptions';

const COLOR_MAP: Record<string, string> = COLOR_HEX;
const GEM_MAP: Record<string, string> = GEM_HEX;

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

// 5-point star polygon centred at (cx, cy), outer radius 13, inner 5.5.
function starPoints(cx: number, cy: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const aOuter = (-90 + i * 72) * (Math.PI / 180);
    const aInner = (-54 + i * 72) * (Math.PI / 180);
    pts.push(`${Math.round((cx + 13 * Math.cos(aOuter)) * 10) / 10},${Math.round((cy + 13 * Math.sin(aOuter)) * 10) / 10}`);
    pts.push(`${Math.round((cx + 5.5 * Math.cos(aInner)) * 10) / 10},${Math.round((cy + 5.5 * Math.sin(aInner)) * 10) / 10}`);
  }
  return pts.join(' ');
}

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
  // Head outline: softer than `dark` and thin, so the chin arc never reads
  // as a band across the mouth (v53 bug 2 root cause: the old 2-unit
  // near-black chin arc sat 3px below the mouth and read as a thick band).
  const headStroke = shade(main, -28);
  const gem = GEM_MAP[g.gem] ?? GEM_MAP.Sapphire;
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
  // Spellweaver staff grip: the hand that holds the staff (Female cx119,
  // Male cx125), and a slightly bigger grip hand so the grip reads at 120px.
  const handX = isFemale ? 119 : 125;
  const gripR = isFemale ? 5.5 : 6;
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
  // Person-like proportions (reference sheets): head ~1/6 of body height.
  // ROOT CAUSE (v53, found by rendering): the skin circle was r12 and
  // drawn OUTSIDE the 0.72 face/hair transform, while the eyes, mouth,
  // brows, and hair inside it were scaled 0.72: a big empty balloon face
  // holding small centred features, with a 2-unit near-black outline and
  // hair locks wider than the face, so the head read ~1/4. The circle is
  // now r10.5 at cy29 and the face/hair/beard/crown groups centre on
  // (100,29) at the same scale, so circle, features, and hair agree.
  // Neck top sits just below the chin, never over the mouth.
  const torsoD = isFemale
    ? `M100 54 L${f(100 + 13 * bw)} 58 L${f(100 + 15 * bw)} 92 L${f(100 + 10 * bw)} 118 L${f(100 - 10 * bw)} 118 L${f(100 - 15 * bw)} 92 L${f(100 - 13 * bw)} 58 Z`
    : `M100 54 L${f(100 + 21 * bw)} 58 L${f(100 + 23 * bw)} 94 L${f(100 + 17 * bw)} 118 L${f(100 - 17 * bw)} 118 L${f(100 - 23 * bw)} 94 L${f(100 - 21 * bw)} 58 Z`;
  const beltW = (isFemale ? 26 : 34) * bw;
  const pauldronRx = (isFemale ? 11 : 13) * bw;
  const pauldronDx = (isFemale ? 14 : 21) * bw;

  // Hair, flat with strand lines, not a flat cap. Each style has its own
  // silhouette so it reads at 72px too. Hair colour is a warm brown for
  // every style; the shape is what tells them apart. Head (rendered):
  // centre (100,30), r12, top y18, chin y42, sides x88/112.
  const HAIR_C = '#5b3a1e';
  const HAIR_L = '#8a6238';
  const hairArt = isFemale ? (
    <g>
      {/* Top cap, shared by every Female style. Narrowed (x87-113, was
          x83-117): the old 34-wide cap is what made the head read wide. */}
      <path d="M87 40 Q86 22 100 22 Q114 22 113 40 Q109 28 100 28 Q91 28 87 40 Z" fill={HAIR_C} />
      <path d="M100 23 Q95 24 91 28" fill="none" stroke={HAIR_L} strokeWidth="2.5" opacity="0.9" strokeLinecap="round" />
      <path d="M100 23 Q105 24 109 28" fill="none" stroke={HAIR_L} strokeWidth="2.5" opacity="0.9" strokeLinecap="round" />
      {hair === 'Long' && (
        <g>
          {/* Locks end just below the shoulders (y~68), NOT at the waist
              (old y100): the old waist-length locks are what made the
              head+hair mass read as ~1/4 of the figure. */}
          <path d="M87 38 Q84 52 85 68 Q88 71 90 66 Q89 52 89 42 Z" fill={HAIR_C} />
          <path d="M113 38 Q116 52 115 68 Q112 71 110 66 Q111 52 111 42 Z" fill={HAIR_C} />
          <path d="M88 48 Q86 58 88 64 M112 48 Q114 58 112 64" fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
        </g>
      )}
      {hair === 'Ponytail' && (
        <g>
          <path d="M114 38 Q121 58 117 84 Q112 88 109 80 Q112 58 110 42 Z" fill={HAIR_C} />
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
          <path d="M90 25 Q95 22 100 25 M104 25 Q109 22 113 25" fill="none" stroke={HAIR_L} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}
      {hair === 'Braided' && (
        <g fill={HAIR_C}>
          <path d="M86 44 Q84 60 86 80 Q90 84 92 78 Q91 60 91 44 Z" />
          <circle cx="114" cy="50" r="5.5" />
          <circle cx="111" cy="60" r="5.5" />
          <circle cx="115" cy="70" r="5.5" />
          <circle cx="112" cy="78" r="5" />
          <circle cx="114" cy="48" r="3" fill={gem} stroke="#fff" strokeWidth="1" />
          <circle cx="112" cy="82" r="3" fill={gem} stroke="#fff" strokeWidth="1" />
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
          <path d="M87 40 Q86 22 100 22 Q114 22 113 40 Q109 28 100 28 Q91 28 87 40 Z" fill={HAIR_C} />
          <path d="M90 28 Q95 24 100 24 Q105 24 110 28" fill="none" stroke={HAIR_L} strokeWidth="2.5" opacity="0.8" />
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
          <path d="M87 38 Q84 52 85 68 Q88 71 90 66 Q89 52 89 42 Z" />
          <path d="M113 38 Q116 52 115 68 Q112 71 110 66 Q111 52 111 42 Z" />
          <path d="M88 48 Q86 58 88 64 M112 48 Q114 58 112 64" fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
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
      <path d="M84 40 Q82 22 100 22 Q118 22 116 40 L111 34 Q108 26 100 26 Q92 26 89 34 Z" fill={capeMain} stroke={dark} strokeWidth="2.5" />
      <path d="M90 28 Q95 24 100 24" fill="none" stroke={light} strokeWidth="2" opacity="0.6" />
      {isFemale && hair === 'Long' && (
        <g fill={HAIR_C}>
          <path d="M85 42 Q81 56 84 70 Q89 74 91 68 Q91 54 90 44 Z" />
          <path d="M115 42 Q119 56 116 70 Q111 74 109 68 Q109 54 110 44 Z" />
        </g>
      )}
      {isFemale && hair === 'Ponytail' && (
        <g fill={HAIR_C}>
          <path d="M114 42 Q120 60 116 84 Q110 88 108 80 Q110 58 109 44 Z" />
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
          <circle cx="115" cy="74" r="5" />
          <circle cx="112" cy="78" r="3" fill={gem} stroke="#fff" strokeWidth="1" />
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
          <path d="M83 42 Q79 56 82 70 Q86 74 89 68 Q88 54 88 44 Z" />
          <path d="M117 42 Q121 56 118 70 Q114 74 111 68 Q112 54 112 44 Z" />
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
              Male neck is wider and thicker; female neck is narrower.
              ROOT CAUSE (v52 mouth band): the old neck rect had a DARK
              stroke and its top edge sat 2.6px below the mouth, so at the
              120px Customize preview its dark top edge merged with the chin
              outline into a dark band across the lower face at mouth level.
              No stroke now, skin fill only, top at y39 touching the chin. */}
          <rect x={isFemale ? 96 : 93} y="39" width={isFemale ? 8 : 14} height="13" rx="3" fill={SKIN} />
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
          {/* Head: flat skin, r10.5 at (100,29), 21 units tall in a 164-unit
              figure (~1/7.8). The v52 head was r12 (24 units) OUTSIDE the
              0.72 face/hair transform while the features inside were scaled
              0.72, so a big empty balloon face held small centred features
              and read ~1/4 with its thick outline: that mismatch, not the
              hair, was the chibi read. The circle, the face, and the hair
              now all centre on (100,29) at the same scale, and the outline
              is 1.2 units in a softer navy, so the chin arc is a face
              outline, not a band. */}
          <circle cx="100" cy="29" r="10.5" fill={SKIN} stroke={headStroke} strokeWidth="1.2" />
          {!isFemale && (
            <g stroke={dark} strokeWidth="1.5" opacity="0.35" fill="none" strokeLinecap="round">
              <path d="M89 35 L92 40" />
              <path d="M111 35 L108 40" />
            </g>
          )}
          {/* Hair: Ranger hood for Ranger, wizard hat for Spellweaver, else
              the picked hair style. */}
          <g transform="translate(100 29) scale(0.72) translate(-100 -36)">
            {g.classId === 'Ranger' ? hoodHair : g.classId === 'Spellweaver' ? null : hairArt}
          </g>
          {/* Spellweaver hat: a pointed wizard hat. ROOT CAUSE (v53):
              the old hat WAS rendering (same branch, Armor passes the class
              prop through the draft, verified) and its cone was 25 tall,
              but it was filled `main` (Navy) on the Spellweaver night-sky
              background, which is ALSO Navy #124571: only its 2-unit
              outline showed, so at 120px it read as a flat wide brim with
              a small dome and a gem. Fix: the cone and brim are now filled
              `light`, which reads against the dark sky, the cone is
              narrower (32 wide, was 44) and taller for its width, with a
              clear bent tip flopping right. Brim rx19 (was rx23). */}
          {g.classId === 'Spellweaver' && (
            <g>
              <path d="M84 22 L98 1 Q106 -1 109 6 Q110 11 105 13 Q101 15 103 22 L116 22 Z" fill={light} stroke={dark} strokeWidth="2" strokeLinejoin="round" />
              <path d="M88 18 L97 7" fill="none" stroke="#fff" strokeWidth="2" opacity="0.55" strokeLinecap="round" />
              <ellipse cx="100" cy="22" rx="19" ry="4" fill={light} stroke={dark} strokeWidth="2" />
              <path d="M82 21 Q100 18 118 21" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.5" />
              <circle cx="100" cy="20" r="3.5" fill={gem} stroke="#fff" strokeWidth="1" />
            </g>
          )}
          {/* Beard: only when the picked hair style has one (Short + beard,
              Bald, or Long for Male). Short, Buzz, Curly, and Man bun are
              clean-shaven. Female has no beard. ROOT CAUSE (v52 mouth band
              + "small nose"): the old beard path spanned rendered y~35-46,
              a dark band straight across the mouth, with the mouth line
              drawn ON it in near-black so it vanished, and the beard's
              second path was a small dark blob just above the mouth that
              read as a nose. Fix: the beard is now CHIN-ONLY, starting
              below the mouth (y51), the mustache is two separate corner
              tufts with the centre clear, and the blob is gone. The firm
              mouth sits on clear skin between mustache and beard. Drawn
              before the face, so the mouth reads over it. */}
          {hasBeard && (
            <g transform="translate(100 29) scale(0.72) translate(-100 -36)" fill={HAIR_C}>
              <path d="M87 44 Q91 42 96 44.5 Q92 46.5 87 46 Z" />
              <path d="M113 44 Q109 42 104 44.5 Q108 46.5 113 46 Z" />
              <path d="M88 51 Q87 59 100 61 Q113 59 112 51 L108 53 Q106 57 100 58 Q94 57 92 53 Z" />
            </g>
          )}
          {/* Crown, Level 10+ */}
          {showCrown && (
            <g transform="translate(100 29) scale(0.72) translate(-100 -36)">
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
            <g transform="translate(100 29) scale(0.72) translate(-100 -36)">
              <path d="M88 32 L95 34.5 M105 34.5 L112 32" fill="none" stroke={HAIR_C} strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="94" cy="38" r="2.2" fill="#1c2b3a" />
              <circle cx="106" cy="38" r="2.2" fill="#1c2b3a" />
              <path d="M95 47 L105 47" fill="none" stroke="#1c2b3a" strokeWidth="2.2" strokeLinecap="round" />
            </g>
          ) : (
            <g transform="translate(100 29) scale(0.72) translate(-100 -36)">
              <path d="M87 31 L95 34.5 M105 34.5 L113 31" fill="none" stroke={HAIR_C} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="94" cy="38" r="2.2" fill="#1c2b3a" />
              <circle cx="106" cy="38" r="2.2" fill="#1c2b3a" />
              <path d="M95 47 L105 47" fill="none" stroke="#1c2b3a" strokeWidth="2.5" strokeLinecap="round" />
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
          {/* Class weapon, flat like reference image 5: a distinct item at a glance */}
          {g.classId === 'Guardian' && (
            <g>
              {/* Shield, figure's LEFT hand (image-right): flat, gold rim,
                  main-colour panel, gem centre. ROOT CAUSE (v52): the old
                  code put the shield at x48-76 (image-left) with the
                  image-left hand, but for a front-facing figure image-left
                  IS the figure's right side, so the shield was in the
                  figure's right hand and the sword in the left. Swapped. */}
              <path d="M124 80 L152 80 L152 100 Q138 114 124 100 Z" fill={STEEL} stroke={GOLD} strokeWidth="3" />
              <path d="M129 85 L147 85 L147 99 Q138 108 129 99 Z" fill={main} opacity="0.9" />
              <circle cx="138" cy="95" r="5.5" fill={gem} stroke="#fff" strokeWidth="1.5" />
              <circle cx={isFemale ? 119 : 125} cy="102" r={isFemale ? 4.5 : 5.5} fill={SKIN} stroke={dark} strokeWidth="1.5" />
              {/* Sword, figure's RIGHT hand (image-left): flat blade, gold
                  crossguard, brown grip */}
              <g transform="rotate(-12 78 80)">
                <rect x="75" y="48" width="6" height="50" rx="3" fill={STEEL} stroke={STEEL_DARK} strokeWidth="1.5" />
                <rect x="77" y="50" width="1.8" height="44" fill="#fff" opacity="0.7" />
                <rect x="68" y="96" width="20" height="6" rx="3" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.5" />
                <rect x="74" y="102" width="8" height="12" rx="3" fill={WOOD} />
              </g>
              <circle cx={isFemale ? 81 : 75} cy="102" r={isFemale ? 4.5 : 5.5} fill={SKIN} stroke={dark} strokeWidth="1.5" />
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
              {/* Staff, tilted 7deg about the grip hand so the star clears
                  the face. ROOT CAUSE (v53): the old star spanned x103-135,
                  y18-50, so its left point covered the figure's right eye
                  (rendered at x104.3, y31.4), and the finial sat at face
                  level. The star is now r13 (was ~r16, starPoints helper)
                  and the tilt moves its centre ~9px right of the face.
                  The shaft is split into two segments with the grip hand
                  drawn over the gap, so the grip reads at 120px: a
                  continuous shaft behind a 4.5r hand did not read as a
                  grip (live v53: "shaft uninterrupted"). The three
                  floating sparkle dots are gone: they sat left of the
                  shaft and floated once the staff tilted. */}
              <g transform={`rotate(7 ${handX} 102)`}>
                <rect x={handX - 3} y="42" width="6" height="54" rx="3" fill={WOOD} stroke={WOOD_DARK} strokeWidth="1.5" />
                <rect x={handX - 3} y="108" width="6" height="50" rx="3" fill={WOOD} stroke={WOOD_DARK} strokeWidth="1.5" />
                <rect x={handX - 1} y="44" width="2" height="50" fill="#a8763e" opacity="0.7" />
                <rect x={handX - 1} y="110" width="2" height="46" fill="#a8763e" opacity="0.7" />
                <polygon points={starPoints(handX, 30)} fill={gem} stroke="#fff" strokeWidth="2" />
                <polygon points={`${handX},24 ${handX + 3},30 ${handX},36 ${handX - 3},30`} fill="#fff" opacity="0.5" />
              </g>
              <circle cx={handX} cy="102" r={gripR} fill={SKIN} stroke={dark} strokeWidth="1.5" />
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
