import { useEffect, useRef, useState } from 'react';
import type { Ctx } from '../App';
import { ARMOR, CLASSES, CLASS_GOOD_FOR, CLASS_WORKOUT_FOCUS, SPELLS } from '../lib/data';
import type { ArmorPiece } from '../lib/types';
import { earnedArmorIds, levelForXp } from '../lib/store';
import { armorKind, equipSlot, equippedArmorName, equippedWeaponName, weaponKind } from '../lib/equip';
import { showToast } from '../lib/toast';
import type { GuardianState } from '../lib/store';
import type { ClassId } from '../lib/types';
import GuardianAvatar from './GuardianAvatar';
import GuardianEmote, { EMOTES } from './GuardianEmote';

// Same color, gem, hair, and build options as onboarding, so a client can
// change after signup what they picked (or skipped) at signup.
import {
  BUILD_OPTIONS,
  COLOR_HEX,
  DEFAULT_HAIR,
  GEM_HEX,
  GUARDIAN_COLORS,
  GUARDIAN_GEMS,
  HAIR_LABELS,
  HAIR_OPTIONS,
  SKIN_HEX,
  SKIN_TONES,
} from '../lib/guardianOptions';
const COLORS = [...GUARDIAN_COLORS];
const GEMS = [...GUARDIAN_GEMS];

