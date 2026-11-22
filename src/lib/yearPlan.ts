// The 52-week year: four 12-week cycles plus a Week 52 review. Every cycle
// is different: new goal, new land, new boss rounds, new companions, new
// gear, and a harder training target. Nothing here names a brand. The
// training tracks are Active Life tracks, built from the same moves and
// structure the client already knows.
//
// Periodization, in plain words:
// - Cycle 1 builds the base (Phases 1 to 3).
// - Cycle 2 gets stronger (Phases 3 to 4, one more set on main lifts).
// - Cycle 3 pushes further (Phases 4 to 5 where unlocked, heavier main
//   lifts, 4 to 6 reps, longer rest).
// - Cycle 4 peaks, then keeps going (heaviest main lifts of the year).
// - Week 12 of every cycle is a retest AND a deload week: lighter loads,
//   then the retest. The next cycle only opens after that cycle's retest,
//   the same gate as Week 13.
// - Retests happen at Week 4, 8, and 12 of EVERY cycle, plus a Week 52
//   review. Rest stays per muscle group: 1 to 2 rest days between
//   strength days for the same muscles.

export const YEAR_WEEKS = 52;

export const RETEST_WEEKS = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52];

export const BOSS_WEEKS = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52];

export const DELOAD_WEEKS = [12, 24, 36, 48, 52];

export interface YearCycle {
  cycle: number;
  name: string;
  goal: string;
  weeks: [number, number];
  phases: string;
  lands: string;
  track: string;
  trackDetail: string;
  progression: string;
  deload: string;
  story: string;
  bossWeeks: number[];
  companionIds: string[];
}

export const YEAR_CYCLES: YearCycle[] = [
  {
    cycle: 1,
    name: 'Build the base',
    goal: 'Move well and build the base',
    weeks: [1, 12],
    phases: 'Phases 1 to 3',
    lands: 'Sapphire Forest, Crystal Shores, Navy Peaks',
    track: 'Foundation track',
    trackDetail: 'Learn the moves first. Steady pace, full range, slow lowering.',
    progression: 'Add a rep, or a little weight, each week you hit the top of the rep range. Form first, load second.',
    deload: 'Week 12 is a retest and deload week. Lighter loads, then test your balance and form.',
    story: 'The guardian leaves home, meets Bram and Sylva in the Sapphire Forest, and learns to move well. Three boss rounds guard the road out.',
    bossWeeks: [4, 8, 12],
    companionIds: ['bram', 'sylva', 'ash', 'miso', 'ember', 'tilda', 'pip', 'rowan', 'quill', 'mara', 'hoot', 'kaelith'],
  },
  {
    cycle: 2,
    name: 'Get stronger',
    goal: 'Get stronger',
    weeks: [13, 24],
    phases: 'Phases 3 to 4',
    lands: 'Ember Highlands',
    track: 'Build strength track',
    trackDetail: 'Compound lifts first, 3 to 4 sets of 8 to 12 reps, with a little more weight each week you earn it.',
    progression: 'Add 1 set to your main lifts. When you hit the top of the rep range on a lift, add a little weight next time. Your PRs are the proof.',
    deload: 'Week 24 is a retest and deload week. Lighter loads, then the retest that opens the next stretch.',
    story: 'Past the Navy Peaks, the road climbs into the Ember Highlands. Wren the scout shows the short cuts, and Fern the gardener tends the rest stops. The work gets heavier, and the guardian gets stronger with it.',
    bossWeeks: [16, 20, 24],
    companionIds: ['wren', 'fern'],
  },
  {
    cycle: 3,
    name: 'Push further',
    goal: 'Push further',
    weeks: [25, 36],
    phases: 'Phases 4 to 5 where unlocked',
    lands: 'Storm Coast',
    track: 'Push heavy track',
    trackDetail: 'Main lifts go heavy: 4 to 6 reps with longer rest. Accessories stay at 8 to 12 reps.',
    progression: 'Main lifts move to heavier sets of 4 to 6 reps with longer rest between sets. If a lift feels fast and clean, add weight. Phase 5 still needs a clean retest and Derek\'s approval.',
    deload: 'Week 36 is a retest and deload week. Lighter loads, then the retest that opens the next stretch.',
    story: 'The Storm Coast is wind and rain and steep stairs. Ansel the old climber joins the road and teaches the guardian to brace against the weather. The bosses here hit harder, and so does the guardian.',
    bossWeeks: [28, 32, 36],
    companionIds: ['ansel'],
  },
  {
    cycle: 4,
    name: 'Peak and keep going',
    goal: 'Peak, then keep going',
    weeks: [37, 48],
    phases: 'Phases 4 to 5',
    lands: 'Golden Summit',
    track: 'Peak track',
    trackDetail: 'Your heaviest main lifts yet, plus short daily sessions when time is tight.',
    progression: 'Your heaviest main lifts yet. Week 48 is a retest and deload, then steady build weeks and a review retest at the end of the road, where you test your best and pick your next goal.',
    deload: 'Week 48 is a retest and deload week. After that, steady build weeks and a review retest at the end of the road: retest, deload, and look back at how far you have come.',
    story: 'The Golden Summit is the highest ground yet. Lark the messenger flies ahead with news of the road home. The bosses here are the hardest, and the guardian meets them with a long stretch of training behind every rep.',
    bossWeeks: [40, 44, 48, 52],
    companionIds: ['lark'],
  },
];

