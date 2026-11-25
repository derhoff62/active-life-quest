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
// Spellweaver orb's glow, the Ranger arrow's glowing tip, the shield
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
import type { GuardianMood, GuardianState } from '../lib/store';
import { ARMOR } from '../lib/data';
import { armorKind, tierColor, weaponKind } from '../lib/equip';
import {
  COLOR_HEX,
  GEM_HEX,
  GEM_LIGHT_HEX,
  HAIR_WITH_BEARD,
  buildWidth,
  hairForLook,
  skinHex,
  skinToneFor,
} from '../lib/guardianOptions';

const COLOR_MAP: Record<string, string> = COLOR_HEX;
const GEM_MAP: Record<string, string> = GEM_HEX;

const SIZES = { large: 180, medium: 120, compact: 96, small: 72 } as const;

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
  face,
}: {
  guardian: GuardianState | null;
  level: number;
  size?: GuardianAvatarSize;
  label?: string;
  background?: GuardianScene;
  // Explicit face override (Today's auto mood). Without it the face is
  // the guardian's picked default mood (guardian.mood, 'determined'
  // on old profiles) — never stuck on angry.
  face?: GuardianMood;
}) {
  const g = guardian ?? DEFAULT_GUARDIAN;
  const isRanger = g.classId === 'Ranger';
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
  // Face-feature contrast, REWORKED (Derek, Nov 22 8:30 PM: "I don't
  // see a difference" — live v67 test: on Deep the brows and mouth
  // effectively vanish, on Brown they are faint). Why the v67 fix did
  // NOT read: Deep skin #54371e and near-black #1c2b3a are both dark
  // (relative luminance ~0.05 vs ~0.03), so a dark brow on dark skin
  // has almost no contrast, and a 1.2-1.4 unit stroke is 0.34-0.4 px
  // at the 56px preview — sub-pixel, so it disappears whatever its
  // colour. The mouth on dark tones was shade(skin,+70) = #9a7d64, a
  // mid-tan 1.4-unit line: a faint mark, not a mouth.
  // Fix: on the two darkest tones the brow is drawn TWICE — a wide
  // light-cream halo underneath (#ffe3c2, the Fair tone) and a dark
  // near-black core on top — so the dark brow is rimmed in light and
  // separates from both the dark skin and the dark hair. The mouth on
  // dark tones is a light-cream line, thicker (2.8) and longer (8
  // units), so it reads as a mouth, not a faint mark. On light tones
  // the brow stays dark brown and the mouth stays muted brown, both
  // thickened a little (brows 2.2->3.0 male, mouth 1.4->2.0) so they
  // read at 56px without becoming a band. Eyes get slightly bigger
  // dots (r2.4->2.7); they already read on every tone.
  const skinIsDark = skinTone === 'Brown' || skinTone === 'Deep';
  const browCore = skinIsDark ? '#120a04' : HAIR_C;
  // BIGGER FIXES (Derek, Nov 23 10:12 PM, diagnosis Nov 23 10:11 PM):
  // the Ranger brows/eyes were sub-pixel at the 96px live preview
  // (brow stroke 1.8 units = 0.86px, glint r0.9 = 0.43px radius), so
  // the light halo now exists on ALL skin tones for Ranger, not
  // only Brown/Deep — on Light skin the cream rim is what separates
  // the dark brow from the light skin at 1-2px. Mouth thickened
  // for Ranger too (see mouthWidth below).
  const browHalo = skinIsDark || isRanger ? '#ffe3c2' : null;
  const mouthStroke = skinIsDark ? '#ffe3c2' : '#6b4a3a';
  const mouthWidth = isRanger ? 2.4 : skinIsDark ? 2.8 : 2.0;
  // Beard edge on dark skin: the old dark outline (#2e1a08) vanished
  // into Deep skin (#54371e) next to beard fill #40260f, so the beard
  // edge gets a light-tan rim on dark tones instead.
  const beardStroke = skinIsDark ? '#e5b183' : '#2e1a08';
  const gem = GEM_MAP[g.gem] ?? GEM_MAP.Sapphire;
  const gemLight = GEM_LIGHT_HEX[g.gem] ?? GEM_LIGHT_HEX.Sapphire;
  // Equipped gear (Derek, Nov 22 8:53 PM): an equipped weapon replaces
  // the class weapon in the hand, an equipped armor piece adds a
  // tier-coloured trim + kind-specific piece (helm band, crown, chest
  // plate tint, boot bands, cape edge). No equipped gear = class weapon
  // and no trim, exactly as before, so old profiles look unchanged.
  const equippedWeapon = ARMOR.find((a) => a.id === g.equippedWeaponId);
  const equippedArmor = ARMOR.find((a) => a.id === g.equippedArmorId);
  const equippedWeaponKind = equippedWeapon ? weaponKind(equippedWeapon) : null;
  // Shield hand (Derek, Nov 22 10:02 PM: "if a shield is equipped you
  // shouldn't be able to see the hand right?"): correct — the hand
  // holding a shield is BEHIND the shield, so it must not be drawn
  // over the shield face. The class Guardian shield is drawn whenever
  // no weapon is equipped, or a one-handed left-hand weapon is
  // equipped (sword/dagger/hammer/claws); an equipped shield also
  // covers the right hand. In those cases the right hand is omitted
  // at the end (see Hands below), not drawn over the shield.
  const shieldCoversRightHand =
    equippedWeaponKind === 'shield' ||
    (g.classId === 'Guardian' &&
      (!equippedWeapon ||
        equippedWeaponKind === 'sword' ||
        equippedWeaponKind === 'dagger' ||
        equippedWeaponKind === 'hammer' ||
        equippedWeaponKind === 'claws'));
  const equippedArmorKind = equippedArmor ? armorKind(equippedArmor) : null;
  // FULL HELMET (Derek, Nov 23 10:18 PM: a full helmet that covers
  // the head when equipped, plus famous ones to unlock). The old
  // helm was only a thin tier-coloured band across the crown. When
  // a helm is equipped, the hair / hood / wizard hat are NOT drawn
  // at all (see the head section below): the helmet replaces them,
  // on all 3 classes — the Ranger hood and the Spellweaver hat are
  // class headgear, and the helmet takes their place while it is
  // equipped. The helmet itself is drawn just before {faceArt}, so
  // brows, eyes and mouth are drawn AFTER it and stay visible.
  const helmEquipped = equippedArmorKind === 'helm';
  const equipTier = equippedArmor ? tierColor(equippedArmor.tier) : null;
  const weaponTier = equippedWeapon ? tierColor(equippedWeapon.tier) : null;
  const px = SIZES[size];
  const showWings = level >= 8;
  const showCrown = level >= 10 && g.classId === 'Guardian';
  const name = guardian ? `${g.name} the ${g.classId}` : 'Your guardian';
  const caption = label ?? `${name} · Level ${level}`;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (n: string) => `${n}-${uid}`;
  // GLOW v2 (Derek, Nov 23 3:14 PM: keep fixing the glow — live Nov 23
  // 3:10 PM it was still flat: no pulse, only a faint wash. DIAGNOSIS
  // (pixel-measured at the LIVE sizes, 96px/180px, not 800px): the v1
  // gradient disc DID render — the scan shows a pale fade — but (a) its
  // colour #8db4f2 at 0.5 opacity over steel plate / steel-blue sky is
  // only ~20-40 RGB units from the background, (b) it fades to
  // transparent by 45-100% of its radius, so the bright part is only
  // ~2-3px at 96px, and (c) the CSS pulse (scale 1->1.22, opacity
  // .55->.95) moves that faint edge by ~2px, below perception in a
  // 5s-apart live check. Fix: bigger discs, a SOLID translucent core
  // (a solid disc cannot wash out the way a gradient does), a white
  // inner ring, brighter gradient stops, and a much bigger pulse
  // (scale 1->1.35, opacity .6->1.0 in styles.css). The gem/orb itself
  // is drawn AFTER this, so it covers the centre. No permanent
  // whole-figure halo — per-gem only, per Derek Nov 22. */
  // PULSE v3 (Derek, Nov 23 4:26 PM): the v2 CSS pulse never showed
  // live — two crops 5s apart identical — because the live-check
  // browser runs with reduced motion forced, and the
  // prefers-reduced-motion media query sets animation: none on
  // .guardian-glow-pulse (see styles.css). SMIL <animate> is NOT
  // affected by CSS animation: none or that media query, so the pulse
  // now also lives in SMIL: each circle's r animates 1 -> 1.2, and
  // the group's opacity 0.7 -> 0.95. In a normal browser CSS wins
  // over SMIL on opacity (same property) and SMIL r still runs —
  // CSS never touches r — so nothing compounds. In a reduced-motion
  // browser CSS is dead and SMIL runs both. Either way dim =
  // opacity 0.7, r x1.0; bright = opacity 0.95, r x1.2.
  // TONE-DOWN (Derek, Nov 23 10:13 PM: "The aura is a little too
  // much now"): radii cut ~25-30% from v2 (chest 20->15, orb 22->17,
  // shield/arrow 18->14, pommel 16->12, equipped 24->18, cast hand
  // 14->11), solid core 0.5->0.35, white ring 0.35->0.25, SMIL
  // radius 1.4->1.2 and opacity 0.5->1.0 to 0.7->0.95 (same in
  // styles.css). Glow still visible at 96px, just subtler — not
  // removed, no permanent whole-figure halo. */
  const glowDisc = (cx: number, cy: number, r: number, fillUrl: string, light: string) => (
    <g className="guardian-glow-pulse">
      <animate attributeName="opacity" values="0.7;0.95;0.7" keyTimes="0;0.5;1" dur="1.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" />
      <circle cx={cx} cy={cy} r={r} fill={fillUrl}>
        <animate attributeName="r" values={`${r};${r * 1.2};${r}`} keyTimes="0;0.5;1" dur="1.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" />
      </circle>
      <circle cx={cx} cy={cy} r={r * 0.62} fill={light} opacity="0.35">
        <animate attributeName="r" values={`${r * 0.62};${r * 0.62 * 1.2};${r * 0.62}`} keyTimes="0;0.5;1" dur="1.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" />
      </circle>
      <circle cx={cx} cy={cy} r={r * 0.42} fill="#ffffff" opacity="0.25">
        <animate attributeName="r" values={`${r * 0.42};${r * 0.42 * 1.2};${r * 0.42}`} keyTimes="0;0.5;1" dur="1.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" />
      </circle>
    </g>
  );
  const scene: GuardianScene = background ?? CLASS_SCENE[g.classId] ?? 'guardian';
  const isFemale = g.look === 'Female';
  // RANGER FACE FIX, ROUND 2: r3.2 eyes + glint still dominated the
  // face at 180px (shiny eyeballs under thick brow bars). The
  // Ranger-only enlargement was the overshoot — Guardian eyes r2.7
  // read fine. Ranger now uses the SAME eye/brow sizes as Guardian
  // (r2.7, glint r0.9, brow core 2.4/3.0, halo 4.6/5.2); only the
  // Ranger brow SHAPE (raised, shorter) and eye height (cy29) stay
  // distinct, so the face keeps its own look without the bug eyes.
  const browCoreWidth = isRanger ? (isFemale ? 2.4 : 3.0) : isFemale ? 2.4 : 3.0;
  const browHaloWidth = isRanger ? (isFemale ? 4.6 : 5.2) : isFemale ? 4.6 : 5.2;
  const hair = hairForLook(g.look, g.hair);
  const hasBeard = !isFemale && HAIR_WITH_BEARD.includes(hair);
  const bw = buildWidth(g.build);
  const partName = (v: string | undefined) => (v && COLOR_HEX[v] ? v : g.color);
  const armName = partName(g.armColor);
  const legName = partName(g.legColor);
  const capeName = partName(g.capeColor);
  const armMain = COLOR_HEX[armName];
  const armDark = shade(armMain, -45);
  const armLight = shade(armMain, 40);
  // Sleeve fill, LIGHTER than the torso: the old arms used armMain
  // itself, so on Ranger and Spellweaver (no pauldrons, torso and
  // arms the same Navy) the arm was a thin dark strip that read as
  // a seam, not a limb — the hands floated at the waist.
  const legMain = COLOR_HEX[legName];
  const legDark = shade(legMain, -45);
  const capeMain = COLOR_HEX[capeName];
  const capeDark = shade(capeMain, -45);
  const f = (n: number) => Math.round(n * 100) / 100;

  // Face (Derek, Nov 22 9:21 PM: the guardian must not be stuck with
  // the angry Determined look). Six faces, same shapes as GuardianEmote:
  // Celebrate, Determined, Tired, Strong, Struggling, Good job.
  // `face` (Today's auto mood) wins; otherwise the guardian's picked
  // default mood; old profiles get 'determined'. Brows keep the v68
  // dark-skin halo + core so they read on every tone; closed/half-closed
  // eyes get the same halo treatment. No nose, no ears, no white sclera.
  const faceId: GuardianMood = face ?? g.mood ?? 'determined';
  // RANGER FACE (Derek, Nov 23 6:44 PM: "Ranger needs touch ups:
  // eyebrows, hair, the beard isn't on the face, you can't see the
  // eyes"). Measured in the renders: the shared brows are thick
  // bars (Female 2.4 / Male 3.0) angled steeply down at y22.5-25,
  // sitting directly ON the eyes (eye top y24.8, cy27.5 r2.7), so
  // brow + eye merge into one dark angry mass, and the hood's
  // narrow inner opening (x90-110) pinches the outer eye corners.
  // Ranger-only: brows raised ~2.5 units, shorter (5.5 vs 7 long),
  // shallower angle (drop 1.5, not 2.5), thinner (1.8 / 2.2), and
  // the eyes moved DOWN to cy29, bigger (r3.0) with a small glint
  // dot — so there is a clear skin gap between brow and eye on
  // every mood. Guardian / Spellweaver keep the shared geometry.
  const browD: Record<GuardianMood, string> = isRanger
    ? {
        determined: 'M90 20 L95.5 21.5 M104.5 21.5 L110 20',
        celebrate: 'M90 18.5 L95.5 17 M104.5 17 L110 18.5',
        tired: 'M90 21 L95.5 21 M104.5 21 L110 21',
        strong: 'M90 17.5 L95.5 20 M104.5 22.5 L110 20',
        struggling: 'M90 21.5 L95.5 18.5 M104.5 18.5 L110 21.5',
        'thumbs-up': 'M90 18 L95.5 16.5 M104.5 16.5 L110 18',
      }
    : {
        determined: 'M88.5 22.5 L95.5 25 M104.5 25 L111.5 22.5',
        celebrate: 'M88.5 21 L95.5 19.5 M104.5 19.5 L111.5 21',
        tired: 'M88.5 23.5 L95.5 23.5 M104.5 23.5 L111.5 23.5',
        strong: 'M88.5 20 L95.5 22.5 M104.5 25 L111.5 22.5',
        struggling: 'M88.5 24 L95.5 21 M104.5 21 L111.5 24',
        'thumbs-up': 'M88.5 20.5 L95.5 19 M104.5 19 L111.5 20.5',
      };
  const eyeCy = isRanger ? 29 : 27.5;
  const eyeR = 2.7;
  const faceArt = (
    <g>
      {browHalo && (
        <path d={browD[faceId]} fill="none" stroke={browHalo} strokeWidth={browHaloWidth} strokeLinecap="round" />
      )}
      <path d={browD[faceId]} fill="none" stroke={browCore} strokeWidth={browCoreWidth} strokeLinecap="round" />
      {isFemale && faceId === 'determined' && !isRanger && (
        <path d="M90 24.5 L88.5 22.5 M110 24.5 L111.5 22.5" fill="none" stroke={browCore} strokeWidth="1.8" strokeLinecap="round" />
      )}
      {isFemale && faceId === 'determined' && isRanger && (
        <path d="M90 26 L88.5 24 M110 26 L111.5 24" fill="none" stroke={browCore} strokeWidth="2.4" strokeLinecap="round" />
      )}
      {faceId === 'celebrate' ? (
        <>
          {browHalo && (
            <path d={`M89 ${eyeCy} Q92.5 ${eyeCy - 3.5} 96 ${eyeCy} M104 ${eyeCy} Q107.5 ${eyeCy - 3.5} 111 ${eyeCy}`} fill="none" stroke={browHalo} strokeWidth="4.4" strokeLinecap="round" />
          )}
          <path d={`M89 ${eyeCy} Q92.5 ${eyeCy - 3.5} 96 ${eyeCy} M104 ${eyeCy} Q107.5 ${eyeCy - 3.5} 111 ${eyeCy}`} fill="none" stroke="#1c2b3a" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M94 32 Q100 39.5 106 32 Q100 35.5 94 32 Z" fill={mouthStroke} />
        </>
      ) : faceId === 'tired' ? (
        <>
          {browHalo && (
            <path d={`M89.5 ${eyeCy} L95.5 ${eyeCy} M104.5 ${eyeCy} L110.5 ${eyeCy}`} fill="none" stroke={browHalo} strokeWidth="4.4" strokeLinecap="round" />
          )}
          <path d={`M89.5 ${eyeCy} L95.5 ${eyeCy} M104.5 ${eyeCy} L110.5 ${eyeCy}`} fill="none" stroke="#1c2b3a" strokeWidth="2" strokeLinecap="round" />
          <path d={`M89.5 ${eyeCy} Q92.5 ${eyeCy + 2.3} 95.5 ${eyeCy} M104.5 ${eyeCy} Q107.5 ${eyeCy + 2.3} 110.5 ${eyeCy}`} fill="none" stroke="#1c2b3a" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M96 35 L104 35" fill="none" stroke={mouthStroke} strokeWidth={mouthWidth} strokeLinecap="round" />
          {/* "Z" sits in clear sky: top-right for Guardian/Ranger, but
              top-LEFT for Spellweaver, whose staff orb glow disc sits
              top-right and the Z stamped on it read as a misprint. */}
          <text x={g.classId === 'Spellweaver' ? 70 : 126} y="14" fontSize="11" fill="#f2d878" fontWeight="700">Z</text>
        </>
      ) : (
        <>
          <circle cx="92.5" cy={eyeCy} r={eyeR} fill="#1c2b3a" />
          <circle cx="107.5" cy={eyeCy} r={eyeR} fill="#1c2b3a" />
          {isRanger && (
            <g fill="#fff" opacity="0.9">
              <circle cx="91" cy={eyeCy - 1} r="0.9" />
              <circle cx="106" cy={eyeCy - 1} r="0.9" />
            </g>
          )}
          {faceId === 'determined' && (
            <path d="M96 34.5 L104 34.5" fill="none" stroke={mouthStroke} strokeWidth={mouthWidth} strokeLinecap="round" />
          )}
          {faceId === 'strong' && (
            <path d="M94 32 Q100 38.5 106 32 Q100 35.5 94 32 Z" fill="#fff" stroke={mouthStroke} strokeWidth="1.4" />
          )}
          {faceId === 'struggling' && (
            <>
              <path d="M96 36 Q100 33.5 104 36" fill="none" stroke={mouthStroke} strokeWidth={mouthWidth} strokeLinecap="round" />
              <path d="M110 30.5 Q112 33.5 110 35.5 Q108 33.5 110 30.5 Z" fill="#4a90c2" />
            </>
          )}
          {faceId === 'thumbs-up' && (
            <path d="M95 32 Q100 36.5 105 32" fill="none" stroke={mouthStroke} strokeWidth={mouthWidth} strokeLinecap="round" />
          )}
        </>
      )}
    </g>
  );

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
  // RANGER BOW RAISED (Derek, Nov 23 6:44 PM: "the bow is held at a
  // higher spot"): the class bow was gripped at the waist (y90, arrow
  // across the belt). Ranger-only, class bow only: the grip moves to
  // shoulder height y60 — bow arc y38-82, arrow horizontal at y60,
  // just above the chest gem (top y62) so the arrow never crosses
  // it, bow top tip at (handRx,38) clear of the face (right edge
  // x113). With an equipped weapon the hands stay at the waist (y87)
  // where the equipped weapon is drawn.
  const rangerBowRaised = isRanger && !equippedWeapon;
  const bowY = rangerBowRaised ? 60 : 90;
  const bowTopY = rangerBowRaised ? 38 : 70;
  const bowBottomY = rangerBowRaised ? 82 : 112;
  // ACTION POSES (Derek, Nov 23 4:29 PM: "Action poses, one per
  // class"). Guardian: sword raised, shield forward, wide planted
  // stance. Ranger: bow drawn — string pulled back to the left
  // hand, long arrow. Spellweaver: staff tilted up, left hand out
  // casting. Hands stay on grips: the sword rotates about its grip
  // point, the bow string pulls to the existing left hand, the
  // staff rotates about its grip point. Legs widen by scaling x
  // about centre 100 (y untouched, feet stay on the ground, belt
  // still covers the leg tops). Poses are a clear ready/action
  // stance, not a lunge or jump — nothing contorted at 100px.
  const legSpread = g.classId === 'Guardian' ? 1 : g.classId === 'Ranger' ? 1.12 : 1;
  // GUARDIAN STANCE (Derek, Nov 23 6:46 PM: fix the Guardian stance).
  // The old 1.25x legSpread did NOT read wide live (Nov 23 6:32 PM
  // check: "legs are vertical and parallel, tan boots close together,
  // feet together"). Measured why: Female legs are x88-95 / x105-112,
  // gap 10 units; 1.25x about centre 100 moves the centres only
  // ~2 units out (gap 12.5), AND it scales the boots wider too
  // (rx 10 -> 12.5), so the boots OVERLAP by ~2.5 units and read as
  // one tan patch. Scaling alone can never open a boot gap.
  // Fix: Guardian legs are now ANGLED trapezoids, not vertical
  // rectangles — hips stay under the belt (tops x89-95 / x105-111
  // Female), ankles splay out ~12 units each side (bottoms x79-89 /
  // x111-121 Female), ~15 degrees, boots centred on the ankles
  // (cx84 / cx116 Female) rotated 10 degrees toes-out (was 18,
  // narrowed Nov 25, see below), with a clear 12-unit gap between
  // the boots (~5.8px at 96px). No scale transform on Guardian legs
  // any more (legSpread 1), so boots keep their size and the angle
  // is not distorted. Ranger keeps its 1.12x scale, Spellweaver
  // its robe.
  // GUARDIAN STANCE NARROWED (Derek, Nov 25 12:59 PM: "the
  // guardians legs seem too far apart"). The Nov 23 fix overshot:
  // ankles splayed to bottoms x71-81 / x119-129, boots cx76 / cx124
  // (Male 74.5 / 125.5), ~48 units ankle-to-ankle, boots spanning
  // x66-134 — two-thirds of the figure width, a split, not a
  // stance. Now ankles come in ~8 units each side: bottoms x79-89 /
  // x111-121 Female (x77-88 / x112-123 Male), boots cx84 / cx116
  // (Male 82.5 / 117.5), ~12-unit gap between the boots (~5.8px at
  // 96px), toes-out 18° -> 10°. Still a planted stance, hips still
  // under the belt, splay ~10°, not feet together.
  // Spellweaver casting hand: out to the left, raised to chest
  // height, with a glow (see the hands block). Null for other
  // classes, so their hands are untouched.
  const castHand = g.classId === 'Spellweaver' ? { x: handLx - 10, y: 62 } : null;
  // Staff grip: the wizard staff is present exactly when the class
  // is Spellweaver with no equipped weapon, or when the equipped
  // weapon is a staff (any class). Only then does the right hand
  // get the gripping-fist treatment in the hands block below.
  const isStaffGrip =
    (!equippedWeapon && g.classId === 'Spellweaver') || equippedWeaponKind === 'staff';
  // Wizard staff (Derek, Nov 23 7:32 AM: "Can the staff look more
  // like [a wizard] staff rather than a stick with a star?").
  // A proper wizard staff, not a straight stick with a star on top:
  // gnarled / twisted natural wood shaft (BOLD S-curve swinging
  // 12-14 units each way, large knots, thick bark lines, gold carved
  // rings), and a forked crook top holding a glowing crystal
  // orb IN the fork — the orb sits DOWN between two wide prongs
  // and in a wood cup under it, clearly mounted, no gap, no floating. The
  // glow disc is drawn FIRST (before the shaft) so it never tints
  // the wood grey-blue and reads as a gap — that was the last
  // star-gap bug. Orb: gem-coloured crystal with a white heart, so
  // it reads as glowing crystal at 56px, not a flat star. The
  // equipped staff uses the same shape; its glow is the tier colour
  // (Legendary gold) and its orb stays the gem colour.
  // NON-DEMONIC (Derek, Nov 23 9:54 AM: "I just don't want the staff
  // to look like a demonic thing"): NO sharp horns, no trident, no
  // pointed black/red spikes, no red/black colours, no jagged or
  // claw-like prongs. The fork here is a tree-branch CUP / CRADLE,
  // not horns: two short, thick, ROUNDED lobes (ellipses, fully
  // rounded tips, leaning gently outward) that cup the orb from the
  // sides, warm brown wood, pale blue/white orb, soft glow. If it
  // ever reads as horns or a trident, it has failed this rule.
  const wizardStaff = (orbFill: string, glowFill: string) => {
    // BOLD wizard staff, v4 (Nov 23: live 10:09 AM, fork v3 PASSED —
    // gnarled shaft, wide rounded fork, orb nestled low, not demonic —
    // but the HAND failed: "3-4px gap between the pale hand circle
    // and the brown shaft, no fingers wrapping it", and the left sky
    // gap was only a 1-2px sliver).
    // HAND DIAGNOSIS (measured, not guessed): the generic hand sat
    // at (handRx,90) but the shaft centreline at the grip is
    // (handRx-2,90), and above the grip it bends LEFT (x109 at y64,
    // x114 at y85 — bezier-sampled), so the hand's right half hung
    // in empty air right of the shaft, and its thick dark-navy ring
    // (1.5 units on a 5-unit circle) read at preview size as a dark
    // separator between hand and wood. The fix is in the hands block
    // below (fist centred ON the shaft centreline, thin outline,
    // finger lines across the shaft), not in this function.
    // LEFT-GAP DIAGNOSIS: the v3 arms' inner edges sat ~ox+/-13 at
    // orb height, so after the orb's white stroke and the r10 glow
    // disc tinting the gap, only ~2px of sky read at 100px on the
    // left. V4 widens both arms (tips ox-23 / ox+22, controls
    // ox-/+28) so ~7-8 units of sky show, and shrinks the glow disc
    // to r9 so it tints less of the gap. (V6 supersedes the arm
    // geometry: the whole staff top moved right, ox = handRx+17,
    // arms thinner at 8/5.5 — see FACE-BLOCK FIX below.)
    // FOOT DIAGNOSIS: the v3 lower segment bulged RIGHT to x125.7
    // at y120 then came back LEFT to x117 at y146, reading live as
    // a pronounced leftward hook at robe-hem level. V4 ends the
    // shaft at (handRx+2,146) with a much smaller lower bend, so
    // the foot plants straight down; the gnarl stays in the upper
    // S-curve and the knots.
    // FACE-BLOCK FIX v6 (Derek, Nov 23 2:54 PM: "The staff blocks
    // the face"): measured — the v4/v5 fork's LEFT arm passed through
    // (101,28) Female / (106,28) Male, i.e. dead centre of the face
    // (head (100,29) r13, right eye ~x107), and the orb at
    // (handRx+2,28) sat at x112.5, touching the face edge (x113) and
    // the Spellweaver hat brim (ends x119). The shaft's upper bend
    // also swung LEFT to x105-106 at y55-72, over the chin/shoulder.
    // Fix: the whole staff TOP moves right, ox = handRx+17 (was +2),
    // while the GRIP stays at (handRx-2,90) so the fist still holds
    // it — the shaft now leans gently right from grip to knob instead
    // of bending left over the face. Orb centre (ox,28) r8.5: left
    // edge ox-8.5 = 127.5 Female / 132.5 Male, clear of the face by
    // 14.5+ and of the hat brim (ends x126 after the Nov 23 brim
    // widening, rx26) by ~1.5 Female / ~6.5 Male. Fork arms are THINNER (8/5.5,
    // was 10/7) so a sky gap fits: left arm centre ~122.5 at y27
    // (left edge 118.5, clear of the face by 5.5; inner edge 126.5,
    // ~2 units of sky to the orb), right arm centre ~150.5 (inner
    // edge ~146.5, ~3 units of sky). Arms stay rounded, warm brown,
    // non-demonic (see rule above). Knob, cup, glow disc, knots,
    // bark and gold rings all move with the new centreline.
    // BIGGER FIXES (Derek, Nov 23 10:12 PM, diagnosis Nov 23
    // 10:11 PM): the brim is now rx33 (tips x67/133) and the live
    // check (Nov 23 7:09 PM) found the orb sitting ON the hat's
    // lower right at brim height. Two causes, both fixed: (1) ox
    // moves further right, handRx+17 -> handRx+24, so the orb's
    // left edge is 134.5 Female / 139.5 Male before the pose
    // rotation; (2) the pose rotation was rotate(-8), which swings
    // the staff top LEFT by ~9 units at orb height — the old
    // comment claiming -8 swings the top right was wrong (a point
    // above the grip rotated -8 deg moves left, not right), and
    // that leftward pull is what put the orb over the hat. The
    // Spellweaver staff pose is now rotate(+8), swinging the top
    // RIGHT, so the orb lands ~10 units clear of the brim tip
    // (see the pose block below). Equipped staffs are not rotated,
    // so their orb sits 1.5 units clear of the brim tip — tight,
    // but the class staff is the live case.
    const ox = handRx + 24;
    const oy = 28;
    // Centreline: top (knob) -> gentle curve RIGHT-DOWN to the grip
    // -> small bend RIGHT -> straight foot. No leftward excursion
    // above the grip any more.
    const shaftD = `M${ox} 40 C${ox - 5} 55 ${ox - 9} 72 ${handRx - 2} 90 C${handRx + 4} 108 ${handRx + 6} 126 ${handRx + 2} 146`;
    return (
      <g>
        {/* Gnarled shaft: dark outline stroke, then wood, so the bend
            has a visible edge at preview size. Width 14 -> 11.5. */}
        <path d={shaftD} fill="none" stroke={WOOD_DARK} strokeWidth="14" strokeLinecap="round" />
        <path d={shaftD} fill="none" stroke={WOOD} strokeWidth="11.5" strokeLinecap="round" />
        {/* Wood highlight following the bend, split at the grip. */}
        <path d={`M${ox - 3} 46 C${ox - 6} 58 ${ox - 8} 70 ${handRx - 4} 84 M${handRx + 1} 98 C${handRx + 4} 112 ${handRx + 5} 124 ${handRx + 2} 142`} fill="none" stroke="#a8763e" strokeWidth="3" opacity="0.8" strokeLinecap="round" />
        {/* Knots: LARGE dark blobs with a light centre dot, on the bends. */}
        <ellipse cx={ox - 6} cy="62" rx="5.5" ry="6.5" fill={WOOD_DARK} opacity="0.9" />
        <circle cx={ox - 6} cy="62" r="2.2" fill="#a8763e" opacity="0.9" />
        <ellipse cx={handRx + 5} cy="124" rx="5.5" ry="6.5" fill={WOOD_DARK} opacity="0.9" />
        <circle cx={handRx + 5} cy="124" r="2.2" fill="#a8763e" opacity="0.9" />
        {/* Bark lines: thick dark diagonals across the shaft. */}
        <path d={`M${ox - 11} 48 L${ox} 55 M${handRx - 1} 104 L${handRx + 10} 111 M${handRx - 4} 134 L${handRx + 7} 141`} fill="none" stroke={WOOD_DARK} strokeWidth="4" opacity="0.75" strokeLinecap="round" />
        {/* Carved gold rings: thick bands across the shaft. */}
        <path d={`M${handRx - 2} 76 L${handRx + 12} 76 M${handRx - 1} 112 L${handRx + 13} 112`} stroke={GOLD} strokeWidth="5" strokeLinecap="round" />
        {/* Forked crook: big rounded knob, then a wide wood cup under
            the orb. The cup is drawn BEFORE the orb, so the orb sits
            in it. */}
        <circle cx={ox} cy="40" r="6.5" fill={WOOD} stroke={WOOD_DARK} strokeWidth="2" />
        <path d={`M${ox - 11} 32 Q${ox} 42 ${ox + 11} 32 L${ox + 9} 38 Q${ox} 44 ${ox - 9} 38 Z`} fill={WOOD} stroke={WOOD_DARK} strokeWidth="1.5" />
        {/* Orb glow, GLOW FIX (Derek, Nov 23 2:55 PM): the old disc
            was r9, opacity 0.3, drawn FIRST before the shaft, only
            0.5 units bigger than the orb — visible ring 0.25px at
            100px, and the shaft/fork/orb covered the rest, so live
            it was a flat solid blue orb. Now r18, radialGradient
            fading to transparent, drawn AFTER the shaft/fork/cup
            but BEFORE the orb, so it spills around the orb and
            between the prongs instead of hiding behind the shaft.
            It pulses (.guardian-glow-pulse) so the spill breathes;
            the orb itself stays static. */}
        <defs>
          <radialGradient id={id('glowOrb')} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={shade(glowFill, 80)} stopOpacity="1" />
            <stop offset="35%" stopColor={glowFill} stopOpacity="0.8" />
            <stop offset="70%" stopColor={glowFill} stopOpacity="0.3" />
            <stop offset="100%" stopColor={glowFill} stopOpacity="0" />
          </radialGradient>
        </defs>
        {glowDisc(ox, oy, 17, `url(#${id('glowOrb')})`, shade(glowFill, 80))}
        {/* Crystal orb, DOWN between the prongs: centre (ox,28),
            r8.5, bottom y36.5 overlaps the cup and the shaft top,
            so it is mounted, not floating. */}
        <circle cx={ox} cy={oy} r="8.5" fill={orbFill} stroke="#fff" strokeWidth="1" />
        {/* White heart kept SMALL (r2.2, not r3.5): a bigger white
            centre read at large size as a pupil, like a blue eye. */}
        <circle cx={ox} cy={oy} r="2.2" fill="#fff" opacity="0.85" />
        <circle cx={ox - 3} cy={oy - 3} r="1.4" fill="#fff" opacity="0.9" />
        {/* Rounded cup/cradle arms, drawn AFTER the orb so they are
            never hidden behind it. CONTINUOUS curved arms, not
            isolated blobs: each arm starts at the knob (ox,42) and
            curves up and out, then slightly back in, ending in a
            fully rounded tip — a tree-branch cup, NOT horns or a
            trident: no points, no spikes, no isolated eggs. V6
            (face-block fix): arms are THINNER (8 dark / 5.5 wood,
            was 10/7) and stay right of the face — left arm centre
            ~122.5 at orb height (Female), right arm centre ~150.5,
            so ~2-3 units of sky show between each arm and the orb
            and nothing crosses the face, eye, or hat brim. */}
        <path d={`M${ox} 42 Q${ox - 18} 28 ${ox - 18} 10`} fill="none" stroke={WOOD_DARK} strokeWidth="8" strokeLinecap="round" />
        <path d={`M${ox} 42 Q${ox + 20} 30 ${ox + 18} 11`} fill="none" stroke={WOOD_DARK} strokeWidth="8" strokeLinecap="round" />
        <path d={`M${ox} 42 Q${ox - 18} 28 ${ox - 18} 10`} fill="none" stroke={WOOD} strokeWidth="5.5" strokeLinecap="round" />
        <path d={`M${ox} 42 Q${ox + 20} 30 ${ox + 18} 11`} fill="none" stroke={WOOD} strokeWidth="5.5" strokeLinecap="round" />
      </g>
    );
  };
  const torsoD = isFemale
    ? `M100 46 L${f(100 + 11 * bw)} 50 L${f(100 + 13 * bw)} 74 L${f(100 + 9 * bw)} 94 L${f(100 - 9 * bw)} 94 L${f(100 - 13 * bw)} 74 L${f(100 - 11 * bw)} 50 Z`
    : `M100 46 L${f(100 + 17 * bw)} 50 L${f(100 + 19 * bw)} 76 L${f(100 + 14 * bw)} 94 L${f(100 - 14 * bw)} 94 L${f(100 - 19 * bw)} 76 L${f(100 - 17 * bw)} 50 Z`;
  const beltW = (isFemale ? 24 : 30) * bw;
  const pauldronRx = (isFemale ? 10 : 11) * bw;
  const pauldronDx = isFemale ? 13 : 18;

  // --- Hair, flat with strand lines, in the SAME coordinates as the head.
  // Head: centre (100,29), r13, top y16, sides x87/113, chin y42, brows
  // y22.5-25, eyes cy27.5. ONE anchored system for all 3 classes:
  // every hair piece starts ON the head (cap side point, or under the
  // hood / hat brim) and ends ON the shoulders — never floating, never
  // past the shoulders, never covering the face or the brows.
  // The old cap was the root bug (Derek, Nov 22 7:02 PM: "I can see the
  // arms the hair doesn't line up"): its sides ran down to y37-38 as
  // cheek tabs and its forehead arc sat at y21-24, right on the brows,
  // so short hair read as a headband/helmet and the brows vanished.
  // The new hairline ends at the temples (y31), above the eyes, and the
  // strand line sits near the crown, so the brows stay visible.
  const hairCap = (
    <g>
      <path d="M86 32 Q84 14 100 13 Q116 14 114 32 Q112 21 100 20 Q88 21 86 32 Z" fill={HAIR_C} />
      <path d="M94 17 Q100 15.5 106 17" fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.8" strokeLinecap="round" />
    </g>
  );
  // One side lock: starts ON the cap side point (86,31)/(114,31), hugs
  // the face side, ends rounded ON the shoulder. Top overlaps the cap
  // by 2 units, so there is never a gap between hair and head.
  const sideLock = (left: boolean, endY = 57, topY = 30) => {
    const d = left
      ? `M86 ${topY} Q81 ${topY + 14} 82 ${endY} Q85 ${endY + 3} 89 ${endY - 2} Q88 ${topY + 13} 89 ${topY + 1} Z`
      : `M114 ${topY} Q119 ${topY + 14} 118 ${endY} Q115 ${endY + 3} 111 ${endY - 2} Q112 ${topY + 13} 111 ${topY + 1} Z`;
    const strand = left
      ? `M85 ${topY + 12} Q84 ${topY + 20} 85 ${endY - 2}`
      : `M115 ${topY + 12} Q116 ${topY + 20} 115 ${endY - 2}`;
    return (
      <g fill={HAIR_C}>
        <path d={d} />
        <path d={strand} fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
      </g>
    );
  };
  // LONG hair (Derek, Nov 22 9:18 PM: "The long hair looks weird").
  // History: it first read as TWO separate side locks with armour
  // showing between them (live Nov 22 9:45/9:58/10:06 PM), so a
  // broad front panel was added (v77) joining the locks down the
  // centre chest to y78 with a gem brooch in it. That fixed the
  // two-strand read — but the full health check (Nov 23 7:32 AM)
  // found the cure reads as a BEARD: a large brown mass covering
  // the chin and chest, with a blue gem in it. A solid brown bib
  // down the centre front IS a beard shape, whatever it is called.
  // The redesign (v78): NO centre panel at all. The hair frames
  // the face from the sides and falls BESIDE the torso, OVER the
  // shoulders — never down the centre front. The locks are WIDE
  // (~18 units each, not the old 9-wide straps) and connected at
  // the crown by the cap, so they do not read as two thin separate
  // strands; between them, under the chin, a small gap shows skin
  // (neck), collar clasp, and chest plate — the centre chest shows
  // ARMOUR, not hair. The chest-plate gem stays on the chest
  // plate at (100,70), where it belongs, not in the hair. Male
  // Long keeps its under-chin band (it passed live, and a bearded
  // man with long hair is expected to have hair meeting beard).
  const longHair = (topY = 30, endY = 54) => {
    const tipY = endY + 4;
    const bandTop = endY - 6;
    const bandDip = endY + 1;
    const bandBottom = endY + 1;
    const lock = (left: boolean) => {
      const d = left
        ? `M86 ${topY - 1} Q79 ${topY + 7} 80 ${topY + 18} Q81 ${tipY - 2} 88 ${tipY} Q95 ${tipY} 97 ${tipY - 8} Q98 ${topY + 10} 91 ${topY} Z`
        : `M114 ${topY - 1} Q121 ${topY + 7} 120 ${topY + 18} Q119 ${tipY - 2} 112 ${tipY} Q105 ${tipY} 103 ${tipY - 8} Q102 ${topY + 10} 109 ${topY} Z`;
      const strand = left
        ? `M84 ${topY + 10} Q83 ${topY + 18} 85 ${tipY - 3}`
        : `M116 ${topY + 10} Q117 ${topY + 18} 115 ${tipY - 3}`;
      const strand2 = left
        ? `M91 ${topY + 12} Q91 ${topY + 20} 92 ${tipY - 4}`
        : `M109 ${topY + 12} Q109 ${topY + 20} 108 ${tipY - 4}`;
      return (
        <g fill={HAIR_C}>
          <path d={d} />
          <path d={strand} fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
          <path d={strand2} fill="none" stroke={HAIR_L} strokeWidth="1.6" opacity="0.55" strokeLinecap="round" />
        </g>
      );
    };
    return (
      <g>
        {/* Male only: the old under-chin band (Female has no centre
            panel any more — see the comment above). */}
        {!isFemale && (
          <path d={`M93 ${bandTop} Q100 ${bandDip} 107 ${bandTop} L107 ${bandBottom - 1} Q100 ${bandBottom + 1} 93 ${bandBottom - 1} Z`} fill={HAIR_C} />
        )}
        {lock(true)}
        {lock(false)}
      </g>
    );
  };
  // longLocks keeps the old call shape: Guardian/Ranger pass topY
  // only (endY = topY + 24 = 54); Spellweaver passes topY 22 AND
  // endY 54, so its locks hang to the pauldrons like the others.
  const longLocks = (topY = 30, endY = topY + 24) => longHair(topY, endY);
  // Short side locks (Bun / Topknot / ManBun / ShortBob): same anchored
  // shape, ending a little higher (y54) so they read as short, not long.
  const shortLocks = (
    <g>
      {sideLock(true, 52)}
      {sideLock(false, 52)}
    </g>
  );
  // ONE ponytail tail, on the right side only: thick (9-10 wide),
  // starting under the cap at (108,26), sweeping out to x121 and down
  // to y58 with a rounded end. Gem ties are SMALL (r3) so they read as
  // ties on the tail, not balls hiding it — the old r4.5-5 ties dwarfed
  // the thin tail and read as two blue earrings.
  const ponytailTail = (
    <g>
      <path d="M113 25 Q121 31 121 46 Q121 56 116 58 Q111 57 112 47 Q113 34 111 28 Z" fill={HAIR_C} />
      <path d="M117 36 Q118 46 117 54" fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
      <circle cx="117" cy="34" r="3" fill={gem} stroke="#fff" strokeWidth="1.2" />
      <circle cx="117" cy="55" r="3" fill={gem} stroke="#fff" strokeWidth="1.2" />
    </g>
  );
  // ONE braid, on the right side only: a solid spine from the cap side
  // (y30) to the shoulder (y57), overlapping segment circles, and
  // SMALL gem ties (r3) at the top and the end. The old braid was
  // loose circles hidden behind two big gem ties, plus a stray thin
  // lock on the left that did not match — both are gone.
  const braid = (
    <g fill={HAIR_C}>
      <path d="M112 32 Q116 44 113 57 L110 57 Q108 44 110 32 Z" />
      <circle cx="113" cy="37" r="3.8" />
      <circle cx="112" cy="43" r="3.8" />
      <circle cx="113" cy="50" r="3.8" />
      <circle cx="113" cy="56" r="3.5" />
      <path d="M109 41 L116 41 M109 48 L116 48 M109 55 L116 55" fill="none" stroke={HAIR_L} strokeWidth="1.6" opacity="0.8" strokeLinecap="round" />
      <circle cx="113" cy="58" r="3" fill={gem} stroke="#fff" strokeWidth="1.2" />
    </g>
  );
  // Curly: one connected cloud, not detached balls. Top circles overlap
  // the head by 3-4 units and each other; side curls overlap the face
  // side; bridge curls join the top to the lower curls, which rest ON
  // the pauldrons. The old side balls at (85,35)/(115,35) and chest
  // balls at (86,50)/(114,50) floated with visible gaps.
  const curlyTop = (
    <g fill={HAIR_C}>
      <circle cx="90" cy="20" r="6" />
      <circle cx="100" cy="17" r="6.5" />
      <circle cx="110" cy="20" r="6" />
      <circle cx="86" cy="27" r="5" />
      <circle cx="114" cy="27" r="5" />
      <path d="M91 23 Q95 20 100 23 M104 23 Q109 20 113 23" fill="none" stroke={HAIR_L} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  );
  const curlySides = (
    <g fill={HAIR_C}>
      <circle cx="86" cy="36" r="5.5" />
      <circle cx="114" cy="36" r="5.5" />
      <circle cx="85" cy="44" r="4.5" />
      <circle cx="115" cy="44" r="4.5" />
      <circle cx="87" cy="52" r="4.5" />
      <circle cx="113" cy="52" r="4.5" />
    </g>
  );
  // A knot that sits INTO what is below it (cap top y13, hood top y15,
  // hat cone): centre y11, r7.5, so its bottom overlaps by ~4 units
  // instead of balancing on top like a pom-pom.
  const knot = (withGemBand: boolean) => (
    <g fill={HAIR_C}>
      <circle cx="100" cy="11" r="7.5" />
      <path d="M94 8 Q100 5 106 8" fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.8" strokeLinecap="round" />
      {withGemBand && <path d="M93 14 Q100 11 107 14" fill="none" stroke={gem} strokeWidth="3" strokeLinecap="round" />}
    </g>
  );
  const buzzCap = (
    <g>
      <path d="M86 30 Q85 15 100 14 Q115 15 114 30 Q112 23 100 22 Q88 23 86 30 Z" fill={HAIR_C} />
      <path d="M95 17 Q100 16 105 17" fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.8" strokeLinecap="round" />
    </g>
  );
  const hairArt = isFemale ? (
    <g>
      {hair === 'Curly' ? curlyTop : hairCap}
      {hair === 'Long' && <path d="M100 14.5 L100 18.5" stroke={SKIN} strokeWidth="1.2" strokeLinecap="round" />}
      {hair === 'Bun' && knot(false)}
      {hair === 'Topknot' && knot(true)}
    </g>
  ) : hair === 'Bald' ? (
    <g>
      <ellipse cx="97" cy="22" rx="5.5" ry="1.8" fill="#fff" opacity="0.25" />
    </g>
  ) : (
    <g>
      {/* Short / Long / ManBun share the new cap: sides end at the
          temples, brows stay visible. Buzz gets its own tighter cap —
          higher hairline, shorter sides — so it reads as a buzz cut
          next to Short instead of being identical to it. */}
      {hair === 'Curly' ? curlyTop : hair === 'Buzz' ? buzzCap : hairCap}
      {hair === 'Long' && <path d="M100 14.5 L100 18.5" stroke={SKIN} strokeWidth="1.2" strokeLinecap="round" />}
      {hair === 'ManBun' && knot(true)}
    </g>
  );

  // Hanging hair, drawn AFTER the pauldrons (in front of the armour),
  // so long hair falls over the shoulders like the reference sheets.
  const hangingHair = isFemale ? (
    <g>
      {hair === 'Long' && longLocks()}
      {hair === 'Ponytail' && ponytailTail}
      {hair === 'Bun' && shortLocks}
      {hair === 'Curly' && curlySides}
      {hair === 'Braided' && braid}
      {hair === 'ShortBob' && (<g>{sideLock(true, 48)}{sideLock(false, 48)}</g>)}
      {hair === 'Topknot' && shortLocks}
    </g>
  ) : (
    <g>
      {hair === 'Long' && longLocks()}
      {hair === 'Curly' && curlySides}
      {hair === 'ManBun' && shortLocks}
    </g>
  );

  // RANGER HAIR (Derek, Nov 23 6:44 PM: "Ranger needs touch ups:
  // eyebrows, hair"). Measured in the renders: the shared Long locks
  // are 18-wide brown curtains (x79-97 / 103-121, y29-58) covering
  // the cheeks and hanging to the chest, so the face is a narrow
  // pale oval squeezed between two brown slabs; the Ponytail gem
  // ties (r3 + white ring) read as a blue eyeball on the tail; the
  // Braid is a short brown stub on the shoulder; Curly sides are two
  // big brown pom-poms (r5.5 at cx86/114) sitting ON the jaw; and
  // the hood's inner opening (x90-110) pinches the face. Ranger-only
  // versions, all moved OUTWARD so the inner edge stays at x89/110,
  // clear of the face edge (x87/113): narrower locks, smaller gem
  // ties, smaller curls, and a wider hood opening (x88-112).
  // Male Long gets NO under-chin band here — the shared band merges
  // with the beard into a bib (see the Ranger beard below).
  const rangerLongLocks = (
    <g fill={HAIR_C}>
      <path d="M87 30 Q78 38 79 50 Q80 57 87 57 Q90 50 90 38 Q90 31 87 30 Z" />
      <path d="M113 30 Q122 38 121 50 Q120 57 113 57 Q110 50 110 38 Q110 31 113 30 Z" />
      <path d="M84 40 Q84 48 85 54 M116 40 Q116 48 115 54" fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
    </g>
  );
  const rangerSideLock = (left: boolean) => (
    <g fill={HAIR_C}>
      {left ? (
        <path d="M87 31 Q80 38 80 48 Q81 53 87 52 Q89 44 89 36 Z" />
      ) : (
        <path d="M113 31 Q120 38 120 48 Q119 53 113 52 Q111 44 111 36 Z" />
      )}
    </g>
  );
  const rangerCurlySides = (
    <g fill={HAIR_C}>
      <circle cx="82" cy="36" r="4.5" />
      <circle cx="118" cy="36" r="4.5" />
      <circle cx="81" cy="44" r="4" />
      <circle cx="119" cy="44" r="4" />
      <circle cx="83" cy="52" r="4" />
      <circle cx="117" cy="52" r="4" />
    </g>
  );
  const rangerPonytailTail = (
    <g>
      <path d="M114 25 Q120 31 120 46 Q120 56 116 58 Q112 57 113 47 Q113 34 112 28 Z" fill={HAIR_C} />
      <path d="M117 36 Q118 46 117 54" fill="none" stroke={HAIR_L} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
      <circle cx="117" cy="34" r="2" fill={gem} stroke="#fff" strokeWidth="0.8" />
      <circle cx="117" cy="55" r="2" fill={gem} stroke="#fff" strokeWidth="0.8" />
    </g>
  );
  const rangerBraid = (
    <g fill={HAIR_C}>
      <path d="M114 32 Q118 44 116 58 L113 58 Q111 44 113 32 Z" />
      <circle cx="116" cy="37" r="3.2" />
      <circle cx="115" cy="43" r="3.2" />
      <circle cx="116" cy="50" r="3.2" />
      <circle cx="116" cy="56" r="3" />
      <path d="M113 41 L119 41 M113 48 L119 48 M113 55 L119 55" fill="none" stroke={HAIR_L} strokeWidth="1.6" opacity="0.8" strokeLinecap="round" />
      <circle cx="116" cy="59" r="2.5" fill={gem} stroke="#fff" strokeWidth="1" />
    </g>
  );
  // Ranger hood: the hood frames the face, so only the bits that peek out
  // are drawn — side locks, a braid, a bob, curls, or a knot poking above
  // the hood. Buzz / Short / Bald show nothing extra.
  const hoodHair = (
    <g>
      <path d="M85 46 Q80 15 100 15 Q120 15 115 46 L112 36 Q110 20 100 20 Q90 20 88 36 Z" fill={capeMain} stroke={dark} strokeWidth="2.5" />
      <path d="M91 23 Q95 20 100 20" fill="none" stroke={light} strokeWidth="2" opacity="0.6" strokeLinecap="round" />
      {isFemale && hair === 'Long' && rangerLongLocks}
      {isFemale && hair === 'Ponytail' && rangerPonytailTail}
      {isFemale && hair === 'Bun' && (
        <g>
          {knot(false)}
          {rangerSideLock(true)}
          {rangerSideLock(false)}
        </g>
      )}
      {isFemale && hair === 'Curly' && rangerCurlySides}
      {isFemale && hair === 'Braided' && rangerBraid}
      {isFemale && hair === 'ShortBob' && (<g>{rangerSideLock(true)}{rangerSideLock(false)}</g>)}
      {isFemale && hair === 'Topknot' && (
        <g>
          {knot(true)}
          {rangerSideLock(true)}
          {rangerSideLock(false)}
        </g>
      )}
      {!isFemale && hair === 'Curly' && rangerCurlySides}
      {!isFemale && hair === 'Long' && rangerLongLocks}
      {!isFemale && hair === 'ManBun' && (
        <g>
          {knot(true)}
          {rangerSideLock(true)}
          {rangerSideLock(false)}
        </g>
      )}
    </g>
  );

  // Spellweaver hair: the old code drew hairArt as null for this class,
  // so EVERY Spellweaver hairstyle rendered the same bald face under
  // the hat (Long, Braided and Bun shared one image hash). Hair is
  // drawn BEFORE the hat, so the locks start tucked under the brim
  // (topY 22, on the brim edge). The knot is NOT drawn here: a knot
  // behind the cone would only peek out as two bumps flanking it — it
  // is drawn after the hat instead (knotOnHat, below), perched on the
  // cone tip where it reads as one bun.
  const spellweaverHair = (
    <g>
      {hair === 'Long' && longLocks(22, 54)}
      {hair === 'Ponytail' && ponytailTail}
      {hair === 'Braided' && braid}
      {hair === 'Curly' && curlySides}
      {hair === 'ShortBob' && (
        <g>
          {sideLock(true, 48, 22)}
          {sideLock(false, 48, 22)}
        </g>
      )}
      {(hair === 'Bun' || hair === 'Topknot' || hair === 'ManBun') && (
        <g>
          {sideLock(true, 48, 22)}
          {sideLock(false, 48, 22)}
        </g>
      )}
    </g>
  );
  // Bun / Topknot / ManBun under a wizard hat: one knot perched on the
  // cone tip (drawn AFTER the hat), overlapping it by ~3.5 units.
  // Cone tip is at (101,-4), so the knot centre is (101,-6).
  const knotOnHat = (
    <g fill={HAIR_C}>
      <circle cx="101" cy="-6" r="5.5" />
      <path d="M97 -8 Q101 -10 105 -8" fill="none" stroke={HAIR_L} strokeWidth="1.8" opacity="0.8" strokeLinecap="round" />
      {(hair === 'Topknot' || hair === 'ManBun') && <path d="M96 -3 Q101 -5 106 -3" fill="none" stroke={gem} strokeWidth="2.5" strokeLinecap="round" />}
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
          {/* GLOW (Derek, Nov 23 2:55 PM: fix the glow — live Nov 23
              11:30 AM it was flat everywhere, no glow, no pulse.
              Diagnosis: the chest diamond was drawn BEFORE the chest
              plate, which painted over it; the orb glow disc was
              r9, only 0.5 units bigger than the orb, drawn FIRST so
              the shaft/fork/orb covered it; shield/sword/arrow
              "glows" were same-colour flat discs, no gradient, no
              lighter colour. These gradients are the real glow,
              copied from CompanionAvatar's radialGradient aura
              (stops 0.85 -> 0.35 -> 0): bright light centre fading
              to transparent, so the spill reads as light, not a
              solid disc. glowGem = the picked gem colour, glowTier
              = the equipped piece's tier colour. NO permanent halo
              / aura ring around the whole figure — glow stays
              per-gem, contextual, per Derek Nov 22. */}
          <radialGradient id={id('glowGem')} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={gemLight} stopOpacity="1" />
            <stop offset="35%" stopColor={gemLight} stopOpacity="0.8" />
            <stop offset="70%" stopColor={gem} stopOpacity="0.3" />
            <stop offset="100%" stopColor={gem} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id('glowTier')} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={shade(weaponTier ?? gemLight, 80)} stopOpacity="1" />
            <stop offset="35%" stopColor={weaponTier ?? gem} stopOpacity="0.8" />
            <stop offset="70%" stopColor={weaponTier ?? gem} stopOpacity="0.3" />
            <stop offset="100%" stopColor={weaponTier ?? gem} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Flat background scene, clipped to the rounded frame */}
        <g clipPath={`url(#${id('frame')})`}>
          <rect x="0" y="0" width="200" height="200" fill={sceneBg} />
          {sceneArt}
        </g>
        {/* Thin gold frame, the one epic touch kept: flat, clean, reads at any size */}
        <rect x="2" y="2" width="196" height="196" rx="16" fill="none" stroke={GOLD} strokeWidth="3" opacity="0.8" />
        {/* Ground shadow */}
        <ellipse className="guardian-shadow" cx="100" cy="172" rx={g.classId === 'Guardian' ? 56 : 44} ry="6" fill="#124571" opacity="0.18" />

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
              <path d="M100 48 L124 58 L121 108 Q100 116 79 108 L76 58 Z" fill={capeMain} stroke={capeDark} strokeWidth="2" opacity="0.96" />
              <path d="M86 64 Q84 88 86 106" fill="none" stroke={capeDark} strokeWidth="2" opacity="0.6" />
              <path d="M114 64 Q116 88 114 106" fill="none" stroke={capeDark} strokeWidth="2" opacity="0.6" />
              <path d="M100 58 Q100 88 100 110" fill="none" stroke={capeDark} strokeWidth="1.5" opacity="0.4" />
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
          {/* Belt: drawn AFTER the legs and the Spellweaver robe (see
              below), so it sits ON TOP of them at the waist — the legs
              used to be drawn after the belt and covered its bottom
              3 units, so the legs read as being over the belt
              (Derek, Nov 23 1:12 PM). */}
          {/* Glowing gem on chest: MOVED (GLOW FIX, Derek Nov 23
              2:55 PM) — this diamond used to be drawn here, BEFORE
              the legs/neck/arms, and the Guardian chest plate
              (opacity 0.95, drawn ~200 lines later) painted straight
              over it, so live there was no diamond at all, only the
              plate's tiny r4 circle with no glow. The gem now lives
              after the chest plate (see below): a glow disc + gem
              for Guardian, and the diamond + glow for Ranger /
              Spellweaver, whose torso has no plate to cover it. */}
          {/* Legs, with a shade strip and a knee band each, so they read
              as armoured legs, not plain sticks (Derek's screenshot:
              long plain red rectangles, no knees, no shading). */}
          {/* POSE: Ranger legs widen 1.12x about centre 100, Spellweaver
              1; Guardian legs are ANGLED trapezoids (see legSpread
              comment above), not scaled — y untouched, feet stay on
              the ground, belt (drawn after, not in this group) still
              covers the leg tops. */}
          <g transform={legSpread !== 1 ? `translate(100 0) scale(${legSpread} 1) translate(-100 0)` : undefined}>
          {g.classId === 'Guardian' ? (
            <>
              <path d={isFemale ? 'M89 94 L79 142 L89 142 L95 94 Z' : 'M87 94 L77 142 L88 142 L97 94 Z'} fill={legMain} stroke={legDark} strokeWidth="1.5" />
              <path d={isFemale ? 'M105 94 L111 142 L121 142 L111 94 Z' : 'M103 94 L112 142 L123 142 L113 94 Z'} fill={legMain} stroke={legDark} strokeWidth="1.5" />
              <path d={isFemale ? 'M92 96 L84 140 L87 140 L95 96 Z' : 'M91 96 L82 140 L85 140 L94 96 Z'} fill="#000" opacity="0.14" />
              <path d={isFemale ? 'M108 96 L116 140 L113 140 L105 96 Z' : 'M109 96 L117 140 L114 140 L106 96 Z'} fill="#000" opacity="0.14" />
              <path d={isFemale ? 'M84 120 L91 120 M109 120 L116 120' : 'M82 120 L92 120 M108 120 L118 120'} fill="none" stroke={legDark} strokeWidth="2.5" opacity="0.85" strokeLinecap="round" />
              <ellipse cx={isFemale ? 84 : 82.5} cy="148" rx="10" ry="4.5" fill={BOOT} transform={`rotate(-10 ${isFemale ? 84 : 82.5} 148)`} />
              <ellipse cx={isFemale ? 116 : 117.5} cy="148" rx="10" ry="4.5" fill={BOOT} transform={`rotate(10 ${isFemale ? 116 : 117.5} 148)`} />
              <g transform={`rotate(-10 ${isFemale ? 84 : 82.5} 148)`}>
                <path d={`M${(isFemale ? 84 : 82.5) - 8} 145 L${(isFemale ? 84 : 82.5) + 8} 145`} stroke="#d9a441" strokeWidth="3" opacity="1" />
                <path d={`M${(isFemale ? 84 : 82.5) - 8} 150 L${(isFemale ? 84 : 82.5) + 8} 150`} stroke="#d9a441" strokeWidth="2.5" opacity="0.9" />
              </g>
              <g transform={`rotate(10 ${isFemale ? 116 : 117.5} 148)`}>
                <path d={`M${(isFemale ? 116 : 117.5) - 8} 145 L${(isFemale ? 116 : 117.5) + 8} 145`} stroke="#d9a441" strokeWidth="3" opacity="1" />
                <path d={`M${(isFemale ? 116 : 117.5) - 8} 150 L${(isFemale ? 116 : 117.5) + 8} 150`} stroke="#d9a441" strokeWidth="2.5" opacity="0.9" />
              </g>
            </>
          ) : (
            <>
          <path d={isFemale ? 'M89 94 L88 142 L95 142 L95 94 Z' : 'M87 94 L86 142 L97 142 L97 94 Z'} fill={legMain} stroke={legDark} strokeWidth="1.5" />
          <path d={isFemale ? 'M105 94 L105 142 L112 142 L111 94 Z' : 'M103 94 L103 142 L114 142 L113 94 Z'} fill={legMain} stroke={legDark} strokeWidth="1.5" />
          <rect x={isFemale ? 92 : 94} y="96" width="3" height="44" fill="#000" opacity="0.14" />
          <rect x={isFemale ? 109 : 111} y="96" width="3" height="44" fill="#000" opacity="0.14" />
          <path d={isFemale ? 'M88.5 120 L95 120 M105 120 L111.5 120' : 'M86.5 120 L97 120 M103 120 L113.5 120'} fill="none" stroke={legDark} strokeWidth="2.5" opacity="0.85" strokeLinecap="round" />
          {/* RANGER BOOTS (Derek, Nov 23 6:44 PM: "the feet look
              weird"): the shared boots are flat brown ellipses
              (rx10, ry4.5) with TWO thick gold straps each — at
              large size they read as one long gold/brown plank
              across both feet, legs ending flat with no ankle or
              toe, and the two boots touching in the middle. Ranger-
              only: each boot is a foot-shaped rounded rect (12
              wide, y142-152) with a toe pointing outward, a dark
              sole line at y150, ONE gold strap at y145, and a clear
              gap between the boots. Guardian / Spellweaver keep
              the shared ellipses + straps. */}
          {isRanger ? (
            <g>
              {/* BIGGER FIXES (Nov 23 10:12 PM): the Ranger boot gap
                  was 4 units (1.9px at 96px) — one plank live. Now
                  the boots are 12 units apart (5.8px at 96px, 6.4px
                  after the 1.12x leg scale): left x78-94, right
                  x106-122, and the single gold strap (10 wide) is
                  shorter than the boot (16 wide) so gold never
                  bridges the gap. */}
              <path d="M80 142 L92 142 Q94 142 94 146 L94 149 Q94 152 90 152 L82 152 Q78 152 78 149 L78 146 Q78 142 80 142 Z" fill={BOOT} stroke={shade(BOOT, -20)} strokeWidth="1.5" />
              <path d="M108 142 L120 142 Q122 142 122 146 L122 149 Q122 152 118 152 L110 152 Q106 152 106 149 L106 146 Q106 142 108 142 Z" fill={BOOT} stroke={shade(BOOT, -20)} strokeWidth="1.5" />
              <path d="M78 150 L94 150 M106 150 L122 150" stroke="#1e1206" strokeWidth="1.5" opacity="0.8" />
              <path d="M81 145 L91 145 M109 145 L119 145" stroke="#d9a441" strokeWidth="2.5" opacity="1" />
            </g>
          ) : (
            <g>
              <ellipse cx="91" cy="148" rx="10" ry="4.5" fill={BOOT} />
              <ellipse cx="109" cy="148" rx="10" ry="4.5" fill={BOOT} />
              {/* Boot straps, BOLD and bright — the old thin tan lines were
                  invisible at preview size live. */}
              <path d="M83 145 L99 145 M101 145 L117 145" stroke="#d9a441" strokeWidth="3" opacity="1" />
              <path d="M83 150 L99 150 M101 150 L117 150" stroke="#d9a441" strokeWidth="2.5" opacity="0.9" />
            </g>
          )}
            </>
          )}
          </g>
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
          {/* Belt with buckle and studs — AFTER the legs, boots and
              Spellweaver robe, so the full gold belt reads across the
              waist and the legs start BELOW it, never over it. */}
          <rect x={100 - beltW / 2} y="88" width={beltW} height="9" rx="4.5" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.5" />
          <rect x="94" y="89" width="12" height="7" rx="2" fill="#fffdf4" stroke={GOLD_DARK} strokeWidth="1.5" />
          <circle cx={100 - beltW / 2 + 5} cy="92.5" r="1.5" fill={GOLD_DARK} />
          <circle cx={100 + beltW / 2 - 5} cy="92.5" r="1.5" fill={GOLD_DARK} />
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
          {!helmEquipped && (g.classId === 'Ranger' ? hoodHair : g.classId === 'Spellweaver' ? spellweaverHair : hairArt)}
          {/* (helm: hair / hood / hat are skipped when a helm is
              equipped — see the fullHelmet block before {faceArt}.) */}
          {/* Spellweaver hat: a tall pointed wizard hat in a LIGHT fill
              (shade +100), so it reads against the steel-blue night sky.
              Derek, Nov 23 4:27 PM: "The spell weaver hat looks weird".
              What was weird (measured in the renders): the old cone was
              OFF-CENTRE and squat — its base ran x81-103 (centre ~92,
              8 units left of the brim centre 100), so the right half
              of the brim was bare and the cone read as a small floppy
              sock/beret perched on one side of a wide flat disc, not
              a wizard hat; it was only 18 tall against a 40-wide brim.
              The tip was a small rightward hook with a dent below it
              (Q101 13) that read as a knuckle/waist, and the white
              highlight ran as a straight strap along the left edge.
              The gem sat dead-centre ON the flat brim (r3.5 at 100,16)
              and read as a big blue button/eye on the forehead.
              New hat: a SYMMETRICAL cone, base x82-118 (centred on
              the brim), 22 tall, soft pointed tip at (101,-4) with a
              slight kink for the point, no hook, no dent, no waist.
              A gold band across the cone base carries the gem as a
              small buckle jewel (r2.8, on gold, not on the brim), and
              the dark arc line across the brim is gone, so the brim
              reads as one clean brim, not a second disc. Brim bottom
              stays y22.5, just above the brows (y22.5-25). Brim
              widened (Derek, Nov 23 6:44 PM: "make the brim bigger"):
              rx20 -> rx26, 52 wide, ends x74/126, extending past the
              hair on both sides; cone, gold band and gem unchanged.
              BIGGER FIXES (Derek, Nov 23 10:12 PM, diagnosis Nov 23
              10:11 PM): rx26 read as the cone's base live, not a
              flap - at 96px the visible flaps were only ~3.8px wide
              each, tapering to ~1.6px, in the SAME light blue as the
              cone, so there was no edge contrast. Now rx33, ry7,
              cy15.5 (bottom y22.5, still just above the brows
              y22.5-25, no face cover): each flap is 15 units wide
              past the cone base (x67-82 / x118-133, ~7px at 96px)
              and ~8-10 units tall mid-flap (~4-5px), and the brim
              is a shade DARKER than the cone (shade +70 vs +100)
              with a thicker outline (2.5), so it reads as a
              separate wide brim. The staff now clears it (see
              wizardStaff: ox handRx+24, pose rotate +8). */}
          {!helmEquipped && g.classId === 'Spellweaver' && (
            <g>
              <path d="M82 18 C85 9 92 0 101 -4 C110 -1 115 8 118 18 Z" fill={light} stroke={dark} strokeWidth="2" strokeLinejoin="round" />
              <path d="M88 13 Q94 6 99 1" fill="none" stroke="#fff" strokeWidth="2" opacity="0.55" strokeLinecap="round" />
              <ellipse cx="100" cy="15.5" rx="33" ry="7" fill={shade(main, 70)} stroke={dark} strokeWidth="2.5" />
              <path d="M85 13.5 Q100 11 115 13.5 L115 18 L85 18 Z" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1" />
              <circle cx="100" cy="15.5" r="2.8" fill={gem} stroke="#fff" strokeWidth="1" />
            </g>
          )}
        {!helmEquipped && g.classId === 'Spellweaver' && (hair === 'Bun' || hair === 'Topknot' || hair === 'ManBun') && knotOnHat}
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
              {/* RANGER BEARD (Derek, Nov 23 6:44 PM: "the beard isn't
                  on the face"): the shared beard is a wide flat band
                  (x91-109, y37-44.5) below the mouth, reading as a
                  separate brown collar strap, and on Male Long it
                  merges with the under-chin hair band into a bib.
                  Ranger-only: narrower (x93-107, 14 wide), top edge
                  following the jaw curve up at the corners (y37.5)
                  so it hugs the chin, bottom y43.5 (1.5 below the
                  chin), skin showing at both jaw corners, mouth
                  clear, two short texture lines only. */}
              {isRanger ? (
                <>
                  {/* BIGGER FIXES (Nov 23 10:12 PM): the Ranger beard
                      was 14 wide with a 1-unit outline, in #40260f
                      against #5b3a1e locks — at 96px beard + locks +
                      jaw merged into one brown lower-face band. Now
                      the outline is 2.2 units of dark #2e1a08 (light
                      tan rim on dark skin, via beardStroke) and the
                      beard is narrowed to 12 wide (x94-106), leaving
                      a 4-unit skin gap to the locks' inner edge
                      (x90/110), so the beard reads as a separate
                      chin crescent, not part of the hair. */}
                  <path d="M94 37.5 Q93 42 100 43.5 Q107 42 106 37.5 Q104 39.5 100 39.5 Q96 39.5 94 37.5 Z" stroke={beardStroke} strokeWidth="2.2" />
                  <path d="M97 40.5 L97 42.5 M103 40.5 L103 42.5" fill="none" stroke={HAIR_L} strokeWidth="1.6" opacity="0.9" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <path d="M91 37 Q89.5 43 100 44.5 Q110.5 43 109 37 Q105 39.5 100 39.5 Q95 39.5 91 37 Z" stroke={beardStroke} strokeWidth="1" />
                  <path d="M95 40.5 L95 43.2 M98.5 40.5 L98.5 43.5 M101.5 40.5 L101.5 43.5 M105 40.5 L105 43.2" fill="none" stroke={HAIR_L} strokeWidth="1.6" opacity="0.9" strokeLinecap="round" />
                </>
              )}
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
          {/* FULL HELMET (Derek, Nov 23 10:18 PM): when a helm is
              equipped, a real helmet covers the crown and hair —
              not the old thin band. Drawn AFTER the head, hair
              (suppressed), hood/hat (suppressed) and beard, and
              BEFORE {faceArt}, so brows, eyes and mouth are drawn
              on top and stay visible. Geometry, head centre
              (100,29) r13, brows y22.5-25, eyes cy27.5/29: the dome
              top is y3, its bottom edge arches UP to y20.5 at the
              centre (above the brows) and down to y28 at the
              temples (x84/116, covering the hairline and side
              hair). A tier-coloured brow band sits at y17-22,
              above the brows; a steel nose guard runs down the
              centre (x98.5-101.5, y20-33) between the eyes,
              stopping above the mouth (y34.5); a tier gem sits on
              the dome at (100,11). Cheek guards run down the face
              sides (x83-88 / 112-117, y26-32), outside the face
              edge (x87/113). Beard (chin y37-44.5) is below the
              helmet and stays visible. The Level 10+ crown, drawn
              just above, is covered by the dome when a helm is
              equipped. All 3 classes get the same helmet — the
              hood and hat are replaced by it, not worn under it. */}
          {helmEquipped && equipTier && (
            <g>
              <path d="M84 28 Q83 4 100 3 Q117 4 116 28 Q108 20.5 100 20.5 Q92 20.5 84 28 Z" fill={STEEL} stroke={dark} strokeWidth="2" />
              <path d="M100 5 L100 19" fill="none" stroke={STEEL_DARK} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M90 10 Q94 6 98 5" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
              <path d="M87 22 Q100 17 113 22 L113 19 Q100 14 87 19 Z" fill={equipTier} stroke="#fff" strokeWidth="1" />
              <path d="M84 26 L88 26 L88 32 Q84 32 84 26 Z" fill={STEEL} stroke={dark} strokeWidth="1.5" />
              <path d="M116 26 L112 26 L112 32 Q116 32 116 26 Z" fill={STEEL} stroke={dark} strokeWidth="1.5" />
              <rect x="98.5" y="20" width="3" height="13" rx="1.5" fill={STEEL} stroke={dark} strokeWidth="1" />
              <circle cx="100" cy="11" r="2.6" fill={gem} stroke="#fff" strokeWidth="1" />
            </g>
          )}
          {faceArt}
          {/* Arms, drawn AFTER the torso and chest, BEFORE the
              pauldrons and weapons: WIDE SLEEVES in a lighter shade
              of the arm colour, so shoulder, arm and hand read as
              ONE connected limb, never floating circles at the waist.
              (Derek, Nov 23 7:37 AM: "The arms also don't connect
              to the body properly on two of the classes." Diagnosis
              in the renders: Ranger and Spellweaver. The old arms
              were thin (~7-9 units) dark strips in armMain, the
              same Navy as the torso/robe, with no pauldron to cover
              the joint — they read as seams, and the hands floated.
              Guardian only read connected because its steel
              pauldrons covered the arm tops. The new sleeves are
              ~13 units wide, stick out past the torso silhouette
              against the background, and are filled lighter than
              the torso so they separate from it on every class.
              SLEEVE CAPS REMOVED (Derek, Nov 23 4:27 PM: "The arms
              have weird circles on it too"): the old design put a
              standalone ellipse at each shoulder (Female (86/114,50)
              rx7.5, Male (84/116,50) rx8, full dark outline ring) on
              top of the sleeve — at large size it read as two big
              blue "ears" / discs flanking the neck on Ranger and
              Spellweaver (no pauldrons to cover them), and as light
              lobes peeking above the pauldrons on Guardian. The
              shoulder is now part of the sleeve itself: each sleeve
              is ONE closed path whose top is a rounded dome (peak
              ~y47) that runs straight into the outer and inner
              edges — no separate disc, no closed ring inside the
              arm, so nothing on the arm reads as a circle. The
              pauldrons (drawn next) cover the domes on Guardian;
              the hands (drawn last) cover the arm bottoms — so the
              joint and the grip both read.) */}
          {isFemale ? (
            <g>
              {g.classId === 'Spellweaver' ? (
                <path d="M95 52 Q88 42 79 54 Q72 58 71 62 L79 68 Q86 60 95 52 Z" fill={armLight} stroke={armDark} strokeWidth="2" />
              ) : rangerBowRaised ? (
                <path d="M95 52 Q86 44 78 52 Q72 56 74 62 L84 64 Q88 58 95 52 Z" fill={armLight} stroke={armDark} strokeWidth="2" />
              ) : (
                <path d="M95 52 Q88 42 79 54 Q74 68 74 88 L84 89 Q87 72 95 52 Z" fill={armLight} stroke={armDark} strokeWidth="2" />
              )}
              {rangerBowRaised ? (
                <path d="M105 52 Q114 44 122 52 Q128 56 126 62 L116 64 Q112 58 105 52 Z" fill={armLight} stroke={armDark} strokeWidth="2" />
              ) : (
                <path d="M105 52 Q112 42 121 54 Q126 68 126 88 L116 89 Q113 72 105 52 Z" fill={armLight} stroke={armDark} strokeWidth="2" />
              )}
              <path d="M80 56 Q77 66 77 84" fill="none" stroke="#fff" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
              <path d="M120 56 Q123 66 123 84" fill="none" stroke="#fff" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
            </g>
          ) : (
            <g>
              {g.classId === 'Spellweaver' ? (
                <path d="M92 52 Q84 41 76 54 Q68 58 66 62 L74 68 Q84 60 92 52 Z" fill={armLight} stroke={armDark} strokeWidth="2" />
              ) : rangerBowRaised ? (
                <path d="M92 52 Q84 41 76 54 Q68 58 70 62 L80 64 Q84 58 92 52 Z" fill={armLight} stroke={armDark} strokeWidth="2" />
              ) : (
                <path d="M92 52 Q84 41 76 54 Q70 68 70 88 L80 89 Q83 72 92 52 Z" fill={armLight} stroke={armDark} strokeWidth="2" />
              )}
              {rangerBowRaised ? (
                <path d="M108 52 Q116 41 124 54 Q130 58 128 62 L118 64 Q114 58 108 52 Z" fill={armLight} stroke={armDark} strokeWidth="2" />
              ) : (
                <path d="M108 52 Q116 41 124 54 Q130 68 130 88 L120 89 Q117 72 108 52 Z" fill={armLight} stroke={armDark} strokeWidth="2" />
              )}
              <path d="M76 56 Q73 66 73 84" fill="none" stroke="#fff" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
              <path d="M124 56 Q127 66 127 84" fill="none" stroke="#fff" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
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
              <ellipse cx={100 - pauldronDx} cy="52" rx={pauldronRx} ry={isFemale ? 7.5 : 8} fill={equipTier ?? STEEL} stroke={dark} strokeWidth="2" />
              <ellipse cx={100 + pauldronDx} cy="52" rx={pauldronRx} ry={isFemale ? 7.5 : 8} fill={equipTier ?? STEEL} stroke={dark} strokeWidth="2" />
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
              {/* Chest gem GLOW (GLOW FIX, Derek Nov 23 2:55 PM):
                  r18 radialGradient disc drawn AFTER the plate, so
                  the plate can no longer cover it — it spills past
                  the plate edges onto the torso/background. It
                  pulses (.guardian-glow-pulse); the gem itself is
                  static. The old plate gem had no glow disc at all. */}
              {glowDisc(100, 70, 15, `url(#${id('glowGem')})`, gemLight)}
              <circle cx="100" cy="70" r="4" fill={gem} stroke="#fff" strokeWidth="1.5" />
            </g>
          )}
          {/* Chest gem for Ranger / Spellweaver (no plate): the flat
              diamond with a white facet, drawn AFTER the torso so
              nothing covers it, with the same r18 glow disc behind
              it. Guardian already has the plate gem above, so it
              does not get a second gem here. */}
          {g.classId !== 'Guardian' && (
            <g>
              {glowDisc(100, 71, 15, `url(#${id('glowGem')})`, gemLight)}
              <polygon points="100,62 109,71 100,80 91,71" fill={gem} stroke="#fff" strokeWidth="2" />
              <polygon points="100,66 104,71 100,76 96,71" fill="#fff" opacity="0.55" />
            </g>
          )}
          {/* Hanging hair in front of the armour (Guardian only — the
              Ranger hood and Spellweaver hat have no pauldrons to
              swallow them, so their hair stays in the early block). */}
          {g.classId === 'Guardian' && !helmEquipped && hangingHair}
          {/* Ranger quiver strap, diagonal across the chest */}
          {g.classId === 'Ranger' && (
            <path d="M84 58 L116 88" fill="none" stroke={WOOD_DARK} strokeWidth="4" opacity="0.7" strokeLinecap="round" />
          )}
          {/* Equipped armor: a tier-coloured trim band across the chest
              (always, so any equipped piece reads at 56px), a tier glow
              behind the chest gem for Legendary/Mythical, and one
              kind-specific piece — helm band, crown points, chest tint,
              boot bands, or cape edge. Drawn before the weapons so the
              hands and weapons stay on top. */}
          {equippedArmor && equipTier && (
            <g>
              <path d="M88 58 L112 58 L112 64 L88 64 Z" fill={equipTier} stroke="#fff" strokeWidth="1" opacity="0.95" />
              <circle cx="100" cy="61" r="3" fill="#fff" stroke={equipTier} strokeWidth="1.5" />
              {(equippedArmor.tier === 'Legendary' || equippedArmor.tier === 'Mythical') && (
                glowDisc(100, 70, 18, `url(#${id('glowTier')})`, shade(weaponTier ?? gemLight, 80))
              )}
              {/* Helm: the old thin band across the crown is gone —
                  a full helmet is drawn just before {faceArt} now
                  (see fullHelmet above), so this block draws
                  nothing extra for helms. */}
              {equippedArmorKind === 'crown' && (
                <g fill={equipTier} stroke="#fff" strokeWidth="1">
                  <polygon points="88,16 92,6 96,16" />
                  <polygon points="96,16 100,4 104,16" />
                  <polygon points="104,16 108,6 112,16" />
                </g>
              )}
              {equippedArmorKind === 'chest' && (
                <path d="M90 50 L110 50 L112 68 L100 78 L88 68 Z" fill={equipTier} stroke="#fff" strokeWidth="1.5" opacity="0.4" />
              )}
              {equippedArmorKind === 'boots' && (
                <g fill={equipTier} stroke="#fff" strokeWidth="1">
                  <rect x="86" y="136" width="12" height="6" rx="2" />
                  <rect x="102" y="136" width="12" height="6" rx="2" />
                </g>
              )}
              {equippedArmorKind === 'cloak' && g.cape && (
                <path d="M100 48 L124 58 L121 122 Q100 130 79 122 L76 58 Z" fill="none" stroke={equipTier} strokeWidth="3" opacity="0.9" />
              )}
              {equippedArmorKind === 'belt' && (
                <rect x="86" y="88" width="28" height="6" rx="3" fill={equipTier} stroke="#fff" strokeWidth="1" />
              )}
            </g>
          )}
          {/* Weapons, flat like reference image 5: a distinct item at a
              glance, HELD in the hand — the hand circle is drawn over the
              grip, so the grip reads. Shield in the figure's LEFT hand
              (image-right), sword in the figure's RIGHT hand (image-left). */}
          {/* Equipped weapon: replaces the class weapon entirely, in
              the same hand positions, with a tier-coloured accent so
              the change reads at preview size. Legendary/Mythical
              weapons get a soft glow disc behind the blade/orb. */}
          {equippedWeapon && equippedWeaponKind && (
            <g>
              {(equippedWeapon.tier === 'Legendary' || equippedWeapon.tier === 'Mythical') && (
                glowDisc(equippedWeaponKind === 'bow' || equippedWeaponKind === 'staff' || equippedWeaponKind === 'shield' || equippedWeaponKind === 'lasso' ? handRx + 12 : handLx, 70, 18, `url(#${id('glowTier')})`, shade(weaponTier ?? gemLight, 80))
              )}
              {equippedWeaponKind === 'sword' && (
                <g transform={`rotate(-12 ${handLx} 68)`}>
                  <rect x={handLx - 3} y="40" width="6" height="44" rx="3" fill={equippedWeapon.id === 'epic-excalibur' ? GOLD : STEEL} stroke={weaponTier ?? STEEL_DARK} strokeWidth="2" />
                  <rect x={handLx - 1} y="42" width="1.8" height="38" fill="#fff" opacity="0.7" />
                  <rect x={handLx - 10} y="82" width="20" height="6" rx="3" fill={weaponTier ?? GOLD} stroke={GOLD_DARK} strokeWidth="1.5" />
                  <rect x={handLx - 4.5} y="88" width="9" height="8" rx="3" fill={WOOD} />
                  {/* SWORD BOTTOM FIX (Derek, Nov 24 7:58 AM): same as
                      the class sword — the gem sat on the crossguard
                      tip (handLx-9,85), rendering at ~(handLx-5,86),
                      a blue dot floating left of the fist, while the
                      bare grip bottom dangled at ~(handLx+7,100).
                      Grip shortened to end at y96, gold pommel cap,
                      gem set in the cap at (handLx,97.8), rendering
                      at ~(handLx+6,97) on the grip axis just below
                      the fist. NO glow disc on the pommel. */}
                  <rect x={handLx - 5.5} y="95" width="11" height="5.5" rx="2.5" fill={weaponTier ?? GOLD} stroke={GOLD_DARK} strokeWidth="1.5" />
                  <circle cx={handLx} cy="97.8" r="3" fill={weaponTier ?? gem} stroke="#fff" strokeWidth="1.5" />
                </g>
              )}
              {equippedWeaponKind === 'dagger' && (
                <g transform={`rotate(-12 ${handLx} 72)`}>
                  <path d={`M${handLx} 52 L${handLx + 4} 62 L${handLx} 84 L${handLx - 4} 62 Z`} fill={STEEL} stroke={weaponTier ?? STEEL_DARK} strokeWidth="2" />
                  <rect x={handLx - 8} y="84" width="16" height="5" rx="2.5" fill={weaponTier ?? GOLD} />
                  <rect x={handLx - 3.5} y="89" width="7" height="10" rx="3" fill={WOOD} />
                </g>
              )}
              {equippedWeaponKind === 'hammer' && (
                <g>
                  <rect x={handLx - 13} y="38" width="26" height="13" rx="3" fill={weaponTier ?? STEEL} stroke={GOLD_DARK} strokeWidth="2" />
                  <circle cx={handLx} cy="44" r="3" fill="#fff" />
                  <rect x={handLx - 3} y="51" width="6" height="42" rx="3" fill={WOOD} stroke={WOOD_DARK} strokeWidth="1.5" />
                </g>
              )}
              {equippedWeaponKind === 'claws' && (
                <g fill={STEEL} stroke={weaponTier ?? STEEL_DARK} strokeWidth="2">
                  <path d={`M${handLx - 8} 92 L${handLx - 14} 62 L${handLx - 6} 64 Z`} />
                  <path d={`M${handLx} 92 L${handLx} 58 L${handLx + 6} 64 Z`} />
                  <path d={`M${handLx + 8} 92 L${handLx + 14} 62 L${handLx + 6} 64 Z`} />
                  <rect x={handLx - 10} y="88" width="20" height="7" rx="3.5" fill={weaponTier ?? GOLD} stroke="none" />
                </g>
              )}
              {equippedWeaponKind === 'bow' && (
                <g>
                  <path d={`M${handRx} 66 Q${handRx + 24} 90 ${handRx} 126`} fill="none" stroke={WOOD} strokeWidth="4.5" strokeLinecap="round" />
                  <line x1={handRx} y1="66" x2={handRx} y2="126" stroke={weaponTier ?? '#e8e2d4'} strokeWidth="2" />
                  <line x1={handRx} y1="90" x2={handRx + 24} y2="90" stroke={weaponTier ?? gem} strokeWidth="3.5" strokeLinecap="round" />
                  <polygon points={`${handRx + 24},90 ${handRx + 17},87 ${handRx + 17},93`} fill={STEEL_DARK} />
                  {glowDisc(handRx + 24, 90, 14, `url(#${id('glowTier')})`, shade(weaponTier ?? gemLight, 80))}
                  <polygon points={`${handRx + 2},90 ${handRx - 13},84 ${handRx - 13},96`} fill="#fff" opacity="0.9" />
                </g>
              )}
              {equippedWeaponKind === 'staff' && wizardStaff(gem, weaponTier ?? gem)}
              {equippedWeaponKind === 'shield' && (
                <g>
                  <path d={`M${handRx - 2} 66 L${handRx + 28} 66 L${handRx + 28} 86 Q${handRx + 13} 102 ${handRx - 2} 86 Z`} fill={STEEL} stroke={weaponTier ?? GOLD} strokeWidth="3" />
                  <path d={`M${handRx + 3} 71 L${handRx + 23} 71 L${handRx + 23} 85 Q${handRx + 13} 96 ${handRx + 3} 85 Z`} fill={main} opacity="0.9" />
                  {glowDisc(handRx + 13, 81, 14, `url(#${id('glowTier')})`, shade(weaponTier ?? gemLight, 80))}
                  <circle cx={handRx + 13} cy="81" r="5.5" fill={weaponTier ?? gem} stroke="#fff" strokeWidth="1.5" />
                </g>
              )}
              {equippedWeaponKind === 'lasso' && (
                <g>
                  <circle cx={handRx + 12} cy="78" r="11" fill="none" stroke={weaponTier ?? GOLD} strokeWidth="3.5" />
                  <circle cx={handRx + 12} cy="78" r="4" fill={weaponTier ?? gem} />
                  <path d={`M${handRx} 90 L${handRx + 8} 82`} stroke={weaponTier ?? GOLD} strokeWidth="3" strokeLinecap="round" />
                </g>
              )}
            </g>
          )}
          {(!equippedWeapon || equippedWeaponKind === 'sword' || equippedWeaponKind === 'dagger' || equippedWeaponKind === 'hammer' || equippedWeaponKind === 'claws') && g.classId === 'Guardian' && (
            <g>
              {/* Shield, image-right. Kept when the equipped weapon is
                  a one-handed left-hand weapon (sword / dagger / hammer
                  / claws), so equipping Excalibur does not leave the
                  shield hand empty. A right-hand equipped weapon
                  (bow / staff / shield / lasso) takes the shield's
                  place instead. */}
              {/* POSE (Guardian): shield FORWARD — shifted +6 right,
                  +4 down from the waist, so it reads pushed out in
                  front of the body instead of flat at the side. The
                  shield hand stays hidden behind it, as before. */}
              <path d={`M${handRx + 4} 70 L${handRx + 34} 70 L${handRx + 34} 90 Q${handRx + 19} 106 ${handRx + 4} 90 Z`} fill={STEEL} stroke={GOLD} strokeWidth="3" />
              <path d={`M${handRx + 9} 75 L${handRx + 29} 75 L${handRx + 29} 89 Q${handRx + 19} 100 ${handRx + 9} 89 Z`} fill={main} opacity="0.9" />
              {/* Shield gem GLOW (GLOW FIX): the old r10 disc was the
                  same colour as the gem, no gradient — a flat slightly
                  larger blue disc. Now a r14 radialGradient glow,
                  light centre fading out, pulsing. */}
              {glowDisc(handRx + 19, 85, 14, `url(#${id('glowGem')})`, gemLight)}
              <circle cx={handRx + 19} cy="85" r="5.5" fill={gem} stroke="#fff" strokeWidth="1.5" />
              {/* POSE (Guardian): sword RAISED — blade up-left at -38
                  about the grip point (handLx, 90), so the hand stays
                  on the grip and the blade points up, ready, instead
                  of hanging down at -12. SWORD HIGHER (Derek, Nov 25
                  12:59 PM: "a good guardian action stance would just
                  be holding the sword a bit higher"): -48 -> -38, so
                  the blade is ~8° more upright and the tip sits ~5
                  units higher, without swinging onto the face. The
                  pommel gem stays IN the gold cap at (handLx,97.8). */}
              {!equippedWeapon && (
              <g transform={`rotate(-38 ${handLx} 90)`}>
              {/* Sword, image-left: blade with fuller line, gold
                  crossguard, wrapped grip, gem in the pommel */}
                <rect x={handLx - 3} y="40" width="6" height="44" rx="3" fill={STEEL} stroke={STEEL_DARK} strokeWidth="1.5" />
                <rect x={handLx - 1} y="42" width="1.8" height="38" fill="#fff" opacity="0.7" />
                <rect x={handLx - 10} y="82" width="20" height="6" rx="3" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.5" />
                {/* Grip, BOLDER wrap — the old thin lines were invisible
                    at preview size live (grip read as solid brown). */}
                <rect x={handLx - 4.5} y="88" width="9" height="8" rx="3" fill={WOOD} />
                <path d={`M${handLx - 4.5} 90 L${handLx + 4.5} 92 M${handLx - 4.5} 93 L${handLx + 4.5} 95`} stroke={WOOD_DARK} strokeWidth="2.5" />
                {/* Sword pommel — SWORD BOTTOM FIX (Derek, Nov 24
                    7:58 AM: "The bottom of the sword got moved to a
                    weird spot"). The crotch-glow fix moved the gem to
                    the LEFT TIP of the crossguard (handLx-9,85), but
                    after the -48° pose rotation that renders at
                    ~(handLx-10,93) — ~10 units left and ~6 below the
                    fist, hanging off the end of a 6-unit-thick bar, so
                    it read as a blue dot floating left of the hand.
                    And the grip bottom was a bare brown stub rendering
                    at ~(handLx+8,97), dangling down-right toward the
                    belt. The gem belongs on the POMMEL, on the sword
                    axis just below the fist: grip shortened to end at
                    y96, gold pommel cap at y95-100.5, gem set in the
                    cap at (handLx,97.8), rendering at ~(handLx+5,96)
                    at the -38° raise — on the grip axis, attached via
                    cap and grip to the hand. NO glow disc: a pommel
                    gem is solid, and the old r12 disc is what glowed
                    in the crotch. */}
                <rect x={handLx - 5.5} y="95" width="11" height="5.5" rx="2.5" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.5" />
                <circle cx={handLx} cy="97.8" r="3" fill={gem} stroke="#fff" strokeWidth="1.5" />
              </g>
              )}
            </g>
          )}
          {!equippedWeapon && g.classId === 'Ranger' && (
            <g>
              {/* Bow, image-right hand: flat brown arc, string, arrow with
                  fletching and a GLOWING tip (gem glow — a spell-like
                  effect, not a halo). */}
              {/* POSE (Ranger): bow DRAWN — the string is pulled back
                  in a V to the left hand, and the arrow is a long
                  shaft from the fletching at that hand to a tip 30
                  units past the bow, instead of a short arrow with
                  a straight vertical string. BOW RAISED (Derek, Nov
                  23 6:44 PM): the grip is now at shoulder height
                  (bowY 60, arc y38-82) instead of the waist (y90),
                  so the bow is held high and the arrow runs across
                  the upper chest, just above the chest gem. */}
              <path d={`M${handRx} ${bowTopY} Q${handRx + 28} ${bowY} ${handRx} ${bowBottomY}`} fill="none" stroke={WOOD} strokeWidth="4.5" strokeLinecap="round" />
              <path d={`M${handRx} ${bowTopY} Q${handRx + 22} ${bowY} ${handRx} ${bowBottomY}`} fill="none" stroke="#a8763e" strokeWidth="2" strokeLinecap="round" />
              <line x1={handRx} y1={bowTopY} x2={handLx + 4} y2={bowY} stroke="#e8e2d4" strokeWidth="2" />
              <line x1={handRx} y1={bowBottomY} x2={handLx + 4} y2={bowY} stroke="#e8e2d4" strokeWidth="2" />
              <path d={`M${handRx - 3} ${bowY - 4} L${handRx + 3} ${bowY - 4} M${handRx - 3} ${bowY + 4} L${handRx + 3} ${bowY + 4}`} stroke={WOOD_DARK} strokeWidth="2" />
              <line x1={handLx + 4} y1={bowY} x2={handRx + 30} y2={bowY} stroke={gem} strokeWidth="3.5" strokeLinecap="round" />
              <polygon points={`${handRx + 30},${bowY} ${handRx + 23},${bowY - 3} ${handRx + 23},${bowY + 3}`} fill={STEEL_DARK} />
              {/* Arrow tip GLOW (GLOW FIX): the old r6 disc was a
                  ~3px pale-blue dot at 100px, not a glow. Now a r12
                  radialGradient glow, pulsing, around the arrowhead. */}
              {glowDisc(handRx + 30, bowY, 14, `url(#${id('glowGem')})`, gemLight)}
              {/* Fletching, BIG — the old small white triangle was
                  invisible at preview size live. A large white feather
                  at the arrow tail, with a second smaller one. */}
              <polygon points={`${handLx + 6},${bowY} ${handLx - 9},${bowY - 6} ${handLx - 9},${bowY + 6}`} fill="#fff" opacity="0.9" />
              <polygon points={`${handLx + 6},${bowY} ${handLx - 5},${bowY + 2} ${handLx - 5},${bowY + 8}`} fill="#dfe8f0" opacity="0.9" />
            </g>
          )}
          {/* POSE (Spellweaver): staff RAISED — tilted +8° about the
              grip point (handRx-2, 90), so the top swings up/RIGHT
              and the foot stays planted on the ground. It WAS -8°,
              but -8° swings a point above the grip LEFT (measured
              Nov 23 10:11 PM diagnosis: the old comment claiming
              -8° swings the top right was backwards), which pulled
              the orb ~9 units left onto the hat brim — the live
              Nov 23 7:09 PM check found the orb sitting on the
              hat's lower right at brim height. +8° with ox =
              handRx+24 lands the orb ~10 units clear of the brim
              tip (brim rx33, tips x67/133). The grip, the fist,
              and the face-clearance fix are untouched. */}
          {!equippedWeapon && g.classId === 'Spellweaver' && (
            <g transform={`rotate(8 ${handRx - 2} 90)`}>{wizardStaff(gem, gem)}</g>
          )}
          {/* Hands, drawn LAST over the weapon grips, so every weapon
              reads as held. Skin circles with a dark outline.
              HAND FIX (Derek, Nov 23 4:27 PM: "The arms have weird
              circles on it too"): the generic hands were perfect
              skin circles (r5-5.5) with a thick 1.5-unit dark ring,
              centred at y90 — just BELOW the sleeve ends (y88-89) —
              so they read as detached beige discs / buttons at the
              waist. Now centred at y87, so the top half of the hand
              overlaps the sleeve end and the hand emerges FROM the
              sleeve, and the outline is now only a BOTTOM half-arc
              (1 unit) under the hand — the top of the hand has no
              ring at all, so it merges into the sleeve instead of
              reading as a closed coin. Staff-mode left hand moved
              the same way (88 -> 87, same half-arc); the finger
              capsules are untouched.
              EXCEPT the shield hand: when a shield covers the right
              hand (class Guardian shield, or an equipped shield),
              the hand is BEHIND the shield and must NOT show on the
              shield face, so it is omitted here — see
              shieldCoversRightHand above.
              STAFF GRIP (Derek, Nov 23 11:26 AM: fix the hand grip;
              live Nov 23 10:09 AM: "3-4px gap between the pale hand
              circle and the brown shaft, no fingers wrapping it",
              other hand also detached): the generic hand sat at
              (handRx,90) while the shaft centreline at the grip is
              (handRx-2,90) and bends LEFT above it, so the hand's
              right half hung in air and its thick dark ring read as
              a separator. In staff mode the right hand is a FIST
              centred ON the shaft centreline at the grip (handRx-2,
              90), wider than the shaft (rx7.5 vs shaft half-width
              ~7), thin outline (1, not 1.5), with three finger
              lines across the shaft in darkened skin, so it reads
              as fingers wrapping the wood. The left hand moves up
              2 units onto the sleeve end (cy88, r+0.5) so it is not
              detached at the waist either. Other classes keep the
              generic hands exactly as before (they passed live).
              FINGERS v6 (Derek, Nov 23 2:54 PM: "the fingers look
              really big"): the v5 capsules were 11.5 wide x 3.5 tall
              with a 5-wide palm column — bounding box 15 x 13.5,
              ~1.4x a generic hand (10-11 across), and at live size
              they read as a big block. V6 shrinks them ~30% in skin
              area: capsules 9.5 wide x 3.0 tall (y84.7/89.0/93.3,
              gaps 1.3, total height 11.6), palm column 4 wide x
              11.6, bounding box 12 x 11.6 — proportionate to the
              hand and the shaft, fingertips ending ~3 units short
              of the shaft's far edge so wood shows on the right
              and the grip still reads as wrapping. NOT back to
              thin lines (v4, invisible) — the capsules stay
              structural, just smaller. */}
          {isStaffGrip ? (
            <g>
              {/* POSE (Spellweaver): casting hand — out to the left at
                  (handLx-10, 62), on the end of the raised casting
                  arm, with a small glow in the palm. The bottom
                  half-arc outline stays, so it reads as a palm, not
                  a closed coin. */}
              {castHand && glowDisc(castHand.x, castHand.y, 11, `url(#${id('glowGem')})`, gemLight)}
              <circle cx={castHand ? castHand.x : handLx} cy={castHand ? castHand.y : 87} r={handR + 0.5} fill={SKIN} />
              <path d={`M${(castHand ? castHand.x : handLx) - handR - 0.5} ${castHand ? castHand.y : 87} A${handR + 0.5} ${handR + 0.5} 0 0 0 ${(castHand ? castHand.x : handLx) + handR + 0.5} ${castHand ? castHand.y : 87}`} fill="none" stroke={dark} strokeWidth="1" strokeLinecap="round" />
              {/* Palm column (left / body side), joins the fingers. */}
              <rect x={handRx - 10.5} y="84.7" width="4" height="11.6" rx="1.8" fill={SKIN} stroke={skinIsDark ? '#ffe3c2' : dark} strokeWidth="1.2" />
              {/* Three finger capsules across the shaft; the 1.3-unit
                  gaps between them show the dark wood shaft, so the
                  fingers read as separate bands wrapping the wood. */}
              <rect x={handRx - 7.5} y="84.7" width="9.5" height="3" rx="1.5" fill={SKIN} stroke={skinIsDark ? '#ffe3c2' : dark} strokeWidth="1" />
              <rect x={handRx - 7.5} y="89" width="9.5" height="3" rx="1.5" fill={SKIN} stroke={skinIsDark ? '#ffe3c2' : dark} strokeWidth="1" />
              <rect x={handRx - 7.5} y="93.3" width="9.5" height="3" rx="1.5" fill={SKIN} stroke={skinIsDark ? '#ffe3c2' : dark} strokeWidth="1" />
            </g>
          ) : (
            <g>
              {/* POSE (Spellweaver, no staff equipped): same casting
                  hand as the staff branch. With an equipped weapon
                  the left hand stays on its weapon, so the casting
                  hand only applies when no weapon is equipped. */}
              {castHand && !equippedWeapon && glowDisc(castHand.x, castHand.y, 11, `url(#${id('glowGem')})`, gemLight)}
              {/* Ranger raised bow: the left (draw) hand sits at the
                  string V (handLx+4, 60) and the right hand grips
                  the bow at (handRx, 60) — both on the raised sleeves
                  above, never floating at the waist. */}
              <circle cx={castHand && !equippedWeapon ? castHand.x : rangerBowRaised ? handLx + 4 : handLx} cy={castHand && !equippedWeapon ? castHand.y : rangerBowRaised ? 60 : 87} r={handR} fill={SKIN} />
              <path d={`M${(castHand && !equippedWeapon ? castHand.x : rangerBowRaised ? handLx + 4 : handLx) - handR} ${castHand && !equippedWeapon ? castHand.y : rangerBowRaised ? 60 : 87} A${handR} ${handR} 0 0 0 ${(castHand && !equippedWeapon ? castHand.x : rangerBowRaised ? handLx + 4 : handLx) + handR} ${castHand && !equippedWeapon ? castHand.y : rangerBowRaised ? 60 : 87}`} fill="none" stroke={dark} strokeWidth="1" strokeLinecap="round" />
              {!shieldCoversRightHand && (
                <g>
                  <circle cx={handRx} cy={rangerBowRaised ? 60 : 87} r={handR} fill={SKIN} />
                  <path d={`M${handRx - handR} ${rangerBowRaised ? 60 : 87} A${handR} ${handR} 0 0 0 ${handRx + handR} ${rangerBowRaised ? 60 : 87}`} fill="none" stroke={dark} strokeWidth="1" strokeLinecap="round" />
                </g>
              )}
            </g>
          )}
        </g>
        </g>
      </svg>
      <p className="guardian-caption">
        {caption}
        {showWings && ' · Wings'}
        {showCrown && ' · Crown'}
      </p>
      {(equippedWeapon || equippedArmor) && (
        <p className="small" style={{ margin: '2px 0 0' }}>
          {equippedWeapon ? `Wielding ${equippedWeapon.name}` : ''}
          {equippedWeapon && equippedArmor ? ' · ' : ''}
          {equippedArmor ? `Wearing ${equippedArmor.name}` : ''}
        </p>
      )}
      <p className="small muted" style={{ margin: '2px 0 0' }}>{SCENE_LABEL[scene]}</p>
    </div>
  );
}