const DEFAULT_DRAFT: GuardianState = {
  name: 'Brave Beginner',
  classId: 'Guardian',
  color: 'Navy',
  gem: 'Sapphire',
  cape: true,
  look: 'Female',
  hair: 'Long',
  build: 'Athletic',
  skinColor: 'Light',
  bodyColor: 'Navy',
  armColor: 'Navy',
  legColor: 'Navy',
  capeColor: 'Navy',
};

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
      {n.includes('claw') ? (
        <g {...common}><path d="M12 28 L16 28 L13 8 L9 12 Z" fill={tierColor} stroke="none" /><path d="M18 28 L22 28 L20 5 L18 5 Z" fill={tierColor} stroke="none" /><path d="M24 28 L28 28 L31 12 L27 8 Z" fill={tierColor} stroke="none" /><rect x="8" y="28" width="24" height="6" rx="3" fill={tierColor} stroke="none" opacity="0.9" /></g>
      ) : n.includes('hammer') ? (
        <g {...common}><rect x="10" y="7" width="20" height="11" rx="3" fill={tierColor} stroke="none" opacity="0.9" /><path d="M20 18 L20 36" strokeWidth="4" /><circle cx="20" cy="12" r="2" fill="#fff" stroke="none" /></g>
      ) : n.includes('shield') ? (
        <g {...common}><path d="M20 5 L32 9 L32 20 Q32 30 20 35 Q8 30 8 20 L8 9 Z" fill={tierColor} stroke="none" opacity="0.85" /><circle cx="20" cy="19" r="5" fill="#fff" stroke="none" /><circle cx="20" cy="19" r="2.5" fill={tierColor} stroke="none" /></g>
      ) : n.includes('lasso') ? (
        <g {...common}><circle cx="20" cy="14" r="8" /><path d="M20 22 L28 34" /><circle cx="20" cy="14" r="3" fill={tierColor} stroke="none" /></g>
      ) : n.includes('dagger') ? (
        <g {...common}><path d="M20 4 L24 14 L20 28 L16 14 Z" fill={tierColor} stroke="none" /><path d="M12 28 L28 28 M20 28 L20 36" /></g>
      ) : n.includes('sword') ? (
        <g {...common}><path d="M20 4 L24 12 L20 28 L16 12 Z" fill={tierColor} stroke="none" /><path d="M11 29 L29 29 M20 29 L20 36" /><circle cx="20" cy="14" r="2" fill="#fff" stroke="none" /></g>
      ) : n.includes('blade') || n.includes('shortblade') || n.includes('greatblade') ? (
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

// One gear row. Compact by default: name, tier, Earned / Equipped pills,
// and the Equip button. How to earn it and what it does only show when
// the client taps Details, so the vault no longer reads as a wall of
// stats. Hidden Legendary / Mythical pieces keep their old shape: name
// stays "???", only the tier and the way to unlock show.
function GearCard({ piece, earned, equipped, expanded, onToggleEquip, onToggleDetails }: {
  piece: ArmorPiece;
  earned: boolean;
  equipped?: boolean;
  expanded?: boolean;
  onToggleEquip?: () => void;
  onToggleDetails?: () => void;
}) {
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
          {equipped && <span className="tier-pill">Equipped</span>}
        </div>
        {expanded && (
          <>
            <p className="small" style={{ margin: '2px 0' }}>{piece.how}</p>
            <p className="small muted" style={{ margin: 0 }}>Effect: {piece.effect}</p>
          </>
        )}
        <div className="row" style={{ gap: 6, marginTop: 6 }}>
          {onToggleDetails && (
            <button type="button" onClick={onToggleDetails} aria-expanded={!!expanded}>
              {expanded ? 'Hide details' : 'Details'}
            </button>
          )}
          {earned && onToggleEquip && (
            <button type="button" onClick={onToggleEquip}>
              {equipped ? 'Unequip' : `Equip ${equipSlot(piece) === 'weapon' ? 'weapon' : 'armor'}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Gear groups for the full list, by what the piece is, not by tier or
// set. A piece lands in the first group whose test matches, so every
// piece shows exactly once. Weapons first, then head, chest, legs,
// hands, cloaks, belts and shoulders, then anything left over.
const GEAR_GROUPS: { id: string; label: string; test: (a: ArmorPiece) => boolean }[] = [
  { id: 'weapons', label: 'Weapons', test: (a) => !!weaponKind(a) },
  { id: 'helmets', label: 'Helmets', test: (a) => armorKind(a) === 'helm' || armorKind(a) === 'crown' },
  { id: 'chest', label: 'Chest', test: (a) => armorKind(a) === 'chest' },
  { id: 'boots', label: 'Boots and legs', test: (a) => armorKind(a) === 'boots' },
  { id: 'hands', label: 'Hands', test: (a) => armorKind(a) === 'hands' },
  { id: 'cloaks', label: 'Cloaks', test: (a) => armorKind(a) === 'cloak' },
  { id: 'belt', label: 'Belts and shoulders', test: (a) => armorKind(a) === 'belt' || armorKind(a) === 'pauldrons' },
  { id: 'other', label: 'Other gear', test: () => true },
];

export default function Armor({ ctx }: { ctx: Ctx }) {
  const { doc, update } = ctx;
  // The "new gear" badge and the top notice stay while you are on this
  // tab, and clear when you leave it: the seen count is only ever raised
  // on unmount. Refs, not the first render's closure, so leaving never
  // writes a stale copy of the profile over newer progress.
  const docRef = useRef(doc);
  docRef.current = doc;
  const updateRef = useRef(update);
  updateRef.current = update;
  useEffect(
    () => () => {
      const d = docRef.current;
      const earned = earnedArmorIds(d).length;
      if (earned > (d.armorSeenCount || 0)) {
        updateRef.current((x) => {
          x.armorSeenCount = earnedArmorIds(x).length;
        });
      }
    },
    [],
  );
  const earned = new Set(doc.armorEarned);
  const rarityEarned = new Set(doc.rarityEarned);
  const earnedCount = ARMOR.filter((a) => earned.has(a.id) || rarityEarned.has(a.id)).length;
  const next = ARMOR.find((a) => !earned.has(a.id) && !rarityEarned.has(a.id));
  const nextHidden = next && (next.tier === 'Legendary' || next.tier === 'Mythical');
  // Gear view state: the full list stays hidden behind "Show all gear",
  // and one piece at a time shows its details. Nothing is removed.
  const [showAllGear, setShowAllGear] = useState(false);
  const [expandedGearId, setExpandedGearId] = useState<string | null>(null);
  const isEarned = (a: ArmorPiece) => earned.has(a.id) || rarityEarned.has(a.id);
  const gearCardProps = (a: ArmorPiece) => ({
    earned: isEarned(a),
    equipped: doc.guardian?.equippedWeaponId === a.id || doc.guardian?.equippedArmorId === a.id,
    expanded: expandedGearId === a.id,
    onToggleEquip: () => toggleEquip(a),
    onToggleDetails: () => setExpandedGearId((cur) => (cur === a.id ? null : a.id)),
  });
  // Wearing now: the two equipped pieces, weapon and armor. Up next: the
  // next two unearned pieces in vault order, so there is always something
  // close to aim at. Full list: grouped by type, earned first in each
  // group, then still to earn.
  const equippedWeapon = ARMOR.find((a) => a.id === doc.guardian?.equippedWeaponId);
  const equippedArmor = ARMOR.find((a) => a.id === doc.guardian?.equippedArmorId);
  const nextPieces = ARMOR.filter((a) => !isEarned(a)).slice(0, 2);
  const gearGroups = GEAR_GROUPS.map((g) => {
    const pieces = ARMOR.filter((a) => g.test(a)).sort((x, y) => Number(isEarned(y)) - Number(isEarned(x)));
    return { ...g, pieces, earnedCount: pieces.filter(isEarned).length };
  }).filter((g) => g.pieces.length > 0);
  const [showCustomize, setShowCustomize] = useState(false);
  const [draft, setDraft] = useState<GuardianState>(DEFAULT_DRAFT);
  const [customizeMsg, setCustomizeMsg] = useState('');

  const openCustomize = () => {
    const g = doc.guardian;
    const color = g?.color || 'Navy';
    const look = g?.look || 'Female';
    setDraft({
      name: g?.name || 'Brave Beginner',
      classId: (g?.classId || 'Guardian') as ClassId,
      color,
      gem: g?.gem || 'Sapphire',
      cape: g?.cape ?? true,
      look,
      hair: g?.hair || DEFAULT_HAIR[look],
      build: g?.build || 'Athletic',
      skinColor: g?.skinColor || 'Light',
      bodyColor: g?.bodyColor || color,
      armColor: g?.armColor || color,
      legColor: g?.legColor || color,
      capeColor: g?.capeColor || color,
      equippedWeaponId: g?.equippedWeaponId,
      equippedArmorId: g?.equippedArmorId,
      mood: g?.mood || 'determined',
    });
    setCustomizeMsg('');
    setShowCustomize(true);
  };

  // Equip (Derek, Nov 22 8:53 PM): one weapon slot + one armor slot.
  // Only earned pieces get a button (GearCard hides it otherwise), so
  // this never equips a locked piece. Tapping an equipped piece unequips
  // it; tapping another piece in the same slot swaps it. The guardian
  // (Classic SVG) changes at once — Today and the Armor preview both
  // render from doc.guardian.
  const toggleEquip = (piece: ArmorPiece) => {
    if (!doc.guardian) return;
    const slot = equipSlot(piece);
    const field = slot === 'weapon' ? 'equippedWeaponId' : 'equippedArmorId';
    const isEquipped = doc.guardian[field] === piece.id;
    update((d) => {
      if (!d.guardian) return;
      d.guardian[field] = isEquipped ? undefined : piece.id;
    });
    showToast(isEquipped ? `Unequipped ${piece.name}.` : `Equipped ${piece.name}.`);
  };

  return (
    <div>
      <div className="card gold-frame">
        <GuardianAvatar guardian={doc.guardian} level={levelForXp(doc.xp)} size="large" />
        <div className="creature">
          <div>
            <h2>Armor vault</h2>
            <p>
              {doc.guardian ? `${doc.guardian.name}, Level ${doc.level}` : 'Your guardian'} · {earnedCount} {earnedCount === 1 ? 'piece' : 'pieces'} earned
              {next ? ` · Next: ${nextHidden ? '??? (hidden until earned)' : next.name}` : ''}
            </p>
            <p className="small muted">Armor and weapons never block a workout, quest, check-in, or retest. They are earned, one at a time, from real milestones.</p>
            <p className="small">
              {equippedWeaponName(doc.guardian) || equippedArmorName(doc.guardian)
                ? `Equipped: ${[equippedWeaponName(doc.guardian), equippedArmorName(doc.guardian)].filter(Boolean).join(' · ')}`
                : 'Nothing equipped yet. Equip earned gear below and your guardian changes.'}
            </p>
            {doc.guardian && <p className="small">{CLASS_GOOD_FOR[doc.guardian.classId] || ''}</p>}
            {doc.guardian && CLASS_WORKOUT_FOCUS[doc.guardian.classId] && (
              <p className="small"><strong>{CLASS_WORKOUT_FOCUS[doc.guardian.classId].line}</strong></p>
            )}
            {doc.guardian && (
              <p className="small muted">Change class, color, gem, cape, look, skin color, or name in Customize guardian below. Your XP, level, and armor stay.</p>
            )}
            {/* TOGGLE, not open-only: the old handler called
                openCustomize() every time, which always ran
                setShowCustomize(true) — so "Close customize" did
                nothing (and re-initialised the draft). Closing
                discards the unsaved draft, exactly like Cancel. */}
            <button onClick={() => { if (showCustomize) { setShowCustomize(false); setCustomizeMsg(''); } else { openCustomize(); } }}>
              {showCustomize ? 'Close customize' : 'Customize guardian'}
            </button>
            {customizeMsg && <p className="small" style={{ color: '#1e7a46' }}>{customizeMsg}</p>}
          </div>
        </div>
      </div>

      {showCustomize && (
        <div className="card">
          <h3>Customize guardian</h3>
          <p className="small muted">Change how your guardian looks, any time. Your XP, level, armor, workouts, and progress stay the same. Changing class also changes spells, weapon, and workout focus.</p>
          <div className="guardian-sticky-preview">
            <GuardianAvatar guardian={draft} level={levelForXp(doc.xp)} size="compact" label={`${draft.name.trim() || 'Your guardian'} the ${draft.classId} · Level ${levelForXp(doc.xp)}`} />
            <div className="guardian-preview-text">
              <strong>{draft.name.trim() || 'Your guardian'} the {draft.classId}</strong>
              <p className="small muted" style={{ margin: '2px 0 0' }}>Level {levelForXp(doc.xp)} · {draft.look} · {HAIR_LABELS[draft.hair ?? 'Long'] || draft.hair}</p>
              <p className="small" style={{ margin: '2px 0 0' }}>
                {equippedWeaponName(draft) || equippedArmorName(draft)
                  ? `Equipped: ${[equippedWeaponName(draft), equippedArmorName(draft)].filter(Boolean).join(' · ')}`
                  : 'Nothing equipped.'}
              </p>
            </div>
          </div>
          <label htmlFor="g-custom-name">Guardian name</label>
          <input
            id="g-custom-name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="e.g. Brave Beginner"
          />
          <label htmlFor="g-custom-class">Class</label>
          <select
            id="g-custom-class"
            value={draft.classId}
            onChange={(e) => setDraft((d) => ({ ...d, classId: e.target.value as ClassId }))}
          >
            {CLASSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <p className="small">{CLASS_GOOD_FOR[draft.classId] || ''}</p>
          <label>Guardian look</label>
          <div className="row">
            {(['Female', 'Male'] as const).map((l) => (
              <button key={l} type="button" onClick={() => setDraft((d) => ({ ...d, look: l, hair: DEFAULT_HAIR[l] }))} style={draft.look === l ? { background: '#124571', color: '#fff' } : {}}>
                {l}
              </button>
            ))}
          </div>
          <label>Hair style</label>
          <div className="row">
            {HAIR_OPTIONS[draft.look || 'Female'].map((h) => (
              <button key={h} type="button" onClick={() => setDraft((d) => ({ ...d, hair: h }))} style={draft.hair === h ? { background: '#124571', color: '#fff' } : {}}>
                {HAIR_LABELS[h] || h}
              </button>
            ))}
          </div>
          <label>Skin color</label>
          <div className="row">
            {SKIN_TONES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, skinColor: s }))}
                style={draft.skinColor === s ? { background: '#124571', color: '#fff', borderColor: '#c9a227', borderWidth: 2 } : {}}
                aria-pressed={draft.skinColor === s}
              >
                <span aria-hidden style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: SKIN_HEX[s], marginRight: 6, verticalAlign: 'middle', border: '1px solid #5b6b7a' }} />
                {s}
              </button>
            ))}
          </div>
                    <label>Build</label>
          <div className="row">
            {BUILD_OPTIONS.map((b) => (
              <button key={b} type="button" onClick={() => setDraft((d) => ({ ...d, build: b }))} style={draft.build === b ? { background: '#124571', color: '#fff' } : {}}>
                {b}
              </button>
            ))}
          </div>
          <label>Overall color</label>
          <div className="row">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, color: c, bodyColor: c, armColor: c, legColor: c, capeColor: c }))}
                style={draft.color === c ? { background: '#124571', color: '#fff', borderColor: '#c9a227', borderWidth: 2 } : {}}
                aria-pressed={draft.color === c}
              >
                <span aria-hidden style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: COLOR_HEX[c], marginRight: 6, verticalAlign: 'middle', border: '1px solid #5b6b7a' }} />
                {c}
              </button>
            ))}
          </div>
          <p className="small muted">Pick one color for everything, or change each part below.</p>
          <h4 style={{ margin: '14px 0 4px' }}>Colors, by part</h4>
          {([
            ['Body', 'bodyColor'],
            ['Arms', 'armColor'],
            ['Legs', 'legColor'],
            ['Cape', 'capeColor'],
          ] as const).map(([label, field]) => (
            <div key={field}>
              <label>{label}</label>
              <div className="row">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, [field]: c }))}
                    style={draft[field] === c ? { background: '#124571', color: '#fff', borderColor: '#c9a227', borderWidth: 2 } : {}}
                    aria-pressed={draft[field] === c}
                  >
                    <span aria-hidden style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: COLOR_HEX[c], marginRight: 6, verticalAlign: 'middle', border: '1px solid #5b6b7a' }} />
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="row" style={{ marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setDraft((d) => { const c = d.bodyColor || d.color; return { ...d, armColor: c, legColor: c, capeColor: c, color: c }; })}
            >
              Match all to Body color
            </button>
          </div>
          <label>Gem</label>
          <div className="row">
            {GEMS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, gem: g }))}
                style={draft.gem === g ? { background: '#124571', color: '#fff', borderColor: '#c9a227', borderWidth: 2 } : {}}
                aria-pressed={draft.gem === g}
              >
                <span aria-hidden style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: GEM_HEX[g], marginRight: 6, verticalAlign: 'middle', border: '1px solid #5b6b7a' }} />
                {g}
              </button>
            ))}
          </div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={draft.cape} onChange={(e) => setDraft((d) => ({ ...d, cape: e.target.checked }))} style={{ width: 'auto', minHeight: 0 }} /> Cape
          </label>
          <h4 style={{ margin: '14px 0 4px' }}>Default mood</h4>
          <p className="small muted">Your guardian's usual face — not stuck on angry. Pick one; the preview above changes at once. On Today the face can still change for the day based on how you are doing (tired after a short night, celebrating a personal record), and Today will say why.</p>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            {EMOTES.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, mood: e.id }))}
                style={draft.mood === e.id ? { background: '#124571', color: '#fff', borderColor: '#c9a227', borderWidth: 2 } : {}}
                aria-pressed={draft.mood === e.id}
              >
                <span style={{ display: 'block', textAlign: 'center' }}>
                  <GuardianEmote emote={e.id} guardian={draft} size={44} />
                </span>
                {e.label}
              </button>
            ))}
          </div>
          {doc.guardian && draft.classId !== doc.guardian.classId && (
            <p className="small">Switching to {draft.classId} changes your spells, class weapon, and workout focus. Your XP, level, and armor stay.</p>
          )}
          <div className="row" style={{ marginTop: 12 }}>
            <button
              className="primary"
              disabled={!draft.name.trim()}
              onClick={() => {
                const name = draft.name.trim();
                update((d) => {
                  d.guardian = { ...draft, name };
                  d.guardianPicked = true;
                });
                setShowCustomize(false);
                setCustomizeMsg(`Guardian updated. ${name} is ready.`);
              }}
            >
              Save guardian
            </button>
            <button onClick={() => { setShowCustomize(false); setCustomizeMsg(''); }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Spells and abilities</h3>
        {SPELLS.filter((s) => {
          // Second Wind is shared by every class but only from Level 9,
          // here as on Journey. Showing it at Level 1 was a lie.
          if (s.id === 'second-wind') return levelForXp(doc.xp) >= 9;
          return s.classId === 'any' || s.classId === doc.guardian?.classId;
        }).map((s) => (
          <p key={s.id}><strong>{s.name}</strong>: {s.blurb} ({s.cost} mana, {s.damage} damage)</p>
        ))}
        <p className="small muted">Second Wind unlocks at Level 9 for every class.</p>
      </div>

      <div className="card">
        <h3>Wearing now</h3>
        <p className="small muted">What your guardian has on. Tap Details on a piece to see how you earned it and what it does.</p>
        {equippedWeapon && <GearCard key={equippedWeapon.id} piece={equippedWeapon} {...gearCardProps(equippedWeapon)} />}
        {equippedArmor && <GearCard key={equippedArmor.id} piece={equippedArmor} {...gearCardProps(equippedArmor)} />}
        {!equippedWeapon && !equippedArmor && (
          <p className="small">Nothing equipped yet. Equip earned gear below and your guardian changes.</p>
        )}
      </div>

      <div className="card">
        <h3>Up next</h3>
        <p className="small muted">The next pieces to aim at, in vault order.</p>
        {nextPieces.map((a) => (
          <GearCard key={a.id} piece={a} {...gearCardProps(a)} />
        ))}
        {nextPieces.length === 0 && <p className="small">Every piece earned. Nothing left to aim at.</p>}
      </div>

      <div className="card" id="gear-list">
        <h3>All gear</h3>
        <p className="small muted">
          {earnedCount} of {ARMOR.length} pieces earned. Grouped by type, earned pieces first in each group.
          Legendary and Mythical pieces stay hidden as ??? until earned. Equipping a full helmet puts it on your guardian.
        </p>
        <button type="button" onClick={() => setShowAllGear((v) => !v)} aria-expanded={showAllGear}>
          {showAllGear ? 'Hide all gear' : 'Show all gear'}
        </button>
        {showAllGear && gearGroups.map((g) => (
          <div key={g.id}>
            <h4 style={{ margin: '14px 0 4px' }}>{g.label} ({g.earnedCount} of {g.pieces.length} earned)</h4>
            {g.pieces.map((a) => (
              <GearCard key={a.id} piece={a} {...gearCardProps(a)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
