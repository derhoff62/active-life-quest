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
// The figure: COMPACT — head ~1/5 of the short figure, legs about as long as the torso, like the reference paladin. Derek, Nov 22 7:48 PM: "I think it looks weird cause the guardian is too tall" — the old figure was ~173 units tall (legs 66, torso 64) and filled the whole card, head far up, long body below. Now ~139 units (legs 48, torso 48), shifted down 17 in the frame so it sits centred with breathing room above and below.
// Neck: SHORT — the collar rises to just under the chin, only ~1.5
// units of skin show, like the reference sheets, where the chin nearly
// touches the collar. No bare neck column,
// no gap, no floating, no dark band between head and body. Face: small
// dark dot eyes, strong brows, firm straight mouth, a THIN short light
// mouth line (never a thick dark band),
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
  skinHex,
  skinToneFor,
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
  skinColor: 'Light',
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

// Flat cartoon palette: solid steel, solid gold, solid wood. Skin is
// NOT a constant any more: it comes from the guardian's picked skin
// tone (SKIN_TONES in guardianOptions), default Light (#f7d9ae, the
// tone the avatar shipped with).
const STEEL = '#b9c9d8';
const STEEL_DARK = '#7d93a8';
const GOLD = '#c9a227';
const GOLD_DARK = '#8a6d00';
const WOOD = '#7a4a21';
const WOOD_DARK = '#5b3a1e';
const BOOT = '#3a2410';
const HAIR_C = '#5b3a1e';
const HAIR_L = '#8a6238';
// Beard fill: DARKER than the hair cap (#5b3a1e) so it reads at 56px.
// Derek, Nov 22 7:58 PM: "I can't see the facial hair well" — the v64
// chin crescent was 15 wide, ~3 units thick at the centre, in the same
// medium brown as the hair, and it vanished at preview size. Still brown,
// not black, and still chin-only (see the beard block below).
const BEARD_C = '#40260f';

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
  // Skin tone (Derek, Nov 22 8:22 PM: "I need skin color customization
  // as well"): the picked tone drives the face, the neck, and the hands.
  // Old profiles have no skinColor, so skinToneFor falls back to
  // 'Light', the tone the avatar shipped with.
  const skinTone = skinToneFor(g.skinColor);
  const SKIN = skinHex(skinTone);
  // Head outline: a warm TAN (darkened skin), NOT dark navy. PIL on the
  // v55 render proved the old dark-navy chin arc + the mouth line + the
  // circle's side strokes merged at preview size into one dark band
  // across the lower face (dark pixels x88.5-111.2 at y37-38). A tan
  // outline reads as shading, never as a band, and the mouth stays a
  // separate thin line.
  const headStroke = shade(SKIN, -55);
  // Face-feature contrast: on the two darkest tones (Brown, Deep) the
  // medium-brown brows (#5b3a1e) and muted-brown mouth (#6b4a3a) would
  // vanish into the skin, so the brows go near-black and the mouth goes
  // a lighter tan that still reads as a mouth, not a smile. The dark
  // dot eyes (#1c2b3a) already read on every tone.
  const skinIsDark = skinTone === 'Brown' || skinTone === 'Deep';
  const browStroke = skinIsDark ? '#1c2b3a' : HAIR_C;
  const mouthStroke = skinIsDark ? shade(SKIN, 70) : '#6b4a3a';
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
  // Head: centre (100,29), r13, y16-42. Hair top y13.5, chin y42, so
  // head+hair is ~28 of ~173, about 1/6. The head was r11 in v56/v57
  // and read TINY live — Derek's own screenshot (Nov 22, 7:15 PM)
  // shows a tiny head on a huge black torso, a big brown beard bib,
  // floating hands, and plain red stick legs. The torso is NARROWER
  // now (male ±19 at the widest, was ±23), the pauldrons sit closer
  // in, and the arms are drawn AFTER the torso so they are VISIBLE
  // from shoulder to hand instead of hidden behind the tunic.
  // SHOULDERS RAISED (Derek, Nov 22 7:24 PM: "Why is the head still
  // really high?"): his 7:24 screenshot shows the head perched high
  // above the shoulders — chin y42, then a tall black collar dome
  // down to y58, pauldrons at cy65 (top y57), flanking the chest
  // plate, not the head. The fix moves the SHOULDERS up to the chin,
  // not the head down: torso top y54->46, collar a shallow cap
  // (y41.5-50, was y41.5-58), pauldrons cy65->52 (tops y44, only 2
  // units below the chin), chest plate up 10, arms starting at the
  // new shoulder line. The head now sits BETWEEN the pauldrons, chin
  // just above the chest plate, like the reference paladins. Hanging
  // hair (locks, braid, ponytail tail) is drawn AFTER the pauldrons
  // (hangingHair) so it falls IN FRONT of the raised armour instead
  // of being swallowed by it.
  // Neck and mouth are UNCHANGED from v56/v57 (both verified FIXED
  // live Nov 22, 7:11-7:15 PM): neck short, collar rises to just
  // under the chin, ~1.5 units of skin show; mouth a thin short
  // light line at y34.5. Legs (y94-142, 48 tall) are about as long as the torso (y46-94,
  // 48 tall), with a shade strip and a knee band each, so they
  // read as armoured legs, not sticks. The whole figure is ~139
  // units tall (was ~173) and is shifted down 17 by the outer
  // wrapper <g> below, so it sits centred in the 200 frame.
  // Neck: SHORT, NARROW, TAPERED — top 10 wide at the chin, widening
  // to 14 at the shoulders, mostly hidden by the collar, which rises
  // to just under the chin. Only ~1.5 units of skin show between chin
  // and collar. Like the reference sheets: the chin nearly touches
  // the collar, there is no bare column of neck.
  // Hands: image-left hand holds the sword (figure's right), image-right
  // hand holds the shield / bow / staff (figure's left).
  const handLx = isFemale ? 81 : 76;
  const handRx = isFemale ? 119 : 124;
  const handR = isFemale ? 5 : 5.5;
  const torsoD = isFemale
    ? `M100 46 L${f(100 + 11 * bw)} 50 L${f(100 + 13 * bw)} 74 L${f(100 + 9 * bw)} 94 L${f(100 - 9 * bw)} 94 L${f(100 - 13 * bw)} 74 L${f(100 - 11 * bw)} 50 Z`
    : `M100 46 L${f(100 + 17 * bw)} 50 L${f(100 + 19 * bw)} 76 L${f(100 + 14 * bw)} 94 L${f(100 - 14 * bw)} 94 L${f(100 - 19 * bw)} 76 L${f(100 - 17 * bw)} 50 Z`;
  const beltW = (isFemale ? 24 : 30) * bw;
  const pauldronRx = (isFemale ? 10 : 11) * bw;
  const pauldronDx = isFemale ? 13 : 18;

  // --- Hair, flat with strand lines, in the SAME coordinates as the head.
  // Head: centre (100,29), r13, top y16, sides x87/113, chin y42.
  // Every style sits ON the head; locks hug the head sides and end ON
  // the shoulders (y57), aligned with the arms, never hanging in
  // mid-air beside the neck, never past the shoulders, never
  // covering the face or the pauldrons. Hair colour is warm brown for
  // every style; the silhouette is what tells them apart.
  const hairCap = (
    <g>
      {/* Cap top at y16, ABOVE the head circle's top (y17), and wider
          than the circle (x86/114 vs x87/113), so it covers the circle's
          top arc — the old cap left the dark arc peeking above the hair
          like a headband. */}
      <path d="M87 38 Q85.5 15 100 13.5 Q114.5 15 113 38 Q110 24 100 24 Q90 24 87 38 Z" fill={HAIR_C} />
      <path d="M100 16 Q94.5 17 91 22.5 M100 16 Q105.5 17 109 22.5" fill="none" stroke={HAIR_L} strokeWidth="2.5" opacity="0.9" strokeLinecap="round" />
    </g>
  );
  const longLocks = (wide: boolean) => (
    <g fill={HAIR_C}>
      {/* Locks hug the head: inner edge touching the face sides,
          outer edge just past them, ending ON the shoulders (y57),
          aligned with the arms — never hanging in mid-air beside
          the neck, never past the shoulders. */}
      <path d={wide ? 'M87.5 34 Q81.5 45 82.5 57 Q85.5 60 89 54 Q88 45 89 35 Z' : 'M88.5 34 Q82.5 45 83.5 57 Q86 60 89 54 Q88 45 89 35 Z'} />
      <path d={wide ? 'M112.5 34 Q118.5 45 117.5 57 Q114.5 60 111 54 Q112 45 111 35 Z' : 'M111.5 34 Q117.5 45 116.5 57 Q114 60 111 54 Q112 45 111 35 Z'} />
      <path d="M86 43 Q85 50 86 55 M114 43 Q115 50 114 55" fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
    </g>
  );
  const shortLocks = (
    <g fill={HAIR_C}>
      <path d="M88.5 35.5 Q86.5 45 88.5 55 Q90.5 57 92.5 51 Q91.5 43 91.5 35.5 Z" />
      <path d="M111.5 35.5 Q113.5 45 111.5 55 Q109.5 57 107.5 51 Q108.5 43 108.5 35.5 Z" />
    </g>
  );
  const hairArt = isFemale ? (
    <g>
      {hairCap}
      {/* Long locks hang in front of the pauldrons — see hangingHair. */}
      {/* Ponytail tail hangs in front of the pauldrons — see hangingHair. */}
      {hair === 'Bun' && (
        <g>
          <circle cx="100" cy="10" r="8" fill={HAIR_C} />
          <path d="M94 7 Q100 4 106 7" fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.8" strokeLinecap="round" />
          <path d="M93 12 Q100 9 107 12" fill="none" stroke={HAIR_L} strokeWidth="1.8" opacity="0.6" strokeLinecap="round" />
          {/* Bun side locks hang in front of the pauldrons — hangingHair. */}
        </g>
      )}
      {hair === 'Curly' && (
        <g fill={HAIR_C}>
          <circle cx="89" cy="26" r="5.5" />
          <circle cx="95" cy="19.5" r="6" />
          <circle cx="105" cy="19.5" r="6" />
          <circle cx="111" cy="26" r="5.5" />
          <circle cx="85" cy="35" r="5" />
          <circle cx="115" cy="35" r="5" />
          {/* Lower side curls hang in front of the pauldrons — hangingHair. */}
          <path d="M91 23 Q95 20 100 23 M104 23 Q109 20 113 23" fill="none" stroke={HAIR_L} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}
      {/* Braid hangs in front of the pauldrons — see hangingHair. */}
      {/* Short bob locks hang in front of the pauldrons — see hangingHair. */}
      {hair === 'Topknot' && (
        <g fill={HAIR_C}>
          <circle cx="100" cy="9" r="8" />
          <path d="M94 6 Q100 3 106 6" fill="none" stroke={HAIR_L} strokeWidth="2" strokeLinecap="round" />
          <path d="M93 14 Q100 11 107 14" fill="none" stroke={gem} strokeWidth="3" strokeLinecap="round" />
          {/* Topknot side locks hang in front of the pauldrons — hangingHair. */}
        </g>
      )}
    </g>
  ) : hair === 'Bald' ? (
    <g>
      <ellipse cx="97" cy="22" rx="5.5" ry="1.8" fill="#fff" opacity="0.25" />
    </g>
  ) : (
    <g>
      {hair === 'Buzz' ? (
        <path d="M88.5 36 Q88.5 14.5 100 13.5 Q111.5 14.5 111.5 36 Q106 25 100 25 Q94 25 88.5 36 Z" fill={HAIR_C} />
      ) : (
        <g>
          <path d="M88 37 Q88 15 100 13.5 Q112 15 112 37 Q107 24 100 24 Q93 24 88 37 Z" fill={HAIR_C} />
          <path d="M91 23 Q95 21 100 21 Q105 21 109 23" fill="none" stroke={HAIR_L} strokeWidth="2.5" opacity="0.8" strokeLinecap="round" />
          {/* NO sideburns: the old short tabs (x87.5-90.5 / 109.5-112.5,
              y35-41) ran down both sides of the face and, with the hair
              cap sides and the beard, framed the whole lower face in
              brown like a mask — that was the "facial hair needs fixed"
              look in Derek's Nov 22 7:24 PM screenshot. A short beard
              does not need to touch the hair; skin shows at the jaw
              corners, like the reference paladins. */}
        </g>
      )}
      {hair === 'Curly' && (
        <g fill={HAIR_C}>
          <circle cx="89" cy="25" r="4.5" />
          <circle cx="95" cy="19.5" r="5" />
          <circle cx="105" cy="19.5" r="5" />
          <circle cx="111" cy="25" r="4.5" />
          <circle cx="85" cy="34" r="4" />
          <circle cx="115" cy="34" r="4" />
        </g>
      )}
      {/* Long locks hang in front of the pauldrons — see hangingHair. */}
      {hair === 'ManBun' && (
        <g fill={HAIR_C}>
          <circle cx="100" cy="10" r="7" />
          <path d="M95 7 Q100 4 105 7" fill="none" stroke={HAIR_L} strokeWidth="2" strokeLinecap="round" />
          <path d="M94 14 Q100 11 106 14" fill="none" stroke={gem} strokeWidth="2.5" strokeLinecap="round" />
          {/* Man bun side locks hang in front of the pauldrons — hangingHair. */}
        </g>
      )}
    </g>
  );

  // Hanging hair, drawn AFTER the pauldrons (in front of the armour),
  // so long hair falls over the shoulders like the reference sheets.
  // The pauldrons now sit up at chin height (tops y44), so hair drawn
  // before them would be swallowed — only the cap and on-head styles
  // are drawn early, in hairArt above. Gem ties are BIG (r4.5-5) so
  // they read at preview size.
  const hangingHair = isFemale ? (
    <g>
      {hair === 'Long' && longLocks(false)}
      {hair === 'Ponytail' && (
        <g>
          {/* ONE tail on the right side only, THICKER — the old version
              had this tail PLUS a short lock on the left, which read
              live as two thin symmetric strands / pigtails. Gem ties
              at the top AND at the end, both big enough to see. */}
          <path d="M111 30 Q121 44 119 58 Q114 61 111 55 Q113 42 109 34 Z" fill={HAIR_C} />
          <path d="M116 42 Q117 50 116 56" fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
          <circle cx="115" cy="44" r="5" fill={gem} stroke="#fff" strokeWidth="1.5" />
          <circle cx="116" cy="56" r="4.5" fill={gem} stroke="#fff" strokeWidth="1.5" />
        </g>
      )}
      {hair === 'Bun' && shortLocks}
      {hair === 'Curly' && (
        <g fill={HAIR_C}>
          <circle cx="86" cy="50" r="4.5" />
          <circle cx="114" cy="50" r="4.5" />
        </g>
      )}
      {hair === 'Braided' && (
        <g fill={HAIR_C}>
          {/* Braid hangs to the SHOULDER (y60), aligned with the right
              arm — the old braid ran to y80, mid-torso, floating. */}
          <path d="M88.5 35.5 Q86.5 45 88.5 55 Q90.5 57 92.5 51 Q91.5 43 91.5 35.5 Z" />
          <circle cx="114" cy="42" r="5" />
          <circle cx="112" cy="49" r="5" />
          <circle cx="114" cy="55" r="4.5" />
          <circle cx="114" cy="40" r="4.5" fill={gem} stroke="#fff" strokeWidth="1.5" />
          <circle cx="114" cy="56" r="4.5" fill={gem} stroke="#fff" strokeWidth="1.5" />
        </g>
      )}
      {hair === 'ShortBob' && (
        <g fill={HAIR_C}>
          <path d="M86 36 Q83 46 86 52 Q89 54 91 49 Q90 42 90 36 Z" />
          <path d="M114 36 Q117 46 114 52 Q111 54 109 49 Q110 42 110 36 Z" />
          <path d="M88 44 Q90 50 92 48 M112 44 Q110 50 108 48" fill="none" stroke={HAIR_L} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}
      {hair === 'Topknot' && shortLocks}
    </g>
  ) : (
    <g>
      {hair === 'Long' && longLocks(true)}
      {hair === 'ManBun' && (
        <g fill={HAIR_C}>
          <path d="M87 38 Q85 47 87 55 Q90 57 92 52 Q91 44 91 38 Z" />
          <path d="M113 38 Q115 47 113 55 Q110 57 108 52 Q109 44 109 38 Z" />
        </g>
      )}
    </g>
  );

  // Ranger hood: the hood frames the face, so only the bits that peek out
  // are drawn — side locks, a braid, a bob, curls, or a knot poking above
  // the hood. Buzz / Short / Bald show nothing extra.
  const hoodHair = (
    <g>
      <path d="M85 46 Q80 15 100 15 Q120 15 115 46 L110 36 Q108 21 100 21 Q92 21 90 36 Z" fill={capeMain} stroke={dark} strokeWidth="2.5" />
      <path d="M91 23 Q95 20 100 20" fill="none" stroke={light} strokeWidth="2" opacity="0.6" strokeLinecap="round" />
      {isFemale && hair === 'Long' && longLocks(false)}
      {isFemale && hair === 'Ponytail' && (
        <g>
          {/* ONE tail only, with big gem ties top and end — same fix
              as the non-hood Ponytail (two-strand read live). The tail
              ends at y58, above the pauldron top, so the end tie shows. */}
          <path d="M111 30 Q121 44 119 58 Q114 61 111 55 Q113 42 109 34 Z" fill={HAIR_C} />
          <circle cx="115" cy="44" r="5" fill={gem} stroke="#fff" strokeWidth="1.5" />
          <circle cx="116" cy="56" r="4.5" fill={gem} stroke="#fff" strokeWidth="1.5" />
        </g>
      )}
      {isFemale && hair === 'Bun' && (
        <g fill={HAIR_C}>
          <circle cx="100" cy="10" r="7.5" />
          {shortLocks}
        </g>
      )}
      {isFemale && hair === 'Curly' && (
        <g fill={HAIR_C}>
          <circle cx="84" cy="48" r="5" />
          <circle cx="116" cy="48" r="5" />
          <circle cx="86" cy="58" r="4.5" />
          <circle cx="114" cy="58" r="4.5" />
        </g>
      )}
      {isFemale && hair === 'Braided' && (
        <g fill={HAIR_C}>
          <circle cx="114" cy="42" r="5" />
          <circle cx="112" cy="49" r="5" />
          <circle cx="114" cy="55" r="4.5" />
          <circle cx="114" cy="40" r="4.5" fill={gem} stroke="#fff" strokeWidth="1.5" />
          <circle cx="114" cy="56" r="4.5" fill={gem} stroke="#fff" strokeWidth="1.5" />
        </g>
      )}
      {isFemale && hair === 'ShortBob' && (
        <g fill={HAIR_C}>
          <path d="M86 36 Q83 46 86 52 Q89 54 91 49 Q90 42 90 36 Z" />
          <path d="M114 36 Q117 46 114 52 Q111 54 109 49 Q110 42 110 36 Z" />
        </g>
      )}
      {isFemale && hair === 'Topknot' && (
        <g fill={HAIR_C}>
          <circle cx="100" cy="9" r="7.5" />
          <path d="M93 13 Q100 10 107 13" fill="none" stroke={gem} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
      {!isFemale && hair === 'Curly' && (
        <g fill={HAIR_C}>
          <circle cx="85" cy="47" r="4" />
          <circle cx="115" cy="47" r="4" />
        </g>
      )}
      {!isFemale && hair === 'Long' && longLocks(true)}
      {!isFemale && hair === 'ManBun' && (
        <g fill={HAIR_C}>
          <circle cx="100" cy="10" r="7" />
          <path d="M94 14 Q100 11 106 14" fill="none" stroke={gem} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
    </g>
  );

  // --- Scene backgrounds: detailed flat cartoon scenes, one per class.
  // Detail stays BEHIND the figure and away from the face (the figure
  // occupies x70-150, y17-170 in the frame (after the +17 shift)
  // and is drawn on top, opaque). The
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
          <circle cx="140" cy="148" r="2.5" fill="#fff" />
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
        <ellipse className="guardian-shadow" cx="100" cy="172" rx="44" ry="6" fill="#124571" opacity="0.18" />

        {/* Compact figure: the whole figure is shifted down 17 in the
            frame by this plain wrapper <g> (no CSS class — the
            .guardian-bob CSS animation animates transform, so an
            attribute transform ON that group would be overridden
            live). Figure now spans y~30 (hair top) to y~170 (boots),
            ~139 units tall, centred with breathing room above and
            below instead of filling the whole card. */}
        <g transform="translate(0 17)">
        <g className="guardian-bob">
          {/* Cape with folds, flat, behind the body. Outlined in the
              darker cape colour, so it reads against the tunic instead
              of vanishing into it (same colour, no edge). */}
          {g.cape && (
            <g>
              <path d="M100 48 L124 58 L121 122 Q100 130 79 122 L76 58 Z" fill={capeMain} stroke={capeDark} strokeWidth="2" opacity="0.96" />
              <path d="M86 64 Q84 96 86 118" fill="none" stroke={capeDark} strokeWidth="2" opacity="0.6" />
              <path d="M114 64 Q116 96 114 118" fill="none" stroke={capeDark} strokeWidth="2" opacity="0.6" />
              <path d="M100 58 Q100 96 100 122" fill="none" stroke={capeDark} strokeWidth="1.5" opacity="0.4" />
            </g>
          )}
          {/* Wings, Level 8+ : flat white feathers */}
          {showWings && (
            <g>
              <g fill="#ffffff" stroke={main} strokeWidth="2.5" opacity="0.95">
                <ellipse cx="66" cy="82" rx="13" ry="24" transform="rotate(-25 66 92)" />
                <ellipse cx="134" cy="82" rx="13" ry="24" transform="rotate(25 134 92)" />
              </g>
              <g fill={gem} opacity="0.35">
                <ellipse cx="66" cy="88" rx="7" ry="15" transform="rotate(-25 66 98)" />
                <ellipse cx="134" cy="88" rx="7" ry="15" transform="rotate(25 134 98)" />
              </g>
            </g>
          )}
          {/* Ranger quiver, worn on the back: peeks over the left shoulder
              with arrows sticking up, strap diagonal across the chest. */}
          {g.classId === 'Ranger' && (
            <g transform="translate(0 -8)">
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
          {/* Arms are drawn AFTER the torso (see below, before the
              pauldrons), so they are VISIBLE from shoulder to hand.
              The old arms were drawn here, before the torso, and the
              torso covered them — only the hands showed, floating at
              the waist, which is what Derek's screenshot shows. */}
          {/* Body: flat tunic in the main colour, one light strip on the
              left, one dark strip on the right (reference image 2 shading).
              Top edge (y46) sits under the collar (y41.5-50), which
              bridges chin to torso, so the neck never shows a gap. */}
          <path d={torsoD} fill={main} stroke={dark} strokeWidth="2.5" />
          <path d="M88 62 Q86 76 88 90 Q93 92 95 90 Q91 76 93 64 Z" fill="#fff" opacity="0.22" />
          <path d="M112 62 Q114 76 112 90 Q107 92 105 90 Q109 76 107 64 Z" fill="#000" opacity="0.14" />
          {/* Belt with buckle and studs */}
          <rect x={100 - beltW / 2} y="88" width={beltW} height="9" rx="4.5" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.5" />
          <rect x="94" y="89" width="12" height="7" rx="2" fill="#fffdf4" stroke={GOLD_DARK} strokeWidth="1.5" />
          <circle cx={100 - beltW / 2 + 5} cy="92.5" r="1.5" fill={GOLD_DARK} />
          <circle cx={100 + beltW / 2 - 5} cy="92.5" r="1.5" fill={GOLD_DARK} />
          {/* Glowing gem on chest: flat diamond with a white facet.
              The gem PULSES (.guardian-gem) — a subtle contextual glow,
              not a halo around the figure. */}
          <g className="guardian-gem">
            <polygon points="100,62 109,71 100,80 91,71" fill={gem} stroke="#fff" strokeWidth="2" />
            <polygon points="100,66 104,71 100,76 96,71" fill="#fff" opacity="0.55" />
          </g>
          {/* Legs, with a shade strip and a knee band each, so they read
              as armoured legs, not plain sticks (Derek's screenshot:
              long plain red rectangles, no knees, no shading). */}
          <path d={isFemale ? 'M89 94 L88 142 L95 142 L95 94 Z' : 'M87 94 L86 142 L97 142 L97 94 Z'} fill={legMain} stroke={legDark} strokeWidth="1.5" />
          <path d={isFemale ? 'M105 94 L105 142 L112 142 L111 94 Z' : 'M103 94 L103 142 L114 142 L113 94 Z'} fill={legMain} stroke={legDark} strokeWidth="1.5" />
          <rect x={isFemale ? 92 : 94} y="96" width="3" height="44" fill="#000" opacity="0.14" />
          <rect x={isFemale ? 109 : 111} y="96" width="3" height="44" fill="#000" opacity="0.14" />
          <path d={isFemale ? 'M88.5 120 L95 120 M105 120 L111.5 120' : 'M86.5 120 L97 120 M103 120 L113.5 120'} fill="none" stroke={legDark} strokeWidth="2.5" opacity="0.85" strokeLinecap="round" />
          <ellipse cx="91" cy="148" rx="10" ry="4.5" fill={BOOT} />
          <ellipse cx="109" cy="148" rx="10" ry="4.5" fill={BOOT} />
          {/* Boot straps, BOLD and bright — the old thin tan lines were
              invisible at preview size live. */}
          <path d="M83 145 L99 145 M101 145 L117 145" stroke="#d9a441" strokeWidth="3" opacity="1" />
          <path d="M83 150 L99 150 M101 150 L117 150" stroke="#d9a441" strokeWidth="2.5" opacity="0.9" />
          {/* Spellweaver wizard robe: flows from the waist to the ankles
              over the legs, boots peeking out below. Flat, with fold
              lines, a hem trim, and a gem. */}
          {g.classId === 'Spellweaver' && (
            <g>
              <path d="M84 92 L116 92 L126 138 Q100 146 74 138 Z" fill={main} stroke={dark} strokeWidth="2.5" />
              <path d="M92 100 Q90 120 92 134 M100 102 Q100 120 100 138 M108 100 Q110 120 108 134" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.4" />
              <path d="M88 104 Q86 122 88 132" fill="#fff" opacity="0.18" />
              <path d="M76 134 Q100 142 124 134" fill="none" stroke={GOLD} strokeWidth="2" opacity="0.7" />
              <circle cx="100" cy="118" r="4" fill={gem} stroke="#fff" strokeWidth="1.5" />
            </g>
          )}
          {/* Neck: SHORT, NARROW, TAPERED — like the reference sheets,
              where the chin nearly touches the collar and almost no
              neck shows. Top 10 wide at the chin (y38, inside the
              head), widening to 14 at the shoulders (y50, below the
              torso top), about half the face width. A soft shade strip
              on one side. The COLLAR drawn after it covers the bottom
              half, so only ~1.5 units of skin show between chin (y40)
              and collar (y41.5) — a neck, not a column, not a thin
              stick, never a wide block. Drawn AFTER the torso and
              BEFORE the head; the chin sits ON the neck, the neck
              disappears INTO the collar. */}
          <path d="M95 38 L105 38 L107 50 L93 50 Z" fill={SKIN} />
          <path d="M102 40 L105 40 L105 42.5 L102.5 42.5 Z" fill={shade(SKIN, -30)} opacity="0.45" />
          {/* Collar: a SHALLOW dome-topped cap rising to just under the
              chin (top edge y41.5, bottom edge y50) — it joins chin to
              shoulders and covers the neck's bottom half. It used to
              run down to y58, a tall black dome that made the head
              look perched high above the shoulders (Derek, Nov 22
              7:24 PM). Main colour (hood colour for the Ranger, so it
              reads as the cowl). Light trim along the top edge. */}
          <path d="M85 50 Q85 41.5 100 41.5 Q115 41.5 115 50 Z" fill={g.classId === 'Ranger' ? capeMain : main} stroke={dark} strokeWidth="2" />
          <path d="M88 44.5 Q100 42.5 112 44.5" fill="none" stroke={light} strokeWidth="1.5" opacity="0.5" />
          {/* Cape clasp on the collar, joining neck to shoulders */}
          <circle cx="100" cy="47" r="3.5" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.5" />
          <circle cx="100" cy="47" r="1.8" fill={gem} stroke="#fff" strokeWidth="1" />
          {/* Head: one flat skin circle, r13 at (100,29), 26 units tall
              (hair top y13.5 to chin y42 is ~28 of the ~139-unit figure,
              about 1/5 — stockier, like the reference paladin).
              v56/v57 had r11 and the head read TINY live against the
              wide torso. Drawn AFTER the neck, so it overlaps the neck
              top. Same coordinates as the face and hair — no scale
              transform anywhere, so nothing can drift. Neck and mouth
              are UNCHANGED (both verified FIXED live): the neck path
              and the thin light mouth line at y34.5 are exactly as
              they were. */}
          <circle cx="100" cy="29" r="13" fill={SKIN} stroke={headStroke} strokeWidth="1.2" />
          {/* NO jaw lines: the old dark strokes down the face sides
              (M90 31.5 L92 37) read at preview size as grey streaks
              running down the cheeks — they looked like stubble/tears
              on clean-shaven faces, and on bearded faces they added
              to the brown frame. The beard (or a clean jaw) defines
              the jaw on its own. */}
          {/* Hair, hood, or wizard hat — all in the same coordinates as
              the head, sitting ON it. */}
          {g.classId === 'Ranger' ? hoodHair : g.classId === 'Spellweaver' ? null : hairArt}
          {/* Spellweaver hat: a tall pointed wizard hat in a LIGHT fill
              (shade +100), so it reads against the steel-blue night sky.
              Brim at y18, cone rising to a bent tip at y0, gem band. */}
          {g.classId === 'Spellweaver' && (
            <g>
              <path d="M81 18 L99 0 Q107 -2 109 4 Q110 9 105 11 Q101 13 103 18 L119 18 Z" fill={light} stroke={dark} strokeWidth="2" strokeLinejoin="round" />
              <path d="M87 14 L96 5" fill="none" stroke="#fff" strokeWidth="2" opacity="0.55" strokeLinecap="round" />
              <ellipse cx="100" cy="18" rx="20" ry="4.5" fill={light} stroke={dark} strokeWidth="2" />
              <path d="M82 17 Q100 14 118 17" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.5" />
              <circle cx="100" cy="16" r="3.5" fill={gem} stroke="#fff" strokeWidth="1" />
            </g>
          )}
          {/* Beard: only when the picked hair style has one (Male Short +
              beard, Bald, or Long). A SHORT NEAT CHIN BEARD that
              follows the jawline — Derek, Nov 22 7:54 PM: "the facial
              hair needs fixed". What was wrong (his Nov 22 7:24 PM
              screenshot): the old beard was a wide solid crescent
              (x90-110, y38-46.5) hanging 4.5 units BELOW the chin,
              plus filled mustache lenses sitting right under the mouth
              (y36.5-38.5, reading as a dark band under the mouth),
              plus sideburn tabs down both face sides — together the
              whole lower face was framed in brown like a mask/bib.
              The new beard is NARROWER (x92.5-107.5, 15 wide, not
              20), so skin shows at both jaw corners; it ends at
              y43.5, only 1.5 below the chin, so it sits ON the chin
              and never hangs into the collar; its top edge sags to
              y~39.5 at the centre, 5 units below the mouth, so the
              mouth stays clear. NO mustache: a mustache above the
              mouth would sit 2 units from it and merge into a band
              at preview size, and lenses under the mouth were the
              band. Two short LIGHT texture lines only. Female never
              has a beard. MORE VISIBLE (Derek, Nov 22 7:58 PM: "I can't
              see the facial hair well"): the v64 crescent was 15 wide,
              ~3 units thick at the centre, medium brown, two faint light
              lines — it vanished at 56px. Now 18 wide (x91-109, still
              narrower than the face, skin shows at both jaw corners),
              ~5 units thick at the centre (top edge sags to y39.5, 5
              units below the mouth, so the mouth stays clear; bottom
              y44.5, only 2.5 below the chin, so it sits ON the chin and
              never hangs into the collar like the old bib), DARKER brown
              fill (#40260f), thin dark outline, and FOUR texture lines
              (was two light ones) so the beard reads as hair, not a
              solid block. Still NO mustache, NO sideburns, NO jaw lines.
              Female never has a beard. */}
          {hasBeard && (
            <g fill={BEARD_C}>
              <path d="M91 37 Q89.5 43 100 44.5 Q110.5 43 109 37 Q105 39.5 100 39.5 Q95 39.5 91 37 Z" stroke="#2e1a08" strokeWidth="0.8" />
              <path d="M95 40.5 L95 43.2 M98.5 40.5 L98.5 43.5 M101.5 40.5 L101.5 43.5 M105 40.5 L105 43.2" fill="none" stroke={HAIR_L} strokeWidth="1.6" opacity="0.9" strokeLinecap="round" />
            </g>
          )}
          {/* Crown, Level 10+, Guardian only (the hat is the Spellweaver's
              crown, the hood is the Ranger's). */}
          {showCrown && (
            <g>
              <polygon points="88,18 91,7 96,14 100,5 104,14 109,7 112,18 112,22 88,22" fill={GOLD} stroke={GOLD_DARK} strokeWidth="2" />
              <circle cx="100" cy="18" r="2.4" fill={gem} stroke="#fff" strokeWidth="1.5" />
              <circle cx="91" cy="18" r="1.8" fill={gem} stroke="#fff" strokeWidth="1" />
              <circle cx="109" cy="18" r="1.8" fill={gem} stroke="#fff" strokeWidth="1" />
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
                <path d="M88.5 22.5 L95.5 25 M104.5 25 L111.5 22.5" fill="none" stroke={browStroke} strokeWidth="1.6" strokeLinecap="round" />
                <path d="M90 24.5 L88.5 22.5 M110 24.5 L111.5 22.5" fill="none" stroke="#1c2b3a" strokeWidth="1.1" strokeLinecap="round" />
              </>
            ) : (
              <path d="M88 22.5 L95.5 25 M104.5 25 L112 22.5" fill="none" stroke={browStroke} strokeWidth="2.2" strokeLinecap="round" />
            )}
            <circle cx="92.5" cy="27.5" r="2.4" fill="#1c2b3a" />
            <circle cx="107.5" cy="27.5" r="2.4" fill="#1c2b3a" />
            {/* Mouth: GENUINELY thin and short — 1.2/1.4 wide, 5 units
                long (x97.5-102.5), at y34.5, in a muted brown
                (#6b4a3a), NOT near-black. The old 1.8/2.2 near-black
                bar read as a thick band at 4x. Nothing else dark
                sits at mouth level. */}
            <path d="M97.5 34.5 L102.5 34.5" fill="none" stroke={mouthStroke} strokeWidth={isFemale ? 1.2 : 1.4} strokeLinecap="round" />
          </g>
          {/* Arms, drawn AFTER the torso and chest, BEFORE the
              pauldrons and weapons: thick shapes in the arm colour
              running from under the pauldrons down to the hands, with
              a light highlight strip so they read even when the arm
              colour matches the torso (Derek's Black guardian). The
              pauldrons (drawn next) cover the arm tops; the hands
              (drawn last) cover the arm bottoms — so shoulder, arm
              and hand read as ONE connected limb, never floating
              circles at the waist. */}
          {isFemale ? (
            <g>
              <path d="M88 49 Q80 62 79 88 L86 89 Q87 74 92 53 Z" fill={armMain} stroke={armDark} strokeWidth="2" />
              <path d="M112 49 Q120 62 121 88 L114 89 Q113 74 108 53 Z" fill={armMain} stroke={armDark} strokeWidth="2" />
              <path d="M84 56 Q81 66 81 84" fill="none" stroke="#fff" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
              <path d="M116 56 Q119 66 119 84" fill="none" stroke="#fff" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
            </g>
          ) : (
            <g>
              <path d="M86 48 Q75 62 74 88 L83 89 Q85 74 91 52 Z" fill={armMain} stroke={armDark} strokeWidth="2" />
              <path d="M114 48 Q125 62 126 88 L117 89 Q115 74 109 52 Z" fill={armMain} stroke={armDark} strokeWidth="2" />
              <path d="M80 54 Q76 66 76 84" fill="none" stroke="#fff" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
              <path d="M120 54 Q124 66 124 84" fill="none" stroke="#fff" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
            </g>
          )}
          {/* Guardian pauldrons, drawn AFTER the arms so they cover the
              arm tops, and BEFORE the hanging hair (hangingHair), so
              long hair falls IN FRONT of them like the reference
              sheets. RAISED to chin height (cy52, tops y44, only 2
              units below the chin at y42) — they flank the HEAD now,
              not the chest. Big steel, both looks, all hairstyles,
              with rivets and a gem stud each. */}
          {g.classId === 'Guardian' && (
            <g>
              <ellipse cx={100 - pauldronDx} cy="52" rx={pauldronRx} ry={isFemale ? 7.5 : 8} fill={STEEL} stroke={dark} strokeWidth="2" />
              <ellipse cx={100 + pauldronDx} cy="52" rx={pauldronRx} ry={isFemale ? 7.5 : 8} fill={STEEL} stroke={dark} strokeWidth="2" />
              <circle cx={100 - pauldronDx} cy="52" r="2.5" fill={gem} />
              <circle cx={100 + pauldronDx} cy="52" r="2.5" fill={gem} />
              <circle cx={100 - pauldronDx - 5} cy="49" r="1.2" fill={STEEL_DARK} />
              <circle cx={100 - pauldronDx + 5} cy="49" r="1.2" fill={STEEL_DARK} />
              <circle cx={100 + pauldronDx - 5} cy="49" r="1.2" fill={STEEL_DARK} />
              <circle cx={100 + pauldronDx + 5} cy="49" r="1.2" fill={STEEL_DARK} />
            </g>
          )}
          {/* Guardian chest plate over the tunic, with emblem, etched
              lines, and a glowing gem. */}
          {g.classId === 'Guardian' && (
            <g>
              {/* Tapered at the top, so it reads as armour, not a bib.
                  Narrower than v56/v57 (was x84-116) so the head
                  does not look tiny next to it. Raised 10 with the
                  shoulders (top y50, was y62) so the chin sits just
                  above it. */}
              <path d="M90 50 L110 50 L112 68 L100 78 L88 68 Z" fill={STEEL} stroke={STEEL_DARK} strokeWidth="2" opacity="0.95" />
              <path d="M90 50 L110 50 L111 60 L89 60 Z" fill={main} opacity="0.85" />
              <path d="M94 54 L92 66 M106 54 L108 66" stroke={STEEL_DARK} strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
              <g className="guardian-gem">
                <circle cx="100" cy="70" r="4" fill={gem} stroke="#fff" strokeWidth="1.5" />
              </g>
            </g>
          )}
          {/* Hanging hair in front of the armour (Guardian only — the
              Ranger hood and Spellweaver hat have no pauldrons to
              swallow them, so their hair stays in the early block). */}
          {g.classId === 'Guardian' && hangingHair}
          {/* Ranger quiver strap, diagonal across the chest */}
          {g.classId === 'Ranger' && (
            <path d="M84 58 L116 88" fill="none" stroke={WOOD_DARK} strokeWidth="4" opacity="0.7" strokeLinecap="round" />
          )}
          {/* Weapons, flat like reference image 5: a distinct item at a
              glance, HELD in the hand — the hand circle is drawn over the
              grip, so the grip reads. Shield in the figure's LEFT hand
              (image-right), sword in the figure's RIGHT hand (image-left). */}
          {g.classId === 'Guardian' && (
            <g>
              {/* Shield, image-right */}
              <path d={`M${handRx - 2} 66 L${handRx + 28} 66 L${handRx + 28} 86 Q${handRx + 13} 102 ${handRx - 2} 86 Z`} fill={STEEL} stroke={GOLD} strokeWidth="3" />
              <path d={`M${handRx + 3} 71 L${handRx + 23} 71 L${handRx + 23} 85 Q${handRx + 13} 96 ${handRx + 3} 85 Z`} fill={main} opacity="0.9" />
              <circle cx={handRx + 13} cy="81" r="10" fill={gem} opacity="0.45" />
              <circle cx={handRx + 13} cy="81" r="5.5" fill={gem} stroke="#fff" strokeWidth="1.5" />
              {/* Sword, image-left: blade with fuller line, gold
                  crossguard, wrapped grip, gem in the pommel */}
              <g transform={`rotate(-12 ${handLx} 68)`}>
                <rect x={handLx - 3} y="40" width="6" height="44" rx="3" fill={STEEL} stroke={STEEL_DARK} strokeWidth="1.5" />
                <rect x={handLx - 1} y="42" width="1.8" height="38" fill="#fff" opacity="0.7" />
                <rect x={handLx - 10} y="82" width="20" height="6" rx="3" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.5" />
                {/* Grip, BOLDER wrap — the old thin lines were invisible
                    at preview size live (grip read as solid brown). */}
                <rect x={handLx - 4.5} y="88" width="9" height="13" rx="3" fill={WOOD} />
                <path d={`M${handLx - 4.5} 90 L${handLx + 4.5} 92 M${handLx - 4.5} 94 L${handLx + 4.5} 96 M${handLx - 4.5} 98 L${handLx + 4.5} 100`} stroke={WOOD_DARK} strokeWidth="2.5" />
                <circle cx={handLx} cy="101" r="6" fill={gem} opacity="0.4" />
                <circle cx={handLx} cy="101" r="3.5" fill={gem} stroke="#fff" strokeWidth="1.5" />
              </g>
            </g>
          )}
          {g.classId === 'Ranger' && (
            <g>
              {/* Bow, image-right hand: flat brown arc, string, arrow with
                  fletching and a GLOWING tip (gem glow — a spell-like
                  effect, not a halo). */}
              <path d={`M${handRx} 66 Q${handRx + 24} 90 ${handRx} 126`} fill="none" stroke={WOOD} strokeWidth="4.5" strokeLinecap="round" />
              <path d={`M${handRx} 66 Q${handRx + 19} 90 ${handRx} 126`} fill="none" stroke="#a8763e" strokeWidth="2" strokeLinecap="round" />
              <line x1={handRx} y1="66" x2={handRx} y2="126" stroke="#e8e2d4" strokeWidth="2" />
              <path d={`M${handRx - 3} 86 L${handRx + 3} 86 M${handRx - 3} 94 L${handRx + 3} 94`} stroke={WOOD_DARK} strokeWidth="2" />
              <line x1={handRx} y1="90" x2={handRx + 24} y2="90" stroke={gem} strokeWidth="3.5" strokeLinecap="round" />
              <polygon points={`${handRx + 24},90 ${handRx + 17},87 ${handRx + 17},93`} fill={STEEL_DARK} />
              <circle cx={handRx + 24} cy="90" r="6" fill={gem} opacity="0.45" />
              {/* Fletching, BIG — the old small white triangle was
                  invisible at preview size live. A large white feather
                  at the arrow tail, with a second smaller one. */}
              <polygon points={`${handRx + 2},90 ${handRx - 13},84 ${handRx - 13},96`} fill="#fff" opacity="0.9" />
              <polygon points={`${handRx + 2},90 ${handRx - 9},92 ${handRx - 9},98`} fill="#dfe8f0" opacity="0.9" />
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
              <g transform={`rotate(7 ${handRx} 90)`}>
                <rect x={handRx - 3} y="27" width="6" height="57" rx="3" fill={WOOD} stroke={WOOD_DARK} strokeWidth="1.5" />
                <rect x={handRx - 3} y="96" width="6" height="50" rx="3" fill={WOOD} stroke={WOOD_DARK} strokeWidth="1.5" />
                <rect x={handRx - 1} y="29" width="2" height="55" fill="#a8763e" opacity="0.7" />
                <rect x={handRx - 1} y="98" width="2" height="46" fill="#a8763e" opacity="0.7" />
                {/* Carved rings, GOLD and BOLD — the old dark thin bands
                    were invisible on the brown wood at preview size
                    live (staff read as plain brown). Four rings, plus
                    bolder wrap lines at the grip. */}
                <path d={`M${handRx - 3} 44 L${handRx + 3} 44 M${handRx - 3} 58 L${handRx + 3} 58 M${handRx - 3} 72 L${handRx + 3} 72 M${handRx - 3} 118 L${handRx + 3} 118`} stroke={GOLD} strokeWidth="3.5" />
                <path d={`M${handRx - 3} 106 L${handRx + 3} 108 M${handRx - 3} 112 L${handRx + 3} 114`} stroke={WOOD_DARK} strokeWidth="2.5" />
                <g className="guardian-gem">
                  <circle cx={handRx + 10} cy="18" r="16" fill={gem} opacity="0.45" />
                  <polygon points={starPoints(handRx + 10, 18, 9)} fill={gem} stroke="#fff" strokeWidth="2" />
                </g>
                <polygon points={`${handRx + 10},13 ${handRx + 13},18 ${handRx + 10},23 ${handRx + 7},18`} fill="#fff" opacity="0.5" />
              </g>
            </g>
          )}
          {/* Hands, drawn LAST over the weapon grips, so every weapon
              reads as held. Skin circles with a dark outline. */}
          <circle cx={handLx} cy="90" r={handR} fill={SKIN} stroke={dark} strokeWidth="1.5" />
          <circle cx={handRx} cy="90" r={handR} fill={SKIN} stroke={dark} strokeWidth="1.5" />
        </g>
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
