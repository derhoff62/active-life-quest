import type { Ctx } from '../App';
import Assessment from './Assessment';
import Workouts from './Workouts';
import { assessmentPending } from '../lib/store';
import { nextRetestDueWeek } from '../lib/badges';

// Train: everything about training, in one tab. Workouts first, because
// that is the one next step on most days. Assessment and retests sit
// right below it, open when something is due (first assessment, a
// pending review, or a retest week) and closed behind one tap the rest
// of the time, so the tab stays short once the assessment is done.
// Nothing is removed: the old Assessment tab lives here, whole.
export default function Train({ ctx }: { ctx: Ctx }) {
  const { doc } = ctx;
  const retestDue = nextRetestDueWeek(doc) !== null;
  const needsAssessment = !doc.assessmentDone || assessmentPending(doc) || retestDue;
  return (
    <div>
      <Workouts ctx={ctx} />
      <details className="card" open={needsAssessment}>
        <summary>
          <strong>Assessment and retests</strong>
          {needsAssessment && <span className="small muted"> · Something is due here.</span>}
        </summary>
        <p className="small muted">Your first assessment sets your starting phase. Retests at Weeks 4, 8, and 12 check your movement again. Derek reviews every one before your phase moves.</p>
        <Assessment ctx={ctx} />
      </details>
    </div>
  );
}
