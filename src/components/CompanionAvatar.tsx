// Small pure-SVG portraits for companions and bosses, in the same friendly
// style as the guardian avatar. No external images, no AI images.
// Each is a 56x56 drawing that sits inside the gold-ringed .avatar circle.
// Bosses stay enemies: no cute befriending, just a clear face to fight.
export default function CompanionAvatar({ id }: { id: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 56 56" role="img" aria-label={id} style={{ display: 'block' }}>
      {id === 'bram' && (
        <g>
          <rect x="14" y="36" width="28" height="14" rx="4" fill="#5b3a1e" />
          <rect x="24" y="36" width="8" height="14" fill="#8a6d00" />
          <circle cx="28" cy="26" r="12" fill="#f7d9ae" />
          <path d="M16 28 Q16 44 28 44 Q40 44 40 28 Q36 36 28 36 Q20 36 16 28 Z" fill="#8a6238" />
          <path d="M16 22 Q16 12 28 12 Q40 12 40 22 Q36 16 28 16 Q20 16 16 22 Z" fill="#9aa5b1" />
          <circle cx="23" cy="24" r="1.8" fill="#1c2b3a" />
          <circle cx="33" cy="24" r="1.8" fill="#1c2b3a" />
          <path d="M25 31 Q28 33 31 31" stroke="#1c2b3a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <g transform="rotate(-30 46 40)">
            <rect x="44" y="28" width="4" height="16" rx="2" fill="#5b3a1e" />
            <rect x="38" y="24" width="16" height="7" rx="2" fill="#7d93a8" />
          </g>
        </g>
      )}
      {id === 'sylva' && (
        <g>
          <path d="M14 20 L8 12 L18 16 Z" fill="#f7d9ae" />
          <path d="M42 20 L48 12 L38 16 Z" fill="#f7d9ae" />
          <circle cx="28" cy="26" r="12" fill="#f7d9ae" />
          <path d="M16 24 Q16 12 28 12 Q40 12 40 24 Q36 16 28 16 Q20 16 16 24 Z" fill="#e8c85a" />
          <circle cx="23" cy="26" r="1.8" fill="#1c2b3a" />
          <circle cx="33" cy="26" r="1.8" fill="#1c2b3a" />
          <path d="M24 32 Q28 35 32 32" stroke="#1c2b3a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M14 38 L42 38 L38 50 L18 50 Z" fill="#1e7a46" />
          <circle cx="28" cy="42" r="3" fill="#2f6fd0" />
        </g>
      )}
      {id === 'kaelith' && (
        <g>
          <path d="M12 30 Q6 14 20 16 Q26 8 30 18 Q38 10 40 22 Q48 20 44 32 Q36 40 24 38 Q14 38 12 30 Z" fill="#2f6f5a" />
          <path d="M20 16 L22 10 L26 15 Z" fill="#f2d878" />
          <path d="M32 14 L35 8 L37 14 Z" fill="#f2d878" />
          <circle cx="24" cy="26" r="2.2" fill="#fff" />
          <circle cx="24" cy="26" r="1.1" fill="#1c2b3a" />
          <circle cx="34" cy="26" r="2.2" fill="#fff" />
          <circle cx="34" cy="26" r="1.1" fill="#1c2b3a" />
          <path d="M26 32 Q29 35 32 32" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M40 34 Q48 38 46 46 Q42 42 38 40 Z" fill="#2f6f5a" />
        </g>
      )}
      {id === 'tilda' && (
        <g>
          <circle cx="28" cy="24" r="11" fill="#f7d9ae" />
          <circle cx="18" cy="16" r="4" fill="#8a6238" />
          <circle cx="38" cy="16" r="4" fill="#8a6238" />
          <path d="M17 22 Q17 13 28 13 Q39 13 39 22 Q35 16 28 16 Q21 16 17 22 Z" fill="#8a6238" />
          <circle cx="23" cy="24" r="1.8" fill="#1c2b3a" />
          <circle cx="33" cy="24" r="1.8" fill="#1c2b3a" />
          <path d="M24 29 Q28 32 32 29" stroke="#1c2b3a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M16 38 L40 38 L38 50 L18 50 Z" fill="#a83232" />
          <path d="M22 38 L34 38 L33 50 L23 50 Z" fill="#fffdf4" />
        </g>
      )}
      {id === 'pip' && (
        <g>
          <path d="M28 4 L36 24 L20 24 Z" fill="#2f6fd0" />
          <circle cx="28" cy="26" r="11" fill="#f7d9ae" />
          <path d="M18 28 Q18 40 28 40 Q38 40 38 28 Q34 34 28 34 Q22 34 18 28 Z" fill="#e8e2d4" />
          <circle cx="23" cy="24" r="1.8" fill="#1c2b3a" />
          <circle cx="33" cy="24" r="1.8" fill="#1c2b3a" />
          <path d="M24 29 Q28 31 32 29" stroke="#1c2b3a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M14 40 L42 40 L40 50 L16 50 Z" fill="#2f6fd0" />
          <rect x="42" y="38" width="10" height="8" rx="2" fill="#f6ecd0" stroke="#8a6d00" />
        </g>
      )}
      {id === 'hoot' && (
        <g>
          <ellipse cx="28" cy="30" rx="15" ry="17" fill="#8a6238" />
          <path d="M20 16 L24 10 L26 16 Z" fill="#8a6238" />
          <path d="M32 16 L36 10 L38 16 Z" fill="#8a6238" />
          <circle cx="22" cy="26" r="6" fill="#fff" />
          <circle cx="34" cy="26" r="6" fill="#fff" />
          <circle cx="22" cy="26" r="2.8" fill="#1c2b3a" />
          <circle cx="34" cy="26" r="2.8" fill="#1c2b3a" />
          <polygon points="28,30 24,34 32,34" fill="#e8a91c" />
          <ellipse cx="28" cy="40" rx="8" ry="6" fill="#e8e2d4" opacity="0.7" />
        </g>
      )}
      {id === 'ash' && (
        <g>
          <path d="M16 22 L14 8 L24 16 Z" fill="#5b6b7a" />
          <path d="M40 22 L42 8 L32 16 Z" fill="#5b6b7a" />
          <ellipse cx="28" cy="30" rx="14" ry="13" fill="#8a9aa8" />
          <ellipse cx="28" cy="36" rx="8" ry="7" fill="#e8e2d4" />
          <circle cx="21" cy="26" r="2.2" fill="#f2d878" />
          <circle cx="35" cy="26" r="2.2" fill="#f2d878" />
          <circle cx="21" cy="26" r="1.1" fill="#1c2b3a" />
          <circle cx="35" cy="26" r="1.1" fill="#1c2b3a" />
          <ellipse cx="28" cy="36" rx="3.5" ry="2.5" fill="#1c2b3a" />
          <path d="M28 38 L28 41 M24 41 Q28 44 32 41" stroke="#1c2b3a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
      )}
      {id === 'ember' && (
        <g>
          <path d="M14 28 Q8 16 18 16 Q22 8 28 16 Q36 8 38 18 Q46 18 42 28 Q36 36 28 36 Q18 36 14 28 Z" fill="#e8702a" />
          <path d="M24 14 L26 8 L29 13 Z" fill="#f2d878" />
          <path d="M32 13 L34 7 L37 12 Z" fill="#f2d878" />
          <circle cx="23" cy="24" r="2" fill="#fff" />
          <circle cx="33" cy="24" r="2" fill="#fff" />
          <circle cx="23" cy="24" r="1" fill="#1c2b3a" />
          <circle cx="33" cy="24" r="1" fill="#1c2b3a" />
          <path d="M24 30 Q28 33 32 30" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M40 30 Q48 34 46 42 Q42 38 38 36 Z" fill="#e8702a" />
          <path d="M14 30 Q8 26 12 20 Q16 24 18 28 Z" fill="#f2a541" />
        </g>
      )}
      {id === 'rowan' && (
        <g>
          <circle cx="28" cy="26" r="12" fill="#f7d9ae" />
          <path d="M17 28 Q17 42 28 42 Q39 42 39 28 Q35 35 28 35 Q21 35 17 28 Z" fill="#e8e2d4" />
          <path d="M16 22 Q16 12 28 12 Q40 12 40 22 Q36 15 28 15 Q20 15 16 22 Z" fill="#c8ccd0" />
          <circle cx="23" cy="24" r="1.8" fill="#1c2b3a" />
          <circle cx="33" cy="24" r="1.8" fill="#1c2b3a" />
          <path d="M24 30 Q28 32 32 30" stroke="#1c2b3a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M14 40 L42 40 L40 50 L16 50 Z" fill="#5b6b7a" />
          <path d="M44 36 L52 36 L52 46 Q48 51 44 46 Z" fill="#b9c9d8" stroke="#c9a227" strokeWidth="1.5" />
        </g>
      )}
      {id === 'mara' && (
        <g>
          <circle cx="28" cy="24" r="11" fill="#f7d9ae" />
          <path d="M17 22 Q17 12 28 12 Q39 12 39 22 Q35 16 28 16 Q21 16 17 22 Z" fill="#5b3a1e" />
          <circle cx="23" cy="24" r="1.8" fill="#1c2b3a" />
          <circle cx="33" cy="24" r="1.8" fill="#1c2b3a" />
          <path d="M24 29 Q28 32 32 29" stroke="#1c2b3a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M16 38 L40 38 L38 50 L18 50 Z" fill="#fffdf4" stroke="#1e7a46" strokeWidth="1.5" />
          <path d="M28 38 L28 50" stroke="#1e7a46" strokeWidth="1.5" />
          <rect x="44" y="18" width="3" height="30" rx="1.5" fill="#5b3a1e" />
          <ellipse cx="45" cy="14" rx="5" ry="7" fill="#1e7a46" transform="rotate(20 45 14)" />
        </g>
      )}
      {id === 'quill' && (
        <g>
          <ellipse cx="28" cy="30" rx="14" ry="15" fill="#1c2b3a" />
          <path d="M18 20 Q28 12 38 20 Q38 12 28 10 Q18 12 18 20 Z" fill="#1c2b3a" />
          <circle cx="22" cy="26" r="2.5" fill="#fff" />
          <circle cx="34" cy="26" r="2.5" fill="#fff" />
          <circle cx="22" cy="26" r="1.2" fill="#1c2b3a" />
          <circle cx="34" cy="26" r="1.2" fill="#1c2b3a" />
          <polygon points="28,30 22,33 28,38" fill="#e8a91c" />
          <path d="M36 32 Q46 36 44 44 Q40 40 36 38 Z" fill="#2a3a4a" />
        </g>
      )}
      {id === 'miso' && (
        <g>
          <path d="M18 22 L16 10 L26 16 Z" fill="#e8a91c" />
          <path d="M38 22 L40 10 L30 16 Z" fill="#e8a91c" />
          <circle cx="28" cy="28" r="13" fill="#f2a541" />
          <circle cx="22" cy="26" r="2" fill="#1c2b3a" />
          <circle cx="34" cy="26" r="2" fill="#1c2b3a" />
          <ellipse cx="28" cy="33" rx="2.5" ry="1.8" fill="#c96a7a" />
          <path d="M28 35 L28 37 M24 37 Q28 39 32 37" stroke="#1c2b3a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M10 28 L18 30 M10 34 L18 33 M46 28 L38 30 M46 34 L38 33" stroke="#8a6238" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}
      {id === 'unknown' && (
        <g>
          <circle cx="28" cy="22" r="9" fill="#5b6b7a" />
          <path d="M12 50 Q12 34 28 34 Q44 34 44 50 Z" fill="#5b6b7a" />
          <text x="28" y="27" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">?</text>
        </g>
      )}
    </svg>
  );
}

// Boss monsters: enemies, not friends. Same small SVG style, sterner faces.
export function BossAvatar({ id }: { id: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 56 56" role="img" aria-label={id} style={{ display: 'block' }}>
      {id === 'the-slump' && (
        <g>
          <ellipse cx="20" cy="32" rx="12" ry="9" fill="#8a9aa8" />
          <ellipse cx="32" cy="28" rx="13" ry="11" fill="#a8b6c2" />
          <ellipse cx="40" cy="34" rx="9" ry="7" fill="#8a9aa8" />
          <path d="M24 28 Q27 30 30 28 M34 28 Q37 30 40 28" stroke="#1c2b3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M28 34 Q31 36 34 34" stroke="#1c2b3a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <text x="46" y="16" fontSize="11" fontWeight="700" fill="#5b6b7a">Z</text>
          <text x="50" y="9" fontSize="8" fontWeight="700" fill="#5b6b7a">z</text>
        </g>
      )}
      {id === 'stiff-hips-goblin' && (
        <g>
          <path d="M14 24 L6 16 L14 14 Z" fill="#3f9e4d" />
          <path d="M42 24 L50 16 L42 14 Z" fill="#3f9e4d" />
          <circle cx="28" cy="28" r="13" fill="#57b368" />
          <path d="M20 20 L26 23 M36 20 L30 23" stroke="#1c2b3a" strokeWidth="2" strokeLinecap="round" />
          <circle cx="22" cy="28" r="2" fill="#1c2b3a" />
          <circle cx="34" cy="28" r="2" fill="#1c2b3a" />
          <ellipse cx="28" cy="35" rx="3" ry="2" fill="#1c2b3a" />
          <path d="M24 40 Q28 38 32 40" stroke="#1c2b3a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M16 40 L40 40 L38 50 L18 50 Z" fill="#5b3a1e" />
        </g>
      )}
      {id === 'achy-knees-troll' && (
        <g>
          <circle cx="28" cy="26" r="15" fill="#8a9aa8" />
          <path d="M18 18 L20 10 L24 17 Z" fill="#c8ccd0" />
          <path d="M34 17 L38 10 L40 18 Z" fill="#c8ccd0" />
          <path d="M18 22 L26 24 M38 22 L30 24" stroke="#1c2b3a" strokeWidth="2" strokeLinecap="round" />
          <circle cx="22" cy="28" r="2.2" fill="#1c2b3a" />
          <circle cx="34" cy="28" r="2.2" fill="#1c2b3a" />
          <ellipse cx="28" cy="33" rx="4" ry="3" fill="#6d7d8c" />
          <path d="M22 40 L24 36 M34 40 L32 36" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 42 Q28 44 34 42" stroke="#1c2b3a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M12 42 L44 42 L42 50 L14 50 Z" fill="#5b6b7a" />
        </g>
      )}
      {id === 'tired-back-beast' && (
        <g>
          <ellipse cx="28" cy="30" rx="16" ry="14" fill="#8a6238" />
          <path d="M16 20 L14 12 L22 16 Z" fill="#8a6238" />
          <path d="M40 20 L42 12 L34 16 Z" fill="#8a6238" />
          <path d="M18 22 Q22 20 26 22 M30 22 Q34 20 38 22" stroke="#1c2b3a" strokeWidth="2" strokeLinecap="round" />
          <path d="M20 26 Q23 27 26 26 M30 26 Q33 27 36 26" stroke="#1c2b3a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <ellipse cx="28" cy="34" rx="5" ry="3.5" fill="#5b3a1e" />
          <path d="M24 40 Q28 38 32 40" stroke="#1c2b3a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M14 44 Q28 48 42 44" stroke="#5b3a1e" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )}
      {id === 'wobbly-balance-sprite' && (
        <g>
          <path d="M18 24 Q10 12 20 12 Q24 18 22 26 Z" fill="#b9a7e8" opacity="0.9" />
          <path d="M38 24 Q46 12 36 12 Q32 18 34 26 Z" fill="#b9a7e8" opacity="0.9" />
          <circle cx="28" cy="28" r="11" fill="#c9b8f2" />
          <circle cx="23" cy="26" r="2" fill="#1c2b3a" />
          <circle cx="33" cy="26" r="2" fill="#1c2b3a" />
          <path d="M22 31 Q28 36 34 31" stroke="#1c2b3a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M24 18 Q28 12 32 18" stroke="#7b2fbe" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M18 40 L38 40 L36 50 L20 50 Z" fill="#7b2fbe" />
        </g>
      )}
    </svg>
  );
}
