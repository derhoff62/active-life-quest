// GuardianAvatar — REBUILT FROM SCRATCH (Nov 22, 2026, v55).
// Derek, Nov 22 6:47 PM: "The head is floating and they don't look like
// the picture I sent." The old file had accumulated patches (a 0.72-scaled
// face group, a separate head circle, a moved neck rect) and the head was
// detached from the body. This rebuild draws ONE connected figure in ONE
// coordinate space, no scale transforms on the face or hair, in the style
// of Derek's five reference sheets:
//   1. 12 flat characters (main style lead): full-body, clean flat colours,
//      one shade strip, simple faces, distinct outfits at a glance.
//   2. 9 cartoon characters: richer shading, stronger poses.
//   3. Large set + red dragon: outfit/weapon variety.
//   4. Cartoon set + blue dragon: fierce cartoon bosses.
//   5. Orcs/wolves/griffin/horse + flat weapons: creatures and gear.
// The figure: head ~1/7 of total height, neck a short wide skin shape
// that OVERLAPS both chin and shoulders (chin sits ON the neck, neck sits
// ON the shoulders — no gap, no floating, no dark band between head and
// body). Face: small dark dot eyes, strong brows, firm straight mouth,
// NO nose, NO ears, NO white sclera, NO blush, NO smile (Derek: things
// don't have to look friendly). No external images, no AI images.
// GLOW (Derek, Nov 22 6:49 PM: "Make sure there's still glowing effects
// when there needs to be"): glow is CONTEXTUAL, never a permanent aura
// ring around the figure. Kept: chest gem pulse (.guardian-gem), the
// Spellweaver star's glow, the Ranger arrow's glowing tip, the shield
// gem's soft glow, the sword pommel gem, Legendary/Mythical gear shine
// (Armor), boss/companion map glows (JourneyMap). NOT kept: any permanent
// halo/aura around the guardian — that was part of the old shape look.
// BACKGROUNDS (Derek, Nov 22 6:49 PM: "Can the background look really
// cool then?"): each class gets a detailed flat scene — castle training
// ground, deep forest, starry night — detailed behind the figure, lower
// contrast than the figure, nothing crossing the face. The Spellweaver
// sky is steel blue (#35567e), NOT navy, and the hat is a LIGHT fill, so
// the navy-on-navy camouflage that hid the hat in v53 cannot happen.
// DETAILS (Derek, Nov 22 6:50 PM: "Add a bunch of details"): belt buckle
// and studs, straps, gem studs, pauldron rivets, chest-plate emblem,
// boot straps, cape clasp, quiver strap, robe folds and hem, hat band,
// sword fuller + wrapped grip + pommel gem, bow string + fletching,
// staff carved rings + wrapped grip, hair strand lines, braid segments,
// curl bumps, bun wrap, ponytail gem tie. Clean lines only — nothing
// that turns to muddle at 56px.
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

