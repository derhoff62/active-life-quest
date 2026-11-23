// Guardian mood, automatic (Derek, Nov 22 9:21 PM: the guardian should
// not be stuck with the angry Determined look). On Today the guardian's
// face reflects how the client is doing, using ONLY data already in the
// profile — nothing is invented. The client's picked default mood
// (guardian.mood, chosen in Customize guardian) shows everywhere else,
// and on Today when no rule below fires. When a rule fires, it wins on
// Today, and Today shows a small caption saying why.
// Priority, first match wins:
// 1. Struggling — a 'hurts' feedback in the last 3 days. Pain outranks
//    everything: the face does not celebrate while something hurts.
// 2. Tired — recovery under 45 from the last check-in, OR the last
//    check-in said energy 3 or less (0-10), OR the last sleep logged
//    (within 2 days) was under 6 hours, OR no check-in for 3+ days.
//    The missed-check-in rule only applies once they have checked in
//    before — a brand-new account with no check-ins gets no rule, not
//    a tired face on day one.
// 3. Celebrate — a personal record set today or yesterday.
// 4. Strong — a workout logged today.
// Otherwise null: Today shows the picked default mood.
import type { GuardianMood, ProfileDoc } from './store';
import { missedCheckinDays, recoveryScoreForDoc } from './store';

export interface AutoMood {
  face: GuardianMood;
  label: string;
  reason: string;
}

function wholeDaysSince(dateStr: string | undefined | null): number | null {
  if (!dateStr) return null;
  const t = new Date(String(dateStr)).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
}

function isToday(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false;
  const d = new Date(String(dateStr));
  if (Number.isNaN(d.getTime())) return false;
  return d.toDateString() === new Date().toDateString();
}

export function autoMood(doc: ProfileDoc): AutoMood | null {
  // 1. Struggling: something hurt recently.
  const hurts = (doc.exerciseFeedback || []).some(
    (f) => f.kind === 'hurts' && (wholeDaysSince(f.date) ?? 999) <= 3,
  );
  if (hurts) {
    return { face: 'struggling', label: 'struggling', reason: 'something hurt in your last workout' };
  }

  // 2. Tired: recovery, energy, sleep, or gone quiet.
  const recovery = recoveryScoreForDoc(doc);
  const lastCheckin = (doc.checkins || [])[(doc.checkins || []).length - 1] as { energy?: number } | undefined;
  const lastSleep = (doc.sleep || [])[(doc.sleep || []).length - 1] as { hours?: number; date?: string } | undefined;
  const tiredReasons: string[] = [];
  if (recovery !== null && recovery < 45) tiredReasons.push('recovery is low');
  if (lastCheckin && typeof lastCheckin.energy === 'number' && lastCheckin.energy <= 3) {
    tiredReasons.push('your last check-in said energy was low');
  }
  if (lastSleep && typeof lastSleep.hours === 'number' && lastSleep.hours < 6 && (wholeDaysSince(lastSleep.date) ?? 999) <= 2) {
    tiredReasons.push("last night's sleep was short");
  }
  if ((doc.checkins || []).length > 0 && missedCheckinDays(doc) >= 3) {
    tiredReasons.push('you have not checked in for a few days');
  }
  if (tiredReasons.length > 0) {
    return { face: 'tired', label: 'tired', reason: tiredReasons[0] };
  }

  // 3. Celebrate: a personal record today or yesterday.
  const recentPr = (doc.prs || []).some((p) => (wholeDaysSince(p.date) ?? 999) <= 1);
  if (recentPr) {
    return { face: 'celebrate', label: 'celebrating', reason: 'you set a personal record' };
  }

  // 4. Strong: a workout logged today.
  if (isToday(doc.lastWorkoutDate)) {
    return { face: 'strong', label: 'strong', reason: 'you trained today' };
  }

  return null;
}
