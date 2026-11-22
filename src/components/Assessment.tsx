import { useState } from 'react';
import type { Ctx } from '../App';
import * as api from '../lib/api';
import { ASSESSMENT_EXAMPLES, ASSESSMENT_QUESTIONS, CES_TEMPLATES, CONTRAINDICATIONS, DEFAULT_EQUIPMENT, EQUIPMENT_NOTES, EQUIPMENT_OPTIONS, FOCUS_AREAS, recommendPhase } from '../lib/data';
import { currentWeekForDoc, awardBadges, phaseForDoc, bestBalanceSec, lastLoggedLabel } from '../lib/store';
import { RETEST_WEEKS, weekLabel } from '../lib/yearPlan';
import type { FindingId, FormRating } from '../lib/types';
import ExampleVideo from './ExampleVideo';

const FINDING_LABELS: { id: FindingId; label: string }[] = CES_TEMPLATES.map((t) => ({ id: t.id, label: t.plainName }));

export default function Assessment({ ctx }: { ctx: Ctx }) {
  const { doc, update, toast } = ctx;
  const [step, setStep] = useState(0);
  const [parq, setParq] = useState<string[]>([]);
  const [flags, setFlags] = useState<string[]>([]);
  const [findings, setFindings] = useState<FindingId[]>([]);
  const [experience, setExperience] = useState<'new' | 'some' | 'regular'>('new');
  const [years, setYears] = useState<'under1' | '1to3' | 'over3'>('under1');
  const [squat, setSquat] = useState<FormRating>('ok');
  const [hinge, setHinge] = useState<FormRating>('ok');
  const [bench, setBench] = useState<FormRating>('ok');
  const [balL, setBalL] = useState('');
  const [balR, setBalR] = useState('');
  const [sex, setSex] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [age, setAge] = useState('');
  const [equipment, setEquipment] = useState<string[]>(
    doc.equipment && doc.equipment.length > 0 ? doc.equipment : [...DEFAULT_EQUIPMENT],
  );
  const [focus, setFocus] = useState<Record<string, number>>(doc.focus || {});
  const [socialPerm, setSocialPerm] = useState<boolean>(doc.socialPermission || false);
  const [retestWeek, setRetestWeek] = useState(4);
  const [retestClean, setRetestClean] = useState(true);
  const [retestBalL, setRetestBalL] = useState('');
  const [retestBalR, setRetestBalR] = useState('');
  const [retestMsg, setRetestMsg] = useState('');
  const [balTestL, setBalTestL] = useState('');
  const [balTestR, setBalTestR] = useState('');
  const [balTestMsg, setBalTestMsg] = useState('');
  const [done, setDone] = useState(false);
  const [retaking, setRetaking] = useState(false);
  const [doctorCleared, setDoctorCleared] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoMsg, setVideoMsg] = useState('');
  const [videoError, setVideoError] = useState('');
  const [videoSkipped, setVideoSkipped] = useState(false);

  function pickVideo(file: File | undefined) {
    setVideoMsg('');
    setVideoError('');
    setVideoSkipped(false);
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setVideoError('That file is not a video. Pick a video file.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setVideoError('That video is over 100 MB. Pick a shorter clip.');
      return;
    }
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  }

  async function uploadVideo() {
    if (!videoFile || videoUploading) return;
    setVideoUploading(true);
    setVideoMsg('');
    setVideoError('');
    try {
      const r = await api.uploadAssessmentVideo(videoFile, 'Assessment video', currentWeekForDoc(doc));
      update((d) => {
        const videos = d.assessmentVideos || [];
        d.assessmentVideos = [r.video, ...videos];
      });
      setVideoMsg('Video uploaded. Derek can watch it in Coach.');
      toast('Video uploaded. Derek can watch it in Coach.');
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setVideoPreview('');
      setVideoFile(null);
    } catch (e) {
      setVideoError(e instanceof Error ? e.message : 'The video could not be uploaded. You can still finish without a video.');
    } finally {
      setVideoUploading(false);
    }
  }

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const result = doc.assessment;

  function finish() {
    const rec = recommendPhase(findings.length, experience, years, { squatForm: squat, hingeForm: hinge, benchForm: bench });
    // Match each picked flag to its contraindication by exact name, with
    // one alias (Heart condition is the Coronary entry). The old fuzzy
    // match could pair a flag with the wrong entry.
    const alias: Record<string, string> = { 'Heart condition': 'Coronary or heart condition' };
    const contra = CONTRAINDICATIONS.filter((c) =>
      flags.some((f) => c.flag === f || c.flag === alias[f]),
    ).map((c) => c.flag);
    const firstTime = !doc.assessmentDone;
    update((d) => {
      d.assessment = {
        findings,
        balanceLeftSec: Number(balL) || 0,
        balanceRightSec: Number(balR) || 0,
        experience,
        yearsTraining: years,
        squatForm: squat,
        hingeForm: hinge,
        benchForm: bench,
        startingPhase: rec.phase,
        recommendedPhase: rec.phase,
        reason: rec.reason,
      };
      d.assessmentDone = true;
      // PAR-Q answers are health flags too: a yes to any of them is saved
      // on the profile so Derek sees it, not thrown away.
      d.healthFlags = [...new Set([...flags, ...parq])];
      d.equipment = equipment.length > 0 ? equipment : [...DEFAULT_EQUIPMENT];
      d.contraindications = contra;
      d.balanceBaseline = { left: Number(balL) || 0, right: Number(balR) || 0 };
      d.doctorCleared = doctorCleared;
      d.body = {
        sex,
        heightIn: Number(height) || null,
        weightLb: Number(weight) || null,
        goalWeightLb: Number(goalWeight) || null,
        age: Number(age) || null,
        activity: d.body.activity,
      };
      d.focus = focus;
      d.socialPermission = socialPerm;
      // 60 XP is for the first assessment only. Retaking it to update
      // answers does not earn again.
      if (firstTime) d.xp += 60;
    });
    setDone(true);
    setRetaking(false);
    toast(firstTime ? 'Assessment done. +60 XP.' : 'Assessment updated.');
  }

  function startRetake() {
    // A retake starts blank, with the client's current answers cleared,
    // so old findings and body details do not silently carry over.
    setParq([]);
    setFlags([]);
    setFindings([]);
    setExperience('new');
    setYears('under1');
    setSquat('ok');
    setHinge('ok');
    setBench('ok');
    setBalL('');
    setBalR('');
    setSex('');
    setHeight('');
    setWeight('');
    setGoalWeight('');
    setAge('');
    setEquipment(doc.equipment && doc.equipment.length > 0 ? doc.equipment : [...DEFAULT_EQUIPMENT]);
    setFocus(doc.focus || {});
    setSocialPerm(doc.socialPermission || false);
    setDoctorCleared(false);
    setVideoFile(null);
    setVideoPreview('');
    setVideoSkipped(false);
    setDone(false);
    setRetaking(true);
    setStep(0);
  }

  if (result && (done || doc.assessmentDone) && !retaking) {
    const templates = CES_TEMPLATES.filter((t) => result.findings.includes(t.id));
    // Week 13 only pops up after the Week 12 retest, same as Today.
    // A plan picked earlier still shows its saved line, but no pick buttons.
    const week12Done = doc.retests.some((r) => (r as { week?: number }).week === 12);
    return (
      <div>
        <div className="card gold-frame">
          <h2>Your assessment is done</h2>
          <p><strong>Starting phase: Phase {result.startingPhase}.</strong> {result.reason}</p>
          <p className="muted small">Total time: 30 to 45 minutes, goals and history plus the movement screen. The first assessment earns 60 XP.</p>
          {result.findings.length === 0 && <p>Your screen was clean. No corrective templates were flagged.</p>}
          {result.findings.length > 0 && <p>Movement patterns to work on: {result.findings.map((f) => FINDING_LABELS.find((x) => x.id === f)?.label).join(', ')}.</p>}
          <p>Balance baseline: {result.balanceLeftSec}s left, {result.balanceRightSec}s right. This is a general balance check, not a formal test.</p>
          <p>Your equipment: Workouts swap out moves you cannot do with this gear.</p>
          <div className="equip-list">
            {(doc.equipment && doc.equipment.length > 0 ? doc.equipment : DEFAULT_EQUIPMENT).map((e) => (
              <label key={e}>
                <span>
                  <span className="equip-name">{e}</span>{' '}
                  <span className="equip-note">{EQUIPMENT_NOTES[e] || ''}</span>
                </span>
              </label>
            ))}
          </div>
          <button className="primary" onClick={startRetake}>Retake the assessment</button>
        </div>
        <div className="card" id="retest">
          <h3>Retest (Weeks 4, 8, and 12 of each cycle)</h3>
          <p className="small muted">A retest is a short check, not the full assessment. Do it at Weeks 4, 8, and 12 of each 12-week cycle. There is a review retest too, then you keep going with a new goal. A clean retest moves you to the next phase and moves your corrective steps one step forward. Week 12 of each cycle is also a deload week: lighter loads that week. The next cycle only opens after that cycle's retest.</p>
          <label>Which week are you retesting?</label>
          <div className="row">
            {RETEST_WEEKS.map((w) => (
              <button key={w} type="button" onClick={() => setRetestWeek(w)} style={retestWeek === w ? { background: '#124571', color: '#fff' } : {}}>{weekLabel(w)}</button>
            ))}
          </div>
          <label>Balance now (seconds each side, general check)</label>
          <div className="grid2">
            <input inputMode="numeric" value={retestBalL} onChange={(e) => setRetestBalL(e.target.value)} placeholder={`Left (was ${result.balanceLeftSec}s)`} />
            <input inputMode="numeric" value={retestBalR} onChange={(e) => setRetestBalR(e.target.value)} placeholder={`Right (was ${result.balanceRightSec}s)`} />
          </div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400 }}>
            <input type="checkbox" checked={retestClean} onChange={(e) => setRetestClean(e.target.checked)} style={{ width: 'auto', minHeight: 0, marginTop: 4 }} />
            My movement screen is clean this time (no patterns to work on).
          </label>
          {retestMsg && <p className="notice">{retestMsg}</p>}
          <button
            className="primary"
            onClick={() => {
              // One retest per week, in order, across all four cycles.
              // Saving Week 8 before Week 4, or the same week twice, used
              // to hand out +20 XP and a phase jump every tap.
              const doneWeeks = new Set(doc.retests.map((r) => (r as { week?: number }).week));
              if (doneWeeks.has(retestWeek)) {
                setRetestMsg(`${weekLabel(retestWeek)} retest is already saved. Pick the next week.`);
                return;
              }
              const retestIdx = RETEST_WEEKS.indexOf(retestWeek);
              const prevRetest = retestIdx > 0 ? RETEST_WEEKS[retestIdx - 1] : null;
              if (prevRetest !== null && !doneWeeks.has(prevRetest)) {
                setRetestMsg(`Do the ${weekLabel(prevRetest)} retest first.`);
                return;
              }
              // Weeks 4, 8, and 12 move the phase. Later retests keep the
              // phase you are in: Phase 5 still needs a clean retest and
              // Derek's approval, and later cycles build on what you have.
              const currentPhase = phaseForDoc(doc);
              const nextPhase = retestWeek === 4 ? 2 : retestWeek === 8 ? 3 : retestWeek === 12 ? 4 : currentPhase;
              update((d) => {
                d.retests.push({ week: retestWeek, date: new Date().toISOString(), clean: retestClean, balanceLeftSec: Number(retestBalL) || 0, balanceRightSec: Number(retestBalR) || 0 } as never);
                if (Number(retestBalL) || Number(retestBalR)) {
                  d.balanceBaseline = { left: Number(retestBalL) || 0, right: Number(retestBalR) || 0 };
                }
                if (retestClean) {
                  d.phaseOverride = nextPhase;
                  for (const t of CES_TEMPLATES) {
                    const cur = d.cesStep?.[t.id] || 0;
                    d.cesStep = { ...(d.cesStep || {}), [t.id]: Math.min(cur + 1, t.progression.length - 1) };
                  }
                  d.xp += 20;
                }
                awardBadges(d);
              });
              const phaseMoved = retestWeek <= 12 && nextPhase !== currentPhase;
              setRetestMsg(retestClean ? (phaseMoved ? `Retest saved. You move to Phase ${nextPhase}. Your corrective steps moved one step forward. +20 XP.` : `Retest saved. You stay in Phase ${currentPhase} and move to the next stretch. Your corrective steps moved one step forward. +20 XP.`) : 'Retest saved. Keep working on your patterns. You stay in your current phase until a clean retest.');
              toast(retestClean ? (phaseMoved ? `Retest saved. You move to Phase ${nextPhase}. +20 XP.` : 'Retest saved. +20 XP.') : 'Retest saved.');
            }}
          >
            Save my retest
          </button>
          <p className="small muted">Targets: 10 seconds per side at Week 4, 20 at Week 8, 30 at Week 12, then hold 30 seconds and beat your best each cycle after.</p>
        </div>
        <div className="card" id="balance-test">
          <h3>Balance test</h3>
          <p className="small muted">A standalone balance check, any time, not just at a retest. Stand on one leg, hold a chair or wall if you need it, and time each side. This is a general balance check, not a formal test.</p>
          <p className="small"><strong>Your best hold so far: {bestBalanceSec(doc)} seconds.</strong>{(doc.balanceTests || []).length > 0 ? ` ${lastLoggedLabel(doc.balanceTests)}.` : ''}</p>
          <div className="grid2">
            <div>
              <label htmlFor="bal-test-l">Left leg (seconds)</label>
              <input id="bal-test-l" inputMode="numeric" value={balTestL} onChange={(e) => { setBalTestL(e.target.value); setBalTestMsg(''); }} placeholder={doc.balanceBaseline ? `Was ${doc.balanceBaseline.left}s` : 'Seconds'} />
            </div>
            <div>
              <label htmlFor="bal-test-r">Right leg (seconds)</label>
              <input id="bal-test-r" inputMode="numeric" value={balTestR} onChange={(e) => { setBalTestR(e.target.value); setBalTestMsg(''); }} placeholder={doc.balanceBaseline ? `Was ${doc.balanceBaseline.right}s` : 'Seconds'} />
            </div>
          </div>
          <button
            className="primary"
            style={{ marginTop: 10 }}
            onClick={() => {
              const l = Number(balTestL) || 0;
              const r = Number(balTestR) || 0;
              if (l <= 0 && r <= 0) {
                setBalTestMsg('Enter seconds for at least one leg.');
                return;
              }
              const prevBest = bestBalanceSec(doc);
              const newBest = Math.max(l, r);
              update((d) => {
                d.balanceTests = [...(d.balanceTests || []), { id: `b${Date.now()}`, date: new Date().toISOString(), leftSec: l, rightSec: r }];
                if (newBest > prevBest) d.xp += 10;
              });
              setBalTestL('');
              setBalTestR('');
              setBalTestMsg(newBest > prevBest ? `New balance best: ${newBest} seconds. +10 XP.` : `Balance test saved: ${l}s left, ${r}s right.`);
              toast(newBest > prevBest ? `New balance best: ${newBest} seconds. +10 XP.` : 'Balance test saved.');
            }}
          >
            Save balance test
          </button>
          {balTestMsg && <p className={balTestMsg.startsWith('Enter') ? 'error' : 'ok'}>{balTestMsg}</p>}
          {(doc.balanceTests || []).length > 0 && (
            <div style={{ marginTop: 10 }}>
              {[...doc.balanceTests].reverse().slice(0, 5).map((t) => (
                <p key={t.id} className="small" style={{ margin: '2px 0' }}>
                  {new Date(String(t.date)).toLocaleDateString()}: {t.leftSec}s left, {t.rightSec}s right
                </p>
              ))}
            </div>
          )}
          <p className="small muted">Keep the 2-minute balance practice going too: it is a daily quest on Today (+15 XP).</p>
        </div>
        {(week12Done || doc.week13Goal) && (
        <div className="card" id="week13-plan">
          <h3>Week 13: keep going</h3>
          <p className="small muted">After Week 12, pick where to go next. Nothing resets. Your guardian, gear, and XP stay.</p>
          {week12Done && (
          <div className="row">
            {[1, 2, 3].map((ph) => (
              <button
                key={ph}
                type="button"
                onClick={() => {
                  update((d) => { d.phaseOverride = ph; d.week13Goal = `Cycle back to Phase ${ph}`; });
                  setRetestMsg(`Week 13 plan saved. You are back in Phase ${ph}.`);
                  toast(`Week 13 plan saved. You are back in Phase ${ph}.`);
                }}
              >
                Cycle back to Phase {ph}
              </button>
            ))}
            <button type="button" onClick={() => { update((d) => { d.week13Goal = 'Keep going in Phase 4 or 5'; }); setRetestMsg('Week 13 plan saved. Keep going in Phase 4 or 5.'); toast('Week 13 plan saved. Keep going in Phase 4 or 5.'); }}>Stay in Phase 4 or 5</button>
          </div>
          )}
          {doc.week13Goal && <p className="small">Your Week 13 plan: {doc.week13Goal}</p>}
        </div>
        )}
        {(doc.assessmentVideos || []).length > 0 && (
          <div className="card">
            <h3>Assessment videos you uploaded</h3>
            {(doc.assessmentVideos || []).map((v) => (
              <p key={v.id}>
                {v.label} · Week {v.week} · {new Date(v.date).toLocaleDateString()} · {(v.sizeBytes / 1024 / 1024).toFixed(1)} MB · Derek can watch it in Coach.
              </p>
            ))}
          </div>
        )}
        {templates.map((t) => (
          <details className="card" key={t.id}>
            <summary>{t.plainName} ({t.name})</summary>
            <p><strong>Inhibit:</strong> {t.inhibit}</p>
            <p><strong>Lengthen:</strong> {t.lengthen}</p>
            <p><strong>Activation:</strong> {t.activation}</p>
            <p><strong>Integration:</strong> {t.integration}</p>
            <p className="small muted">Next steps: {t.progression.join(' Then: ')}</p>
            <p className="small muted">Derek cannot fix pain. These moves help you move better with less discomfort. For sharp, new, worsening, or non-improving pain, see a doctor or physical therapist.</p>
          </details>
        ))}
        {doc.contraindications.length > 0 && (
          <div className="notice">
            <strong>Notes for your plan:</strong> {doc.contraindications.join(', ')}. Your workouts will be adjusted for these.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card" id="assessment-start">
      <h2>Assessment, 30 to 45 minutes</h2>
      <p className="muted small">Goals and history, then the movement screen: overhead squat, single-leg squat, and postural assessment. Filming is optional and never required. Skip any video and you can still finish.</p>

      {step === 0 && (
        <div>
          <h3>Step 1: Health screen</h3>
          <p>Answer honestly. A serious flag pauses the movement part until you have doctor clearance.</p>
          {ASSESSMENT_QUESTIONS.parq.map((q) => (
            <label key={q} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400 }}>
              <input type="checkbox" checked={parq.includes(q)} onChange={() => toggle(parq, q, setParq)} style={{ width: 'auto', minHeight: 0, marginTop: 4 }} />
              {q}
            </label>
          ))}
          <label>Health flags that change your plan (pick any)</label>
          <div className="row">
            {['High blood pressure', 'Diabetes', 'Pregnancy', 'Heart condition', 'Osteoporosis', 'Recent injury or surgery', 'Knee pain', 'Back pain'].map((f) => (
              <button key={f} type="button" onClick={() => toggle(flags, f, setFlags)} style={flags.includes(f) ? { background: '#124571', color: '#fff' } : {}}>
                {f}
              </button>
            ))}
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="primary" onClick={() => setStep(1)} disabled={parq.length > 0 && !doctorCleared}>Next: your goals and history</button>
          </div>
          {parq.length > 0 && (
            <div className="notice" style={{ marginTop: 10 }}>
              <strong>You answered yes to a health question.</strong> Talk to your doctor before the movement part, and only carry on once you have clearance. Your answers are saved so Derek sees them.
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400, marginTop: 8 }}>
                <input type="checkbox" checked={doctorCleared} onChange={(e) => setDoctorCleared(e.target.checked)} style={{ width: 'auto', minHeight: 0, marginTop: 4 }} />
                My doctor cleared me to start training.
              </label>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div>
          <h3>Step 2: Goals, history, and body details (optional)</h3>
          {ASSESSMENT_QUESTIONS.questions.map((q) => (
            <p key={q} className="small">· {q}</p>
          ))}
          <label>Training experience</label>
          <select value={experience} onChange={(e) => setExperience(e.target.value as never)}>
            <option value="new">New to training</option>
            <option value="some">Some experience</option>
            <option value="regular">Train regularly</option>
          </select>
          <label>How long have you trained?</label>
          <select value={years} onChange={(e) => setYears(e.target.value as never)}>
            <option value="under1">Less than 1</option>
            <option value="1to3">1 to 3</option>
            <option value="over3">More than 3</option>
          </select>
          <label>What do you want to focus on? (1 = not a focus, 5 = a big focus)</label>
          {FOCUS_AREAS.map((f) => (
            <div key={f.id} style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 400 }}>{f.label}: {focus[f.id] || 3} of 5</label>
              <input type="range" min={1} max={5} step={1} value={focus[f.id] || 3} onChange={(e) => setFocus((p) => ({ ...p, [f.id]: Number(e.target.value) }))} />
            </div>
          ))}
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400 }}>
            <input type="checkbox" checked={socialPerm} onChange={(e) => setSocialPerm(e.target.checked)} style={{ width: 'auto', minHeight: 0, marginTop: 4 }} />
            Derek may share my progress or photos in his posts (only with my okay first).
          </label>
          <label>What equipment do you have? (pick all you have)</label>
          <p className="small muted">Your workouts swap out moves you cannot do. No cable machine, no cable row: you get a dumbbell row instead.</p>
          <div className="equip-list">
            {EQUIPMENT_OPTIONS.map((e) => (
              <label key={e}>
                <input
                  type="checkbox"
                  checked={equipment.includes(e)}
                  onChange={() => toggle(equipment, e, setEquipment)}
                />
                <span>
                  <span className="equip-name">{e}</span>{' '}
                  <span className="equip-note">{EQUIPMENT_NOTES[e] || ''}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="grid2">
            <div>
              <label htmlFor="a-sex">Sex (for nutrition numbers)</label>
              <select id="a-sex" value={sex} onChange={(e) => setSex(e.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
            <div>
              <label htmlFor="a-age">Age</label>
              <input id="a-age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 45" />
            </div>
            <div>
              <label htmlFor="a-height">Height (inches)</label>
              <input id="a-height" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 66" />
            </div>
            <div>
              <label htmlFor="a-weight">Weight (lb)</label>
              <input id="a-weight" inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 190" />
            </div>
            <div>
              <label htmlFor="a-goalw">Goal weight (lb)</label>
              <input id="a-goalw" inputMode="numeric" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} placeholder="e.g. 165" />
            </div>
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="primary" onClick={() => setStep(2)}>Next: movement screen</button>
            <button onClick={() => setStep(0)}>Back</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3>Step 3: Movement screen</h3>
          <p>Do an overhead squat, a single-leg squat, and a postural check, or watch Derek do them and mark what you see. Pick every pattern you notice.</p>
          <h3 style={{ marginTop: 16 }}>Watch how to do it</h3>
          <p className="small muted">One example per move. Open one to see it.</p>
          {ASSESSMENT_EXAMPLES.map((ex) => (
            <details className="card" key={ex.id}>
              <summary>{ex.title}</summary>
              {ex.whatToDo.map((s, i) => (
                <p key={i}>· {s}</p>
              ))}
              <p><strong>Good form:</strong> {ex.goodForm}</p>
              <ExampleVideo src={ex.videoUrl} label="Derek shows the move." />
            </details>
          ))}
          <div className="row">
            {FINDING_LABELS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFindings((prev) => (prev.includes(f.id) ? prev.filter((x) => x !== f.id) : [...prev, f.id]))}
                style={findings.includes(f.id) ? { background: '#124571', color: '#fff' } : {}}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="small muted">No findings? Leave them all unpicked. That is a clean screen.</p>
          <div className="grid2">
            <div>
              <label htmlFor="a-squat">Squat form</label>
              <select id="a-squat" value={squat} onChange={(e) => setSquat(e.target.value as FormRating)}>
                <option value="good">Good</option>
                <option value="ok">Okay</option>
                <option value="poor">Needs work</option>
              </select>
            </div>
            <div>
              <label htmlFor="a-hinge">Hinge (deadlift) form</label>
              <select id="a-hinge" value={hinge} onChange={(e) => setHinge(e.target.value as FormRating)}>
                <option value="good">Good</option>
                <option value="ok">Okay</option>
                <option value="poor">Needs work</option>
              </select>
            </div>
            <div>
              <label htmlFor="a-bench">Bench / push form</label>
              <select id="a-bench" value={bench} onChange={(e) => setBench(e.target.value as FormRating)}>
                <option value="good">Good</option>
                <option value="ok">Okay</option>
                <option value="poor">Needs work</option>
              </select>
            </div>
          </div>
          <h3 style={{ marginTop: 16 }}>Balance baseline (general check)</h3>
          <p className="small muted">Stand near something stable. Hold one leg up as long as you can. Stop if you feel unsteady.</p>
          <div className="grid2">
            <div>
              <label htmlFor="a-bal-l">Left leg (seconds)</label>
              <input id="a-bal-l" inputMode="numeric" value={balL} onChange={(e) => setBalL(e.target.value)} placeholder="e.g. 12" />
            </div>
            <div>
              <label htmlFor="a-bal-r">Right leg (seconds)</label>
              <input id="a-bal-r" inputMode="numeric" value={balR} onChange={(e) => setBalR(e.target.value)} placeholder="e.g. 9" />
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Upload a video (optional)</h3>
            <p className="small muted">Filming is never required. If you want, film a short clip of your squat so Derek can see your form. Skipping never blocks you.</p>
            {!videoSkipped && (
              <div>
                <label htmlFor="a-video">Pick a video, or record one on your phone</label>
                <input
                  id="a-video"
                  type="file"
                  accept="video/*"
                  onChange={(e) => pickVideo(e.target.files?.[0])}
                />
                {videoPreview && videoFile && (
                  <div style={{ marginTop: 10 }}>
                    <video src={videoPreview} controls style={{ width: '100%', maxHeight: 240 }} />
                    <p className="small muted">{videoFile.name} · {(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    <div className="row">
                      <button className="primary" disabled={videoUploading} onClick={uploadVideo}>
                        {videoUploading ? 'Uploading...' : 'Upload this video'}
                      </button>
                      <button
                        onClick={() => {
                          if (videoPreview) URL.revokeObjectURL(videoPreview);
                          setVideoPreview('');
                          setVideoFile(null);
                          setVideoMsg('');
                          setVideoError('');
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
                <div className="row" style={{ marginTop: 10 }}>
                  <button
                    onClick={() => {
                      if (videoPreview) URL.revokeObjectURL(videoPreview);
                      setVideoPreview('');
                      setVideoFile(null);
                      setVideoSkipped(true);
                    }}
                  >
                    Skip video
                  </button>
                </div>
              </div>
            )}
            {videoSkipped && <p className="small muted">No video added. You can still finish.</p>}
            {videoMsg && <p className="ok">{videoMsg}</p>}
            {videoError && <p className="error">{videoError}</p>}
            {(doc.assessmentVideos || []).length > 0 && (
              <p className="small muted">Uploaded this assessment: {(doc.assessmentVideos || []).length} video{(doc.assessmentVideos || []).length === 1 ? '' : 's'}.</p>
            )}
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="primary" onClick={finish}>Finish my assessment</button>
            <button onClick={() => setStep(1)}>Back</button>
          </div>
        </div>
      )}
    </div>
  );
}
