import { useState } from 'react';
import type { Ctx } from '../App';
import { ARMOR, CLASSES, CLASS_GOOD_FOR, CLASS_WORKOUT_FOCUS, SPELLS } from '../lib/data';
import type { ArmorPiece } from '../lib/types';
import { levelForXp } from '../lib/store';
import GuardianAvatar from './GuardianAvatar';

// Small SVG emblem per piece, picked by name. No external images.
function GearIcon({ piece }: { piece: ArmorPiece }) {
  const n = piece.name.toLowerCase();
  const tierColor =
    piece.tier === 'Mythical' ? '#7b2fbe'
    : piece.tier === 'Legendary' ? '#c9a227'
    : piece.tier === 'Rare' ? '#2f6fd0'
    : '#5b6b7a';
  const common = { stroke: tierColor, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const };
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" role="img" aria-label={piece.name} style={{ flexShrink: 0 }}>
      {n.includes('blade') || n.includes('shortblade') || n.includes('greatblade') ? (
        <g {...common}><path d="M20 4 L24 12 L20 30 L16 12 Z" fill={tierColor} stroke="none" /><path d="M12 30 L28 30 M20 30 L20 36" /></g>
      ) : n.includes('bow') ? (
        <g {...common}><path d="M28 6 Q10 20 28 34" /><line x1="28" y1="6" x2="28" y2="34" /><line x1="28" y1="20" x2="14" y2="20" /></g>
      ) : n.includes('staff') ? (
        <g {...common}><line x1="20" y1="12" x2="20" y2="36" /><polygon points="20,4 23,10 29,10 24,14 26,20 20,16 14,20 16,14 11,10 17,10" fill={tierColor} stroke="none" /></g>
      ) : n.includes('helm') ? (
        <g {...common}><path d="M8 24 Q8 10 20 10 Q32 10 32 24 Z" fill={tierColor} stroke="none" opacity="0.85" /><path d="M8 24 L32 24" /></g>
      ) : n.includes('chestplate') || n.includes('tabard') ? (
        <g {...common}><path d="M12 8 L28 8 L28 20 Q28 30 20 34 Q12 30 12 20 Z" fill={tierColor} stroke="none" opacity="0.85" /><path d="M20 12 L20 30" stroke="#fff" /></g>
      ) : n.includes('cloak') || n.includes('mantle') ? (
        <g {...common}><path d="M20 6 L30 34 L10 34 Z" fill={tierColor} stroke="none" opacity="0.85" /><circle cx="20" cy="12" r="2.5" fill="#fff" stroke="none" /></g>
      ) : n.includes('circlet') ? (
        <g {...common}><polygon points="8,26 12,12 18,22 20,10 22,22 28,12 32,26" fill={tierColor} stroke="none" opacity="0.9" /><circle cx="20" cy="26" r="2" fill={tierColor} stroke="none" /></g>
      ) : n.includes('boots') ? (
        <g {...common}><path d="M12 8 L18 8 L18 26 L30 26 L30 32 L12 32 Z" fill={tierColor} stroke="none" opacity="0.85" /></g>
      ) : n.includes('belt') ? (
        <g {...common}><rect x="8" y="15" width="24" height="9" rx="4" fill={tierColor} stroke="none" opacity="0.85" /><rect x="17" y="16" width="6" height="7" fill="#fff" stroke="none" /></g>
      ) : n.includes('gauntlet') || n.includes('gloves') || n.includes('bracers') ? (
        <g {...common}><path d="M14 8 L26 8 L26 26 Q26 32 20 32 Q14 32 14 26 Z" fill={tierColor} stroke="none" opacity="0.85" /></g>
      ) : (
        <g {...common}><polygon points="20,6 30,20 20,34 10,20" fill={tierColor} stroke="none" opacity="0.85" /></g>
      )}
    </svg>
  );
}

