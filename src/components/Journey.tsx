import { useEffect, useRef, useState } from 'react';
import type { Ctx } from '../App';
import { PHASES, MONSTERS, CREATURES, STORY, SPELLS, CLASSES, BOSS_ROUNDS } from '../lib/data';
import { YEAR_CYCLES, challengeForWeek, nextRetestWeek, nextBossWeek, nextRetestLabel, nextBossLabel } from '../lib/yearPlan';
import { phaseForDoc, levelForXp, metCompanionIds, currentWeekForDoc, dailyAttacks, powerCharge, powerCharged, rollDamage, damageRange, todayDayKey, DAILY_UNLOCK_LEVELS, lockedDailyThings } from '../lib/store';
import GuardianAvatar from './GuardianAvatar';
import JourneyMap from './JourneyMap';
import CompanionAvatar, { BossAvatar } from './CompanionAvatar';
import BackToTop from './BackToTop';

// Every boss round has its own picture (Derek Nov 25, 2026). No round
// reuses another round's portrait.
const BOSS_AVATAR: Record<string, string> = {
  'boss-week-4': 'the-slump',
  // Week 8 is the Mirror of Doubt round: the generated Mirror portrait is
  // mapped to this round specifically (Derek Nov 23, 2026). The Mirror is
  // a display name for the round, not a monster in data.ts — the Achy
  // Knees Troll stays its own monster in the monster list.
  'boss-week-8': 'mirror-of-doubt',
  'boss-week-12': 'wobbly-balance-sprite',
  'boss-week-16': 'heavy-fog',
  'boss-week-20': 'rust-giant',
  'boss-week-24': 'ember-drake',
  'boss-week-28': 'gale-howler',
  'boss-week-32': 'tide-troll',
  'boss-week-36': 'storm-serpent',
  'boss-week-40': 'gold-golem',
  'boss-week-44': 'summit-wraith',
  'boss-week-48': 'peak-keeper',
  'boss-week-52': 'summit-review',
};

