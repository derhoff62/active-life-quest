import type { Ctx } from '../App';
import { ARMOR, SPELLS } from '../lib/data';
import { levelForXp } from '../lib/store';
import GuardianAvatar from './GuardianAvatar';

export default function Armor({ ctx }: { ctx: Ctx }) {
  const { doc } = ctx;
  const earned = new Set(doc.armorEarned);
  const rarityEarned = new Set(doc.rarityEarned);
  const total = ARMOR.length;
  const earnedCount = ARMOR.filter((a) => earned.has(a.id) || rarityEarned.has(a.id)).length + (doc.armorEarned.length ? 0 : 1);
  const next = ARMOR.find((a) => !earned.has(a.id) && !rarityEarned.has(a.id));

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
              {next ? ` · Next: ${next.name}` : ''}
            </p>
            <p className="small muted">Armor and weapons never block a workout, quest, check-in, or retest. They are earned, one at a time, from real milestones.</p>
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
            <p key={a.id} style={{ opacity: earned.has(a.id) || rarityEarned.has(a.id) ? 1 : 0.6 }}>
              <strong>{a.name}</strong>: {a.how}. Effect: {a.effect} {(earned.has(a.id) || rarityEarned.has(a.id)) ? '· Earned' : ''}
            </p>
          ))}
        </div>
      ))}

      <div className="card">
        <h3>Peakforged set (Phase 4)</h3>
        {bySet('Peakforged').map((a) => (
          <p key={a.id}><strong>{a.name}</strong>: {a.how}. Effect: {a.effect}</p>
        ))}
      </div>
      <div className="card">
        <h3>Stormforged set (Phase 5)</h3>
        {bySet('Stormforged').map((a) => (
          <p key={a.id}><strong>{a.name}</strong>: {a.how}. Effect: {a.effect}</p>
        ))}
      </div>
      <div className="card">
        <h3>Class weapons</h3>
        {bySet('Class weapon').map((a) => (
          <p key={a.id}><strong>{a.name}</strong>: {a.how}. Effect: {a.effect}</p>
        ))}
      </div>
    </div>
  );
}