function GearCard({ piece, earned }: { piece: ArmorPiece; earned: boolean }) {
  // Legendary and Mythical stay hidden until earned: only the tier and the
  // way to unlock show. No name, no effect, no emblem detail.
  if (!earned && (piece.tier === 'Legendary' || piece.tier === 'Mythical')) {
    return (
      <div className={`gear-item rarity-${piece.tier.toLowerCase()} gear-hidden`}>
        <span className="gear-shine" aria-hidden />
        <svg width="40" height="40" viewBox="0 0 40 40" role="img" aria-label="Hidden gear" style={{ flexShrink: 0 }}>
          <circle cx="20" cy="20" r="16" fill="none" stroke="#7b2fbe" strokeWidth="2" strokeDasharray="4 3" />
          <text x="20" y="27" textAnchor="middle" fontSize="18" fontWeight="700" fill="#7b2fbe">?</text>
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: 6 }}>
            <strong>???</strong>
            <span className={`tier-pill tier-${piece.tier.toLowerCase()}`}>{piece.tier}</span>
            <span className="tier-pill">Hidden until earned</span>
          </div>
          <p className="small" style={{ margin: '2px 0' }}>To unlock: {piece.how}</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`gear-item rarity-${piece.tier.toLowerCase()}${earned ? ' earned' : ''}`}>
      {(piece.tier === 'Legendary' || piece.tier === 'Mythical') && <span className="gear-shine" aria-hidden />}
      {piece.tier === 'Mythical' && <span className="gear-sparkle" aria-hidden>✦</span>}
      {piece.tier === 'Mythical' && <span className="gear-sparkle second" aria-hidden>✦</span>}
      {piece.tier === 'Legendary' && <span className="gear-sparkle" aria-hidden>✦</span>}
      <GearIcon piece={piece} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row" style={{ gap: 6 }}>
          <strong>{piece.name}</strong>
          <span className={`tier-pill tier-${piece.tier.toLowerCase()}`}>{piece.tier}</span>
          {earned && <span className="tier-pill tier-earned">Earned</span>}
        </div>
        <p className="small" style={{ margin: '2px 0' }}>{piece.how}</p>
        <p className="small muted" style={{ margin: 0 }}>Effect: {piece.effect}</p>
      </div>
    </div>
  );
}

