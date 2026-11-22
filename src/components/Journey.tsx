import { useState } from 'react';
import type { Ctx } from '../App';
import { PHASES, MONSTERS, CREATURES, STORY, SPELLS, CLASSES } from '../lib/data';
import { phaseForDoc, levelForXp } from '../lib/store';
import GuardianAvatar from './GuardianAvatar';

const AVATAR: Record<string, string> = {
  Bram: '🧔', Sylva: '🧝', Kaelith: '🐉', Tilda: '🧑‍🍳', Pip: '🧙', Hoot: '🦉', Ash: '🐺', Ember: '🐲',
  'The Slump': '😴', 'Stiff Hips Goblin': '👺', 'Achy Knees Troll': '🧌', 'Tired Back Beast': '🐻', 'Wobbly Balance Sprite': '🧚',
};

export default function Journey({ ctx }: { ctx: Ctx }) {
  const { doc, update } = ctx;
  const [showStory, setShowStory] = useState(false);
  const [bossHit, setBossHit] = useState('');
  const phase = phaseForDoc(doc);
  const mySpells = SPELLS.filter((s) => s.classId === 'any' || s.classId === doc.guardian?.classId);

  return (
    <div>
      <div className="card gold-frame">
        <h2>Your journey</h2>
        <div className="map">
          <p><span className="land">Land 1: Sapphire Forest, Forest Castle, Weeks 1 to 4.</span> {phase >= 1 ? 'You are here, or past here.' : ''}</p>
          <p className={phase < 2 ? 'locked' : ''}><span className="land">Land 2: Crystal Shores, Lake Castle, Weeks 5 to 8.</span> {phase < 2 ? 'Locked until your Week 4 retest.' : 'Open.'}</p>
          <p className={phase < 3 ? 'locked' : ''}><span className="land">Land 3: Navy Peaks, Navy Castle, Weeks 9 to 12.</span> {phase < 3 ? 'Locked until your Week 8 retest.' : 'Open.'}</p>
        </div>
        <p className="small muted">Boss rounds at Weeks 4, 8, and 12. Win the round with your class moves and mana, then do the retest to open the next land.</p>
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
        {doc.storySkipped && <p className="muted small">Story skipped. You can still read it here any time.</p>}
      </div>

      <div className="card">
        <h3>Your companions</h3>
        <p className="small muted">People and animals you befriend along the road. Bosses are not companions. They are challenges you beat.</p>
        {CREATURES.map((c) => (
          <div className="creature" key={c.id} style={{ margin: '10px 0' }}>
            <div className="avatar" aria-hidden>{AVATAR[c.name] || '✨'}</div>
            <p><strong>{c.name}</strong> ({c.kind}, {c.place}): {c.line}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Monsters and bosses</h3>
        <p className="small muted">Defeat a monster in a boss round and it is beaten. You move on to the next land. Consistency powers your attacks. Sleep and recovery raise your defense.</p>
        {MONSTERS.map((m) => (
          <div className="creature" key={m.id} style={{ margin: '10px 0' }}>
            <div className="avatar" aria-hidden>{AVATAR[m.name] || '👾'}</div>
            <div>
              <p><strong>{m.name}</strong>: guards the {m.castle} in {m.land}, {m.weeks}. Boss round: {m.bossRound}.</p>
              <p className="small muted">{m.blurb}</p>
            </div>
          </div>
        ))}
        <h3 style={{ marginTop: 16 }}>Boss fight (practice)</h3>
        <p>Mana: {doc.mana}/10. Mana refills daily, and good sleep and check-ins add more. Spells never block a workout, quest, check-in, or retest.</p>
        <div className="row">
          {mySpells.map((s) => (
            <button
              key={s.id}
              disabled={doc.mana < s.cost}
              onClick={() => {
                update((d) => {
                  d.mana = Math.max(0, d.mana - s.cost);
                  d.xp += 5;
                });
                setBossHit(`${s.name} dealt ${s.damage} damage. Nice hit.`);
              }}
            >
              {s.name} ({s.cost} mana)
            </button>
          ))}
        </div>
        {bossHit && <p className="ok">{bossHit}</p>}
        <p className="small muted">Your class: {doc.guardian?.classId || 'not picked yet'}. {CLASSES.find((c) => c.id === doc.guardian?.classId)?.description || ''}</p>
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
