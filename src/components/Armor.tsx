import { useEffect, useRef, useState } from 'react';
import type { Ctx } from '../App';
import { ARMOR, CLASSES, CLASS_GOOD_FOR, CLASS_WORKOUT_FOCUS, SPELLS } from '../lib/data';
import type { ArmorPiece } from '../lib/types';
import { earnedArmorIds, levelForXp } from '../lib/store';
import type { GuardianState } from '../lib/store';
import type { ClassId } from '../lib/types';
import GuardianAvatar from './GuardianAvatar';

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
      {n.includes('hammer') ? (
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
      bodyColor: g?.bodyColor || color,
      armColor: g?.armColor || color,
      legColor: g?.legColor || color,
      capeColor: g?.capeColor || color,
    });
    setCustomizeMsg('');
    setShowCustomize(true);
  };

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
              {doc.guardian ? `${doc.guardian.name}, Level ${doc.level}` : 'Your guardian'} · {earnedCount} {earnedCount === 1 ? 'piece' : 'pieces'} earned
              {next ? ` · Next: ${nextHidden ? '??? (hidden until earned)' : next.name}` : ''}
            </p>
            <p className="small muted">Armor and weapons never block a workout, quest, check-in, or retest. They are earned, one at a time, from real milestones.</p>
            {doc.guardian && <p className="small">{CLASS_GOOD_FOR[doc.guardian.classId] || ''}</p>}
            {doc.guardian && CLASS_WORKOUT_FOCUS[doc.guardian.classId] && (
              <p className="small"><strong>{CLASS_WORKOUT_FOCUS[doc.guardian.classId].line}</strong></p>
            )}
            {doc.guardian && (
              <p className="small muted">Change class, color, gem, cape, look, or name in Customize guardian below. Your XP, level, and armor stay.</p>
            )}
            <button onClick={openCustomize}>
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
          <GuardianAvatar guardian={draft} level={levelForXp(doc.xp)} size="medium" label={`${draft.name.trim() || 'Your guardian'} the ${draft.classId} · Level ${levelForXp(doc.xp)}`} />
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

      {(['Common', 'Rare', 'Legendary', 'Mythical'] as const).map((tier) => (
        <div className="card" key={tier} id={tier === 'Common' ? 'gear-list' : undefined}>
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
      <div className="card">
        <h3>Epic weapons</h3>
        <p className="small muted">Famous weapons, retold. Earned from real milestones, never bought. Legendary and Mythical pieces stay hidden until earned.</p>
        {bySet('Epic weapons').map((a) => (
          <GearCard key={a.id} piece={a} earned={earned.has(a.id) || rarityEarned.has(a.id)} />
        ))}
      </div>
    </div>
  );
}
