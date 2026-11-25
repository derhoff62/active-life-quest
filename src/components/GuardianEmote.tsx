// Custom guardian emotes: the client's own guardian face, drawn in the
// same flat style as GuardianAvatar (skin circle, dark dot eyes, strong
// brows, thin mouth — no white sclera, no realistic nose or ears, no
// generic emoji). One row of 6, used in Message Derek on Today, and
// shown to Derek in Coach. The message body always carries a plain-text
// fallback ("Sent an emote: Celebrate") so the emote still reads if the
// face ever fails to render.
import type { GuardianState } from '../lib/store';
import { SKIN_HEX } from '../lib/guardianOptions';

export type EmoteId = 'celebrate' | 'determined' | 'tired' | 'strong' | 'struggling' | 'thumbs-up';

export interface EmoteDef {
  id: EmoteId;
  label: string;
  // Plain words for the message body and for Derek in Coach.
  text: string;
}

export const EMOTES: EmoteDef[] = [
  { id: 'celebrate', label: 'Celebrate', text: 'Celebrate — I did it!' },
  { id: 'determined', label: 'Determined', text: 'Determined — ready to go.' },
  { id: 'tired', label: 'Tired', text: 'Tired — I need a rest day.' },
  { id: 'strong', label: 'Strong', text: 'Strong — feeling powerful today.' },
  { id: 'struggling', label: 'Struggling', text: 'Struggling — today is hard.' },
  // "Good job" did not make sense (Derek, Nov 25): the client sends
  // these emotes TO Derek, so praising him is backwards, and the old
  // face was the angry Determined brows with a thumb blob on the
  // cheek. "Proud" keeps the thumbs-up praise, pointed at the
  // client's own work. The id stays 'thumbs-up' so stored profiles
  // and Coach messages keep working.
  { id: 'thumbs-up', label: 'Proud', text: 'Proud — I am proud of how that went.' },
];

export function emoteById(id: string | undefined): EmoteDef | undefined {
  return EMOTES.find((e) => e.id === id);
}

const DARK = '#1c2b3a';
const HAIR_C = '#5b3a1e';
const BEARD_C = '#40260f';
const MOUTH = '#6b4a3a';
const GOLD = '#c9a227';

// The face is the guardian's own: Female gets slimmer brows and lashes,
// Male gets thick brows, and bearded Male styles get the same narrow
// chin crescent the avatar has (never a bib).
function faceFor(guardian: GuardianState | null): { female: boolean; bearded: boolean } {
  const female = guardian?.look === 'Female';
  const bearded = !female && (guardian?.hair === 'Short+beard' || guardian?.hair === 'Bald' || guardian?.hair === 'Long');
  return { female, bearded };
}