export default function Journey({ ctx }: { ctx: Ctx }) {
  const { doc, update, toast } = ctx;
  const [showStory, setShowStory] = useState(false);
  const [bossHit, setBossHit] = useState('');
  // Show more collapsing (Derek, Nov 25, 2026): long reference lists
  // start short, one tap expands them, one tap hides them again. The
  // current cycle, the selected boss, and the companions you have met
  // plus the next two to meet always stay visible.
  const [showAllBosses, setShowAllBosses] = useState(false);
  const [showMoreCycles, setShowMoreCycles] = useState(false);
  const [showAllCompanions, setShowAllCompanions] = useState(false);
  const [showAllMonsters, setShowAllMonsters] = useState(false);
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
  // Next step on the road, in plain words, so the map reads top to
  // bottom: where you are, what comes next, then the boss and retest.
  const journeyWeek = currentWeekForDoc(doc);
  const journeyDoneRetests = new Set(doc.retests.map((r) => (r as { week?: number }).week || 0));
  const journeyNextRetest = nextRetestWeek(journeyWeek, journeyDoneRetests);
  const journeyBeatenBossWeeks = new Set(
    Object.entries(doc.bossHp || {}).filter(([, hp]) => hp <= 0).map(([id]) => Number(id.replace('boss-week-', ''))),
  );
  const journeyNextBoss = nextBossWeek(journeyWeek, journeyBeatenBossWeeks);
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

  // One boss row, used for the selected boss (always visible) and for
  // the rest of the rounds behind Show all boss rounds.
  const bossRow = (r: (typeof BOSS_ROUNDS)[number]) => {
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
  };
  const otherBosses = BOSS_ROUNDS.filter((r) => r.id !== boss.id);

  // Your road ahead: the cycle you are in now, the rest behind Show more.
  const currentCycle = YEAR_CYCLES.find((c) => journeyWeek >= c.weeks[0] && journeyWeek <= c.weeks[1])
    || (journeyWeek > YEAR_CYCLES[YEAR_CYCLES.length - 1].weeks[1] ? YEAR_CYCLES[YEAR_CYCLES.length - 1] : YEAR_CYCLES[0]);
  const otherCycles = YEAR_CYCLES.filter((c) => c.cycle !== currentCycle.cycle);
  const cycleBlock = (c: (typeof YEAR_CYCLES)[number]) => {
    const week = currentWeekForDoc(doc);
    const state = week > c.weeks[1] ? 'Done' : week >= c.weeks[0] ? 'You are here' : 'Coming up';
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
  };

  // Companions in full: met companions plus the next two to meet stay
  // visible, the rest hide behind Show all companions.
  const unmetCompanions = CREATURES.filter((c) => !met.has(c.id)).sort((a, b) => a.meetWeek - b.meetWeek);
  const visibleCompanions = [
    ...CREATURES.filter((c) => met.has(c.id)),
    ...unmetCompanions.slice(0, 2),
  ];
  const hiddenCompanions = CREATURES.filter((c) => !visibleCompanions.includes(c));
  const creatureRow = (c: (typeof CREATURES)[number]) => {
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
  };
  const monsterRow = (m: (typeof MONSTERS)[number]) => (
    <div className="creature" key={m.id} style={{ margin: '10px 0' }}>
      <div className="avatar" aria-hidden><BossAvatar id={m.id} /></div>
      <div>
        <p><strong>{m.name}</strong>: guards the {m.castle} in {m.land}, {m.weeks}. Boss round: {m.bossRound}.</p>
        <p className="small muted">{m.blurb}</p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="card gold-frame">
        <h2>Your journey</h2>
        <p><strong>Next: {nextRetestLabel(journeyNextRetest)} {nextBossLabel(journeyNextBoss)}</strong></p>
        <JourneyMap currentWeek={currentWeekForDoc(doc)} met={met} bossHp={doc.bossHp || {}} />
        <p className="small muted">Boss rounds at Weeks 4, 8, and 12 of every cycle, plus a review round at the end of the road. Win the round with your class moves and mana, then do the retest to open the next land. The map above shows the first stretch, Weeks 1 to 12. The road continues below.</p>
        <p className="small"><a href="#companions-top">See companions</a> The portraits on the map are the companions you meet on that step. A ? is someone you have not met yet. Companions live on this tab, just below the map.</p>
      </div>

      <div className="card">
        <h2>Your road ahead</h2>
        <p className="small muted">Each stretch is different: a new goal, a new land, new boss rounds, and new companions. A stretch only opens after the last stretch's retest, the same gate as Week 13.</p>
        {cycleBlock(currentCycle)}
        <p><strong>Keep going.</strong> After the Golden Summit, test your best in a review retest, pick your next goal, and the road keeps going. There is no finish line here.</p>
        <p className="small">This month's challenge: <strong>{challengeForWeek(currentWeekForDoc(doc)).title}</strong> · {challengeForWeek(currentWeekForDoc(doc)).detail}</p>
        <button onClick={() => setShowMoreCycles((v) => !v)}>{showMoreCycles ? 'Hide other cycles' : 'Show all cycles'}</button>
        {showMoreCycles && otherCycles.map((c) => cycleBlock(c))}
      </div>

      <div className="card gold-frame" id="combat">
        <h2>Combat</h2>
        <p>A boss round is a practice fight at the end of a land, at Weeks 4, 8, and 12 of every cycle, plus a review round when you get there. You attack with your class spells, and each spell costs mana. Win the round, do the retest, and the next land opens. Bosses are challenges you beat, not friends.</p>
        <p className="small muted">Mana: {doc.mana}/10. Mana refills daily, and the small things you do through the day add more. Spells never block a workout, quest, check-in, or retest. Pick a boss, then use a spell. The bar drops with every hit. Damage varies a little each time, so a hit can be a bit weaker or stronger than the number shown.</p>
        {(() => {
          const earned = dailyAttacks(doc);
          const charge = powerCharge(doc);
          const charged = powerCharged(doc);
          const chargeOpen = level >= DAILY_UNLOCK_LEVELS.charge;
          const locked = lockedDailyThings(doc);
          const earnedText = earned.total > 0
            ? `You earned ${earned.total} attack${earned.total === 1 ? '' : 's'} today from ${earned.items.map((i) => i.label).join(', ')}.`
            : 'Log a check-in, sleep, cardio, a balance hold, a daily quest, a rest day, or a workout to earn attacks today.';
          return (
            <>
              <p className="small">{earnedText}</p>
              {locked.length > 0 && (
                <p className="small muted">{locked.map((t) => `${t.label} unlocks at Level ${t.level}`).join('. ')}.</p>
              )}
              <p className="small"><strong>{chargeOpen ? `Power Strike charge: ${charge} of 5.` : `Power Strike charge unlocks at Level ${DAILY_UNLOCK_LEVELS.charge}.`}</strong> {chargeOpen ? (charged ? 'Power Strike is charged, free to use once.' : 'Each daily thing adds charge. At 5, Power Strike costs no mana.') : 'Daily things still earn attacks and mana. They just do not fill a charge meter yet.'}</p>
            </>
          );
        })()}
        {bossRow(boss)}
        <p className="small"><strong>Attacking:</strong> {boss.name}. {bossBeaten ? 'Already beaten.' : bossUnlocked ? `${bossHp} of ${boss.maxHp} HP left.` : `${boss.maxHp} HP · Locked until your Week ${boss.week - 4} retest.`}</p>
        <div className="row">
          {mySpells.map((s) => {
            // Power Strike at full charge costs no mana, once. Every
            // other spell pays its cost, and a charged hit resets the
            // meter (see powerCharge in store.ts).
            const isChargedStrike = s.id === 'second-wind' && powerCharged(doc);
            const cost = isChargedStrike ? 0 : s.cost;
            return (
              <button
                key={s.id}
                disabled={doc.mana < cost || bossBeaten || !bossUnlocked}
                onClick={() => {
                  if (!bossUnlocked || bossBeaten) return;
                  const emberBonus = met.has('ember');
                  const dealt = rollDamage(s.damage);
                  const newHp = Math.max(0, bossHp - dealt);
                  const larkBonus = newHp === 0 && met.has('lark');
                  update((d) => {
                    d.mana = Math.max(0, d.mana - cost);
                    d.xp += (emberBonus ? 10 : 5) + (larkBonus ? 5 : 0);
                    d.bossHp = { ...(d.bossHp || {}), [boss.id]: newHp };
                    if (isChargedStrike) {
                      const today = todayDayKey();
                      d.powerChargeUsed = d.powerChargeUsedDay === today ? (d.powerChargeUsed || 0) + 1 : 1;
                      d.powerChargeUsedDay = today;
                    }
                  });
                  setBossHit(
                    newHp === 0
                      ? `${boss.name} beaten. You move on to the next land.${larkBonus ? ' Lark sings (+5 XP).' : ''}`
                      : `${s.name} dealt ${dealt} damage. Boss took ${dealt} damage, ${newHp} of ${boss.maxHp} HP left.${isChargedStrike ? ' Power Strike was charged, so it cost no mana.' : ''}${emberBonus ? ' Ember cheers you on (+5 XP).' : ''}`,
                  );
                  toast(newHp === 0 ? `${boss.name} beaten.${larkBonus ? ' +5 XP from Lark.' : ''}` : `${s.name} hit for ${dealt}. ${newHp} of ${boss.maxHp} HP left.`);
                }}
              >
                {s.name} ({isChargedStrike ? 'charged, free' : `${cost} mana`}, {damageRange(s.damage)} damage)
              </button>
            );
          })}
        </div>
        {bossHit && <p className="ok">{bossHit}</p>}
        <p className="small muted">Your class: {doc.guardian?.classId || 'not picked yet'}. {CLASSES.find((c) => c.id === doc.guardian?.classId)?.description || ''}</p>
        <button onClick={() => setShowAllBosses((v) => !v)}>{showAllBosses ? 'Hide boss rounds' : 'Show all boss rounds'}</button>
        {showAllBosses && otherBosses.map((r) => bossRow(r))}
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
        <h3>Your companions, in full</h3>
        <p className="small muted">People and animals you befriend along the road, one at a time as you get further. Bosses are not companions. They are challenges you beat. The short list is at the top of this tab, above the map.</p>
        {visibleCompanions.map((c) => creatureRow(c))}
        {showAllCompanions && hiddenCompanions.map((c) => creatureRow(c))}
        {hiddenCompanions.length > 0 && (
          <button onClick={() => setShowAllCompanions((v) => !v)}>{showAllCompanions ? 'Hide companions' : 'Show all companions'}</button>
        )}
      </div>

      <div className="card">
        <h3>Monsters and bosses</h3>
        <p className="small muted">Defeat a monster in a boss round and it is beaten. You move on to the next land. Consistency powers your attacks. Sleep and recovery raise your defense.</p>
        {MONSTERS.slice(0, 2).map((m) => monsterRow(m))}
        {showAllMonsters && MONSTERS.slice(2).map((m) => monsterRow(m))}
        <button onClick={() => setShowAllMonsters((v) => !v)}>{showAllMonsters ? 'Hide monsters' : 'Show all monsters'}</button>
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
      <BackToTop />
    </div>
  );
}