export default function Armor({ ctx }: { ctx: Ctx }) {
  const { doc, update } = ctx;
  const earned = new Set(doc.armorEarned);
  const rarityEarned = new Set(doc.rarityEarned);
  const total = ARMOR.length;
  const earnedCount = ARMOR.filter((a) => earned.has(a.id) || rarityEarned.has(a.id)).length;
  const next = ARMOR.find((a) => !earned.has(a.id) && !rarityEarned.has(a.id));
  const nextHidden = next && (next.tier === 'Legendary' || next.tier === 'Mythical');
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [confirmClass, setConfirmClass] = useState<string | null>(null);

  const byTier = (tier: string) => ARMOR.filter((a) => a.tier === tier && !a.set);
  const bySet = (set: string) => ARMOR.filter((a) => a.set === set);

  return (
    <div>
      <div className="card gold-frame">
        <GuardianAvatar guardian={doc.guardian} level={levelForXp(doc.xp)} size="large" />
        <div className="creature">
          <div>
            <h2>Armor vault</h2>
            <p>
              {doc.guardian ? `${doc.guardian.name}, Level ${doc.level}` : 'Your guardian'} · {Math.min(earnedCount, total)} of {total} pieces earned
              {next ? ` · Next: ${nextHidden ? '??? (hidden until earned)' : next.name}` : ''}
            </p>
            <p className="small muted">Armor and weapons never block a workout, quest, check-in, or retest. They are earned, one at a time, from real milestones.</p>
            {doc.guardian && <p className="small">{CLASS_GOOD_FOR[doc.guardian.classId] || ''}</p>}
            {doc.guardian && CLASS_WORKOUT_FOCUS[doc.guardian.classId] && (
              <p className="small"><strong>{CLASS_WORKOUT_FOCUS[doc.guardian.classId].line}</strong></p>
            )}
            {doc.guardian && (
              <button onClick={() => { setShowClassPicker((v) => !v); setConfirmClass(null); }}>
                {showClassPicker ? 'Close class picker' : 'Change class'}
              </button>
            )}
            {showClassPicker && doc.guardian && CLASSES.map((c) => (
              <div key={c.id} style={{ borderTop: '1px solid #d7e3ee', padding: '10px 0', textAlign: 'left' }}>
                <p>
                  <strong>{c.name}</strong>
                  {c.id === doc.guardian?.classId ? ' (your class now)' : ''}
                </p>
                <p className="small">{c.description}</p>
                <p className="small">{CLASS_GOOD_FOR[c.id] || ''}</p>
                {CLASS_WORKOUT_FOCUS[c.id] && (
                  <p className="small"><strong>Workout focus:</strong> {CLASS_WORKOUT_FOCUS[c.id].line}</p>
                )}
                {CLASS_WORKOUT_FOCUS[c.id] && (
                  <details>
                    <summary>Show more about this workout focus</summary>
                    <p className="small">{CLASS_WORKOUT_FOCUS[c.id].detail}</p>
                  </details>
                )}
                <p className="small muted">All classes keep the same phase, strength work, and compound lifts first. The class changes spells, weapon, avatar, background, AND workout focus.</p>
                {c.id !== doc.guardian?.classId && confirmClass !== c.id && (
                  <button onClick={() => setConfirmClass(c.id)}>Switch to {c.name}</button>
                )}
                {confirmClass === c.id && (
                  <div className="notice">
                    <p>Switch to {c.name}? Your spells, class weapon, and workout focus will change to {c.name}&apos;s. Your XP, level, and armor stay.</p>
                    <div className="row">
                      <button
                        className="primary"
                        onClick={() => {
                          update((d) => {
                            if (d.guardian) d.guardian.classId = c.id as 'Guardian' | 'Ranger' | 'Spellweaver';
                          });
                          setConfirmClass(null);
                          setShowClassPicker(false);
                        }}
                      >
                        Yes, switch to {c.name}
                      </button>
                      <button onClick={() => setConfirmClass(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Spells and abilities</h3>
        {SPELLS.filter((s) => s.classId === 'any' || s.classId === doc.guardian?.classId).map((s) => (
          <p key={s.id}><strong>{s.name}</strong>: {s.blurb} ({s.cost} mana, {s.damage} damage)</p>
        ))}
        <p className="small muted">Second Wind unlocks at Level 9 for every class.</p>
      </div>

      {(['Common', 'Rare', 'Legendary', 'Mythical'] as const).map((tier) => (
        <div className="card" key={tier}>
          <h3>{tier}</h3>
          <p className="small muted">
            {tier === 'Common' && 'Easiest to earn.'}
            {tier === 'Rare' && 'Challenging, but easier than Legendary and Mythical.'}
            {tier === 'Legendary' && 'Challenging, but achievable.'}
            {tier === 'Mythical' && 'Very challenging to get.'}
          </p>
          {byTier(tier).map((a) => (
            <GearCard key={a.id} piece={a} earned={earned.has(a.id) || rarityEarned.has(a.id)} />
          ))}
        </div>
      ))}

      <div className="card">
        <h3>Peakforged set (Phase 4)</h3>
        {bySet('Peakforged').map((a) => (
          <GearCard key={a.id} piece={a} earned={earned.has(a.id) || rarityEarned.has(a.id)} />
        ))}
      </div>
      <div className="card">
        <h3>Stormforged set (Phase 5)</h3>
        {bySet('Stormforged').map((a) => (
          <GearCard key={a.id} piece={a} earned={earned.has(a.id) || rarityEarned.has(a.id)} />
        ))}
      </div>
      <div className="card">
        <h3>Class weapons</h3>
        {bySet('Class weapon').map((a) => (
          <GearCard key={a.id} piece={a} earned={earned.has(a.id) || rarityEarned.has(a.id)} />
        ))}
      </div>
    </div>
  );
}
