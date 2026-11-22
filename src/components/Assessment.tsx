import { useState } from 'react';
import type { Ctx } from '../App';
import * as api from '../lib/api';
import { ASSESSMENT_EXAMPLES, ASSESSMENT_QUESTIONS, CES_TEMPLATES, CONTRAINDICATIONS, DEFAULT_EQUIPMENT, EQUIPMENT_NOTES, EQUIPMENT_OPTIONS, recommendPhase } from '../lib/data';
import { currentWeekForDoc } from '../lib/store';
import type { FindingId, FormRating } from '../lib/types';

const FINDING_LABELS: { id: FindingId; label: string }[] = CES_TEMPLATES.map((t) => ({ id: t.id, label: t.plainName }));

export default function Assessment({ ctx }: { ctx: Ctx }) {
  const { doc, update } = ctx;
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
  const [done, setDone] = useState(false);
  const [retaking, setRetaking] = useState(false);
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
    const contra = CONTRAINDICATIONS.filter((c) => flags.some((f) => c.flag.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(c.flag.toLowerCase().split(' ')[0]))).map((c) => c.flag);
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
      d.healthFlags = flags;
      d.equipment = equipment.length > 0 ? equipment : [...DEFAULT_EQUIPMENT];
      d.contraindications = contra;
      d.balanceBaseline = { left: Number(balL) || 0, right: Number(balR) || 0 };
      d.body = {
        sex,
        heightIn: Number(height) || null,
        weightLb: Number(weight) || null,
        goalWeightLb: Number(goalWeight) || null,
        age: Number(age) || null,
        activity: d.body.activity,
      };
      d.xp += 60;
    });
    setDone(true);
    setRetaking(false);
  }

  if (result && (done || doc.assessmentDone) && !retaking) {
    const templates = CES_TEMPLATES.filter((t) => result.findings.includes(t.id));
    return (
      <div>
        <div className="card gold-frame">
          <h2>Your assessment is done</h2>
          <p><strong>Starting phase: Phase {result.startingPhase}.</strong> {result.reason}</p>
          <p className="muted small">Total time: 30 to 45 minutes, goals and history plus the movement screen. You earned 60 XP.</p>
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
          <button className="primary" onClick={() => { setDone(false); setRetaking(true); setStep(0); }}>Retake the assessment</button>
        </div>
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
    <div className="card">
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
            <button className="primary" onClick={() => setStep(1)}>Next: your goals and history</button>
          </div>
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
          <label>Years training</label>
          <select value={years} onChange={(e) => setYears(e.target.value as never)}>
            <option value="under1">Under 1 year</option>
            <option value="1to3">1 to 3 years</option>
            <option value="over3">Over 3 years</option>
          </select>
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
              <input id="a-age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 52" />
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
              <p className="small muted">{ex.videoNote}</p>
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
