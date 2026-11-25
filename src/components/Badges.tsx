import { BADGES } from '../lib/data';
import type { Badge } from '../lib/types';
import { GENERATED_BADGES } from '../lib/generatedBadges';

// Badges, grouped by what they reward. Earned badges first inside each
// group, locked ones after. The groups are presentation only: unlock logic
// in store.ts is untouched, and every badge id here must exist in BADGES
// (a missing id is skipped, never shown as a blank row).
export const BADGE_GROUPS: { title: string; ids: string[] }[] = [
  { title: 'Training & workouts', ids: ['three-in-a-row', 'week-1-finished', 'full-sequence-week', 'two-to-three-strength', 'twenty-five-workouts', 'fifty-workouts'] },
  { title: 'Check-ins & tracking', ids: ['three-day-checkin', 'two-week-checkin', 'sleep-30', 'measurement-tracker'] },
  { title: 'Cardio & balance', ids: ['150-club', 'cardio-1000', 'balance-breakthrough'] },
  { title: 'Phases & cycles', ids: ['phase-1-finisher', 'phase-2-finisher', 'phase-3-finisher', 'cycle-1-finisher', 'cycle-2-finisher', 'cycle-3-finisher', 'cycle-4-finisher', 'year-finisher'] },
  { title: 'Personal records', ids: ['first-pr', 'five-prs', 'ten-prs'] },
];

// Simple SVG medallion for badges without a generated image: gold ring on
// navy, with one plain glyph per group. It reads at 56px, where the
// generated medallions' fine knotwork would turn to muddle.
export function BadgeMedallion({ group, size }: { group: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" role="img" aria-label="Badge" style={{ flexShrink: 0 }}>
      <circle cx="28" cy="28" r="26" fill="#124571" stroke="#c9a227" strokeWidth="3" />
      <circle cx="28" cy="28" r="20" fill="none" stroke="#c9a227" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
      <g fill="#c9a227" stroke="#c9a227" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        {group === 'Training & workouts' && (
          <g>
            <rect x="14" y="20" width="5" height="16" rx="2" />
            <rect x="37" y="20" width="5" height="16" rx="2" />
            <rect x="19" y="26" width="18" height="4" rx="2" />
          </g>
        )}
        {group === 'Check-ins & tracking' && (
          <g>
            <polygon points="20,18 22,24 28,24 23,28 25,34 20,30 15,34 17,28 12,24 18,24" fill="none" />
            <polygon points="36,26 37.5,30.5 42,30.5 38.5,33.5 40,38 36,35 32,38 33.5,33.5 30,30.5 34.5,30.5" fill="none" />
          </g>
        )}
        {group === 'Cardio & balance' && (
          <polygon points="32,12 20,30 27,30 24,44 38,26 30,26" fill="#c9a227" stroke="none" />
        )}
        {group === 'Phases & cycles' && (
          <polygon points="28,14 44,42 12,42" fill="none" strokeWidth="2.5" />
        )}
        {group === 'Personal records' && (
          <g>
            <polygon points="28,12 34,26 22,26" fill="#c9a227" stroke="none" />
            <rect x="25.5" y="26" width="5" height="14" rx="2" fill="#c9a227" stroke="none" />
          </g>
        )}
      </g>
    </svg>
  );
}

// One badge row. Locked badges follow the epic-gear reveal rule: "???",
// a grey silhouette, "Hidden until earned", no name, no image. The how
// still shows, like gear, so the client can see what to do to earn it.
// Earned badges reveal their image (generated medallion where one exists,
// otherwise the SVG medallion) plus their name and how.
export function BadgeRow({ badge, group, earned }: { badge: Badge; group: string; earned: boolean }) {
  const img = GENERATED_BADGES[badge.id];
  return (
    <div className="row" style={{ gap: 10, alignItems: 'flex-start', margin: '8px 0' }}>
      {earned ? (
        img ? (
          <img src={img} alt={badge.name} width={56} height={56} style={{ flexShrink: 0, borderRadius: '50%' }} />
        ) : (
          <BadgeMedallion group={group} size={56} />
        )
      ) : (
        <svg width="56" height="56" viewBox="0 0 56 56" role="img" aria-label="Hidden badge" style={{ flexShrink: 0 }}>
          <circle cx="28" cy="28" r="25" fill="#e8e8e8" stroke="#7b2fbe" strokeWidth="2" strokeDasharray="4 3" />
          <text x="28" y="37" textAnchor="middle" fontSize="24" fontWeight="700" fill="#7b2fbe">?</text>
        </svg>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {earned ? (
          <p className="small" style={{ margin: 0 }}><strong>✓ {badge.name}</strong> · {badge.how}</p>
        ) : (
          <p className="small" style={{ margin: 0 }}>
            <strong>???</strong>{' '}
            <span className="tier-pill">Hidden until earned</span>
            <br />To unlock: {badge.how}
          </p>
        )}
      </div>
    </div>
  );
}

// The full badge list, grouped, earned first in each group. Shared by the
// Gear tab and the Progress summary, so the two never drift apart.
export default function BadgesSection({ earnedIds }: { earnedIds: string[] }) {
  return (
    <div>
      {BADGE_GROUPS.map((g) => {
        const groupBadges = g.ids
          .map((id) => BADGES.find((b) => b.id === id))
          .filter((b): b is Badge => Boolean(b));
        const earnedCount = groupBadges.filter((b) => earnedIds.includes(b.id)).length;
        const ordered = [
          ...groupBadges.filter((b) => earnedIds.includes(b.id)),
          ...groupBadges.filter((b) => !earnedIds.includes(b.id)),
        ];
        return (
          <div key={g.title} style={{ marginTop: 12 }}>
            <h4 style={{ margin: '0 0 4px' }}>{g.title} · {earnedCount} of {groupBadges.length}</h4>
            {ordered.map((b) => (
              <BadgeRow key={b.id} badge={b} group={g.title} earned={earnedIds.includes(b.id)} />
            ))}
          </div>
        );
      })}
      <p className="small muted">Earned: {earnedIds.length} {earnedIds.length === 1 ? 'badge' : 'badges'}. Tap a workout, check-in, or PR to earn more.</p>
    </div>
  );
}
