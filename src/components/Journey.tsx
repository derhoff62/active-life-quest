import { useEffect, useRef, useState } from 'react';
import type { Ctx } from '../App';
import { PHASES, MONSTERS, CREATURES, STORY, SPELLS, CLASSES, BOSS_ROUNDS } from '../lib/data';
import { YEAR_CYCLES, challengeForWeek } from '../lib/yearPlan';
import { phaseForDoc, levelForXp, metCompanionIds, currentWeekForDoc } from '../lib/store';
import GuardianAvatar from './GuardianAvatar';
import JourneyMap from './JourneyMap';
import CompanionAvatar, { BossAvatar } from './CompanionAvatar';

// New boss rounds reuse the five boss drawings with new names and higher
// HP. Bosses are challenges you beat, never friends.
const BOSS_AVATAR: Record<string, string> = {
  'boss-week-4': 'the-slump',
  'boss-week-8': 'achy-knees-troll',
  'boss-week-12': 'wobbly-balance-sprite',
  'boss-week-16': 'stiff-hips-goblin',
  'boss-week-20': 'tired-back-beast',
  'boss-week-24': 'achy-knees-troll',
  'boss-week-28': 'the-slump',
  'boss-week-32': 'wobbly-balance-sprite',
  'boss-week-36': 'stiff-hips-goblin',
  'boss-week-40': 'tired-back-beast',
  'boss-week-44': 'achy-knees-troll',
  'boss-week-48': 'wobbly-balance-sprite',
  'boss-week-52': 'the-slump',
};

