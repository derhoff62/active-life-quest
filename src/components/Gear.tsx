import type { Ctx } from '../App';
import Armor from './Armor';
import BadgesSection, { BADGE_GROUPS } from './Badges';
import { BADGES } from '../lib/data';

// Gear: everything your guardian wears and everything you have earned,
// in one tab. Armor first (what you have on, what is up next, all gear
// behind Show all gear), then badges. Badges follow the same pattern:
// the count and the next two to aim at are visible, the full list of
// 24 stays behind Show all badges. Locked badges stay as ??? with how
// to earn them, the same reveal rule as gear. Nothing is removed: the
// old Armor tab is whole above, the old badges list is whole below.
export default function Gear({ ctx }: { ctx: Ctx }) {
  const { doc, go } = ctx;
  const earnedIds = doc.badges || [];
  const earnedCount = earnedIds.length;
  // Next to aim at: the first two unearned badges, in group order.
  // Locked badges never show their name, only what to do to earn them.
  const nextUp = BADGE_GROUPS.flatMap((g) =>
    g.ids.map((id) => BADGES.find((b) => b.id === id)).filter((b): b is NonNullable<typeof b> => Boolean(b)),
  )
    .filter((b) => !earnedIds.includes(b.id))
    .slice(0, 2);
  return (
    <div>
      <Armor ctx={ctx} />
      <div className="card">
        <h3>Badges</h3>
        <p>
          <strong>{earnedCount} of {BADGES.length} earned.</strong>
        </p>
        {nextUp.length > 0 && (
          <div>
            <p className="small muted" style={{ marginBottom: 4 }}>Next to aim at:</p>
            {nextUp.map((b) => (
              <p className="small" key={b.id} style={{ margin: '4px 0' }}>??? · To unlock: {b.how}</p>
            ))}
          </div>
        )}
        {nextUp.length === 0 && <p className="small">Every badge earned.</p>}
        <details>
          <summary>
            <strong>Show all badges</strong>
          </summary>
          <BadgesSection earnedIds={earnedIds} />
        </details>
        <p className="small">
          <button onClick={() => go('journey')}>See companions on Journey</button>
        </p>
      </div>
    </div>
  );
}
