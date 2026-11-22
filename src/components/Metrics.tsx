// Metrics tracker: one metric at a time, with a simple trend line.
// Shared by Progress (client, can log) and Coach (read-only, Derek sees
// the same numbers for each client). All data comes from fields the app
// already records: measurements, weigh-ins, PRs, sleep, steps, cardio.
// Nothing here invents a new log: PRs still come from finishing a
// workout, sleep from Today, steps and cardio from Progress below.
// Weight stays once a week, same day and time, and only the trend over
// weeks matters. Measurements, photos, strength, and how clothes fit
// come first; the scale is last.
import { useState } from 'react';
import type { ProfileDoc } from '../lib/store';
import { metCompanionIds, cardioCreditMinutes } from '../lib/store';

type MetricKey =
  | 'weight' | 'waist' | 'chest' | 'hips' | 'arms' | 'thighs'
  | 'strength' | 'sleep' | 'steps' | 'cardio';

const METRICS: { key: MetricKey; label: string; unit: string }[] = [
  { key: 'weight', label: 'Weight', unit: 'lb' },
  { key: 'waist', label: 'Waist', unit: 'in' },
  { key: 'chest', label: 'Chest', unit: 'in' },
  { key: 'hips', label: 'Hips', unit: 'in' },
  { key: 'arms', label: 'Arms', unit: 'in' },
  { key: 'thighs', label: 'Thighs', unit: 'in' },
  { key: 'strength', label: 'Strength', unit: 'lb' },
  { key: 'sleep', label: 'Sleep', unit: 'hours' },
  { key: 'steps', label: 'Steps', unit: 'steps' },
  { key: 'cardio', label: 'Cardio', unit: 'min' },
];

// Body measurements live on one measurement entry, alongside waist.
// Old entries only have waist / weight / clothes fit; the new fields are
// optional, so old profiles never crash and never show a fake zero.
const BODY_FIELDS: { key: 'waist' | 'chest' | 'hips' | 'arms' | 'thighs'; label: string }[] = [
  { key: 'waist', label: 'Waist' },
  { key: 'chest', label: 'Chest' },
  { key: 'hips', label: 'Hips' },
  { key: 'arms', label: 'Arms' },
  { key: 'thighs', label: 'Thighs' },
];

interface Point { date: string; value: number; label: string }

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

/** One series per metric, oldest first, from fields the app already logs. */
export function metricSeries(doc: ProfileDoc, key: MetricKey, exercise?: string): Point[] {
  const measurements = doc.measurements || [];
  const byDate = (a: Point, b: Point) => new Date(a.date).getTime() - new Date(b.date).getTime();
  if (key === 'weight') {
    return measurements
      .filter((m) => (m as { kind?: string }).kind === 'weigh-in')
      .map((m) => ({ date: String(m.date), value: num((m as { weight?: unknown }).weight), label: '' }))
      .filter((p): p is Point => p.value !== null)
      .map((p) => ({ ...p, label: `${p.value} lb` }))
      .sort(byDate);
  }
  if (BODY_FIELDS.some((f) => f.key === key)) {
    return measurements
      .map((m) => ({ date: String(m.date), value: num((m as Record<string, unknown>)[key]), label: '' }))
      .filter((p): p is Point => p.value !== null)
      .map((p) => ({ ...p, label: `${p.value} in` }))
      .sort(byDate);
  }
  if (key === 'strength') {
    if (!exercise) return [];
    return (doc.prs || [])
      .filter((p) => p.exercise === exercise)
      .map((p) => ({ date: p.date, value: p.weight, label: `${p.weight} lb x ${p.reps}` }))
      .sort(byDate);
  }
  if (key === 'sleep') {
    return (doc.sleep || [])
      .map((s) => ({ date: String(s.date), value: num((s as { hours?: unknown }).hours), label: '' }))
      .filter((p): p is Point => p.value !== null)
      .map((p) => ({ ...p, label: `${p.value} hours` }))
      .sort(byDate);
  }
  if (key === 'steps') {
    return (doc.steps || [])
      .map((s) => ({ date: String(s.date), value: num((s as { steps?: unknown }).steps), label: '' }))
      .filter((p): p is Point => p.value !== null)
      .map((p) => ({ ...p, label: `${p.value.toLocaleString()} steps` }))
      .sort(byDate);
  }
  // Cardio: one point per log, credited minutes (HIIT counts double).
  return (doc.cardio || [])
    .map((c) => ({ date: String(c.date), value: cardioCreditMinutes(c as { minutes?: unknown; zone?: unknown }), label: (c as { zone?: string }).zone === 'HIIT' ? `${Number((c as { minutes?: number }).minutes || 0)} min HIIT = ${cardioCreditMinutes(c as { minutes?: unknown; zone?: unknown })} credited` : `${cardioCreditMinutes(c as { minutes?: unknown; zone?: unknown })} min` }))
    .filter((p): p is Point => p.value !== null && p.value > 0)
    .sort(byDate);
}