export default function Journey({ ctx }: { ctx: Ctx }) {
  const { doc, update, toast } = ctx;
  const [showStory, setShowStory] = useState(false);
  const [bossHit, setBossHit] = useState('');
  // Same as Armor: the "new companion" badge and the top notice stay
  // while you are on this tab, and clear when you leave it. The
  // boss-ready part of the badge does not clear on a visit at all: it
  // clears when the boss is beaten.
  const docRef = useRef(doc);
  docRef.current = doc;
  const updateRef = useRef(update);
  updateRef.current = update;
  useEffect(
    () => () => {
      const d = docRef.current;
      const week = currentWeekForDoc(d);
      if (week > (d.journeySeenWeek || 0)) {
        updateRef.current((x) => {
          x.journeySeenWeek = currentWeekForDoc(x);
        });
      }
    },
    [],
  );
  const phase = phaseForDoc(doc);
  const level = levelForXp(doc.xp);
  const mySpells = SPELLS.filter((s) => {
    if (s.id === 'second-wind') return level >= 9;
    return s.classId === 'any' || s.classId === doc.guardian?.classId;
  });
  const met = metCompanionIds(doc);
  // Boss health, stored on the profile so a beaten boss stays beaten.
  const bossHpMap = doc.bossHp || {};
  const hpOf = (r: (typeof BOSS_ROUNDS)[number]) => bossHpMap[r.id] ?? r.maxHp;
  const firstOpen = BOSS_ROUNDS.find((r) => phase >= r.unlockPhase && hpOf(r) > 0) || BOSS_ROUNDS[0];
  const [selectedBoss, setSelectedBoss] = useState(firstOpen.id);
  const boss = BOSS_ROUNDS.find((r) => r.id === selectedBoss) || BOSS_ROUNDS[0];
  const bossHp = hpOf(boss);
  const bossBeaten = bossHp <= 0;
  const bossUnlocked = phase >= boss.unlockPhase;

  return (
    <div>
      <div className="card gold-frame">
        <h2>Your journey</h2>
        <JourneyMap currentWeek={currentWeekForDoc(doc)} met={met} bossHp={doc.bossHp || {}} />
        <div className="map">
          <p><span className="land">Land 1: Sapphire Forest, Forest Castle, Weeks 1 to 4.</span> {phase >= 1 ? 'You are here, or past here.' : ''}</p>
          <p className={phase < 2 ? 'locked' : ''}><span className="land">Land 2: Crystal Shores, Lake Castle, Weeks 5 to 8.</span> {phase < 2 ? 'Locked until your Week 4 retest.' : 'Open.'}</p>
          <p className={phase < 3 ? 'locked' : ''}><span className="land">Land 3: Navy Peaks, Navy Castle, Weeks 9 to 12.</span> {phase < 3 ? 'Locked until your Week 8 retest.' : 'Open.'}</p>
        </div>
        <p className="small muted">Boss rounds at Weeks 4, 8, and 12 of every cycle, plus a review round at the end of the road. Win the round with your class moves and mana, then do the retest to open the next land. The map above shows the first stretch, Weeks 1 to 12. The road continues below.</p>
      </div>

      <div className="card">
        <h2>Your road ahead</h2>
        <p className="small muted">Each stretch is different: a new goal, a new land, new boss rounds, and new companions. A stretch only opens after the last stretch's retest, the same gate as Week 13.</p>
        {YEAR_CYCLES.map((c) => {
          const week = currentWeekForDoc(doc);
          const state = week > c.weeks[1] ? 'Done' : week >= c.weeks[0] ? 'You are here' : 'Coming up';
          // Boss weeks are shown without the review round week, and the
          // beaten count never shows a total: the length of the road
          // stays hidden.
          const shownBossWeeks = c.bossWeeks.filter((w) => w !== 52);
          const beaten = shownBossWeeks.filter((w) => ((doc.bossHp || {})[`boss-week-${w}`] ?? 999) <= 0).length;
          return (
            <div key={c.cycle} style={{ marginBottom: 12 }}>
              <p><strong>{c.name} (Weeks {c.weeks[0]} to {c.weeks[1]}) · {state}</strong></p>
              <p className="small">Goal: {c.goal} · {c.phases} · {c.lands}</p>
              <p className="small">{c.story}</p>
              <p className="small muted">Boss rounds: Weeks {shownBossWeeks.join(', ')}{beaten > 0 ? ` · ${beaten} beaten` : ''} · {c.track}</p>
            </div>
          );
        })}
        <p><strong>Keep going.</strong> After the Golden Summit, test your best in a review retest, pick your next goal, and the road keeps going. There is no finish line here.</p>
        <p className="small">This month's challenge: <strong>{challengeForWeek(currentWeekForDoc(doc)).title}</strong> · {challengeForWeek(currentWeekForDoc(doc)).detail}</p>
      </div>

      <div className="card gold-frame" id="combat">
        <h2>Combat</h2>
        <p>A boss round is a practice fight at the end of a land, at Weeks 4, 8, and 12 of every cycle, plus a review round when you get there. You attack with your class spells, and each spell costs mana. Win the round, do the retest, and the next land opens. Bosses are challenges you beat, not friends.</p>
        <p className="small muted">Mana: {doc.mana}/10. Mana refills daily, and good sleep and check-ins add more. Spells never block a workout, quest, check-in, or retest. Pick a boss, then use a spell. The bar drops with every hit.</p>
        {BOSS_ROUNDS.map((r) => {
          const hp = hpOf(r);
          const locked = phase < r.unlockPhase;
          return (
            <div className="creature" key={r.id} style={{ margin: '12px 0' }}>
              <div className="avatar" aria-hidden><BossAvatar id={BOSS_AVATAR[r.id]} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <button
                  onClick={() => setSelectedBoss(r.id)}
                  disabled={locked}
                  style={selectedBoss === r.id ? { background: '#124571', color: '#fff' } : {}}
                >
                  {r.name} · {r.land}
                </button>
                <div className="progress-bar boss-bar" style={{ marginTop: 8 }}>
                  <div style={{ width: `${(hp / r.maxHp) * 100}%` }} />
                </div>
                <p className="small" style={{ margin: '4px 0 0' }}>
                  {locked
                    ? `${r.maxHp} HP · Locked until your Week ${r.week - 4} retest.`
                    : hp <= 0
                      ? 'Beaten. You move on to the next land.'
                      : `${hp} of ${r.maxHp} HP`}
                </p>
              </div>
            </div>
          );
        })}
        <p className="small"><strong>Attacking:</strong> {boss.name}. {bossBeaten ? 'Already beaten.' : bossUnlocked ? `${bossHp} of ${boss.maxHp} HP left.` : `${boss.maxHp} HP · Locked until your Week ${boss.week - 4} retest.`}</p>
        <div className="row">
          {mySpells.map((s) => (
            <button
              key={s.id}
              disabled={doc.mana < s.cost || bossBeaten || !bossUnlocked}
              onClick={() => {
                if (!bossUnlocked || bossBeaten) return;
                const emberBonus = met.has('ember');
                const newHp = Math.max(0, bossHp - s.damage);
                const larkBonus = newHp === 0 && met.has('lark');
                update((d) => {
                  d.mana = Math.max(0, d.mana - s.cost);
                  d.xp += (emberBonus ? 10 : 5) + (larkBonus ? 5 : 0);
                  d.bossHp = { ...(d.bossHp || {}), [boss.id]: newHp };
                });
                setBossHit(
                  newHp === 0
                    ? `${boss.name} beaten. You move on to the next land.${larkBonus ? ' Lark sings (+5 XP).' : ''}`
                    : `${s.name} dealt ${s.damage} damage. Boss took ${s.damage} damage, ${newHp} of ${boss.maxHp} HP left.${emberBonus ? ' Ember cheers you on (+5 XP).' : ''}`,
                );
                toast(newHp === 0 ? `${boss.name} beaten.${larkBonus ? ' +5 XP from Lark.' : ''}` : `${s.name} hit. ${newHp} of ${boss.maxHp} HP left.`);
              }}
            >
              {s.name} ({s.cost} mana)
            </button>
          ))}
        </div>
        {bossHit && <p className="ok">{bossHit}</p>}
        <p className="small muted">Your class: {doc.guardian?.classId || 'not picked yet'}. {CLASSES.find((c) => c.id === doc.guardian?.classId)?.description || ''}</p>
      </div>


      <div className="card gold-frame">
        <h3>Your guardian</h3>
        <GuardianAvatar guardian={doc.guardian} level={levelForXp(doc.xp)} size="medium" background={phase >= 3 ? 'peaks' : phase >= 2 ? 'shores' : 'forest'} />
        <p className="small muted" style={{ textAlign: 'center' }}>
          {doc.guardian
            ? `${doc.guardian.name} the ${doc.guardian.classId} walks this map with you. ${CLASSES.find((c) => c.id === doc.guardian?.classId)?.description || ''}`
            : 'Pick your guardian on Today, then they walk this map with you.'}
        </p>
      </div>

      <div className="card">
        <h3>The story</h3>
        <p>{STORY.firstLine}</p>
        {!doc.storySkipped && (
          <>
            <button onClick={() => setShowStory((v) => !v)}>{showStory ? 'Show less' : 'Show more: the story'}</button>
            {showStory && STORY.expanded.map((p, i) => <p key={i}>{p}</p>)}
            <button
              onClick={() => update((d) => { d.storySkipped = true; })}
              style={{ marginLeft: 8 }}
            >
              Skip the story
            </button>
          </>
        )}
        {doc.storySkipped && (
          <p className="muted small">
            Story skipped. You can still read it here any time.{' '}
            <button onClick={() => update((d) => { d.storySkipped = false; })}>Read the story</button>
          </p>
        )}
      </div>

      <div className="card" id="companions">
        <h3>Your companions</h3>
        <p className="small muted">People and animals you befriend along the road, one at a time as you get further. Bosses are not companions. They are challenges you beat.</p>
        {CREATURES.map((c) => {
          const isMet = met.has(c.id);
          if (!isMet) {
            return (
              <div className="creature" key={c.id} style={{ margin: '10px 0', opacity: 0.7 }}>
                <div className="avatar" aria-hidden><CompanionAvatar id="unknown" /></div>
                <p><strong>???</strong> <span className="small muted">Someone you have not met yet. You meet them around Week {c.meetWeek}.</span></p>
              </div>
            );
          }
          return (
            <div className="creature" key={c.id} style={{ margin: '10px 0' }}>
              <div className="avatar" aria-hidden><CompanionAvatar id={c.id} /></div>
              <div>
                <p><strong>{c.name}</strong> ({c.kind}, {c.place}): {c.line}</p>
                <p className="small" style={{ margin: 0 }}><strong>Helps you:</strong> {c.effect}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h3>Monsters and bosses</h3>
        <p className="small muted">Defeat a monster in a boss round and it is beaten. You move on to the next land. Consistency powers your attacks. Sleep and recovery raise your defense.</p>
        {MONSTERS.map((m) => (
          <div className="creature" key={m.id} style={{ margin: '10px 0' }}>
            <div className="avatar" aria-hidden><BossAvatar id={m.id} /></div>
            <div>
              <p><strong>{m.name}</strong>: guards the {m.castle} in {m.land}, {m.weeks}. Boss round: {m.bossRound}.</p>
              <p className="small muted">{m.blurb}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>How it all fits together</h3>
        <p>1. Assessment draws your map. 2. Correctives clear the path. 3. Workouts move you through the lands. 4. Retests open the next castle. 5. After Week 12, pick a new goal and cycle back.</p>
        <details>
          <summary>Phases 1 to 5</summary>
          {PHASES.map((p) => (
            <p key={p.phase}><strong>Phase {p.phase}: {p.name}</strong> ({p.weeks}): {p.reps}, {p.sets}, rest {p.rest}. {p.description}</p>
          ))}
        </details>
      </div>
    </div>
  );
}
