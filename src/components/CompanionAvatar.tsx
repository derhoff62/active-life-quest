// Small pure-SVG portraits for companions and bosses, in the same flat
// cartoon style as the guardian avatar (Derek's reference sheets, Nov 22,
// 2026): flat colours, one shade, simple faces, no white sclera, no
// realistic nose/ears, no photorealism. Image 5 (wolves, griffin, orcs,
// horse, flat weapons/shields) is the model for creatures and gear; image 4
// (blue dragon, orcs, lich) is the model for bosses: big, distinct,
// fierce in a cartoon way, not scary-realistic. Derek Nov 22: "Things don't
// have to look friendly" — companions have personality, bosses look stern
// or fierce, nobody is soft/cute by default. Bosses stay enemies: sterner
// faces and a red ring.
// Generated images: a trial batch of six (Derek Nov 23, 2026 — companions
// and bosses need no customization, so static generated portraits are fine
// here, unlike the guardian). Where GENERATED_COMPANIONS has an image for
// an id, that image is shown in the same 56x56 slot over the same coloured
// disc, with the same red ring for bosses; everything else stays SVG.
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { GENERATED_COMPANIONS } from '../lib/generatedCompanions';

// Generated portrait in the same 56x56 circular slot as the SVG portraits:
// the character's coloured disc behind it, the image on top (head-and-
// shoulders cutout, transparent except the Mirror of Doubt, whose
// grey-blue mirror glass is its background), and the red ring for bosses.
function GeneratedPortrait({ src, pal, enemy, onError }: { src: string; pal: Pal; enemy?: boolean; onError?: () => void }) {
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        overflow: 'hidden',
        backgroundColor: `${pal.glow}38`,
        border: enemy ? '2px solid rgba(168,50,50,0.75)' : 'none',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      <img src={src} alt="" width={56} height={56} onError={onError} style={{ display: 'block', objectFit: 'contain', borderRadius: '50%' }} />
    </div>
  );
}