export default function GuardianEmote({ emote, guardian, size = 44 }: { emote: EmoteId; guardian?: GuardianState | null; size?: number }) {
  const { female, bearded } = faceFor(guardian ?? null);
  const tone = guardian?.skinColor ?? 'Light';
  const skin = SKIN_HEX[tone] ?? '#f7d9ae';
  const darkSkin = tone === 'Brown' || tone === 'Deep';
  const browW = (female ? 1.4 : 2) + (darkSkin ? 1 : 0);
  const browStroke = darkSkin ? '#ffe3c2' : HAIR_C;
  const mouthStroke = darkSkin ? '#ffe3c2' : MOUTH;
  const faceStroke = darkSkin ? '#e5b183' : '#c0a277';
  const dotEyes = emote === 'determined' || emote === 'strong' || emote === 'struggling' || emote === 'thumbs-up';
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role="img"
      aria-label={emoteById(emote)?.label || 'Emote'}
      style={{ flexShrink: 0 }}
    >
      {/* Hair cap, same warm brown as the avatar — a thick band across the top of the head. */}
      <path d="M6 26 Q6 6 24 6 Q42 6 42 26 Q38 15 24 15 Q10 15 6 26 Z" fill={HAIR_C} />
      {/* Face. */}
      <circle cx="24" cy="26" r="18" fill={skin} stroke={faceStroke} strokeWidth="1.2" />
      {darkSkin && dotEyes && (
        <g fill="#ffe3c2">
          <circle cx="16" cy="25.5" r="3.1" />
          <circle cx="32" cy="25.5" r="3.1" />
        </g>
      )}
      {/* Beard: a thin crescent hugging the chin only (top ~y38, chin y44),
          so the mouth at y33 stays clear. The first version sat at y33.5
          and filled the whole lower face like a second mouth. */}
      {bearded && (
        <path d="M15 38 Q14.5 43 24 44 Q33.5 43 33 38 Q29 40.5 24 40.5 Q19 40.5 15 38 Z" fill={BEARD_C} stroke={darkSkin ? '#e5b183' : 'none'} strokeWidth="1" />
      )}
      {emote === 'celebrate' && (
        <g>
          {/* Happy closed eyes, big open smile, gold star above. */}
          <path d="M13 25 Q16.5 21.5 20 25 M28 25 Q31.5 21.5 35 25" fill="none" stroke={DARK} strokeWidth="2" strokeLinecap="round" />
          <path d="M17 30 Q24 38 31 30 Q24 33.5 17 30 Z" fill={mouthStroke} />
          <path d="M24 1 L25.2 4 L28.5 4 L26 6 L27 9.2 L24 7.2 L21 9.2 L22 6 L19.5 4 L22.8 4 Z" fill={GOLD} />
        </g>
      )}
      {emote === 'determined' && (
        <g>
          {/* The guardian's own face: brows angled down, dot eyes, firm straight mouth. */}
          <path d="M12.5 20 L19 22.5 M29 22.5 L35.5 20" fill="none" stroke={browStroke} strokeWidth={browW} strokeLinecap="round" />
          <circle cx="16" cy="25.5" r="2.2" fill={DARK} />
          <circle cx="32" cy="25.5" r="2.2" fill={DARK} />
          <path d="M20.5 33 L27.5 33" fill="none" stroke={mouthStroke} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      )}
      {emote === 'tired' && (
        <g>
          {/* Half-closed eyes, flat tired mouth, small "Z". */}
          <path d="M13 24.5 L19 24.5 M29 24.5 L35 24.5" fill="none" stroke={DARK} strokeWidth="2" strokeLinecap="round" />
          <path d="M13 24.5 Q16 27 19 24.5 M29 24.5 Q32 27 35 24.5" fill="none" stroke={DARK} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M20.5 33.5 L27.5 33.5" fill="none" stroke={mouthStroke} strokeWidth="1.4" strokeLinecap="round" />
          <text x="38" y="12" fontSize="9" fill="#124571" fontWeight="700">Z</text>
        </g>
      )}
      {emote === 'strong' && (
        <g>
          {/* Big grin, one brow raised, determined eyes. */}
          <path d="M12.5 19 L19 22 M29 22.5 L35.5 21" fill="none" stroke={browStroke} strokeWidth={browW} strokeLinecap="round" />
          <circle cx="16" cy="25.5" r="2.2" fill={DARK} />
          <circle cx="32" cy="25.5" r="2.2" fill={DARK} />
          <path d="M17 30 Q24 37 31 30 Q24 33 17 30 Z" fill="#fff" stroke={mouthStroke} strokeWidth="1.2" />
        </g>
      )}
      {emote === 'struggling' && (
        <g>
          {/* Worried brows raised in the middle, downturned mouth, small tear. */}
          <path d="M12.5 22 L19 19.5 M29 19.5 L35.5 22" fill="none" stroke={browStroke} strokeWidth={browW} strokeLinecap="round" />
          <circle cx="16" cy="25.5" r="2.2" fill={DARK} />
          <circle cx="32" cy="25.5" r="2.2" fill={DARK} />
          <path d="M20 34 Q24 31 28 34" fill="none" stroke={mouthStroke} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M35 28 Q37 31.5 35 33.5 Q33 31.5 35 28 Z" fill="#4a90c2" />
        </g>
      )}
      {emote === 'thumbs-up' && (
        <g>
          {/* Proud: happy brows raised (not the angry down-angle the old
              version copied from Determined), big open smile, and a
              clear thumbs-up hand: a fist with the thumb up on top,
              bottom right, outlined dark so it reads against the face
              instead of blending into the cheek like the old blob. */}
          <path d="M12.5 18 L19 16.5 M29 16.5 L35.5 18" fill="none" stroke={browStroke} strokeWidth={browW} strokeLinecap="round" />
          <circle cx="16" cy="25.5" r="2.2" fill={DARK} />
          <circle cx="32" cy="25.5" r="2.2" fill={DARK} />
          <path d="M17 30 Q24 38 31 30 Q24 33.5 17 30 Z" fill={mouthStroke} />
          {/* One silhouette: the thumb grows out of the top of the fist,
              no dividing line between them, so it cannot read as a
              handle on a bag (the v1/v2 two-shape versions did). */}
          <path
            d="M32 45 L32 40 Q32 37 35 37 L35 33 Q35 30.5 38.5 30.5 Q42 30.5 42 33 L42 37 L43 37 Q46 37 46 40 L46 45 Z"
            fill={skin}
            stroke={DARK}
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          <path d="M35 41.5 L43 41.5" fill="none" stroke={faceStroke} strokeWidth="0.8" strokeLinecap="round" />
        </g>
      )}
      {female && emote !== 'celebrate' && (
        <g>
          {/* Small lashes, Female only, kept off the celebrate face where the eyes are closed. */}
          <path d="M14.5 23.5 L13 21.5 M33.5 23.5 L35 21.5" fill="none" stroke={DARK} strokeWidth="1" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
