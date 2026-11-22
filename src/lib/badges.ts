// Tab badges: a gold light / number on a bottom-nav tab when something in
// that tab needs doing. One place, so every rule is easy to check and
// every badge clears when the thing is done.
//
// Rules (all from data already on the profile doc):
// - Today: a NUMBER = check-in not logged today (1) + workout due today
//   (1) + unread messages/nudges from Derek. Clears as each is done.
// - Assessment: a dot when the assessment itself is not done yet, when a
//   retest is due (Week 4/8/12 of any cycle, plus the Week 52 review), or
//   when Week 13 is available (Week 12 retest saved, no Week 13 goal yet).
// - Workouts: a dot when today's workout is not done yet. Rest is per
//   muscle group, not per day: after a full-body day yesterday, today is
//   a rest day and there is no badge; after a Push/Pull/Legs or short
//   session yesterday, a different group is due today.
// - Cardio: a dot while this week's cardio is under 150 minutes.
// - Sleep: a dot when sleep has not been logged today.
// - Journey: a dot when a boss round is ready (unlocked, unbeaten, and
//   enough mana for the cheapest spell) or when the journey has moved to
//   a later week than the last Journey visit (a new companion / land).
// - Nutrition: never. It is education only; there is nothing actionable
//   in the tab, so badging it would just be noise.
// - Progress: a dot when a weigh-in is due (none in the last 6 days).
// - Armor: a dot when gear has been earned since the last Armor visit.
//   armorSeenCount is the count the client had seen; it is only ever
//   raised when the client opens the Armor tab.
// - FAQ: never. - Coach: a NUMBER = unread nudges + replies from Derek.
//
// Fresh accounts only ever see Today (check-in) and Assessment (do the
// assessment): Cardio, Sleep, Journey, Workouts and Progress badges are
// all gated on the assessment being done first.
import { ARMOR, BOSS_ROUNDS, CREATURES, SPELLS } from './data';
import { RETEST_WEEKS } from './yearPlan';
import {
  currentWeekForDoc,
  earnedArmorIds,
  loggedToday,
  phaseForDoc,
  cardioCreditedSum,
  type ProfileDoc,
} from './store';

export type TabBadge = { count?: number } | null;

const DAY = 24 * 60 * 60 * 1000;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  return new Date(Date.now() - DAY).toISOString().slice(0, 10);
}

export function cardioThisWeek(doc: ProfileDoc): number {
  const weekAgo = Date.now() - 7 * DAY;
  // Credited minutes: high-intensity minutes count double.
  return cardioCreditedSum(doc.cardio, weekAgo);
}

export function unreadCount(doc: ProfileDoc): number {
  return (
    (doc.nudges || []).filter((n) => !n.read).length +
    (doc.messages || []).filter((m) => m.coachReply && !m.repliedAt).length
  );
}

export function workoutDueToday(doc: ProfileDoc): boolean {
  if (!doc.assessmentDone) return false;
  if (doc.lastWorkoutDate === todayStr()) return false;
  // Rest is per muscle group: a full-body day yesterday means today is a
  // rest day; a Push/Pull/Legs, Upper/Lower, or short session yesterday
  // leaves a different group due today.
  if (doc.lastWorkoutDate === yesterdayStr() && (doc.trainingStyle || 'full-body') === 'full-body') return false;
  return true;
}

export function retestDue(doc: ProfileDoc): boolean {
  if (!doc.assessmentDone) return false;
  const done = new Set((doc.retests || []).map((r) => (r as { week?: number }).week));
  const week = currentWeekForDoc(doc);
  return RETEST_WEEKS.some((w) => week >= w && !done.has(w));
}

/** First retest week that is due and not saved yet, or null. */
export function nextRetestDueWeek(doc: ProfileDoc): number | null {
  if (!doc.assessmentDone) return null;
  const done = new Set((doc.retests || []).map((r) => (r as { week?: number }).week));
  const week = currentWeekForDoc(doc);
  return RETEST_WEEKS.find((w) => week >= w && !done.has(w)) ?? null;
}