function shade(hex: string, amount: number): string {
  const n = hex.replace('#', '');
  const num = parseInt(n.length === 3 ? n.split('').map((c) => c + c).join('') : n, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

type Pal = {
  glow: string;
  glowLight: string;
  cloth: string;
  clothDark: string;
  skin: string;
  hair: string;
  accent: string;
};

const PALS: Record<string, Pal> = {
  bram: { glow: '#e8a91c', glowLight: '#f7cf6b', cloth: '#5b3a1e', clothDark: '#3a2410', skin: '#f7d9ae', hair: '#8a6238', accent: '#b9c9d8' },
  sylva: { glow: '#1e9e5a', glowLight: '#7ed3a4', cloth: '#1e7a46', clothDark: '#0f4d28', skin: '#f7d9ae', hair: '#e8c85a', accent: '#2f6fd0' },
  kaelith: { glow: '#2f9e7a', glowLight: '#8fd8bd', cloth: '#2f6f5a', clothDark: '#1a4234', skin: '#3d8a6d', hair: '#f2d878', accent: '#f2d878' },
  tilda: { glow: '#c22747', glowLight: '#f08a9d', cloth: '#a83232', clothDark: '#6d1f1f', skin: '#f7d9ae', hair: '#8a6238', accent: '#fffdf4' },
  pip: { glow: '#2f6fd0', glowLight: '#8db4f2', cloth: '#2f6fd0', clothDark: '#1d4fa1', skin: '#f7d9ae', hair: '#e8e2d4', accent: '#f6ecd0' },
  hoot: { glow: '#e8a91c', glowLight: '#f7cf6b', cloth: '#8a6238', clothDark: '#5b3a1e', skin: '#e8e2d4', hair: '#8a6238', accent: '#e8a91c' },
  ash: { glow: '#8a9aa8', glowLight: '#c8d2da', cloth: '#5b6b7a', clothDark: '#3a4a5a', skin: '#e8e2d4', hair: '#8a9aa8', accent: '#f2d878' },
  ember: { glow: '#e8702a', glowLight: '#f7a76b', cloth: '#e8702a', clothDark: '#a84a12', skin: '#f7a76b', hair: '#f2d878', accent: '#f2d878' },
  rowan: { glow: '#b9c9d8', glowLight: '#eef3f7', cloth: '#5b6b7a', clothDark: '#3a4a5a', skin: '#f7d9ae', hair: '#e8e2d4', accent: '#c9a227' },
  mara: { glow: '#1e9e5a', glowLight: '#7ed3a4', cloth: '#fffdf4', clothDark: '#1e7a46', skin: '#f7d9ae', hair: '#5b3a1e', accent: '#1e7a46' },
  quill: { glow: '#5b6b8a', glowLight: '#9aa5c8', cloth: '#1c2b3a', clothDark: '#0e1822', skin: '#2a3a4a', hair: '#1c2b3a', accent: '#e8a91c' },
  miso: { glow: '#e8a91c', glowLight: '#f7cf6b', cloth: '#f2a541', clothDark: '#b96f14', skin: '#f7cf9e', hair: '#e8a91c', accent: '#c96a7a' },
  wren: { glow: '#2f6fd0', glowLight: '#8db4f2', cloth: '#2f6f4a', clothDark: '#1d4f30', skin: '#f7d9ae', hair: '#5b3a1e', accent: '#c9a227' },
  fern: { glow: '#1e9e5a', glowLight: '#7ed3a4', cloth: '#1e7a46', clothDark: '#0f4d28', skin: '#f7d9ae', hair: '#3a6b2f', accent: '#e88a7a' },
  ansel: { glow: '#8a9aa8', glowLight: '#c8d2da', cloth: '#5b6b7a', clothDark: '#3a4a5a', skin: '#f7d9ae', hair: '#e8e2d4', accent: '#c9a227' },
  lark: { glow: '#e8a91c', glowLight: '#f7cf6b', cloth: '#e8a91c', clothDark: '#b96f14', skin: '#f7cf9e', hair: '#e8a91c', accent: '#2f6fd0' },
  unknown: { glow: '#5b6b7a', glowLight: '#9aa5b1', cloth: '#5b6b7a', clothDark: '#3a4a5a', skin: '#9aa5b1', hair: '#5b6b7a', accent: '#ffffff' },
};

const BOSS_PALS: Record<string, Pal> = {
  'the-slump': { glow: '#8a9aa8', glowLight: '#c8d2da', cloth: '#5b6b7a', clothDark: '#3a4a5a', skin: '#a8b6c2', hair: '#8a9aa8', accent: '#f2d878' },
  'stiff-hips-goblin': { glow: '#57b368', glowLight: '#9ad8a4', cloth: '#5b3a1e', clothDark: '#3a2410', skin: '#57b368', hair: '#2f7a38', accent: '#fff' },
  'achy-knees-troll': { glow: '#8a9aa8', glowLight: '#c8d2da', cloth: '#5b6b7a', clothDark: '#3a4a5a', skin: '#8a9aa8', hair: '#c8ccd0', accent: '#fff' },
  'tired-back-beast': { glow: '#8a6238', glowLight: '#c8a06a', cloth: '#5b3a1e', clothDark: '#3a2410', skin: '#8a6238', hair: '#5b3a1e', accent: '#e8e2d4' },
  'wobbly-balance-sprite': { glow: '#7b2fbe', glowLight: '#c9a7e8', cloth: '#7b2fbe', clothDark: '#4d1a78', skin: '#c9b8f2', hair: '#7b2fbe', accent: '#f2d878' },
};

function Portrait({
  pal,
  enemy,
  animal,
  behind,
  front,
  face,
}: {
  pal: Pal;
  enemy?: boolean;
  animal?: boolean;
  behind?: ReactNode;
  front?: ReactNode;
  face: ReactNode;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gid = (n: string) => `${n}-${uid}`;
  const dark = pal.clothDark;
  return (
    <svg width="56" height="56" viewBox="0 0 64 64" role="img" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={gid('aura')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={pal.glow} stopOpacity="0.85" />
          <stop offset="60%" stopColor={pal.glow} stopOpacity="0.35" />
          <stop offset="100%" stopColor={pal.glow} stopOpacity="0" />
        </radialGradient>
        {/* Flat fills: both gradient stops the same colour, so the figure
            reads as one flat colour with a dark outline, like the refs */}
        <linearGradient id={gid('skin')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={pal.skin} />
          <stop offset="100%" stopColor={pal.skin} />
        </linearGradient>
        <linearGradient id={gid('cloth')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={pal.cloth} />
          <stop offset="55%" stopColor={pal.cloth} />
          <stop offset="100%" stopColor={pal.cloth} />
        </linearGradient>
        <linearGradient id={gid('gold')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2d878" />
          <stop offset="100%" stopColor="#a8840a" />
        </linearGradient>
        <filter id={gid('glow')} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Flat colour disc behind the figure, in the character's color —
          no halo ring, no glow filter, like the reference sheets */}
      <circle cx="32" cy="30" r="30" fill={pal.glow} opacity="0.22" />
      {enemy && <circle cx="32" cy="30" r="30" fill="none" stroke="#a83232" strokeWidth="2" opacity="0.75" />}
      {behind}
      {/* Neck: connects the head to the shoulders, so the head never floats */}
      <rect x="28" y="34" width="8" height="13" rx="3" fill={`url(#${gid('skin')})`} stroke={dark} strokeWidth="1.5" />
      {/* Shoulders and chest, one connected figure */}
      {animal ? (
        <g>
          <ellipse cx="32" cy="55" rx="15" ry="11" fill={`url(#${gid('cloth')})`} stroke={dark} strokeWidth="1.5" />
          <ellipse cx="32" cy="51" rx="8" ry="6" fill={pal.skin} opacity="0.65" />
          <path d="M20 50 Q32 46 44 50" fill="none" stroke={pal.glowLight} strokeWidth="1.5" opacity="0.6" />
        </g>
      ) : (
        <g>
          <path d="M32 40 L47 45 L49 64 L15 64 L17 45 Z" fill={`url(#${gid('cloth')})`} stroke={dark} strokeWidth="1.5" />
          <path d="M21 48 Q32 44 43 48" fill="none" stroke={pal.glowLight} strokeWidth="1.5" opacity="0.6" />
          <path d="M32 40 L38 42 L38 48 L26 48 L26 42 Z" fill={`url(#${gid('gold')})`} stroke="#8a6d00" strokeWidth="1" />
        </g>
      )}
      {/* Head: overlaps the neck, so head, neck, and shoulders are one figure */}
      {animal ? (
        <ellipse cx="32" cy="27" rx="15" ry="13" fill={`url(#${gid('skin')})`} stroke={dark} strokeWidth="1.5" />
      ) : (
        <circle cx="32" cy="26" r="13" fill={`url(#${gid('skin')})`} stroke={dark} strokeWidth="1.5" />
      )}
      {front}
      {face}
    </svg>
  );
}

// Determined face, not a smile: strong brows angled down toward the
// centre, small dark dot eyes (no white sclera, no highlight), a firm
// straight mouth. Stern (bosses) is the same face, brows harder and mouth
// flat. Nobody is soft/cute by default.
function FriendlyFace({ stern }: { stern?: boolean }) {
  return (
    <g>
      {stern ? (
        <>
          <path d="M22 20 L28 24 M42 20 L36 24" stroke="#1c2b3a" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M26 34 L38 34" stroke="#1c2b3a" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M23 21 L29 23 M35 23 L41 21" stroke="#5b3a1e" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M27 33 L37 33" stroke="#1c2b3a" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
      <circle cx="27" cy="26" r="2" fill="#1c2b3a" />
      <circle cx="37" cy="26" r="2" fill="#1c2b3a" />
    </g>
  );
}

export default function CompanionAvatar({ id }: { id: string }) {
  const pal = PALS[id] ?? PALS.unknown;
  const generated = GENERATED_COMPANIONS[id];
  if (generated) return <GeneratedPortrait src={generated} pal={pal} />;

  if (id === 'unknown') {
    return (
      <Portrait
        pal={pal}
        face={<text x="32" y="31" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff">?</text>}
        front={<path d="M19 24 Q19 13 32 13 Q45 13 45 24 Q41 17 32 17 Q23 17 19 24 Z" fill={pal.hair} />}
      />
    );
  }

  if (id === 'bram') {
    return (
      <Portrait
        pal={pal}
        face={<FriendlyFace />}
        front={
          <g>
            <path d="M19 24 Q19 13 32 13 Q45 13 45 24 Q41 16 32 16 Q23 16 19 24 Z" fill="#9aa5b1" />
            <path d="M20 28 Q20 42 32 42 Q44 42 44 28 Q40 35 32 35 Q24 35 20 28 Z" fill={pal.hair} />
            <path d="M24 38 Q28 40 32 40 M28 40 Q32 42 36 40" stroke={shade(pal.hair, -20)} strokeWidth="1" fill="none" opacity="0.6" />
          </g>
        }
      />
    );
  }

  if (id === 'sylva') {
    return (
      <Portrait
        pal={pal}
        face={<FriendlyFace />}
        behind={
          <g>
            <path d="M20 24 L11 14 L22 18 Z" fill={pal.skin} stroke={pal.clothDark} strokeWidth="1" />
            <path d="M44 24 L53 14 L42 18 Z" fill={pal.skin} stroke={pal.clothDark} strokeWidth="1" />
          </g>
        }
        front={
          <g>
            <path d="M19 24 Q19 13 32 13 Q45 13 45 24 Q41 16 32 16 Q23 16 19 24 Z" fill={pal.hair} />
            <path d="M25 16 Q29 13 32 13" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.6" />
            <circle cx="32" cy="46" r="3" fill={pal.accent} stroke="#fff" strokeWidth="1" />
          </g>
        }
      />
    );
  }

  if (id === 'kaelith') {
    return (
      <Portrait
        pal={pal}
        animal
        behind={
          <g>
            <path d="M18 30 Q8 18 16 12 Q22 18 24 28 Z" fill={pal.cloth} stroke={pal.clothDark} strokeWidth="1" opacity="0.9" />
            <path d="M46 30 Q56 18 48 12 Q42 18 40 28 Z" fill={pal.cloth} stroke={pal.clothDark} strokeWidth="1" opacity="0.9" />
          </g>
        }
        front={
          <g>
            <path d="M26 15 L28 8 L31 14 Z" fill={pal.accent} />
            <path d="M34 14 L37 7 L39 14 Z" fill={pal.accent} />
            <ellipse cx="32" cy="33" rx="5" ry="3" fill={shade(pal.skin, -15)} />
            <circle cx="29" cy="32" r="0.9" fill="#1c2b3a" />
            <circle cx="35" cy="32" r="0.9" fill="#1c2b3a" />
          </g>
        }
        face={
          <g>
            <circle cx="26" cy="25" r="2" fill="#1c2b3a" />
            <circle cx="38" cy="25" r="2" fill="#1c2b3a" />
            <path d="M27 36 L37 36" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        }
      />
    );
  }

  if (id === 'tilda') {
    return (
      <Portrait
        pal={pal}
        face={<FriendlyFace />}
        front={
          <g>
            <circle cx="20" cy="16" r="4.5" fill={pal.hair} />
            <circle cx="44" cy="16" r="4.5" fill={pal.hair} />
            <path d="M19 24 Q19 13 32 13 Q45 13 45 24 Q41 16 32 16 Q23 16 19 24 Z" fill={pal.hair} />
            <path d="M25 44 L39 44 L38 64 L26 64 Z" fill={pal.accent} opacity="0.9" />
            <circle cx="32" cy="44" r="2" fill={pal.glow} />
          </g>
        }
      />
    );
  }

  if (id === 'pip') {
    return (
      <Portrait
        pal={pal}
        face={<FriendlyFace />}
        front={
          <g>
            <path d="M32 4 L40 22 L24 22 Z" fill={pal.cloth} stroke={pal.clothDark} strokeWidth="1" />
            <circle cx="32" cy="6" r="2.5" fill={pal.glow} />
            <path d="M22 28 Q22 40 32 40 Q42 40 42 28 Q38 34 32 34 Q26 34 22 28 Z" fill={pal.hair} />
            <rect x="46" y="44" width="11" height="9" rx="2" fill={pal.accent} stroke="#8a6d00" strokeWidth="1" />
            <line x1="49" y1="47" x2="54" y2="47" stroke="#8a6d00" strokeWidth="1" />
            <line x1="49" y1="50" x2="54" y2="50" stroke="#8a6d00" strokeWidth="1" />
          </g>
        }
      />
    );
  }

  if (id === 'hoot') {
    return (
      <Portrait
        pal={pal}
        animal
        behind={
          <g>
            <path d="M22 18 L25 10 L28 17 Z" fill={pal.hair} />
            <path d="M36 17 L39 10 L42 18 Z" fill={pal.hair} />
          </g>
        }
        face={
          <g>
            <circle cx="25" cy="25" r="6" fill="#fff" />
            <circle cx="39" cy="25" r="6" fill="#fff" />
            <circle cx="25" cy="25" r="3" fill="#1c2b3a" />
            <circle cx="39" cy="25" r="3" fill="#1c2b3a" />
            <circle cx="26" cy="24" r="1" fill="#fff" />
            <circle cx="40" cy="24" r="1" fill="#fff" />
            <polygon points="32,29 28,33 36,33" fill={pal.accent} />
            <ellipse cx="32" cy="40" rx="7" ry="5" fill={pal.skin} opacity="0.7" />
          </g>
        }
      />
    );
  }

  if (id === 'ash') {
    return (
      <Portrait
        pal={pal}
        animal
        behind={
          <g>
            <path d="M20 22 L17 9 L27 16 Z" fill={pal.hair} stroke={pal.clothDark} strokeWidth="1" />
            <path d="M44 22 L47 9 L37 16 Z" fill={pal.hair} stroke={pal.clothDark} strokeWidth="1" />
          </g>
        }
        face={
          <g>
            <ellipse cx="32" cy="33" rx="8" ry="6" fill={pal.skin} />
            <circle cx="24" cy="24" r="2" fill="#1c2b3a" />
            <circle cx="40" cy="24" r="2" fill="#1c2b3a" />
            <ellipse cx="32" cy="32" rx="3.5" ry="2.5" fill="#1c2b3a" />
            <path d="M32 34 L32 37 M28 37 Q32 40 36 37" stroke="#1c2b3a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </g>
        }
      />
    );
  }

  if (id === 'ember') {
    return (
      <Portrait
        pal={pal}
        animal
        behind={
          <g>
            <path d="M18 30 Q8 18 17 12 Q23 18 25 28 Z" fill={pal.accent} opacity="0.85" />
            <path d="M46 30 Q56 18 47 12 Q41 18 39 28 Z" fill={pal.accent} opacity="0.85" />
          </g>
        }
        front={
          <g>
            <path d="M27 15 L29 8 L32 14 Z" fill={pal.hair} />
            <path d="M34 14 L37 7 L39 14 Z" fill={pal.hair} />
            <ellipse cx="32" cy="33" rx="5" ry="3" fill={shade(pal.skin, -10)} />
          </g>
        }
        face={
          <g>
            <circle cx="26" cy="25" r="2" fill="#1c2b3a" />
            <circle cx="38" cy="25" r="2" fill="#1c2b3a" />
            <path d="M27 36 L37 36" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        }
      />
    );
  }

  if (id === 'rowan') {
    return (
      <Portrait
        pal={pal}
        face={<FriendlyFace />}
        front={
          <g>
            <path d="M19 24 Q19 13 32 13 Q45 13 45 24 Q41 16 32 16 Q23 16 19 24 Z" fill={pal.hair} />
            <path d="M20 28 Q20 42 32 42 Q44 42 44 28 Q40 35 32 35 Q24 35 20 28 Z" fill={pal.hair} />
            <circle cx="48" cy="50" r="8" fill="#b9c9d8" stroke={pal.accent} strokeWidth="2" />
            <circle cx="48" cy="50" r="3" fill={pal.accent} />
          </g>
        }
      />
    );
  }

  if (id === 'mara') {
    return (
      <Portrait
        pal={pal}
        face={<FriendlyFace />}
        front={
          <g>
            <path d="M19 24 Q19 13 32 13 Q45 13 45 24 Q41 16 32 16 Q23 16 19 24 Z" fill={pal.hair} />
            <path d="M24 16 Q28 13 32 13" fill="none" stroke={pal.glowLight} strokeWidth="1.5" opacity="0.7" />
            <line x1="49" y1="20" x2="49" y2="52" stroke="#5b3a1e" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="49" cy="16" rx="5" ry="7" fill={pal.accent} transform="rotate(20 49 16)" />
            <circle cx="32" cy="46" r="2.5" fill={pal.accent} />
          </g>
        }
      />
    );
  }

  if (id === 'quill') {
    return (
      <Portrait
        pal={pal}
        animal
        face={
          <g>
            <circle cx="25" cy="25" r="2" fill="#1c2b3a" />
            <circle cx="39" cy="25" r="2" fill="#1c2b3a" />
            <polygon points="32,28 24,32 32,38" fill={pal.accent} />
            <path d="M20 18 Q32 12 44 18" fill="none" stroke={pal.glowLight} strokeWidth="1.5" opacity="0.7" />
          </g>
        }
      />
    );
  }

  // miso (default human branch fallback for the remaining cat)
  return (
    <Portrait
      pal={pal}
      animal
      behind={
        <g>
          <path d="M20 22 L17 9 L27 16 Z" fill={pal.hair} stroke={pal.clothDark} strokeWidth="1" />
          <path d="M44 22 L47 9 L37 16 Z" fill={pal.hair} stroke={pal.clothDark} strokeWidth="1" />
        </g>
      }
      front={
        <g>
          <path d="M24 16 Q28 13 32 13 Q36 13 40 16" fill="none" stroke={shade(pal.hair, -25)} strokeWidth="1.5" opacity="0.7" />
          <ellipse cx="32" cy="33" rx="2.6" ry="1.9" fill={pal.accent} />
        </g>
      }
      face={
        <g>
          <circle cx="25" cy="25" r="2.2" fill="#1c2b3a" />
          <circle cx="39" cy="25" r="2.2" fill="#1c2b3a" />
          <circle cx="25.8" cy="24.2" r="0.7" fill="#fff" />
          <circle cx="39.8" cy="24.2" r="0.7" fill="#fff" />
          <path d="M28 37 L36 37" stroke="#1c2b3a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M12 26 L21 28 M12 32 L21 31 M52 26 L43 28 M52 32 L43 31" stroke="#8a6238" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      }
    />
  );
}

// Boss monsters: enemies, not friends. Same epic portrait style, but with
// a red ring, sterner faces, and no friendly smile.
//
// Boss portraits generated Nov 25, 2026 (v2 style, same as the trial batch
// in generatedCompanions.ts): the four monster bosses that had no generated
// image. They are embedded base64 in generatedCompanions.ts (Derek's pick
// Nov 25, 2026, so they push through the text-only push-files route), not
// loaded from /bosses/*.webp. If a generated image fails to load, the
// component falls through to the SVG portrait below for that boss. The
// later boss rounds reuse these five drawings with new names and higher HP
// (Journey.tsx), so these four cover every round.
export function BossAvatar({ id }: { id: string }) {
  const pal = BOSS_PALS[id] ?? BOSS_PALS['the-slump'];
  const [imgFailed, setImgFailed] = useState(false);
  const generated = GENERATED_COMPANIONS[id];
  if (generated && !imgFailed) {
    return <GeneratedPortrait src={generated} pal={pal} enemy onError={() => setImgFailed(true)} />;
  }

  // Cycle 2 to 4 companions: befriendable people and animals only.
  if (id === 'wren') {
    return (
      <Portrait
        pal={pal}
        face={<FriendlyFace />}
        front={
          <g>
            <path d="M19 24 Q19 13 32 13 Q45 13 45 24 Q41 16 32 16 Q23 16 19 24 Z" fill={pal.hair} />
            <path d="M32 13 L36 6 L35 14 Z" fill={pal.accent} />
            <path d="M20 28 Q20 42 32 42 Q44 42 44 28 Q40 35 32 35 Q24 35 20 28 Z" fill={pal.hair} opacity="0.35" />
          </g>
        }
      />
    );
  }

  if (id === 'fern') {
    return (
      <Portrait
        pal={pal}
        face={<FriendlyFace />}
        front={
          <g>
            <path d="M19 24 Q19 13 32 13 Q45 13 45 24 Q41 16 32 16 Q23 16 19 24 Z" fill={pal.hair} />
            <circle cx="32" cy="12" r="3" fill={pal.accent} />
            <circle cx="29" cy="13" r="2" fill={pal.glowLight} />
            <circle cx="35" cy="13" r="2" fill={pal.glowLight} />
          </g>
        }
      />
    );
  }

  if (id === 'ansel') {
    return (
      <Portrait
        pal={pal}
        face={<FriendlyFace />}
        front={
          <g>
            <path d="M19 24 Q19 13 32 13 Q45 13 45 24 Q41 16 32 16 Q23 16 19 24 Z" fill={pal.hair} />
            <path d="M20 28 Q20 42 32 42 Q44 42 44 28 Q40 35 32 35 Q24 35 20 28 Z" fill={pal.hair} />
          </g>
        }
      />
    );
  }

  if (id === 'lark') {
    return (
      <Portrait
        pal={pal}
        animal
        behind={
          <g>
            <path d="M18 30 Q8 18 17 12 Q23 18 25 28 Z" fill={pal.glowLight} opacity="0.85" />
            <path d="M46 30 Q56 18 47 12 Q41 18 39 28 Z" fill={pal.glowLight} opacity="0.85" />
          </g>
        }
        face={
          <g>
            <circle cx="25" cy="25" r="2.4" fill="#1c2b3a" />
            <circle cx="39" cy="25" r="2.4" fill="#1c2b3a" />
            <circle cx="25.8" cy="24.2" r="0.8" fill="#fff" />
            <circle cx="39.8" cy="24.2" r="0.8" fill="#fff" />
            <polygon points="32,29 28,33 36,33" fill={pal.accent} />
            <path d="M27 33 L37 33" stroke="#1c2b3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </g>
        }
      />
    );
  }

  if (id === 'the-slump') {
    return (
      <Portrait
        pal={pal}
        enemy
        animal
        front={
          <g>
            <ellipse cx="24" cy="20" rx="9" ry="6" fill={pal.skin} opacity="0.9" />
            <ellipse cx="40" cy="20" rx="9" ry="6" fill={pal.skin} opacity="0.9" />
            <text x="50" y="14" fontSize="11" fontWeight="700" fill={pal.glowLight}>Z</text>
            <text x="55" y="7" fontSize="8" fontWeight="700" fill={pal.glowLight}>z</text>
          </g>
        }
        face={
          <g>
            <path d="M22 25 Q25 27 28 25 M36 25 Q39 27 42 25" stroke="#1c2b3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M27 33 Q32 35 37 33" stroke="#1c2b3a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </g>
        }
      />
    );
  }

  if (id === 'stiff-hips-goblin') {
    return (
      <Portrait
        pal={pal}
        enemy
        behind={
          <g>
            <path d="M20 24 L10 15 L22 18 Z" fill={pal.skin} stroke={pal.clothDark} strokeWidth="1" />
            <path d="M44 24 L54 15 L42 18 Z" fill={pal.skin} stroke={pal.clothDark} strokeWidth="1" />
          </g>
        }
        front={
          <g>
            <path d="M19 24 Q19 13 32 13 Q45 13 45 24 Q41 17 32 17 Q23 17 19 24 Z" fill={pal.hair} />
            <ellipse cx="32" cy="33" rx="3.5" ry="2.5" fill={pal.clothDark} />
            <path d="M26 38 L28 34 L30 38 M34 38 L36 34 L38 38" fill="#fff" stroke="#1c2b3a" strokeWidth="0.8" />
          </g>
        }
        face={<FriendlyFace stern />}
      />
    );
  }

  if (id === 'achy-knees-troll') {
    return (
      <Portrait
        pal={pal}
        enemy
        front={
          <g>
            <path d="M22 18 L24 9 L28 17 Z" fill={pal.hair} />
            <path d="M36 17 L40 9 L42 18 Z" fill={pal.hair} />
            <ellipse cx="32" cy="32" rx="5" ry="3.5" fill={shade(pal.skin, -25)} />
            <path d="M24 40 L26 35 L28 40 M36 40 L38 35 L40 40" fill="#fff" stroke="#1c2b3a" strokeWidth="0.8" />
          </g>
        }
        face={<FriendlyFace stern />}
      />
    );
  }

  if (id === 'tired-back-beast') {
    return (
      <Portrait
        pal={pal}
        enemy
        animal
        behind={
          <g>
            <path d="M20 22 L17 12 L27 17 Z" fill={pal.hair} />
            <path d="M44 22 L47 12 L37 17 Z" fill={pal.hair} />
          </g>
        }
        face={
          <g>
            <path d="M20 22 Q24 20 28 22 M36 22 Q40 20 44 22" stroke="#1c2b3a" strokeWidth="2" strokeLinecap="round" />
            <path d="M22 27 Q25 28 28 27 M36 27 Q39 28 42 27" stroke="#1c2b3a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <ellipse cx="32" cy="33" rx="5" ry="3.5" fill={pal.clothDark} />
            <path d="M27 39 L37 39" stroke="#1c2b3a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        }
      />
    );
  }

  // wobbly-balance-sprite
  return (
    <Portrait
      pal={pal}
      enemy
      behind={
        <g>
          <path d="M20 28 Q10 14 20 12 Q26 18 25 30 Z" fill={pal.glowLight} opacity="0.85" />
          <path d="M44 28 Q54 14 44 12 Q38 18 39 30 Z" fill={pal.glowLight} opacity="0.85" />
        </g>
      }
      front={
        <g>
          <path d="M19 24 Q19 13 32 13 Q45 13 45 24 Q41 16 32 16 Q23 16 19 24 Z" fill={pal.hair} />
          <path d="M28 14 Q32 8 36 14" fill="none" stroke={pal.accent} strokeWidth="2" strokeLinecap="round" />
        </g>
      }
      face={
        <g>
          <circle cx="27" cy="26" r="2" fill="#1c2b3a" />
          <circle cx="37" cy="26" r="2" fill="#1c2b3a" />
          <path d="M26 33 L38 33" stroke="#1c2b3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M28 34 L30 32 M36 34 L34 32" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      }
    />
  );
}