export function cycleForWeek(week: number): { cycle: YearCycle; weekInCycle: number; isReview: boolean } {
  const w = Math.min(YEAR_WEEKS, Math.max(1, week));
  const found = YEAR_CYCLES.find((c) => w >= c.weeks[0] && w <= c.weeks[1]);
  if (found) return { cycle: found, weekInCycle: w - found.weeks[0] + 1, isReview: false };
  // Weeks 49 to 52: the year review stretch, still part of Cycle 4.
  const c4 = YEAR_CYCLES[3];
  return { cycle: c4, weekInCycle: w - c4.weeks[0] + 1, isReview: true };
}

export function isDeloadWeek(week: number): boolean {
  return DELOAD_WEEKS.includes(week);
}

export function nextRetestWeek(week: number, doneWeeks: Set<number>): number | null {
  for (const w of RETEST_WEEKS) {
    if (!doneWeeks.has(w) && w >= week) return w;
  }
  for (const w of RETEST_WEEKS) {
    if (!doneWeeks.has(w)) return w;
  }
  return null;
}

export function nextBossWeek(week: number, beatenWeeks: Set<number>): number | null {
  for (const w of BOSS_WEEKS) {
    if (!beatenWeeks.has(w) && w >= week) return w;
  }
  for (const w of BOSS_WEEKS) {
    if (!beatenWeeks.has(w)) return w;
  }
  return null;
}

// How a week is shown to the client. The last retest week is a review
// retest, never a number: the length of the road stays hidden, so no
// client ever sees a finish line. Internal week numbers still drive
// gating, retests, and bosses.
export function weekLabel(week: number): string {
  return week === 52 ? 'Review' : `Week ${week}`;
}

export function nextRetestLabel(week: number | null): string {
  if (week === null) return 'All retests done.';
  if (week === 52) return 'Next retest: a review retest.';
  return `Next retest: Week ${week}.`;
}

export function nextBossLabel(week: number | null): string {
  if (week === null) return 'All boss rounds beaten.';
  if (week === 52) return 'Next boss round: a review round.';
  return `Next boss round: Week ${week}.`;
}

export function monthForWeek(week: number): number {
  return Math.min(12, Math.max(1, Math.ceil((week * 12) / YEAR_WEEKS)));
}

// One challenge per month, each tied to a real result: strength, cardio
// minutes, sleep, measurements, or consistency. Shown on Today and
// Journey; the client (and Derek) can see whether it happened.
export interface MonthlyChallenge {
  month: number;
  title: string;
  detail: string;
  result: string;
}

export const MONTHLY_CHALLENGES: MonthlyChallenge[] = [
  { month: 1, title: 'Show up 12 times', detail: 'Check in 12 days this month.', result: '12 check-ins' },
  { month: 2, title: '600 cardio minutes', detail: 'Log 600 minutes of cardio this month, Zone 2 pace.', result: '600 cardio minutes' },
  { month: 3, title: 'Sleep 7 hours, 7 nights', detail: 'Log 7 nights of 7 or more hours of sleep.', result: '7 nights at 7+ hours' },
  { month: 4, title: 'A new personal record', detail: 'Set a PR on any lift.', result: '1 new PR' },
  { month: 5, title: 'Measure and see', detail: 'Log your waist and weight twice this month.', result: '2 measurement logs' },
  { month: 6, title: 'Two 150-minute cardio weeks', detail: 'Hit 150 minutes of cardio in two different weeks.', result: '2 weeks at 150+ minutes' },
  { month: 7, title: 'Beat your balance best', detail: 'Hold your balance longer than your best retest.', result: 'A new balance best' },
  { month: 8, title: '25 workouts total', detail: 'Reach 25 workouts logged since you started.', result: '25 workouts' },
  { month: 9, title: '14-day check-in streak', detail: 'Check in 14 days in a row.', result: '14-day streak' },
  { month: 10, title: '1,000 cardio minutes total', detail: 'Reach 1,000 cardio minutes logged since you started.', result: '1,000 cardio minutes' },
  { month: 11, title: '50 workouts total', detail: 'Reach 50 workouts logged since you started.', result: '50 workouts' },
  { month: 12, title: 'Review and keep going', detail: 'Do a review retest, look back at how far you have come, and pick your next goal.', result: 'Review retest done' },
];

export function challengeForWeek(week: number): MonthlyChallenge {
  return MONTHLY_CHALLENGES[monthForWeek(week) - 1];
}