export function weighInDue(doc: ProfileDoc): boolean {
  if (!doc.assessmentDone) return false;
  const sixDaysAgo = Date.now() - 6 * DAY;
  return !(doc.measurements || []).some(
    (m) => (m as { kind?: string }).kind === 'weigh-in' && new Date(String(m.date)).getTime() >= sixDaysAgo,
  );
}

function journeyNeedsAttention(doc: ProfileDoc): boolean {
  if (!doc.assessmentDone) return false;
  const phase = phaseForDoc(doc);
  const cheapestSpell = Math.min(...SPELLS.map((s) => s.cost));
  const bossReady = BOSS_ROUNDS.some((r) => {
    const hp = (doc.bossHp || {})[r.id] ?? r.maxHp;
    return phase >= r.unlockPhase && hp > 0 && doc.mana >= cheapestSpell;
  });
  if (bossReady) return true;
  // The journey has moved on since the client last looked at it: a new
  // companion or land is waiting.
  return currentWeekForDoc(doc) > (doc.journeySeenWeek || 0);
}

/** First boss round that is unlocked, unbeaten, and affordable, or null. */
export function readyBoss(doc: ProfileDoc): { id: string; week: number; name: string; land: string; maxHp: number; hp: number } | null {
  if (!doc.assessmentDone) return null;
  const phase = phaseForDoc(doc);
  const cheapestSpell = Math.min(...SPELLS.map((s) => s.cost));
  const r = BOSS_ROUNDS.find((x) => {
    const hp = (doc.bossHp || {})[x.id] ?? x.maxHp;
    return phase >= x.unlockPhase && hp > 0 && doc.mana >= cheapestSpell;
  });
  if (!r) return null;
  return { ...r, hp: (doc.bossHp || {})[r.id] ?? r.maxHp };
}

/** Companions met since the client last opened Journey. */
export function newCompanions(doc: ProfileDoc): { id: string; name: string }[] {
  if (!doc.assessmentDone) return [];
  const week = currentWeekForDoc(doc);
  const seenWeek = doc.journeySeenWeek || 0;
  return CREATURES.filter((c) => week >= c.meetWeek && c.meetWeek > seenWeek).map((c) => ({ id: c.id, name: c.name }));
}

/** Gear earned since the client last opened Armor, in award order. */
export function newGearIds(doc: ProfileDoc): string[] {
  return earnedArmorIds(doc).slice(doc.armorSeenCount || 0);
}

/** Client-visible names of the gear in newGearIds. */
export function newGearNames(doc: ProfileDoc): string[] {
  const byId = new Map(ARMOR.map((a) => [a.id, a.name]));
  return newGearIds(doc).map((id) => byId.get(id) || id).filter(Boolean);
}

export function tabBadges(doc: ProfileDoc): Record<string, TabBadge> {
  const unread = unreadCount(doc);
  const checkinDue = !loggedToday(doc.checkins);
  const workoutDue = workoutDueToday(doc);
  const todayCount = (checkinDue ? 1 : 0) + (workoutDue ? 1 : 0) + unread;

  const week12Done = (doc.retests || []).some((r) => (r as { week?: number }).week === 12);
  const week13Available = week12Done && !doc.week13Goal;

  return {
    today: todayCount > 0 ? { count: todayCount } : null,
    assessment: !doc.assessmentDone || retestDue(doc) || week13Available ? {} : null,
    workouts: workoutDue ? {} : null,
    cardio: doc.assessmentDone && cardioThisWeek(doc) < 150 ? {} : null,
    sleep: doc.assessmentDone && !loggedToday(doc.sleep) ? {} : null,
    journey: journeyNeedsAttention(doc) ? {} : null,
    nutrition: null,
    progress: weighInDue(doc) ? {} : null,
    armor: earnedArmorIds(doc).length > (doc.armorSeenCount || 0) ? {} : null,
    faq: null,
    coach: unread > 0 ? { count: unread } : null,
  };
}