// Star polygon centred at (cx, cy), outer radius r, inner r * 0.42.
function starPoints(cx: number, cy: number, r = 13): string {
  const inner = r * 0.42;
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const aOuter = (-90 + i * 72) * (Math.PI / 180);
    const aInner = (-54 + i * 72) * (Math.PI / 180);
    pts.push(`${Math.round((cx + r * Math.cos(aOuter)) * 10) / 10},${Math.round((cy + r * Math.sin(aOuter)) * 10) / 10}`);
    pts.push(`${Math.round((cx + inner * Math.cos(aInner)) * 10) / 10},${Math.round((cy + inner * Math.sin(aInner)) * 10) / 10}`);
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
const HAIR_C = '#5b3a1e';
const HAIR_L = '#8a6238';

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
  const light = shade(main, 100);
  const dark = shade(main, -45);
  // Head outline: a warm TAN (darkened skin), NOT dark navy. PIL on the
  // v55 render proved the old dark-navy chin arc + the mouth line + the
  // circle's side strokes merged at preview size into one dark band
  // across the lower face (dark pixels x88.5-111.2 at y37-38). A tan
  // outline reads as shading, never as a band, and the mouth stays a
  // separate thin line.
  const headStroke = shade(SKIN, -55);
  const gem = GEM_MAP[g.gem] ?? GEM_MAP.Sapphire;
  const px = SIZES[size];
  const showWings = level >= 8;
  const showCrown = level >= 10 && g.classId === 'Guardian';
  const name = guardian ? `${g.name} the ${g.classId}` : 'Your guardian';
  const caption = label ?? `${name} · Level ${level}`;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (n: string) => `${n}-${uid}`;
  const scene: GuardianScene = background ?? CLASS_SCENE[g.classId] ?? 'guardian';
  const isFemale = g.look === 'Female';
  const hair = hairForLook(g.look, g.hair);
  const hasBeard = !isFemale && HAIR_WITH_BEARD.includes(hair);
  const bw = buildWidth(g.build);
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

  // --- Geometry, ONE coordinate space, viewBox 0 0 200 200 ---
  // Head: centre (100,30), r13, y17-43. Figure y0-190, so the head is
  // 26 of ~186, about 1/7. Neck: x93-107 (F) / x91-109 (M), y38-58,
  // skin, NO stroke: it overlaps the chin (y43) by 5 and the torso top
  // (y54) by 4, so head, neck, and shoulders are one connected column.
  const neckX = isFemale ? 93 : 91;
  const neckW = isFemale ? 14 : 18;
  // Hands: image-left hand holds the sword (figure's right), image-right
  // hand holds the shield / bow / staff (figure's left).
  const handLx = isFemale ? 81 : 76;
  const handRx = isFemale ? 119 : 124;
  const handR = isFemale ? 5 : 5.5;
  const torsoD = isFemale
    ? `M100 54 L${f(100 + 13 * bw)} 58 L${f(100 + 15 * bw)} 92 L${f(100 + 10 * bw)} 118 L${f(100 - 10 * bw)} 118 L${f(100 - 15 * bw)} 92 L${f(100 - 13 * bw)} 58 Z`
    : `M100 54 L${f(100 + 21 * bw)} 58 L${f(100 + 23 * bw)} 94 L${f(100 + 17 * bw)} 118 L${f(100 - 17 * bw)} 118 L${f(100 - 23 * bw)} 94 L${f(100 - 21 * bw)} 58 Z`;
  const beltW = (isFemale ? 26 : 34) * bw;
  const pauldronRx = (isFemale ? 11 : 13) * bw;
  const pauldronDx = isFemale ? 14 : 21;

  // --- Hair, flat with strand lines, in the SAME coordinates as the head.
  // Head: centre (100,30), r13, top y17, sides x87/113, chin y43.
  // Every style sits ON the head; locks end at the shoulders (y62), never
  // covering the face or the pauldrons. Hair colour is warm brown for
  // every style; the silhouette is what tells them apart.
  const hairCap = (
    <g>
      {/* Cap top at y16, ABOVE the head circle's top (y17), and wider
          than the circle (x86/114 vs x87/113), so it covers the circle's
          top arc — the old cap left the dark arc peeking above the hair
          like a headband. */}
      <path d="M86 40 Q84 18 100 16 Q116 18 114 40 Q110 27 100 27 Q90 27 86 40 Z" fill={HAIR_C} />
      <path d="M100 19 Q94 20 90 26 M100 19 Q106 20 110 26" fill="none" stroke={HAIR_L} strokeWidth="2.5" opacity="0.9" strokeLinecap="round" />
    </g>
  );
  const longLocks = (wide: boolean) => (
    <g fill={HAIR_C}>
      {/* Locks 8 units wide, a solid mass framing the face — the old
          6-unit locks read as thin ribbons. */}
      <path d={wide ? 'M86 36 Q81 50 82 62 Q85 66 89 60 Q88 48 89 38 Z' : 'M85 36 Q81 50 82 62 Q85 66 89 60 Q88 48 89 38 Z'} />
      <path d={wide ? 'M114 36 Q119 50 118 62 Q115 66 111 60 Q112 48 111 38 Z' : 'M115 36 Q119 50 118 62 Q115 66 111 60 Q112 48 111 38 Z'} />
      <path d="M86 46 Q85 54 86 60 M114 46 Q115 54 114 60" fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
    </g>
  );
  const shortLocks = (
    <g fill={HAIR_C}>
      <path d="M86 38 Q84 50 86 58 Q89 60 91 54 Q90 46 90 38 Z" />
      <path d="M114 38 Q116 50 114 58 Q111 60 109 54 Q110 46 110 38 Z" />
    </g>
  );
  const hairArt = isFemale ? (
    <g>
      {hairCap}
      {hair === 'Long' && longLocks(false)}
      {hair === 'Ponytail' && (
        <g>
          <path d="M112 34 Q122 52 119 82 Q114 86 111 78 Q113 56 110 40 Z" fill={HAIR_C} />
          <path d="M115 52 Q118 64 116 76" fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
          <circle cx="114" cy="50" r="4.5" fill={gem} stroke="#fff" strokeWidth="1" />
          <path d="M86 38 Q84 50 86 60 Q89 62 91 56 Q90 46 90 38 Z" fill={HAIR_C} />
        </g>
      )}
      {hair === 'Bun' && (
        <g>
          <circle cx="100" cy="11" r="8.5" fill={HAIR_C} />
          <path d="M93 8 Q100 5 107 8" fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.8" strokeLinecap="round" />
          <path d="M92 13 Q100 10 108 13" fill="none" stroke={HAIR_L} strokeWidth="1.8" opacity="0.6" strokeLinecap="round" />
          {shortLocks}
        </g>
      )}
      {hair === 'Curly' && (
        <g fill={HAIR_C}>
          <circle cx="87" cy="27" r="6" />
          <circle cx="94" cy="20" r="6.5" />
          <circle cx="106" cy="20" r="6.5" />
          <circle cx="113" cy="27" r="6" />
          <circle cx="83" cy="37" r="5.5" />
          <circle cx="117" cy="37" r="5.5" />
          <circle cx="84" cy="52" r="5" />
          <circle cx="116" cy="52" r="5" />
          <path d="M90 24 Q95 21 100 24 M104 24 Q109 21 113 24" fill="none" stroke={HAIR_L} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}
      {hair === 'Braided' && (
        <g fill={HAIR_C}>
          <path d="M86 38 Q84 50 86 58 Q89 60 91 54 Q90 46 90 38 Z" />
          <circle cx="115" cy="48" r="5.5" />
          <circle cx="112" cy="58" r="5.5" />
          <circle cx="115" cy="68" r="5.5" />
          <circle cx="112" cy="76" r="5" />
          <circle cx="115" cy="46" r="3" fill={gem} stroke="#fff" strokeWidth="1" />
          <circle cx="112" cy="80" r="3" fill={gem} stroke="#fff" strokeWidth="1" />
        </g>
      )}
      {hair === 'ShortBob' && (
        <g fill={HAIR_C}>
          <path d="M84 38 Q81 50 85 54 Q89 56 91 51 Q89 44 90 38 Z" />
          <path d="M116 38 Q119 50 115 54 Q111 56 109 51 Q111 44 110 38 Z" />
          <path d="M87 46 Q89 52 91 50 M113 46 Q111 52 109 50" fill="none" stroke={HAIR_L} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}
      {hair === 'Topknot' && (
        <g fill={HAIR_C}>
          <circle cx="100" cy="10" r="8.5" />
          <path d="M94 7 Q100 4 106 7" fill="none" stroke={HAIR_L} strokeWidth="2" strokeLinecap="round" />
          <path d="M93 15 Q100 12 107 15" fill="none" stroke={gem} strokeWidth="3" strokeLinecap="round" />
          {shortLocks}
        </g>
      )}
    </g>
  ) : hair === 'Bald' ? (
    <g>
      <ellipse cx="97" cy="24" rx="6" ry="2" fill="#fff" opacity="0.25" />
    </g>
  ) : (
    <g>
      {hair === 'Buzz' ? (
        <path d="M88 37 Q88 18 100 16 Q112 18 112 37 Q107 29 100 29 Q93 29 88 37 Z" fill={HAIR_C} />
      ) : (
        <g>
          <path d="M87 39 Q87 18 100 16 Q113 18 113 39 Q108 28 100 28 Q92 28 87 39 Z" fill={HAIR_C} />
          <path d="M90 27 Q95 24 100 24 Q105 24 110 27" fill="none" stroke={HAIR_L} strokeWidth="2.5" opacity="0.8" strokeLinecap="round" />
          <path d="M85 38 L86 46 L88 46 L88 38 Z" fill={HAIR_C} />
          <path d="M115 38 L114 46 L112 46 L112 38 Z" fill={HAIR_C} />
        </g>
      )}
      {hair === 'Curly' && (
        <g fill={HAIR_C}>
          <circle cx="88" cy="27" r="5" />
          <circle cx="95" cy="21" r="5.5" />
          <circle cx="105" cy="21" r="5.5" />
          <circle cx="112" cy="27" r="5" />
          <circle cx="84" cy="36" r="4.5" />
          <circle cx="116" cy="36" r="4.5" />
        </g>
      )}
      {hair === 'Long' && longLocks(true)}
      {hair === 'ManBun' && (
        <g fill={HAIR_C}>
          <circle cx="100" cy="11" r="7.5" />
          <path d="M95 8 Q100 5 105 8" fill="none" stroke={HAIR_L} strokeWidth="2" strokeLinecap="round" />
          <path d="M94 15 Q100 12 106 15" fill="none" stroke={gem} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M85 40 Q83 50 85 56 Q89 60 91 54 Q90 46 90 40 Z" />
          <path d="M115 40 Q117 50 115 56 Q111 60 109 54 Q110 46 110 40 Z" />
        </g>
      )}
    </g>
  );

  // Ranger hood: the hood frames the face, so only the bits that peek out
  // are drawn — side locks, a braid, a bob, curls, or a knot poking above
  // the hood. Buzz / Short / Bald show nothing extra.
  const hoodHair = (
    <g>
      <path d="M83 48 Q78 16 100 16 Q122 16 117 48 L111 38 Q109 22 100 22 Q91 22 89 38 Z" fill={capeMain} stroke={dark} strokeWidth="2.5" />
      <path d="M90 24 Q95 20 100 20" fill="none" stroke={light} strokeWidth="2" opacity="0.6" strokeLinecap="round" />
      {isFemale && hair === 'Long' && longLocks(false)}
      {isFemale && hair === 'Ponytail' && (
        <g>
          <path d="M112 34 Q122 52 119 82 Q114 86 111 78 Q113 56 110 40 Z" fill={HAIR_C} />
          <circle cx="114" cy="50" r="4" fill={gem} stroke="#fff" strokeWidth="1" />
        </g>
      )}
      {isFemale && hair === 'Bun' && (
        <g fill={HAIR_C}>
          <circle cx="100" cy="11" r="8" />
          {shortLocks}
        </g>
      )}
      {isFemale && hair === 'Curly' && (
        <g fill={HAIR_C}>
          <circle cx="83" cy="50" r="5" />
          <circle cx="117" cy="50" r="5" />
          <circle cx="85" cy="60" r="4.5" />
          <circle cx="115" cy="60" r="4.5" />
        </g>
      )}
      {isFemale && hair === 'Braided' && (
        <g fill={HAIR_C}>
          <circle cx="115" cy="48" r="5.5" />
          <circle cx="112" cy="58" r="5.5" />
          <circle cx="115" cy="68" r="5" />
          <circle cx="112" cy="76" r="3" fill={gem} stroke="#fff" strokeWidth="1" />
        </g>
      )}
      {isFemale && hair === 'ShortBob' && (
        <g fill={HAIR_C}>
          <path d="M84 40 Q81 50 85 54 Q89 56 91 51 Q89 44 90 40 Z" />
          <path d="M116 40 Q119 50 115 54 Q111 56 109 51 Q111 44 110 40 Z" />
        </g>
      )}
      {isFemale && hair === 'Topknot' && (
        <g fill={HAIR_C}>
          <circle cx="100" cy="10" r="8" />
          <path d="M93 14 Q100 11 107 14" fill="none" stroke={gem} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
      {!isFemale && hair === 'Curly' && (
        <g fill={HAIR_C}>
          <circle cx="84" cy="48" r="4" />
          <circle cx="116" cy="48" r="4" />
        </g>
      )}
      {!isFemale && hair === 'Long' && longLocks(true)}
      {!isFemale && hair === 'ManBun' && (
        <g fill={HAIR_C}>
          <circle cx="100" cy="11" r="7.5" />
          <path d="M94 15 Q100 12 106 15" fill="none" stroke={gem} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
    </g>
  );

  // --- Scene backgrounds: detailed flat cartoon scenes, one per class.
  // Detail stays BEHIND the figure and away from the face (the figure
  // occupies x70-150, y0-190 and is drawn on top, opaque). The
  // Spellweaver sky is steel blue #35567e, NOT navy, so the figure and
  // the light hat read against it — the navy-on-navy camouflage of v53
  // cannot happen.
  const sceneArt = (
    <>
      {scene === 'guardian' && (
        <g>
          {/* Sun with rays, top left */}
          <circle cx="28" cy="26" r="11" fill="#f2d878" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const r = (a * Math.PI) / 180;
            return (
              <line key={a} x1={28 + 14 * Math.cos(r)} y1={26 + 14 * Math.sin(r)} x2={28 + 19 * Math.cos(r)} y2={26 + 19 * Math.sin(r)} stroke="#f2d878" strokeWidth="2.5" strokeLinecap="round" />
            );
          })}
          {/* Clouds */}
          <g fill="#fff" opacity="0.9">
            <ellipse cx="72" cy="18" rx="14" ry="5" />
            <ellipse cx="86" cy="22" rx="10" ry="4" />
            <ellipse cx="150" cy="14" rx="12" ry="4.5" />
            <ellipse cx="162" cy="18" rx="9" ry="3.5" />
          </g>
          {/* Castle wall with crenellations and stone courses */}
          <rect x="6" y="88" width="188" height="80" fill="#b9c2cc" />
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={6 + i * 16} y="80" width="10" height="8" fill="#b9c2cc" />
          ))}
          <path d="M6 104 L194 104 M6 124 L194 124 M6 144 L194 144" stroke="#8a9aa8" strokeWidth="1.5" opacity="0.5" />
          <path d="M30 88 L30 104 M70 104 L70 124 M110 88 L110 104 M150 124 L150 144 M50 124 L50 144 M130 104 L130 124 M170 88 L170 104" stroke="#8a9aa8" strokeWidth="1.2" opacity="0.4" />
          {/* Towers, left and right, with windows */}
          <rect x="12" y="60" width="30" height="108" fill="#9aa7b4" />
          {[12, 24, 36].map((x) => (
            <rect key={x} x={x} y="52" width="8" height="8" fill="#9aa7b4" />
          ))}
          <path d="M22 82 L30 82 L30 96 L22 96 Z" fill="#124571" />
          <path d="M22 82 Q26 76 30 82 Z" fill="#124571" />
          <rect x="158" y="60" width="30" height="108" fill="#9aa7b4" />
          {[158, 170, 182].map((x) => (
            <rect key={x} x={x} y="52" width="8" height="8" fill="#9aa7b4" />
          ))}
          <path d="M168 82 L176 82 L176 96 L168 96 Z" fill="#124571" />
          <path d="M168 82 Q172 76 176 82 Z" fill="#124571" />
          {/* Banners with gem emblems, hanging from the wall */}
          <g>
            <path d="M56 88 L72 88 L72 112 L64 118 L56 112 Z" fill={main} stroke={dark} strokeWidth="1.5" />
            <polygon points="64,94 69,99 64,104 59,99" fill={gem} stroke="#fff" strokeWidth="1" />
            <path d="M128 88 L144 88 L144 112 L136 118 L128 112 Z" fill={main} stroke={dark} strokeWidth="1.5" />
            <polygon points="136,94 141,99 136,104 131,99" fill={gem} stroke="#fff" strokeWidth="1" />
          </g>
          {/* Grass, path, tufts, stones, flowers */}
          <rect x="0" y="168" width="200" height="32" fill="#6da344" />
          <ellipse cx="100" cy="188" rx="34" ry="9" fill="#d9c08a" opacity="0.85" />
          <path d="M18 172 L22 164 L26 172 Z M44 176 L48 168 L52 176 Z M158 174 L162 166 L166 174 Z M180 178 L184 170 L188 178 Z" fill="#4a8a3f" />
          <ellipse cx="34" cy="184" rx="5" ry="3" fill="#8a9aa8" />
          <ellipse cx="164" cy="186" rx="5" ry="3" fill="#8a9aa8" />
          <circle cx="54" cy="178" r="2.5" fill="#e88a7a" />
          <circle cx="146" cy="180" r="2.5" fill="#f2d878" />
          <circle cx="96" cy="176" r="2" fill="#fff" />
        </g>
      )}
      {(scene === 'ranger' || scene === 'forest') && (
        <g>
          {/* Sun through the canopy */}
          <circle cx="168" cy="26" r="12" fill="#f2d878" />
          <path d="M168 6 L168 12 M168 40 L168 46 M148 26 L154 26 M182 26 L188 26" stroke="#f2d878" strokeWidth="2.5" strokeLinecap="round" />
          {/* Back trees, dark green */}
          <polygon points="8,168 28,66 48,168" fill="#1e7a46" />
          <polygon points="54,168 74,82 94,168" fill="#1e7a46" />
          <polygon points="140,168 160,74 180,168" fill="#1e7a46" />
          <polygon points="182,168 194,108 200,140 200,168" fill="#1e7a46" />
          {/* Mid trees, brighter green */}
          <polygon points="34,168 52,94 70,168" fill="#2a9e5f" />
          <polygon points="108,168 128,86 148,168" fill="#2a9e5f" />
          <polygon points="168,168 182,118 196,168" fill="#2a9e5f" />
          {/* Falling leaves */}
          <polygon points="60,58 64,62 60,66 56,62" fill="#2a9e5f" opacity="0.75" />
          <polygon points="92,38 96,42 92,46 88,42" fill="#1e7a46" opacity="0.75" />
          <polygon points="122,66 126,70 122,74 118,70" fill="#2a9e5f" opacity="0.75" />
          <polygon points="150,48 154,52 150,56 146,52" fill="#1e7a46" opacity="0.75" />
          <polygon points="40,92 44,96 40,100 36,96" fill="#2a9e5f" opacity="0.75" />
          {/* Front bushes */}
          <circle cx="18" cy="160" r="14" fill="#3a8a4f" />
          <circle cx="182" cy="162" r="12" fill="#3a8a4f" />
          <circle cx="30" cy="166" r="9" fill="#2a9e5f" />
          <circle cx="172" cy="168" r="8" fill="#2a9e5f" />
          {/* Grass, winding path, flowers */}
          <rect x="0" y="168" width="200" height="32" fill="#4a8a3f" />
          <path d="M92 200 Q96 184 104 168 L118 168 Q110 184 114 200 Z" fill="#d9c08a" opacity="0.85" />
          <path d="M14 174 L18 166 L22 174 Z M52 178 L56 170 L60 178 Z M150 176 L154 168 L158 176 Z M186 180 L190 172 L194 180 Z" fill="#2f6f2f" />
          <circle cx="38" cy="180" r="2.5" fill="#e88a7a" />
          <circle cx="70" cy="184" r="2" fill="#f2d878" />
          <circle cx="140" cy="182" r="2.5" fill="#fff" />
          <circle cx="166" cy="178" r="2" fill="#e88a7a" />
        </g>
      )}
      {scene === 'spellweaver' && (
        <g>
          {/* Moon with glow and craters, top right */}
          <circle cx="164" cy="30" r="20" fill="#f2e6b8" opacity="0.25" />
          <circle cx="164" cy="30" r="13" fill="#f2e6b8" />
          <circle cx="159" cy="26" r="2.5" fill="#d9c08a" />
          <circle cx="168" cy="34" r="2" fill="#d9c08a" />
          <circle cx="166" cy="24" r="1.5" fill="#d9c08a" />
          {/* Stars — kept out of the x85-125 / y15-45 box behind the face */}
          {[
            [24, 28], [52, 16], [76, 26], [140, 16], [186, 52],
            [34, 62], [64, 44], [148, 42], [180, 78], [20, 100],
            [150, 66], [60, 84], [186, 110], [14, 130], [130, 90],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.6 : 1.8} fill="#fff" opacity="0.9" />
          ))}
          <path d="M44 52 L44 60 M40 56 L48 56" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M178 90 L178 97 M174 93 L181 93" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          {/* Mist bands */}
          <rect x="0" y="138" width="200" height="10" rx="5" fill="#fff" opacity="0.1" />
          <rect x="0" y="158" width="200" height="10" rx="5" fill="#fff" opacity="0.1" />
          {/* Pine silhouettes */}
          <polygon points="18,168 30,118 42,168" fill="#24455f" />
          <polygon points="158,168 170,126 182,168" fill="#24455f" />
          {/* Glowing runes on the ground */}
          <circle cx="28" cy="178" r="7" fill={GOLD} opacity="0.25" />
          <circle cx="28" cy="178" r="3" fill={GOLD} />
          <circle cx="28" cy="178" r="1" fill="#fff" />
          <circle cx="172" cy="180" r="7" fill={GOLD} opacity="0.25" />
          <circle cx="172" cy="180" r="3" fill={GOLD} />
          <circle cx="172" cy="180" r="1" fill="#fff" />
          <circle cx="58" cy="186" r="6" fill={GOLD} opacity="0.25" />
          <circle cx="58" cy="186" r="2.5" fill={GOLD} />
          {/* Ground */}
          <rect x="0" y="168" width="200" height="32" fill="#1e3a52" />
          <path d="M10 174 L14 166 L18 174 Z M44 178 L48 170 L52 178 Z M146 176 L150 168 L154 176 Z M186 178 L190 170 L194 178 Z" fill="#142c40" />
        </g>
      )}
      {scene === 'shores' && (
        <g>
          <circle cx="36" cy="28" r="13" fill="#f2d878" />
          <path d="M80 30 Q84 26 88 30 M96 22 Q100 18 104 22" fill="none" stroke="#5b6b7a" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="0" y="118" width="200" height="50" fill="#2f6fd0" opacity="0.55" />
          <path d="M0 128 Q25 122 50 128 T100 128 T150 128 T200 128" fill="none" stroke="#fff" strokeWidth="2" opacity="0.6" />
          <path d="M0 144 Q25 138 50 144 T100 144 T150 144 T200 144" fill="none" stroke="#fff" strokeWidth="2" opacity="0.4" />
          <rect x="0" y="168" width="200" height="32" fill="#e8d9a8" />
          <path d="M28 182 Q32 176 36 182" fill="none" stroke="#c9a227" strokeWidth="2" strokeLinecap="round" />
          <path d="M168 184 Q172 178 176 184" fill="none" stroke="#c9a227" strokeWidth="2" strokeLinecap="round" />
          <polygon points="60,182 62,187 67,187 63,190 65,195 60,192 55,195 57,190 53,187 58,187" fill="#e88a7a" />
          <circle cx="140" cy="180" r="2.5" fill="#c9a227" />
        </g>
      )}
      {scene === 'peaks' && (
        <g>
          <circle cx="166" cy="28" r="13" fill="#f2d878" />
          <ellipse cx="46" cy="38" rx="22" ry="8" fill="#fff" opacity="0.85" />
          <ellipse cx="70" cy="46" rx="18" ry="7" fill="#fff" opacity="0.7" />
          <polygon points="10,168 58,84 106,168" fill="#5b6b7a" />
          <polygon points="46,108 58,84 70,108 64,102 58,110 52,102" fill="#fff" />
          <polygon points="96,168 148,72 200,168" fill="#3a4a5a" />
          <polygon points="134,98 148,72 162,98 156,92 148,100 140,92" fill="#fff" />
          <polygon points="20,168 28,138 36,168" fill="#1e7a46" />
          <polygon points="164,168 172,140 180,168" fill="#1e7a46" />
          <rect x="0" y="168" width="200" height="32" fill="#dbe9f5" />
          <path d="M40 178 L44 172 L48 178 Z M150 180 L154 174 L158 180 Z" fill="#fff" />
        </g>
      )}
    </>
  );

  // Flat scene background colour (no gradient wash, like the reference sheets).
  // Spellweaver sky is STEEL BLUE, not navy — the navy robe and the light
  // hat must both read against it.
  const sceneBg =
    scene === 'spellweaver' ? '#35567e'
    : scene === 'peaks' ? '#eef5fb'
    : scene === 'shores' ? '#eef5fb'
    : scene === 'ranger' || scene === 'forest' ? '#dcefe0'
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
        <ellipse className="guardian-shadow" cx="100" cy="190" rx="44" ry="6" fill="#124571" opacity="0.18" />

        <g className="guardian-bob">
          {/* Cape with folds, flat, behind the body. Outlined in the
              darker cape colour, so it reads against the tunic instead
              of vanishing into it (same colour, no edge). */}
          {g.cape && (
            <g>
              <path d="M100 56 L128 66 L124 142 Q100 150 76 142 L72 66 Z" fill={capeMain} stroke={capeDark} strokeWidth="2" opacity="0.96" />
              <path d="M86 72 Q84 106 86 136" fill="none" stroke={capeDark} strokeWidth="2" opacity="0.6" />
              <path d="M114 72 Q116 106 114 136" fill="none" stroke={capeDark} strokeWidth="2" opacity="0.6" />
              <path d="M100 66 Q100 106 100 142" fill="none" stroke={capeDark} strokeWidth="1.5" opacity="0.4" />
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
          {/* Ranger quiver, worn on the back: peeks over the left shoulder
              with arrows sticking up, strap diagonal across the chest. */}
          {g.classId === 'Ranger' && (
            <g>
              <g transform="rotate(-18 76 72)">
                <rect x="69" y="58" width="14" height="32" rx="7" fill={WOOD} stroke={WOOD_DARK} strokeWidth="1.5" />
                <path d="M72 62 L72 86 M79 62 L79 86" stroke={WOOD_DARK} strokeWidth="1.5" opacity="0.6" />
              </g>
              <line x1="72" y1="60" x2="68" y2="48" stroke="#e8e2d4" strokeWidth="2" strokeLinecap="round" />
              <line x1="77" y1="58" x2="76" y2="46" stroke="#e8e2d4" strokeWidth="2" strokeLinecap="round" />
              <line x1="82" y1="60" x2="84" y2="48" stroke="#e8e2d4" strokeWidth="2" strokeLinecap="round" />
              <polygon points="68,48 64,52 70,53" fill={STEEL_DARK} />
              <polygon points="76,46 72,50 78,51" fill={STEEL_DARK} />
              <polygon points="84,48 80,52 86,53" fill={STEEL_DARK} />
            </g>
          )}
          {/* Arms: drawn before the torso, so the torso overlaps the tops.
              Male arms are thicker; female arms slimmer. */}
          {isFemale ? (
            <>
              <path d="M86 64 Q78 82 80 100 L86 99 Q85 82 90 68 Z" fill={armMain} stroke={armDark} strokeWidth="2" />
              <path d="M114 64 Q122 82 120 100 L114 99 Q115 82 110 68 Z" fill={armMain} stroke={armDark} strokeWidth="2" />
            </>
          ) : (
            <>
              <path d="M82 62 Q72 82 75 102 L84 101 Q83 82 90 67 Z" fill={armMain} stroke={armDark} strokeWidth="2" />
              <path d="M118 62 Q128 82 125 102 L116 101 Q117 82 110 67 Z" fill={armMain} stroke={armDark} strokeWidth="2" />
              <path d="M76 82 Q74 92 76 100" fill="none" stroke={dark} strokeWidth="3" opacity="0.35" strokeLinecap="round" />
              <path d="M124 82 Q126 92 124 100" fill="none" stroke={dark} strokeWidth="3" opacity="0.35" strokeLinecap="round" />
            </>
          )}
          {/* Body: flat tunic in the main colour, one light strip on the
              left, one dark strip on the right (reference image 2 shading).
              Top edge (y54) overlaps the bottom of the neck (y58). */}
          <path d={torsoD} fill={main} stroke={dark} strokeWidth="2.5" />
          <path d="M88 66 Q86 90 88 112 Q93 114 95 112 Q91 90 93 68 Z" fill="#fff" opacity="0.22" />
          <path d="M112 66 Q114 90 112 112 Q107 114 105 112 Q109 90 107 68 Z" fill="#000" opacity="0.14" />
          {/* Belt with buckle and studs */}
          <rect x={100 - beltW / 2} y="108" width={beltW} height="9" rx="4.5" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.5" />
          <rect x="94" y="109" width="12" height="7" rx="2" fill="#fffdf4" stroke={GOLD_DARK} strokeWidth="1.5" />
          <circle cx={100 - beltW / 2 + 5} cy="112.5" r="1.5" fill={GOLD_DARK} />
          <circle cx={100 + beltW / 2 - 5} cy="112.5" r="1.5" fill={GOLD_DARK} />
          {/* Glowing gem on chest: flat diamond with a white facet.
              The gem PULSES (.guardian-gem) — a subtle contextual glow,
              not a halo around the figure. */}
          <g className="guardian-gem">
            <polygon points="100,76 109,85 100,96 91,85" fill={gem} stroke="#fff" strokeWidth="2" />
            <polygon points="100,81 104,85 100,90 96,85" fill="#fff" opacity="0.55" />
          </g>
          {/* Legs, then boots with straps */}
          <path d={isFemale ? 'M89 118 L88 174 L95 174 L95 118 Z' : 'M87 118 L86 174 L97 174 L97 118 Z'} fill={legMain} stroke={legDark} strokeWidth="1.5" />
          <path d={isFemale ? 'M105 118 L105 174 L112 174 L111 118 Z' : 'M103 118 L103 174 L114 174 L113 118 Z'} fill={legMain} stroke={legDark} strokeWidth="1.5" />
          <ellipse cx="91" cy="180" rx="9" ry="4.5" fill={BOOT} />
          <ellipse cx="109" cy="180" rx="9" ry="4.5" fill={BOOT} />
          <path d="M84 178 L98 178 M102 178 L116 178" stroke="#a8763e" strokeWidth="1.5" opacity="0.7" />
          <path d="M84 182 L98 182 M102 182 L116 182" stroke="#a8763e" strokeWidth="1.2" opacity="0.5" />
          {/* Spellweaver wizard robe: flows from the waist to the ankles
              over the legs, boots peeking out below. Flat, with fold
              lines, a hem trim, and a gem. */}
          {g.classId === 'Spellweaver' && (
            <g>
              <path d="M84 114 L116 114 L128 164 Q100 172 72 164 Z" fill={main} stroke={dark} strokeWidth="2.5" />
              <path d="M92 120 Q90 142 92 160 M100 122 Q100 142 100 164 M108 120 Q110 142 108 160" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.4" />
              <path d="M88 126 Q86 144 88 158" fill="#fff" opacity="0.18" />
              <path d="M76 160 Q100 168 124 160" fill="none" stroke={GOLD} strokeWidth="2" opacity="0.7" />
              <circle cx="100" cy="136" r="4" fill={gem} stroke="#fff" strokeWidth="1.5" />
            </g>
          )}
          {/* Neck: a short WIDE skin shape, NO stroke, drawn AFTER the
              torso and BEFORE the head. Top (y38) overlaps the chin
              (y43) by 5; bottom (y58) overlaps the torso top (y54) by 4.
              The chin sits ON the neck, the neck sits ON the shoulders —
              one connected column, no gap, no floating, no dark band. */}
          <rect x={neckX} y="38" width={neckW} height="20" rx="3" fill={SKIN} />
          {/* Cape clasp at the neck base, joining neck to shoulders */}
          <circle cx="100" cy="58" r="5" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.5" />
          <circle cx="100" cy="58" r="2.5" fill={gem} stroke="#fff" strokeWidth="1" />
          {/* Head: one flat skin circle, r13 at (100,30), 26 units tall
              in a ~186-unit figure, about 1/7. Drawn AFTER the neck, so
              it overlaps the neck top. Same coordinates as the face and
              hair — no scale transform anywhere, so nothing can drift. */}
          <circle cx="100" cy="30" r="13" fill={SKIN} stroke={headStroke} strokeWidth="1.2" />
          {!isFemale && (
            <g stroke={dark} strokeWidth="1.5" opacity="0.35" fill="none" strokeLinecap="round">
              <path d="M89 35 L92 40" />
              <path d="M111 35 L108 40" />
            </g>
          )}
          {/* Hair, hood, or wizard hat — all in the same coordinates as
              the head, sitting ON it. */}
          {g.classId === 'Ranger' ? hoodHair : g.classId === 'Spellweaver' ? null : hairArt}
          {/* Spellweaver hat: a tall pointed wizard hat in a LIGHT fill
              (shade +100), so it reads against the steel-blue night sky.
              Brim at y20, cone rising to a bent tip at y0, gem band. */}
          {g.classId === 'Spellweaver' && (
            <g>
              <path d="M81 20 L99 1 Q107 -2 109 5 Q110 10 105 12 Q101 14 103 20 L119 20 Z" fill={light} stroke={dark} strokeWidth="2" strokeLinejoin="round" />
              <path d="M87 16 L96 6" fill="none" stroke="#fff" strokeWidth="2" opacity="0.55" strokeLinecap="round" />
              <ellipse cx="100" cy="20" rx="20" ry="4.5" fill={light} stroke={dark} strokeWidth="2" />
              <path d="M82 19 Q100 16 118 19" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.5" />
              <circle cx="100" cy="18" r="3.5" fill={gem} stroke="#fff" strokeWidth="1" />
            </g>
          )}
          {/* Beard: only when the picked hair style has one (Male Short +
              beard, Bald, or Long). CHIN-ONLY, starting below the mouth
              (y40), mustache two corner tufts with the centre clear, so
              the mouth sits on clear skin. Beard texture: short vertical
              lines. Female never has a beard. */}
          {hasBeard && (
            <g fill={HAIR_C}>
              {/* Smaller corner tufts — the old wide tufts flanked the
                  mouth and added to the dark-band read. */}
              <path d="M89 38 Q92 36.5 95 38.5 Q92 40.5 89 40 Z" />
              <path d="M111 38 Q108 36.5 105 38.5 Q108 40.5 111 40 Z" />
              <path d="M88 40 Q87 52 100 53 Q113 52 112 40 L108 43 Q106 49 100 49 Q94 49 92 43 Z" />
              <path d="M94 46 L94 50 M100 47 L100 51 M106 46 L106 50" stroke={HAIR_L} strokeWidth="1.2" opacity="0.7" strokeLinecap="round" />
            </g>
          )}
          {/* Crown, Level 10+, Guardian only (the hat is the Spellweaver's
              crown, the hood is the Ranger's). */}
          {showCrown && (
            <g>
              <polygon points="86,20 90,8 95,16 100,6 105,16 110,8 114,20 114,25 86,25" fill={GOLD} stroke={GOLD_DARK} strokeWidth="2" />
              <circle cx="100" cy="20" r="2.6" fill={gem} stroke="#fff" strokeWidth="1.5" />
              <circle cx="91" cy="20" r="2" fill={gem} stroke="#fff" strokeWidth="1" />
              <circle cx="109" cy="20" r="2" fill={gem} stroke="#fff" strokeWidth="1" />
            </g>
          )}
          {/* Face: determined warrior, like the reference sheets. Small
              dark dot eyes (NO white sclera, NO iris ring, NO highlight).
              Strong brows angled down toward the centre. A firm straight
              mouth, not a smile. NO nose, NO ears, NO blush. Female is
              serious too, with slimmer brows and small lashes; male brows
              are thick, with jaw lines. */}
          <g>
            {isFemale ? (
              <>
                <path d="M88 25 L95 27.5 M105 27.5 L112 25" fill="none" stroke={HAIR_C} strokeWidth="1.8" strokeLinecap="round" />
                <path d="M90 27 L88 25 M110 27 L112 25" fill="none" stroke="#1c2b3a" strokeWidth="1.2" strokeLinecap="round" />
              </>
            ) : (
              <path d="M87 24 L95 27.5 M105 27.5 L113 24" fill="none" stroke={HAIR_C} strokeWidth="2.5" strokeLinecap="round" />
            )}
            <circle cx="93" cy="30" r="2.4" fill="#1c2b3a" />
            <circle cx="107" cy="30" r="2.4" fill="#1c2b3a" />
            {/* Mouth: thin (1.8/2.2), short (x96-104), at y37 — 6 units
                above the chin, clear of the chin arc, so it can never
                read as a band across the face. */}
            <path d="M96 37 L104 37" fill="none" stroke="#1c2b3a" strokeWidth={isFemale ? 1.8 : 2.2} strokeLinecap="round" />
          </g>
          {/* Guardian pauldrons, drawn AFTER hair so long hair can never
              hide them. Big steel, both looks, all hairstyles, with
              rivets and a gem stud each. */}
          {g.classId === 'Guardian' && (
            <g>
              <ellipse cx={100 - pauldronDx} cy="65" rx={pauldronRx} ry={isFemale ? 7.5 : 8} fill={STEEL} stroke={dark} strokeWidth="2" />
              <ellipse cx={100 + pauldronDx} cy="65" rx={pauldronRx} ry={isFemale ? 7.5 : 8} fill={STEEL} stroke={dark} strokeWidth="2" />
              <circle cx={100 - pauldronDx} cy="65" r="2.5" fill={gem} />
              <circle cx={100 + pauldronDx} cy="65" r="2.5" fill={gem} />
              <circle cx={100 - pauldronDx - 5} cy="62" r="1.2" fill={STEEL_DARK} />
              <circle cx={100 - pauldronDx + 5} cy="62" r="1.2" fill={STEEL_DARK} />
              <circle cx={100 + pauldronDx - 5} cy="62" r="1.2" fill={STEEL_DARK} />
              <circle cx={100 + pauldronDx + 5} cy="62" r="1.2" fill={STEEL_DARK} />
            </g>
          )}
          {/* Guardian chest plate over the tunic, with emblem, etched
              lines, and a glowing gem. */}
          {g.classId === 'Guardian' && (
            <g>
              {/* Tapered at the top, so it reads as armour, not a bib. */}
              <path d="M88 62 L112 62 L116 86 L100 96 L84 86 Z" fill={STEEL} stroke={STEEL_DARK} strokeWidth="2" opacity="0.95" />
              <path d="M88 62 L112 62 L114 74 L86 74 Z" fill={main} opacity="0.85" />
              <path d="M93 66 L91 84 M107 66 L109 84" stroke={STEEL_DARK} strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
              <g className="guardian-gem">
                <circle cx="100" cy="84" r="4" fill={gem} stroke="#fff" strokeWidth="1.5" />
              </g>
            </g>
          )}
          {/* Ranger quiver strap, diagonal across the chest */}
          {g.classId === 'Ranger' && (
            <path d="M84 62 L116 108" fill="none" stroke={WOOD_DARK} strokeWidth="4" opacity="0.7" strokeLinecap="round" />
          )}
          {/* Weapons, flat like reference image 5: a distinct item at a
              glance, HELD in the hand — the hand circle is drawn over the
              grip, so the grip reads. Shield in the figure's LEFT hand
              (image-right), sword in the figure's RIGHT hand (image-left). */}
          {g.classId === 'Guardian' && (
            <g>
              {/* Shield, image-right */}
              <path d={`M${handRx - 2} 78 L${handRx + 28} 78 L${handRx + 28} 98 Q${handRx + 13} 114 ${handRx - 2} 98 Z`} fill={STEEL} stroke={GOLD} strokeWidth="3" />
              <path d={`M${handRx + 3} 83 L${handRx + 23} 83 L${handRx + 23} 97 Q${handRx + 13} 108 ${handRx + 3} 97 Z`} fill={main} opacity="0.9" />
              <circle cx={handRx + 13} cy="93" r="9" fill={gem} opacity="0.3" />
              <circle cx={handRx + 13} cy="93" r="5.5" fill={gem} stroke="#fff" strokeWidth="1.5" />
              {/* Sword, image-left: blade with fuller line, gold
                  crossguard, wrapped grip, gem in the pommel */}
              <g transform={`rotate(-12 ${handLx} 80)`}>
                <rect x={handLx - 3} y="48" width="6" height="48" rx="3" fill={STEEL} stroke={STEEL_DARK} strokeWidth="1.5" />
                <rect x={handLx - 1} y="50" width="1.8" height="42" fill="#fff" opacity="0.7" />
                <rect x={handLx - 10} y="94" width="20" height="6" rx="3" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.5" />
                <rect x={handLx - 4} y="100" width="8" height="12" rx="3" fill={WOOD} />
                <path d={`M${handLx - 4} 103 L${handLx + 4} 105 M${handLx - 4} 107 L${handLx + 4} 109`} stroke={WOOD_DARK} strokeWidth="1.2" />
                <circle cx={handLx} cy="114" r="2.5" fill={gem} stroke="#fff" strokeWidth="1" />
              </g>
            </g>
          )}
          {g.classId === 'Ranger' && (
            <g>
              {/* Bow, image-right hand: flat brown arc, string, arrow with
                  fletching and a GLOWING tip (gem glow — a spell-like
                  effect, not a halo). */}
              <path d={`M${handRx} 66 Q${handRx + 24} 102 ${handRx} 138`} fill="none" stroke={WOOD} strokeWidth="4.5" strokeLinecap="round" />
              <path d={`M${handRx} 66 Q${handRx + 19} 102 ${handRx} 138`} fill="none" stroke="#a8763e" strokeWidth="2" strokeLinecap="round" />
              <line x1={handRx} y1="66" x2={handRx} y2="138" stroke="#e8e2d4" strokeWidth="1.5" />
              <path d={`M${handRx - 3} 98 L${handRx + 3} 98 M${handRx - 3} 106 L${handRx + 3} 106`} stroke={WOOD_DARK} strokeWidth="1.5" />
              <line x1={handRx} y1="102" x2={handRx + 24} y2="102" stroke={gem} strokeWidth="2.5" strokeLinecap="round" />
              <polygon points={`${handRx + 24},102 ${handRx + 17},99 ${handRx + 17},105`} fill={STEEL_DARK} />
              <circle cx={handRx + 24} cy="102" r="5" fill={gem} opacity="0.3" />
              <polygon points={`${handRx + 2},102 ${handRx - 4},99 ${handRx - 4},105`} fill="#fff" opacity="0.85" />
            </g>
          )}
          {g.classId === 'Spellweaver' && (
            <g>
              {/* Staff: held in the image-right hand, shaft split at the
                  grip so the hand reads as holding it. The star sits
                  ABOVE and BESIDE the head — centre (handRx+10, 18), r9 —
                  clear of the face (face right edge x113, star left edge
                  x120). The star GLOWS: a soft gem-coloured disc behind
                  it, pulsing (.guardian-gem) — the spell being cast. */}
              <g transform={`rotate(7 ${handRx} 102)`}>
                <rect x={handRx - 3} y="27" width="6" height="69" rx="3" fill={WOOD} stroke={WOOD_DARK} strokeWidth="1.5" />
                <rect x={handRx - 3} y="108" width="6" height="50" rx="3" fill={WOOD} stroke={WOOD_DARK} strokeWidth="1.5" />
                <rect x={handRx - 1} y="29" width="2" height="65" fill="#a8763e" opacity="0.7" />
                <rect x={handRx - 1} y="110" width="2" height="46" fill="#a8763e" opacity="0.7" />
                <path d={`M${handRx - 3} 58 L${handRx + 3} 58 M${handRx - 3} 130 L${handRx + 3} 130`} stroke={WOOD_DARK} strokeWidth="1.5" />
                <path d={`M${handRx - 3} 118 L${handRx + 3} 120 M${handRx - 3} 124 L${handRx + 3} 126`} stroke={WOOD_DARK} strokeWidth="1.2" />
                <g className="guardian-gem">
                  <circle cx={handRx + 10} cy="18" r="15" fill={gem} opacity="0.3" />
                  <polygon points={starPoints(handRx + 10, 18, 9)} fill={gem} stroke="#fff" strokeWidth="2" />
                </g>
                <polygon points={`${handRx + 10},13 ${handRx + 13},18 ${handRx + 10},23 ${handRx + 7},18`} fill="#fff" opacity="0.5" />
              </g>
            </g>
          )}
          {/* Hands, drawn LAST over the weapon grips, so every weapon
              reads as held. Skin circles with a dark outline. */}
          <circle cx={handLx} cy="102" r={handR} fill={SKIN} stroke={dark} strokeWidth="1.5" />
          <circle cx={handRx} cy="102" r={handR} fill={SKIN} stroke={dark} strokeWidth="1.5" />
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