/** Latest value for one metric, for a one-line Coach summary. */
export function latestMetric(doc: ProfileDoc, key: MetricKey): Point | null {
  const s = metricSeries(doc, key);
  return s.length ? s[s.length - 1] : null;
}

export function TrendChart({ points, unit }: { points: Point[]; unit: string }) {
  if (points.length < 2) {
    return <p className="muted">Log 2 entries to see a trend line here.</p>;
  }
  const W = 340;
  const H = 150;
  const PAD = 8;
  const values = points.map((p) => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) { min -= 1; max += 1; }
  const span = max - min || 1;
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / Math.max(1, points.length - 1);
  const y = (v: number) => PAD + ((max - v) / span) * (H - PAD * 2 - 18);
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Trend chart, ${points.length} entries, from ${points[0].value} to ${points[points.length - 1].value} ${unit}`}>
        <polyline points={line} fill="none" stroke="#124571" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r="5" fill="#c9a227" stroke="#124571" strokeWidth="2" />
        ))}
        <text x={PAD} y={H - 4} fontSize="11" fill="#124571">{fmtDate(points[0].date)}</text>
        <text x={W - PAD} y={H - 4} fontSize="11" fill="#124571" textAnchor="end">{fmtDate(points[points.length - 1].date)}</text>
      </svg>
      <p className="small muted" style={{ margin: '2px 0' }}>
        Highest {max} {unit} · Lowest {min} {unit}
      </p>
    </div>
  );
}

interface MetricsProps {
  doc: ProfileDoc;
  // Omit update/toast for a read-only view (Coach). With them, the client
  // can log measurements and weigh-ins here.
  update?: (fn: (d: ProfileDoc) => void) => void;
  toast?: (msg: string) => void;
}

export default function Metrics({ doc, update, toast }: MetricsProps) {
  const readOnly = !update || !toast;
  const [metric, setMetric] = useState<MetricKey>('weight');
  const [exercise, setExercise] = useState('');
  const [measure, setMeasure] = useState<Record<string, string>>({});
  const [clothes, setClothes] = useState('');
  const [weigh, setWeigh] = useState('');
  const [weighMsg, setWeighMsg] = useState('');
  const [measureMsg, setMeasureMsg] = useState('');
  const [measureBusy, setMeasureBusy] = useState(false);

  const exercises = [...new Set((doc.prs || []).map((p) => p.exercise))].sort();
  const pickedExercise = exercise || exercises[0] || '';
  const points = metricSeries(doc, metric, pickedExercise);
  const meta = METRICS.find((m) => m.key === metric)!;
  const latest = points.length ? points[points.length - 1] : null;
  const first = points.length ? points[0] : null;
  const change = latest && first && points.length >= 2 ? latest.value - first.value : null;
  const cardioWeek = metric === 'cardio'
    ? (doc.cardio || [])
      .filter((c) => Date.now() - new Date(String(c.date)).getTime() < 7 * 24 * 60 * 60 * 1000)
      .reduce((s, c) => s + cardioCreditMinutes(c as { minutes?: unknown; zone?: unknown }), 0)
    : null;

  function logMeasurement() {
    if (!update || !toast || measureBusy) return;
    const filled: Record<string, string> = {};
    for (const f of BODY_FIELDS) {
      const raw = (measure[f.key] || '').trim();
      if (!raw) continue;
      const n = Number(raw);
      if (Number.isNaN(n) || n <= 0) {
        setMeasureMsg(`Enter ${f.label.toLowerCase()} in inches, as a number over 0.`);
        return;
      }
      filled[f.key] = raw;
    }
    if (Object.keys(filled).length === 0 && !clothes.trim()) {
      setMeasureMsg('Enter at least one measurement, or how clothes fit.');
      return;
    }
    setMeasureBusy(true);
    window.setTimeout(() => setMeasureBusy(false), 700);
    const entry = { ...filled, clothesFit: clothes.trim() || undefined };
    const fern = metCompanionIds(doc).has('fern');
    update((d) => {
      d.measurements.push({ id: `m${Date.now()}`, date: new Date().toISOString(), ...entry });
      if (fern) d.xp += 5;
    });
    toast(fern ? 'Measurement saved. +5 XP from Fern.' : 'Measurement saved.');
    setMeasureMsg(fern ? 'Measurement saved. +5 XP from Fern.' : 'Measurement saved.');
    setMeasure({});
    setClothes('');
  }

  function logWeighIn() {
    if (!update || !toast) return;
    if (!weigh || Number.isNaN(Number(weigh)) || Number(weigh) <= 0) {
      setWeighMsg('Enter your weight in pounds.');
      return;
    }
    // Once a week, same day and time: a weigh-in in the last 6 days is
    // already this week's one. Daily weigh-ins stay blocked.
    const sixDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000;
    const recent = (doc.measurements || []).some(
      (m) => (m as { kind?: string }).kind === 'weigh-in' && new Date(String(m.date)).getTime() >= sixDaysAgo,
    );
    if (recent) {
      setWeighMsg('You already weighed in this week. Same day and time next week, and only the trend over weeks matters.');
      return;
    }
    update((d) => {
      d.measurements.push({ id: `m${Date.now()}`, date: new Date().toISOString(), weight: Number(weigh), kind: 'weigh-in' });
      if (metCompanionIds(doc).has('fern')) d.xp += 5;
    });
    setWeigh('');
    setWeighMsg('Weigh-in logged.');
    toast('Weigh-in logged.');
  }

  const isBody = BODY_FIELDS.some((f) => f.key === metric);

  return (
    <div className="card">
      <h3>Metrics</h3>
      <p className="small muted">
        Do not live on the scale. Weight swings a few pounds day to day with water, food, and sleep, and muscle gain can hide fat loss.
        Track measurements, photos, how clothes fit, and strength first. Pick one metric at a time.
      </p>
      <div className="row" role="group" aria-label="Pick a metric">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMetric(m.key)}
            style={metric === m.key ? { background: '#124571', color: '#fff' } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      {metric === 'strength' && exercises.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <label htmlFor="metric-exercise">Which lift?</label>
          <select id="metric-exercise" value={pickedExercise} onChange={(e) => setExercise(e.target.value)}>
            {exercises.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        {points.length === 0 ? (
          <p className="muted">
            {metric === 'weight' && 'No weigh-ins yet. Log one below, once a week, same day and time.'}
            {isBody && 'No measurements for this one yet. Log one below.'}
            {metric === 'strength' && 'No personal records yet. Log a heavier weight or more reps than last time in a workout and it shows here.'}
            {metric === 'sleep' && 'No sleep logged yet. Log it in the Sleep tab.'}
            {metric === 'steps' && 'No steps logged yet. Log them below on Progress.'}
            {metric === 'cardio' && 'No cardio logged yet. Log it in the Cardio tab.'}
          </p>
        ) : (
          <>
            <p>
              <strong>Latest: {latest!.label}</strong> · {fmtDate(latest!.date)}
              {change !== null && (
                <> · Change since first: {change > 0 ? '+' : ''}{change} {meta.unit} (first {first!.label}, {fmtDate(first!.date)})</>
              )}
            </p>
            {metric === 'weight' && <p className="small muted">Only the trend over weeks matters, not one weigh-in.</p>}
            {metric === 'cardio' && cardioWeek !== null && <p className="small">Last 7 days: {cardioWeek} minutes of the 150 to 300 target.</p>}
            <TrendChart points={points} unit={meta.unit} />
            <p className="small muted">{points.length} {points.length === 1 ? 'entry' : 'entries'} logged.</p>
            {points.slice(-5).reverse().map((p, i) => (
              <p key={i} className="small" style={{ margin: '2px 0' }}>{fmtDate(p.date)}: {p.label}</p>
            ))}
          </>
        )}
      </div>

      {!readOnly && isBody && (
        <div style={{ marginTop: 12 }}>
          <h4 style={{ margin: '0 0 6px' }}>Log measurements (inches, optional)</h4>
          <p className="small muted">Log them together, once a week if you like. Leave any blank you do not want to track.</p>
          <div className="grid2">
            {BODY_FIELDS.map((f) => (
              <div key={f.key}>
                <label htmlFor={`metric-${f.key}`}>{f.label} (in)</label>
                <input
                  id={`metric-${f.key}`}
                  inputMode="decimal"
                  value={measure[f.key] || ''}
                  onChange={(e) => setMeasure((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder="e.g. 38.5"
                />
              </div>
            ))}
          </div>
          <label htmlFor="metric-clothes">How do clothes fit?</label>
          <input id="metric-clothes" value={clothes} onChange={(e) => setClothes(e.target.value)} placeholder="e.g. Belt one notch tighter" />
          <button className="primary" style={{ marginTop: 10 }} disabled={measureBusy} onClick={logMeasurement}>
            {measureBusy ? 'Saving…' : 'Log measurement'}
          </button>
          {measureMsg && <p className={measureMsg.startsWith('Enter') ? 'error' : 'ok'}>{measureMsg}</p>}
        </div>
      )}

      {!readOnly && metric === 'weight' && (
        <div id="weigh-in" style={{ marginTop: 12 }}>
          <label htmlFor="metric-weigh">Once-a-week weigh-in (lb, same day and time)</label>
          {(() => {
            const weighIns = (doc.measurements || []).filter((m) => (m as { kind?: string }).kind === 'weigh-in');
            return weighIns.length > 0 ? <p className="small muted">Last logged {new Date(String(weighIns[weighIns.length - 1].date)).toLocaleDateString()}.</p> : <p className="small muted">No weigh-in logged yet.</p>;
          })()}
          <input id="metric-weigh" inputMode="decimal" value={weigh} onChange={(e) => { setWeigh(e.target.value); setWeighMsg(''); }} placeholder="e.g. 188" />
          <button style={{ marginTop: 8 }} onClick={logWeighIn}>Log weigh-in</button>
          {weighMsg && <p className={weighMsg.startsWith('You already') || weighMsg.startsWith('Enter') ? 'error' : 'ok'}>{weighMsg}</p>}
        </div>
      )}

      {!readOnly && metric === 'strength' && (
        <p className="small muted" style={{ marginTop: 12 }}>Personal records are recorded when you finish a workout. Log a heavier weight or more reps than last time and it counts here.</p>
      )}
      {!readOnly && metric === 'sleep' && (
        <p className="small muted" style={{ marginTop: 12 }}>Sleep is logged in the Sleep tab.</p>
      )}
      {!readOnly && metric === 'steps' && (
        <p className="small muted" style={{ marginTop: 12 }}>Log steps below on this page. It shows up here.</p>
      )}
      {!readOnly && metric === 'cardio' && (
        <p className="small muted" style={{ marginTop: 12 }}>Log cardio in the Cardio tab. It shows up here.</p>
      )}
    </div>
  );
}
