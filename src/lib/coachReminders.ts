// Coach reminders engine: who needs Derek today, worked out from each
// client's profile. One place, so the Coach dashboard list, the "Needs
// you" count, and the client-detail flags all agree. All rules use data
// already on the profile doc; nothing here invents a new log.
import { RETEST_WEEKS } from './yearPlan';
import {
  checkinStreakDays,
  currentWeekForDoc,
  missedCheckinDays,
  recoveryScoreForDoc,
  trialEndsAt,
  hasFullAccess,
  pendingRetests,
  type ProfileDoc,
} from './store';
import { nextRetestDueWeek } from './badges';

export interface CoachReminder {
  kind:
    | 'message'
    | 'missed-checkin'
    | 'low-recovery'
    | 'trial-ending'
    | 'retest-due'
    | 'retest-review'
    | 'doctor-clearance'
    | 'unfinished-workout'
    | 'balance-skipped'
    | 'week13'
    | 'hurts';
  text: string;
}

const DAY = 24 * 60 * 60 * 1000;

export function coachRemindersForClient(data: ProfileDoc, displayName: string): CoachReminder[] {
  const name = displayName || 'A client';
  const out: CoachReminder[] = [];
  const unreplied = (data.messages || []).filter((m) => !m.coachReply);
  for (const m of unreplied) {
    out.push({ kind: 'message', text: `New ${m.kind === 'video-call-request' ? 'video call request' : m.kind} from ${name}` });
  }
  // Missed check-ins: 2 or more days since the last daily check-in.
  const missed = missedCheckinDays(data);
  if (data.assessmentDone && missed >= 2 && missed !== Number.POSITIVE_INFINITY) {
    out.push({ kind: 'missed-checkin', text: `${name} has not checked in for ${missed} days` });
  }
  if (data.assessmentDone && missed === Number.POSITIVE_INFINITY) {
    out.push({ kind: 'missed-checkin', text: `${name} has never logged a check-in` });
  }
  // Low recovery score from the last check-in actually logged.
  const rec = recoveryScoreForDoc(data);
  if (rec !== null && rec < 50) {
    out.push({ kind: 'low-recovery', text: `${name} has a low recovery score (${rec}/100)` });
  }
  // Trial ending soon: 3 days or less left on the 14-day trial.
  if (data.trialStartedAt && !data.betaRedeemed) {
    const ends = trialEndsAt(data);
    if (ends) {
      const daysLeft = Math.ceil((new Date(ends).getTime() - Date.now()) / DAY);
      if (daysLeft >= 0 && daysLeft <= 3) {
        out.push({ kind: 'trial-ending', text: `${name}'s trial ends in ${daysLeft === 0 ? 'less than a day' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`}` });
      }
    }
  }
  // Retests due: Weeks 8 and 12 as well as Week 4, in order, any cycle.
  const dueWeek = nextRetestDueWeek(data);
  if (dueWeek !== null) {
    out.push({ kind: 'retest-due', text: dueWeek === 52 ? `${name} is due a review retest` : `${name} is due the Week ${dueWeek} retest` });
  }
  // Doctor clearance: a health-question yes saved, with no clearance recorded.
  if ((data.healthFlags || []).length > 0 && !data.doctorCleared) {
    out.push({ kind: 'doctor-clearance', text: `${name} answered yes to a health question and has no doctor clearance on file` });
  }
  // Unfinished workout still open.
  if (data.sessions) {
    out.push({ kind: 'unfinished-workout', text: `Unfinished workout for ${name}` });
  }
  // Retests waiting for Derek's review: a client saved one, and no
  // phase moves until Derek approves it. One reminder per pending retest.
  for (const r of pendingRetests(data)) {
    const w = Number((r as { week?: number }).week || 0);
    out.push({ kind: 'retest-review', text: w === 52 ? `${name} sent a review retest to review` : `${name} sent the Week ${w} retest to review` });
  }
  // Balance skipped: no balance quest and no balance test in the last 7 days.
  if (data.assessmentDone) {
    const weekAgo = Date.now() - 7 * DAY;
    const didBalance =
      (data.quests || []).some((q) => (q as { kind?: string }).kind === 'balance-quest' && new Date(String(q.date)).getTime() >= weekAgo) ||
      (data.balanceTests || []).some((t) => new Date(String(t.date)).getTime() >= weekAgo);
    if (!didBalance) {
      out.push({ kind: 'balance-skipped', text: `${name} has not done any balance work in the last 7 days` });
    }
  }
  // Week 13 plan waiting to be sent.
  if (data.week13PlanRequested) {
    out.push({ kind: 'week13', text: `Week 13 plan to send to ${name}` });
  }
  // A move flagged as hurting, with the reason the client gave.
  for (const fb of data.exerciseFeedback || []) {
    if (fb.kind === 'hurts') {
      out.push({ kind: 'hurts', text: `${name} said ${fb.exerciseName} hurts (${fb.reason === 'hurts' ? 'pain' : fb.reason === 'too-hard' ? 'too hard' : fb.reason === 'no-equipment' ? 'no equipment' : "does not like it"}). Check in before it is swapped again.` });
    }
  }
  return out;
}

/** All reminders across clients, in client order. */
export function coachReminders(clients: { displayName: string; email: string; data: ProfileDoc }[]): CoachReminder[] {
  const out: CoachReminder[] = [];
  for (const c of clients) out.push(...coachRemindersForClient(c.data, c.displayName || c.email));
  return out;
}

/** Retest weeks still due, for the Coach stats card. */
export function retestWeeksDue(data: ProfileDoc): number[] {
  if (!data.assessmentDone) return [];
  const done = new Set((data.retests || []).map((r) => (r as { week?: number }).week));
  const week = currentWeekForDoc(data);
  return RETEST_WEEKS.filter((w) => week >= w && !done.has(w));
}

export { checkinStreakDays, hasFullAccess };
