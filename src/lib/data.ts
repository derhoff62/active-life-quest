// Active Life Quest content and data layer.
// Plain language, beginner readable. No em-dashes anywhere in strings.
// Pain scope: Derek cannot fix, treat, diagnose, or cure pain. Wording is
// move better with less discomfort, and refer to a doctor or physical
// therapist for sharp, new, worsening, or non-improving pain.

import type {
  ArmorPiece,
  AssessmentResult,
  Badge,
  CesTemplate,
  Checkin,
  ClassInfo,
  Contraindication,
  Creature,
  Exercise,
  Faq,
  FormRating,
  GoalTypeInfo,
  Monster,
  NutritionSection,
  PhaseInfo,
  PriceOption,
  Spell,
  Workout,
} from './types';

export type { Checkin, AssessmentResult };

// ---------------------------------------------------------------- PHASES

export const PHASES: PhaseInfo[] = [
  {
    phase: 1,
    name: 'Stabilization and Endurance',
    weeks: 'Weeks 1-4',
    reps: '12-20 reps',
    sets: '1-3 sets',
    rest: '0-90 seconds between moves',
    description:
      'Slow, controlled moves that build balance, joint control, and good form. This is where every beginner starts, and where the guardian learns to move well before moving heavy.',
    why: 'Good form first. Strength built on shaky form does not last, and slow reps teach your muscles to control every inch of the move.',
  },
  {
    phase: 2,
    name: 'Strength and Endurance',
    weeks: 'Weeks 5-8',
    reps: '8-12 reps',
    sets: '2-4 sets',
    rest: '0-60 seconds between moves',
    description:
      'Heavier moves than Phase 1, still with steady control. You start to feel stronger in everyday life, like carrying groceries and climbing stairs.',
    why: 'This phase bridges control and strength. You keep the form from Phase 1 and add enough load to build real muscle.',
  },
  {
    phase: 3,
    name: 'Building Strength and Mobility',
    weeks: 'Weeks 9-12',
    reps: '6-12 reps',
    sets: '3-5 sets',
    rest: '90 seconds to 2 minutes on main lifts, 0-60 seconds on accessories',
    description:
      'The main lifts get heavier and the rest gets longer, so you can lift well on every set. Mobility work keeps your joints moving freely as you get stronger.',
    why: 'Heavier lifting with full rest builds the most strength. The longer rest on main lifts is what lets you keep good form under load.',
  },
  {
    phase: 4,
    name: 'Maximal Strength',
    weeks: 'After Phase 3 and a clean Week 12 retest',
    reps: '1-5 reps',
    sets: '4-6 sets',
    rest: '3-5 minutes between sets',
    description:
      'Heavy, low-rep lifting for your strongest lifts. You only unlock this phase after finishing Phase 3 and passing the Week 12 retest with clean form.',
    why: 'Low reps with long rest let you lift the heaviest safe loads. That is how top-end strength is built, and it only works when form is already solid.',
  },
  {
    phase: 5,
    name: 'Power',
    weeks: 'Locked until a clean form retest AND Derek Coach approval',
    reps: '3-5 reps, fast and controlled',
    sets: '3-5 sets',
    rest: '3-5 minutes between sets',
    description:
      'Explosive moves that build speed and power on top of your strength. This phase stays locked until your retest shows clean form and Derek approves it in person.',
    why: 'Power moves are fast, so form has to be automatic first. The retest plus Derek approval keeps this phase safe.',
  },
];

// Weekly sets per muscle, by phase. Shorter sessions hit each muscle
// with fewer sets, so they need more days a week to reach the same
// weekly total. 15 minutes needs 4 days, 30 minutes needs 3 days, and
// 45 or more minutes needs 2 days in Phases 1-2 and 3 days in Phases 3-5,
// where the sets per muscle are higher. 60 minutes needs the same as
// 45 or more: it is a longer session, not more days. Always with 1 to 2
// rest days between strength days.
export const PHASE_WEEKLY_SETS: Record<number, string> = {
  1: '6 to 10',
  2: '8 to 12',
  3: '10 to 15',
  4: '12 to 18',
  5: '10 to 15',
};

export function daysForTime(timeMin: 15 | 30 | 45 | 60, phase: number): number {
  if (timeMin === 15) return 4;
  if (timeMin === 30) return 3;
  return phase >= 3 ? 3 : 2;
}

// --------------------------------------------------------------- WORKOUTS

const YMOVE = 'Exercise video by Your Move';

// Playable video clips, served from public/videos/. The six Your Move clips
// are the exact matches on file; the single-leg RDL and step-up clips are
// Derek's own (step-up added Nov 25, 2026, clipped and muted from his take).
const EXERCISE_VIDEOS: Record<string, string> = {
  'Dumbbell Goblet Squat': '/videos/dumbbell-goblet-squat.mp4',
  'Seated Cable Row': '/videos/seated-cable-row.mp4',
  'Lat Pulldown': '/videos/lat-pulldown.mp4',
  'Single-Arm Dumbbell Row': '/videos/single-arm-dumbbell-row.mp4',
  'Barbell Back Squat': '/videos/barbell-back-squat.mp4',
  'Barbell Deadlift': '/videos/barbell-deadlift.mp4',
  'Single-Leg Romanian Deadlift': '/videos/single-leg-rdl-derek.mp4',
  'Step-Up': '/videos/step-up.mp4',
};

// Demo videos for moves with no Derek clip yet. Curated form demos (slow lowering,
// neutral spine, no hype) found via web search Nov 22, 2026. Opens in a new tab so
// the workout never loses its place. No brand names in the link label.
const EXERCISE_DEMO_LINKS: Record<string, string> = {
  'Dumbbell Bench Press': 'https://www.youtube.com/watch?v=q1f4utk67jQ',
  'Romanian Deadlift': 'https://www.youtube.com/watch?v=JCPd_L-xI5k',
  'Push-Up': 'https://www.youtube.com/watch?v=8V-ZUMvQKr0',
  'Glute Bridge': 'https://www.youtube.com/watch?v=B_MWNJOwUcM',
  'Split Squat': 'https://www.youtube.com/watch?v=NIDiXDxzvYs',
  'Pallof Press': 'https://www.youtube.com/watch?v=axgv7H_VQOo',
  'Dumbbell Overhead Press': 'https://www.youtube.com/watch?v=9jzSIztp6EQ',
  'Dead Bug': 'https://www.youtube.com/watch?v=GbSC02oU3To',
  'Bird Dog': 'https://www.youtube.com/watch?v=xEDnlOxeJH4',
  'Side Plank': 'https://www.youtube.com/watch?v=NXr4Fw8q60o',
  'Plank': 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
};

function e(
  id: string,
  name: string,
  sets: number,
  reps: string,
  restSec: number,
  howTo: string[],
  regression: string,
  swap?: string,
  tempo?: string,
  videoLabel?: string,
): Exercise {
  return { id, name, sets, reps, restSec, tempo, howTo, regression, swap, videoLabel, videoUrl: EXERCISE_VIDEOS[name], demoUrl: EXERCISE_DEMO_LINKS[name] };
}

export const WORKOUTS: Workout[] = [
  {
    id: 'day1-first',
    title: 'Your First Workout',
    phase: 1,
    day: 'Day 1',
    minutes: 12,
    note: 'Your very first session. Short, gentle, and made to be finished. Rest as long as you need between moves.',
    exercises: [
      e('glute-bridge', 'Glute Bridge', 2, '10 reps', 30,
        ['Lie on your back, knees bent, feet flat on the floor.', 'Push through your heels and lift your hips until your body is a straight line from shoulders to knees.', 'Lower slowly for 3 to 4 seconds.'],
        'Shorten the lift. Raise your hips only halfway.',
        'Hip thrust with a dumbbell on your lap', '4/2/1'),
      e('goblet-squat', 'Dumbbell Goblet Squat', 2, '8 reps', 60,
        ['Hold one dumbbell at your chest with both hands.', 'Sit back and down until your thighs are about parallel to the floor.', 'Push through your whole foot to stand. Keep your chest up.'],
        'Squat to a chair. Sit down, then stand up.',
        'Bodyweight squat to a chair', '4/2/1', YMOVE),
      e('seated-cable-row', 'Seated Cable Row', 2, '10 reps', 60,
        ['Sit tall, knees slightly bent, and hold the handle with both hands.', 'Pull the handle to your belly button, squeezing your shoulder blades together.', 'Lower slowly for 3 to 4 seconds.'],
        'Use a lighter weight or a resistance band.',
        'Single-arm dumbbell row', '4/2/1', YMOVE),
      e('bird-dog', 'Bird Dog', 2, '6 reps each side', 30,
        ['Start on hands and knees, back flat.', 'Reach one arm forward and the opposite leg back.', 'Hold for 2 seconds, then switch sides without rocking your hips.'],
        'Lift only the arm, or only the leg.',
        'Dead bug', '4/2/1'),
      e('dead-bug', 'Dead Bug', 2, '8 reps', 30,
        ['Lie on your back, arms up, knees bent at 90 degrees.', 'Slowly lower one arm and the opposite leg toward the floor.', 'Return and switch sides. Keep your low back pressed gently to the floor.'],
        'Lower only the arms, or only the legs.',
        'Plank on knees', '4/2/1'),
    ],
  },
  {
    id: 'p1a',
    title: 'Phase 1 Workout A',
    phase: 1,
    day: 'Day A',
    minutes: 30,
    note: 'Slow tempo on every rep. Lower for 3 to 4 seconds. Take 1 to 2 rest days between strength days.',
    exercises: [
      e('goblet-squat', 'Dumbbell Goblet Squat', 2, '12 reps', 60,
        ['Hold one dumbbell at your chest with both hands.', 'Sit back and down until your thighs are about parallel to the floor.', 'Push through your whole foot to stand.'],
        'Squat to a chair. Sit down, then stand up.',
        'Bodyweight squat', '4/2/1', YMOVE),
      e('romanian-deadlift', 'Romanian Deadlift', 2, '12 reps', 60,
        ['Hold dumbbells in front of your thighs, knees soft.', 'Push your hips back and lower the weights down your legs.', 'Stop when you feel a stretch in your hamstrings, then stand tall.'],
        'Use very light dumbbells or no weight, hands on thighs.',
        'Glute bridge', '4/2/1'),
      e('dumbbell-bench-press', 'Dumbbell Bench Press', 2, '12 reps', 60,
        ['Lie on a bench, dumbbells over your chest.', 'Lower the weights slowly to chest level.', 'Press up until your arms are straight.'],
        'Floor press. Lie on the floor so your elbows stop at the floor.',
        'Push-up on a wall', '4/2/1'),
      e('lat-pulldown', 'Lat Pulldown', 2, '12 reps', 60,
        ['Sit at the machine, knees under the pad, hands wide on the bar.', 'Pull the bar down to your upper chest.', 'Let it rise slowly for 3 to 4 seconds.'],
        'Use a lighter weight or a resistance band pulldown.',
        'Seated cable row', '4/2/1', YMOVE),
      e('plank', 'Plank', 2, '20 seconds', 30,
        ['Rest on forearms and toes, body in one straight line.', 'Squeeze your glutes and brace your belly.', 'Breathe steadily. Do not let your hips sag.'],
        'Plank on knees instead of toes.',
        'Dead bug', '4/2/1'),
      e('step-up', 'Step-Up', 2, '10 reps each leg', 60,
        ['Stand facing a low step or box.', 'Step up with one foot and drive through that heel.', 'Step down slowly and switch legs.'],
        'Use a lower step, or hold a wall for balance.',
        'Glute bridge', '4/2/1'),
    ],
  },
  {
    id: 'p1b',
    title: 'Phase 1 Workout B',
    phase: 1,
    day: 'Day B',
    minutes: 30,
    note: 'Slow tempo on every rep. Lower for 3 to 4 seconds. Take 1 to 2 rest days between strength days.',
    exercises: [
      e('split-squat', 'Split Squat', 2, '10 reps each leg', 60,
        ['Take a long step forward and plant both feet.', 'Lower straight down until your back knee nearly touches the floor.', 'Push through your front foot to stand.'],
        'Hold a chair for balance and shorten the range.',
        'Glute bridge', '4/2/1'),
      e('single-leg-rdl', 'Single-Leg Romanian Deadlift', 2, '8 reps each leg', 60,
        ['Stand on one leg, soft knee, dumbbell in the opposite hand.', 'Hinge at the hips and reach the weight toward the floor.', 'Stand tall, squeezing your glute.'],
        'Touch a wall for balance, or keep the back toe on the floor.',
        'Romanian deadlift with two legs', '4/2/1', "Derek's video"),
      e('overhead-press', 'Dumbbell Overhead Press', 2, '12 reps', 60,
        ['Hold dumbbells at shoulder height, palms forward.', 'Press up until your arms are straight.', 'Lower slowly for 3 to 4 seconds.'],
        'Press one arm at a time while seated.',
        'Push-up on a wall', '4/2/1'),
      e('seated-cable-row', 'Seated Cable Row', 2, '12 reps', 60,
        ['Sit tall, knees slightly bent, and hold the handle with both hands.', 'Pull the handle to your belly button.', 'Lower slowly for 3 to 4 seconds.'],
        'Use a lighter weight or a resistance band.',
        'Single-arm dumbbell row', '4/2/1', YMOVE),
      e('side-plank', 'Side Plank', 2, '15 seconds each side', 30,
        ['Lie on your side, elbow under your shoulder.', 'Lift your hips into a straight line.', 'Hold and breathe. Switch sides.'],
        'Side plank on knees instead of feet.',
        'Dead bug', '4/2/1'),
      e('glute-bridge', 'Glute Bridge', 2, '15 reps', 30,
        ['Lie on your back, knees bent, feet flat.', 'Push through your heels and lift your hips.', 'Lower slowly for 3 to 4 seconds.'],
        'Shorten the lift. Raise your hips only halfway.',
        'Hip thrust with a dumbbell', '4/2/1'),
    ],
  },
  {
    id: 'p2a',
    title: 'Phase 2 Workout A',
    phase: 2,
    day: 'Day A',
    minutes: 35,
    note: 'Heavier than Phase 1, still controlled. Rest 0 to 60 seconds between moves.',
    exercises: [
      e('goblet-squat', 'Dumbbell Goblet Squat', 3, '10 reps', 45,
        ['Hold one dumbbell at your chest with both hands.', 'Sit back and down until your thighs are about parallel to the floor.', 'Push through your whole foot to stand.'],
        'Squat to a chair. Sit down, then stand up.',
        'Barbell back squat', '3/2/1', YMOVE),
      e('romanian-deadlift', 'Romanian Deadlift', 3, '10 reps', 45,
        ['Hold dumbbells in front of your thighs, knees soft.', 'Push your hips back and lower the weights down your legs.', 'Stand tall, squeezing your glutes.'],
        'Use lighter dumbbells or no weight.',
        'Glute bridge', '3/2/1'),
      e('dumbbell-bench-press', 'Dumbbell Bench Press', 3, '10 reps', 45,
        ['Lie on a bench, dumbbells over your chest.', 'Lower the weights slowly to chest level.', 'Press up until your arms are straight.'],
        'Floor press on the floor.',
        'Push-up on a bench', '3/2/1'),
      e('single-arm-dumbbell-row', 'Single-Arm Dumbbell Row', 3, '10 reps each arm', 45,
        ['One hand and knee on a bench, dumbbell in the free hand.', 'Pull the weight to your hip.', 'Lower slowly for 3 seconds.'],
        'Use a lighter dumbbell or a band.',
        'Seated cable row', '3/2/1', YMOVE),
      e('plank', 'Plank', 3, '30 seconds', 30,
        ['Rest on forearms and toes, body in one straight line.', 'Squeeze your glutes and brace your belly.', 'Breathe steadily.'],
        'Plank on knees.',
        'Dead bug', '3/2/1'),
      e('step-up', 'Step-Up', 3, '10 reps each leg', 45,
        ['Stand facing a low step or box.', 'Step up and drive through your heel.', 'Step down slowly and switch legs.'],
        'Use a lower step or hold a wall.',
        'Split squat', '3/2/1'),
    ],
  },
  {
    id: 'p2b',
    title: 'Phase 2 Workout B',
    phase: 2,
    day: 'Day B',
    minutes: 35,
    note: 'Heavier than Phase 1, still controlled. Rest 0 to 60 seconds between moves.',
    exercises: [
      e('barbell-back-squat', 'Barbell Back Squat', 3, '8 reps', 60,
        ['Set the bar across your upper back, feet shoulder width.', 'Sit back and down, chest up, knees tracking over toes.', 'Push through your whole foot to stand.'],
        'Goblet squat with a dumbbell.',
        'Leg press', '3/2/1', YMOVE),
      e('single-leg-rdl', 'Single-Leg Romanian Deadlift', 3, '8 reps each leg', 45,
        ['Stand on one leg, soft knee, dumbbell in the opposite hand.', 'Hinge at the hips and reach toward the floor.', 'Stand tall, squeezing your glute.'],
        'Touch a wall for balance.',
        'Romanian deadlift with two legs', '3/2/1', "Derek's video"),
      e('overhead-press', 'Dumbbell Overhead Press', 3, '10 reps', 45,
        ['Hold dumbbells at shoulder height.', 'Press up until your arms are straight.', 'Lower slowly.'],
        'Press one arm at a time while seated.',
        'Push-up on a bench', '3/2/1'),
      e('lat-pulldown', 'Lat Pulldown', 3, '10 reps', 45,
        ['Sit at the machine, knees under the pad.', 'Pull the bar down to your upper chest.', 'Let it rise slowly.'],
        'Use a lighter weight or a band pulldown.',
        'Seated cable row', '3/2/1', YMOVE),
      e('pallof-press', 'Pallof Press', 3, '10 reps each side', 30,
        ['Stand sideways to a cable or band at chest height.', 'Press the handle straight out and hold.', 'Resist the pull. Return slowly.'],
        'Use a lighter band or shorten the hold.',
        'Dead bug', '3/2/1'),
      e('bird-dog', 'Bird Dog', 3, '8 reps each side', 30,
        ['Start on hands and knees, back flat.', 'Reach one arm forward and the opposite leg back.', 'Hold for 2 seconds, then switch.'],
        'Lift only the arm, or only the leg.',
        'Dead bug', '3/2/1'),
    ],
  },
  {
    id: 'p3a',
    title: 'Phase 3 Workout A',
    phase: 3,
    day: 'Day A',
    minutes: 45,
    note: 'Main lifts get 90 seconds to 2 minutes of rest. Accessories get 0 to 60 seconds.',
    exercises: [
      e('barbell-back-squat', 'Barbell Back Squat', 4, '6 reps', 120,
        ['Set the bar across your upper back, feet shoulder width.', 'Sit back and down, chest up, knees tracking over toes.', 'Drive through your whole foot to stand.'],
        'Goblet squat with a dumbbell.',
        'Leg press', '3/1/1', YMOVE),
      e('barbell-deadlift', 'Barbell Deadlift', 4, '6 reps', 120,
        ['Stand with the bar over your mid-foot, shins close to the bar.', 'Grip the bar, chest up, and push the floor away.', 'Stand tall, then lower the bar with control.'],
        'Romanian deadlift with dumbbells.',
        'Trap bar deadlift', '3/1/1', YMOVE),
      e('dumbbell-bench-press', 'Dumbbell Bench Press', 3, '8 reps', 90,
        ['Lie on a bench, dumbbells over your chest.', 'Lower the weights to chest level.', 'Press up until your arms are straight.'],
        'Floor press on the floor.',
        'Push-up', '3/1/1'),
      e('seated-cable-row', 'Seated Cable Row', 3, '10 reps', 45,
        ['Sit tall, knees slightly bent.', 'Pull the handle to your belly button.', 'Lower slowly.'],
        'Use a lighter weight or a band.',
        'Single-arm dumbbell row', '3/1/1', YMOVE),
      e('plank', 'Plank', 3, '40 seconds', 30,
        ['Rest on forearms and toes, body in one straight line.', 'Squeeze your glutes and brace your belly.', 'Breathe steadily.'],
        'Plank on knees.',
        'Dead bug', '3/1/1'),
      e('step-up', 'Step-Up', 3, '10 reps each leg', 45,
        ['Stand facing a step or box.', 'Step up and drive through your heel.', 'Step down slowly.'],
        'Use a lower step.',
        'Split squat', '3/1/1'),
    ],
  },
  {
    id: 'p3b',
    title: 'Phase 3 Workout B',
    phase: 3,
    day: 'Day B',
    minutes: 45,
    note: 'Main lifts get 90 seconds to 2 minutes of rest. Accessories get 0 to 60 seconds.',
    exercises: [
      e('barbell-deadlift', 'Barbell Deadlift', 4, '6 reps', 120,
        ['Stand with the bar over your mid-foot.', 'Grip the bar, chest up, and push the floor away.', 'Stand tall, then lower with control.'],
        'Romanian deadlift with dumbbells.',
        'Trap bar deadlift', '3/1/1', YMOVE),
      e('barbell-back-squat', 'Barbell Back Squat', 4, '6 reps', 120,
        ['Set the bar across your upper back.', 'Sit back and down, chest up.', 'Drive through your whole foot to stand.'],
        'Goblet squat with a dumbbell.',
        'Leg press', '3/1/1', YMOVE),
      e('overhead-press', 'Dumbbell Overhead Press', 3, '8 reps', 90,
        ['Hold dumbbells at shoulder height.', 'Press up until your arms are straight.', 'Lower slowly.'],
        'Press one arm at a time while seated.',
        'Push-up on a bench', '3/1/1'),
      e('single-arm-dumbbell-row', 'Single-Arm Dumbbell Row', 3, '8 reps each arm', 45,
        ['One hand and knee on a bench, dumbbell in the free hand.', 'Pull the weight to your hip.', 'Lower slowly.'],
        'Use a lighter dumbbell or a band.',
        'Seated cable row', '3/1/1', YMOVE),
      e('single-leg-rdl', 'Single-Leg Romanian Deadlift', 3, '8 reps each leg', 45,
        ['Stand on one leg, soft knee.', 'Hinge at the hips and reach toward the floor.', 'Stand tall, squeezing your glute.'],
        'Touch a wall for balance.',
        'Romanian deadlift with two legs', '3/1/1', "Derek's video"),
      e('side-plank', 'Side Plank', 3, '30 seconds each side', 30,
        ['Lie on your side, elbow under your shoulder.', 'Lift your hips into a straight line.', 'Hold and breathe.'],
        'Side plank on knees.',
        'Dead bug', '3/1/1'),
    ],
  },
  {
    id: 'p4a',
    title: 'Phase 4 Workout A',
    phase: 4,
    day: 'Day A',
    minutes: 50,
    note: 'Maximal strength. Rest 3 to 5 minutes between sets on main lifts. Only after Phase 3 and a clean Week 12 retest.',
    exercises: [
      e('barbell-back-squat', 'Barbell Back Squat', 5, '3 reps', 240,
        ['Set the bar across your upper back, feet shoulder width.', 'Sit back and down with control, chest up.', 'Drive through your whole foot to stand.'],
        'Drop to a goblet squat at a lighter load.',
        'Leg press', '3/1/1', YMOVE),
      e('barbell-deadlift', 'Barbell Deadlift', 5, '3 reps', 240,
        ['Stand with the bar over your mid-foot.', 'Grip the bar, chest up, and push the floor away.', 'Stand tall, then lower with control.'],
        'Romanian deadlift with dumbbells.',
        'Trap bar deadlift', '3/1/1', YMOVE),
      e('dumbbell-bench-press', 'Dumbbell Bench Press', 4, '5 reps', 180,
        ['Lie on a bench, dumbbells over your chest.', 'Lower the weights to chest level.', 'Press up with control.'],
        'Floor press on the floor.',
        'Push-up', '3/1/1'),
      e('seated-cable-row', 'Seated Cable Row', 4, '5 reps', 120,
        ['Sit tall, knees slightly bent.', 'Pull the handle to your belly button.', 'Lower slowly.'],
        'Use a lighter weight.',
        'Single-arm dumbbell row', '3/1/1', YMOVE),
      e('plank', 'Plank', 3, '45 seconds', 60,
        ['Rest on forearms and toes, body in one straight line.', 'Squeeze your glutes and brace your belly.', 'Breathe steadily.'],
        'Plank on knees.',
        'Dead bug', '3/1/1'),
    ],
  },
  {
    id: 'p4b',
    title: 'Phase 4 Workout B',
    phase: 4,
    day: 'Day B',
    minutes: 50,
    note: 'Maximal strength. Rest 3 to 5 minutes between sets on main lifts. Only after Phase 3 and a clean Week 12 retest.',
    exercises: [
      e('barbell-deadlift', 'Barbell Deadlift', 5, '3 reps', 240,
        ['Stand with the bar over your mid-foot.', 'Grip the bar, chest up, and push the floor away.', 'Stand tall, then lower with control.'],
        'Romanian deadlift with dumbbells.',
        'Trap bar deadlift', '3/1/1', YMOVE),
      e('barbell-back-squat', 'Barbell Back Squat', 5, '3 reps', 240,
        ['Set the bar across your upper back.', 'Sit back and down with control.', 'Drive through your whole foot to stand.'],
        'Drop to a goblet squat at a lighter load.',
        'Leg press', '3/1/1', YMOVE),
      e('overhead-press', 'Dumbbell Overhead Press', 4, '5 reps', 180,
        ['Hold dumbbells at shoulder height.', 'Press up until your arms are straight.', 'Lower slowly.'],
        'Press one arm at a time while seated.',
        'Push-up on a bench', '3/1/1'),
      e('lat-pulldown', 'Lat Pulldown', 4, '5 reps', 120,
        ['Sit at the machine, knees under the pad.', 'Pull the bar down to your upper chest.', 'Let it rise slowly.'],
        'Use a lighter weight.',
        'Seated cable row', '3/1/1', YMOVE),
      e('pallof-press', 'Pallof Press', 3, '10 reps each side', 60,
        ['Stand sideways to a cable or band at chest height.', 'Press the handle straight out and hold.', 'Resist the pull. Return slowly.'],
        'Use a lighter band.',
        'Dead bug', '3/1/1'),
    ],
  },
  {
    id: 'p5a',
    title: 'Phase 5 Workout A',
    phase: 5,
    day: 'Day A',
    minutes: 50,
    note: 'Power. Fast, controlled, explosive reps. Locked until a clean form retest AND Derek Coach approval.',
    exercises: [
      e('barbell-back-squat', 'Barbell Back Squat', 4, '3 reps', 240,
        ['Set the bar across your upper back.', 'Lower with control, then drive up fast.', 'Land the rep with steady feet and a braced core.'],
        'Goblet squat at a lighter load, driven up fast.',
        'Leg press', '3/1/1', YMOVE),
      e('push-up', 'Push-Up', 4, '5 reps', 180,
        ['Hands under shoulders, body in one straight line.', 'Lower with control.', 'Push up fast and strong.'],
        'Push-up on a bench.',
        'Dumbbell bench press', '3/1/1'),
      e('barbell-deadlift', 'Barbell Deadlift', 4, '3 reps', 240,
        ['Stand with the bar over your mid-foot.', 'Push the floor away fast, chest up.', 'Lower with control.'],
        'Romanian deadlift with dumbbells.',
        'Trap bar deadlift', '3/1/1', YMOVE),
      e('single-arm-dumbbell-row', 'Single-Arm Dumbbell Row', 3, '5 reps each arm', 120,
        ['One hand and knee on a bench.', 'Pull the weight to your hip with speed and control.', 'Lower slowly.'],
        'Use a lighter dumbbell.',
        'Seated cable row', '3/1/1', YMOVE),
      e('plank', 'Plank', 3, '30 seconds', 60,
        ['Rest on forearms and toes, body in one straight line.', 'Squeeze your glutes and brace your belly.', 'Breathe steadily.'],
        'Plank on knees.',
        'Dead bug', '3/1/1'),
    ],
  },
  {
    id: 'p5b',
    title: 'Phase 5 Workout B',
    phase: 5,
    day: 'Day B',
    minutes: 50,
    note: 'Power. Fast, controlled, explosive reps. Locked until a clean form retest AND Derek Coach approval.',
    exercises: [
      e('barbell-deadlift', 'Barbell Deadlift', 4, '3 reps', 240,
        ['Stand with the bar over your mid-foot.', 'Push the floor away fast, chest up.', 'Lower with control.'],
        'Romanian deadlift with dumbbells.',
        'Trap bar deadlift', '3/1/1', YMOVE),
      e('step-up', 'Step-Up', 4, '5 reps each leg', 180,
        ['Stand facing a step or box.', 'Step up fast and strong through your heel.', 'Step down slowly.'],
        'Use a lower step.',
        'Split squat', '3/1/1'),
      e('overhead-press', 'Dumbbell Overhead Press', 4, '5 reps', 180,
        ['Hold dumbbells at shoulder height.', 'Press up fast and strong.', 'Lower slowly.'],
        'Press one arm at a time while seated.',
        'Push-up on a bench', '3/1/1'),
      e('lat-pulldown', 'Lat Pulldown', 4, '5 reps', 120,
        ['Sit at the machine, knees under the pad.', 'Pull the bar down to your upper chest.', 'Let it rise slowly.'],
        'Use a lighter weight.',
        'Seated cable row', '3/1/1', YMOVE),
      e('single-leg-rdl', 'Single-Leg Romanian Deadlift', 3, '5 reps each leg', 120,
        ['Stand on one leg, soft knee.', 'Hinge and reach toward the floor.', 'Drive up fast and stand tall.'],
        'Touch a wall for balance.',
        'Romanian deadlift with two legs', '3/1/1', "Derek's video"),
    ],
  },
  {
    id: 'p1-60',
    title: 'Phase 1 60-Minute Workout',
    phase: 1,
    day: '60-minute day',
    minutes: 60,
    note: 'Warm-up 10 minutes, main 45 minutes, cool-down 5 minutes. Total 60 minutes. Slow tempo on every rep. Lower for 3 to 4 seconds. Take 1 to 2 rest days between strength days.',
    exercises: [
      e('goblet-squat', 'Dumbbell Goblet Squat', 3, '12 reps', 60,
        ['Hold one dumbbell at your chest with both hands.', 'Sit back and down until your thighs are about parallel to the floor.', 'Push through your whole foot to stand.'],
        'Squat to a chair. Sit down, then stand up.',
        'Bodyweight squat', '4/2/1', YMOVE),
      e('romanian-deadlift', 'Romanian Deadlift', 3, '12 reps', 60,
        ['Hold dumbbells in front of your thighs, knees soft.', 'Push your hips back and lower the weights down your legs.', 'Stop when you feel a stretch in your hamstrings, then stand tall.'],
        'Use very light dumbbells or no weight, hands on thighs.',
        'Glute bridge', '4/2/1'),
      e('dumbbell-bench-press', 'Dumbbell Bench Press', 3, '12 reps', 60,
        ['Lie on a bench, dumbbells over your chest.', 'Lower the weights slowly to chest level.', 'Press up until your arms are straight.'],
        'Floor press. Lie on the floor so your elbows stop at the floor.',
        'Push-up on a wall', '4/2/1'),
      e('seated-cable-row', 'Seated Cable Row', 3, '12 reps', 60,
        ['Sit tall, knees slightly bent, and hold the handle with both hands.', 'Pull the handle to your belly button, squeezing your shoulder blades together.', 'Lower slowly for 3 to 4 seconds.'],
        'Use a lighter weight or a resistance band.',
        'Single-arm dumbbell row', '4/2/1', YMOVE),
      e('split-squat', 'Split Squat', 3, '10 reps each leg', 60,
        ['Take a long step forward and plant both feet.', 'Lower straight down until your back knee nearly touches the floor.', 'Push through your front foot to stand.'],
        'Hold a chair for balance and shorten the range.',
        'Glute bridge', '4/2/1'),
      e('overhead-press', 'Dumbbell Overhead Press', 3, '12 reps', 60,
        ['Hold dumbbells at shoulder height, palms forward.', 'Press up until your arms are straight.', 'Lower slowly for 3 to 4 seconds.'],
        'Press one arm at a time while seated.',
        'Push-up on a wall', '4/2/1'),
      e('plank', 'Plank', 3, '20 seconds', 30,
        ['Rest on forearms and toes, body in one straight line.', 'Squeeze your glutes and brace your belly.', 'Breathe steadily. Do not let your hips sag.'],
        'Plank on knees instead of toes.',
        'Dead bug', '4/2/1'),
      e('dead-bug', 'Dead Bug', 3, '8 reps', 30,
        ['Lie on your back, arms up, knees bent at 90 degrees.', 'Slowly lower one arm and the opposite leg toward the floor.', 'Return and switch sides. Keep your low back pressed gently to the floor.'],
        'Lower only the arms, or only the legs.',
        'Plank on knees', '4/2/1'),
    ],
  },
  {
    id: 'p2-60',
    title: 'Phase 2 60-Minute Workout',
    phase: 2,
    day: '60-minute day',
    minutes: 60,
    note: 'Warm-up 10 minutes, main 45 minutes, cool-down 5 minutes. Total 60 minutes. Heavier than Phase 1, still controlled. Rest 0 to 60 seconds between moves. Take 1 to 2 rest days between strength days.',
    exercises: [
      e('barbell-back-squat', 'Barbell Back Squat', 3, '10 reps', 60,
        ['Set the bar across your upper back, feet shoulder width.', 'Sit back and down, chest up, knees tracking over toes.', 'Push through your whole foot to stand.'],
        'Goblet squat with a dumbbell.',
        'Leg press', '3/2/1', YMOVE),
      e('romanian-deadlift', 'Romanian Deadlift', 3, '10 reps', 45,
        ['Hold dumbbells in front of your thighs, knees soft.', 'Push your hips back and lower the weights down your legs.', 'Stand tall, squeezing your glutes.'],
        'Use lighter dumbbells or no weight.',
        'Glute bridge', '3/2/1'),
      e('dumbbell-bench-press', 'Dumbbell Bench Press', 3, '10 reps', 45,
        ['Lie on a bench, dumbbells over your chest.', 'Lower the weights slowly to chest level.', 'Press up until your arms are straight.'],
        'Floor press on the floor.',
        'Push-up on a bench', '3/2/1'),
      e('single-arm-dumbbell-row', 'Single-Arm Dumbbell Row', 3, '10 reps each arm', 45,
        ['One hand and knee on a bench, dumbbell in the free hand.', 'Pull the weight to your hip.', 'Lower slowly for 3 seconds.'],
        'Use a lighter dumbbell or a band.',
        'Seated cable row', '3/2/1', YMOVE),
      e('overhead-press', 'Dumbbell Overhead Press', 3, '10 reps', 45,
        ['Hold dumbbells at shoulder height.', 'Press up until your arms are straight.', 'Lower slowly.'],
        'Press one arm at a time while seated.',
        'Push-up on a bench', '3/2/1'),
      e('single-leg-rdl', 'Single-Leg Romanian Deadlift', 3, '8 reps each leg', 45,
        ['Stand on one leg, soft knee, dumbbell in the opposite hand.', 'Hinge at the hips and reach toward the floor.', 'Stand tall, squeezing your glute.'],
        'Touch a wall for balance.',
        'Romanian deadlift with two legs', '3/2/1', "Derek's video"),
      e('step-up', 'Step-Up', 3, '10 reps each leg', 45,
        ['Stand facing a low step or box.', 'Step up and drive through your heel.', 'Step down slowly and switch legs.'],
        'Use a lower step or hold a wall.',
        'Split squat', '3/2/1'),
      e('plank', 'Plank', 3, '30 seconds', 30,
        ['Rest on forearms and toes, body in one straight line.', 'Squeeze your glutes and brace your belly.', 'Breathe steadily.'],
        'Plank on knees.',
        'Dead bug', '3/2/1'),
    ],
  },
  {
    id: 'p3-60',
    title: 'Phase 3 60-Minute Workout',
    phase: 3,
    day: '60-minute day',
    minutes: 60,
    note: 'Warm-up 8 minutes, main 47 minutes, cool-down 5 minutes. Total 60 minutes. Main lifts get 90 seconds to 2 minutes of rest. Accessories get 0 to 60 seconds. Take 1 to 2 rest days between strength days.',
    exercises: [
      e('barbell-back-squat', 'Barbell Back Squat', 4, '6 reps', 120,
        ['Set the bar across your upper back, feet shoulder width.', 'Sit back and down, chest up, knees tracking over toes.', 'Drive through your whole foot to stand.'],
        'Goblet squat with a dumbbell.',
        'Leg press', '3/1/1', YMOVE),
      e('barbell-deadlift', 'Barbell Deadlift', 4, '6 reps', 120,
        ['Stand with the bar over your mid-foot, shins close to the bar.', 'Grip the bar, chest up, and push the floor away.', 'Stand tall, then lower the bar with control.'],
        'Romanian deadlift with dumbbells.',
        'Trap bar deadlift', '3/1/1', YMOVE),
      e('dumbbell-bench-press', 'Dumbbell Bench Press', 3, '8 reps', 90,
        ['Lie on a bench, dumbbells over your chest.', 'Lower the weights to chest level.', 'Press up until your arms are straight.'],
        'Floor press on the floor.',
        'Push-up', '3/1/1'),
      e('seated-cable-row', 'Seated Cable Row', 3, '10 reps', 45,
        ['Sit tall, knees slightly bent.', 'Pull the handle to your belly button.', 'Lower slowly.'],
        'Use a lighter weight or a band.',
        'Single-arm dumbbell row', '3/1/1', YMOVE),
      e('overhead-press', 'Dumbbell Overhead Press', 3, '8 reps', 90,
        ['Hold dumbbells at shoulder height.', 'Press up until your arms are straight.', 'Lower slowly.'],
        'Press one arm at a time while seated.',
        'Push-up on a bench', '3/1/1'),
      e('single-leg-rdl', 'Single-Leg Romanian Deadlift', 3, '8 reps each leg', 45,
        ['Stand on one leg, soft knee.', 'Hinge at the hips and reach toward the floor.', 'Stand tall, squeezing your glute.'],
        'Touch a wall for balance.',
        'Romanian deadlift with two legs', '3/1/1', "Derek's video"),
      e('side-plank', 'Side Plank', 3, '30 seconds each side', 30,
        ['Lie on your side, elbow under your shoulder.', 'Lift your hips into a straight line.', 'Hold and breathe.'],
        'Side plank on knees.',
        'Dead bug', '3/1/1'),
    ],
  },
  {
    id: 'p4-60',
    title: 'Phase 4 60-Minute Workout',
    phase: 4,
    day: '60-minute day',
    minutes: 60,
    note: 'Warm-up 5 minutes, main 50 minutes, cool-down 5 minutes. Total 60 minutes. Maximal strength. Rest 3 to 5 minutes between sets on main lifts. Only after Phase 3 and a clean Week 12 retest. Take 1 to 2 rest days between strength days.',
    exercises: [
      e('barbell-back-squat', 'Barbell Back Squat', 4, '3 reps', 180,
        ['Set the bar across your upper back, feet shoulder width.', 'Sit back and down with control, chest up.', 'Drive through your whole foot to stand.'],
        'Drop to a goblet squat at a lighter load.',
        'Leg press', '3/1/1', YMOVE),
      e('barbell-deadlift', 'Barbell Deadlift', 4, '3 reps', 180,
        ['Stand with the bar over your mid-foot.', 'Grip the bar, chest up, and push the floor away.', 'Stand tall, then lower with control.'],
        'Romanian deadlift with dumbbells.',
        'Trap bar deadlift', '3/1/1', YMOVE),
      e('dumbbell-bench-press', 'Dumbbell Bench Press', 3, '5 reps', 180,
        ['Lie on a bench, dumbbells over your chest.', 'Lower the weights to chest level.', 'Press up with control.'],
        'Floor press on the floor.',
        'Push-up', '3/1/1'),
      e('seated-cable-row', 'Seated Cable Row', 3, '5 reps', 120,
        ['Sit tall, knees slightly bent.', 'Pull the handle to your belly button.', 'Lower slowly.'],
        'Use a lighter weight.',
        'Single-arm dumbbell row', '3/1/1', YMOVE),
      e('pallof-press', 'Pallof Press', 3, '10 reps each side', 60,
        ['Stand sideways to a cable or band at chest height.', 'Press the handle straight out and hold.', 'Resist the pull. Return slowly.'],
        'Use a lighter band.',
        'Dead bug', '3/1/1'),
    ],
  },
  {
    id: 'p5-60',
    title: 'Phase 5 60-Minute Workout',
    phase: 5,
    day: '60-minute day',
    minutes: 60,
    note: 'Warm-up 5 minutes, main 50 minutes, cool-down 5 minutes. Total 60 minutes. Power. Fast, controlled, explosive reps. Rest 3 to 5 minutes between sets on main lifts. Locked until a clean form retest AND Derek Coach approval.',
    exercises: [
      e('barbell-back-squat', 'Barbell Back Squat', 3, '3 reps', 180,
        ['Set the bar across your upper back.', 'Lower with control, then drive up fast.', 'Land the rep with steady feet and a braced core.'],
        'Goblet squat at a lighter load, driven up fast.',
        'Leg press', '3/1/1', YMOVE),
      e('barbell-deadlift', 'Barbell Deadlift', 3, '3 reps', 180,
        ['Stand with the bar over your mid-foot.', 'Push the floor away fast, chest up.', 'Lower with control.'],
        'Romanian deadlift with dumbbells.',
        'Trap bar deadlift', '3/1/1', YMOVE),
      e('push-up', 'Push-Up', 3, '5 reps', 180,
        ['Hands under shoulders, body in one straight line.', 'Lower with control.', 'Push up fast and strong.'],
        'Push-up on a bench.',
        'Dumbbell bench press', '3/1/1'),
      e('overhead-press', 'Dumbbell Overhead Press', 3, '5 reps', 180,
        ['Hold dumbbells at shoulder height.', 'Press up fast and strong.', 'Lower slowly.'],
        'Press one arm at a time while seated.',
        'Push-up on a bench', '3/1/1'),
      e('single-leg-rdl', 'Single-Leg Romanian Deadlift', 2, '5 reps each leg', 180,
        ['Stand on one leg, soft knee.', 'Hinge and reach toward the floor.', 'Drive up fast and stand tall.'],
        'Touch a wall for balance.',
        'Romanian deadlift with two legs', '3/1/1', "Derek's video"),
    ],
  },
  {
    id: 'track-block-1',
    title: '15-Minute Track: Block 1',
    phase: 1,
    day: '15-minute track',
    minutes: 15,
    note: 'The short track for busy days. About 15 minutes, start to finish. Do one block, or stack blocks when you have more time.',
    exercises: [
      e('goblet-squat', 'Dumbbell Goblet Squat', 2, '10 reps', 45,
        ['Hold one dumbbell at your chest.', 'Sit back and down, chest up.', 'Push through your whole foot to stand.'],
        'Squat to a chair.',
        'Bodyweight squat', '4/2/1', YMOVE),
      e('dumbbell-bench-press', 'Dumbbell Bench Press', 2, '10 reps', 45,
        ['Lie on a bench, dumbbells over your chest.', 'Lower slowly to chest level.', 'Press up until your arms are straight.'],
        'Floor press on the floor.',
        'Push-up on a wall', '4/2/1'),
      e('seated-cable-row', 'Seated Cable Row', 2, '10 reps', 45,
        ['Sit tall and hold the handle with both hands.', 'Pull to your belly button.', 'Lower slowly.'],
        'Use a lighter weight or a band.',
        'Single-arm dumbbell row', '4/2/1', YMOVE),
      e('glute-bridge', 'Glute Bridge', 2, '12 reps', 30,
        ['Lie on your back, knees bent.', 'Push through your heels and lift your hips.', 'Lower slowly.'],
        'Shorten the lift.',
        'Hip thrust with a dumbbell', '4/2/1'),
      e('dead-bug', 'Dead Bug', 2, '8 reps', 30,
        ['Lie on your back, arms up, knees at 90 degrees.', 'Lower one arm and the opposite leg.', 'Return and switch sides.'],
        'Lower only the arms.',
        'Plank on knees', '4/2/1'),
    ],
  },
  {
    id: 'track-block-2',
    title: '15-Minute Track: Block 2',
    phase: 1,
    day: '15-minute track',
    minutes: 15,
    note: 'The short track for busy days. About 15 minutes, start to finish. Do one block, or stack blocks when you have more time.',
    exercises: [
      e('split-squat', 'Split Squat', 2, '10 reps each leg', 45,
        ['Take a long step forward.', 'Lower straight down.', 'Push through your front foot to stand.'],
        'Hold a chair for balance.',
        'Glute bridge', '4/2/1'),
      e('single-leg-rdl', 'Single-Leg Romanian Deadlift', 2, '8 reps each leg', 45,
        ['Stand on one leg, soft knee.', 'Hinge and reach toward the floor.', 'Stand tall.'],
        'Touch a wall for balance.',
        'Romanian deadlift with two legs', '4/2/1', "Derek's video"),
      e('overhead-press', 'Dumbbell Overhead Press', 2, '10 reps', 45,
        ['Hold dumbbells at shoulder height.', 'Press up until your arms are straight.', 'Lower slowly.'],
        'Press one arm at a time while seated.',
        'Push-up on a wall', '4/2/1'),
      e('lat-pulldown', 'Lat Pulldown', 2, '10 reps', 45,
        ['Sit at the machine, knees under the pad.', 'Pull the bar down to your upper chest.', 'Let it rise slowly.'],
        'Use a lighter weight or a band.',
        'Seated cable row', '4/2/1', YMOVE),
      e('side-plank', 'Side Plank', 2, '15 seconds each side', 30,
        ['Lie on your side, elbow under your shoulder.', 'Lift your hips into a straight line.', 'Hold and breathe.'],
        'Side plank on knees.',
        'Dead bug', '4/2/1'),
    ],
  },
  {
    id: 'track-block-3',
    title: '15-Minute Track: Block 3',
    phase: 1,
    day: '15-minute track',
    minutes: 20,
    note: 'Circuit block. No rest inside a round, 3 minutes of rest between rounds. About 20 minutes for 3 rounds.',
    exercises: [
      e('goblet-squat', 'Dumbbell Goblet Squat', 3, '10 reps', 0,
        ['Hold one dumbbell at your chest.', 'Sit back and down, chest up.', 'Push through your whole foot to stand.'],
        'Squat to a chair.',
        'Bodyweight squat', '4/2/1', YMOVE),
      e('push-up', 'Push-Up', 3, '8 reps', 0,
        ['Hands under shoulders, body in one straight line.', 'Lower with control.', 'Push up strong.'],
        'Push-up on a bench.',
        'Dumbbell bench press', '3/1/1'),
      e('single-arm-dumbbell-row', 'Single-Arm Dumbbell Row', 3, '10 reps each arm', 0,
        ['One hand and knee on a bench.', 'Pull the weight to your hip.', 'Lower slowly.'],
        'Use a lighter dumbbell or a band.',
        'Seated cable row', '3/1/1', YMOVE),
      e('step-up', 'Step-Up', 3, '8 reps each leg', 0,
        ['Stand facing a step or box.', 'Step up through your heel.', 'Step down slowly.'],
        'Use a lower step.',
        'Split squat', '3/1/1'),
      e('plank', 'Plank', 3, '20 seconds', 180,
        ['Rest on forearms and toes, body in one straight line.', 'Squeeze your glutes and brace your belly.', 'Breathe steadily. Rest 3 minutes, then start the next round.'],
        'Plank on knees.',
        'Dead bug', '3/1/1'),
    ],
  },
];


// ------------------------------------------- CORE / BALANCE / MOBILITY DAY
// The 5th training day in a 5-day week. Uses moves already in the app.

export const CORE_BALANCE_WORKOUT: Workout = {
  id: 'core-balance-mobility',
  title: 'Core, Balance and Mobility Day',
  phase: 1,
  day: 'Core day',
  minutes: 15,
  note: 'No heavy lifting today. Core, balance, and mobility only. A good 5th day in the week.',
  exercises: [
    e('plank', 'Plank', 2, '30 seconds', 30,
      ['Rest on forearms and toes, body in one straight line.', 'Squeeze your glutes and brace your belly.', 'Breathe steadily.'],
      'Plank on knees instead of toes.', 'Dead bug', '4/2/1'),
    e('bird-dog', 'Bird Dog', 2, '8 reps each side', 30,
      ['Start on hands and knees, back flat.', 'Reach one arm forward and the opposite leg back.', 'Hold for 2 seconds, then switch sides without rocking your hips.'],
      'Lift only the arm, or only the leg.', 'Dead bug', '4/2/1'),
    e('dead-bug', 'Dead Bug', 2, '8 reps', 30,
      ['Lie on your back, arms up, knees bent at 90 degrees.', 'Slowly lower one arm and the opposite leg toward the floor.', 'Return and switch sides.'],
      'Lower only the arms, or only the legs.', 'Plank on knees', '4/2/1'),
    e('glute-bridge', 'Glute Bridge', 2, '12 reps', 30,
      ['Lie on your back, knees bent, feet flat.', 'Push through your heels and lift your hips.', 'Lower slowly for 3 to 4 seconds.'],
      'Shorten the lift. Raise your hips only halfway.', 'Hip thrust with a dumbbell', '4/2/1'),
    e('side-plank', 'Side Plank', 2, '15 seconds each side', 30,
      ['Lie on your side, elbow under your shoulder.', 'Lift your hips into a straight line.', 'Hold and breathe. Switch sides.'],
      'Side plank on knees instead of feet.', 'Dead bug', '4/2/1'),
  ],
};

// ------------------------------------------------------- FOCUS AREAS
// 8 sliders in the assessment: what the client wants to focus on.
// 1 means not a focus, 5 means a big focus. They shape the plan's
// emphasis only. They never lock a goal or a workout.

export const FOCUS_AREAS: { id: string; label: string }[] = [
  { id: 'strength', label: 'Getting stronger' },
  { id: 'balance', label: 'Balance' },
  { id: 'mobility', label: 'Moving freely' },
  { id: 'cardio', label: 'Cardio and endurance' },
  { id: 'weight-loss', label: 'Losing weight' },
  { id: 'sleep', label: 'Sleep and recovery' },
  { id: 'consistency', label: 'Showing up regularly' },
  { id: 'pain-free', label: 'Moving with less discomfort' },
];

// ------------------------------------------------- WEEKLY SPLITS
// Training days per week, 2 to 6, with real splits. The split only
// names the day. The workouts themselves are the phase workouts, the
// Push / Pull / Legs and Upper / Lower workouts, the 15-minute track,
// and the Core, Balance and Mobility day. The workout ids follow the
// client's phase.

// How a client trains at 4 to 6 days a week. Full-body is the default
// at 2 to 3 days. At 4 to 5 days the client can pick Upper / Lower, so
// the same muscles are never trained on back-to-back days. At 5 to 6
// days the client picks: Push / Pull / Legs, Short daily sessions,
// Upper / Lower (5 days only), or (5 days only) Full-body. Full-body is
// NOT offered at 6 days: six full-body strength days in a row trains
// the same muscles on back-to-back days, which breaks the 1 to 2 rest
// days between strength days rule for each muscle group.
export type TrainingStyle = 'full-body' | 'ppl' | 'short' | 'upper-lower';

export const TRAINING_STYLES: { id: TrainingStyle; name: string; blurb: string }[] = [
  { id: 'upper-lower', name: 'Upper / Lower', blurb: 'Upper days work chest, back, shoulders, arms, and core. Lower days work legs, glutes, and core. Each muscle rests 2 to 3 days before its next session. Day 7 is a full rest day.' },
  { id: 'ppl', name: 'Push / Pull / Legs', blurb: 'One muscle group a day, each group twice a week. Each muscle rests 2 to 3 days before its next session. Day 7 is a full rest day.' },
  { id: 'short', name: 'Short daily sessions', blurb: '15 minutes a day, small dose, not a full strength session. Day 7 is a full rest day. If you are sore or tired, take the day off instead.' },
  { id: 'full-body', name: 'Full-body A/B', blurb: 'The same muscles every strength day, so take 1 to 2 rest days between strength days. Not offered at 6 days a week.' },
];

export interface SplitDay { name: string; workoutId: string; group?: 'push' | 'pull' | 'legs' | 'short' | 'full' | 'upper' | 'lower'; }
export function splitForDays(days: number, phase = 1, style: TrainingStyle = 'full-body'): { label: string; days: SplitDay[] } {
  const p = Math.min(Math.max(phase, 1), 5);
  const a = `p${p}a`;
  const b = `p${p}b`;
  const push = `p${p}push`;
  const pull = `p${p}pull`;
  const legs = `p${p}legs`;
  const upperA = `p${p}upper-a`;
  const upperB = `p${p}upper-b`;
  const lowerA = `p${p}lower-a`;
  const lowerB = `p${p}lower-b`;
  if (days <= 3) {
    return {
      label: 'Full-body, 2 to 3 days a week',
      days: [
        { name: 'Day 1: Full-body A', workoutId: a, group: 'full' },
        { name: 'Day 2: Full-body B', workoutId: b, group: 'full' },
        ...(days >= 3 ? [{ name: 'Day 3: Full-body A', workoutId: a, group: 'full' as const }] : []),
      ],
    };
  }
  if (days === 4) {
    if (style === 'upper-lower') {
      return {
        label: 'Upper / Lower, 4 days a week',
        days: [
          { name: 'Day 1: Upper A', workoutId: upperA, group: 'upper' },
          { name: 'Day 2: Lower A', workoutId: lowerA, group: 'lower' },
          { name: 'Day 3: Upper B', workoutId: upperB, group: 'upper' },
          { name: 'Day 4: Lower B', workoutId: lowerB, group: 'lower' },
        ],
      };
    }
    return {
      label: 'Full-body A and B, 4 days a week',
      days: [
        { name: 'Day 1: Full-body A', workoutId: a, group: 'full' },
        { name: 'Day 2: Full-body B', workoutId: b, group: 'full' },
        { name: 'Day 3: Full-body A', workoutId: a, group: 'full' },
        { name: 'Day 4: Full-body B', workoutId: b, group: 'full' },
      ],
    };
  }
  if (style === 'upper-lower') {
    if (days === 5) {
      return {
        label: 'Upper / Lower plus Core, Balance and Mobility, 5 days a week',
        days: [
          { name: 'Day 1: Upper A', workoutId: upperA, group: 'upper' },
          { name: 'Day 2: Lower A', workoutId: lowerA, group: 'lower' },
          { name: 'Day 3: Upper B', workoutId: upperB, group: 'upper' },
          { name: 'Day 4: Lower B', workoutId: lowerB, group: 'lower' },
          { name: 'Day 5: Core, Balance and Mobility', workoutId: 'core-balance-mobility', group: 'short' },
        ],
      };
    }
    // 6 days: Upper / Lower is not offered. Six Upper / Lower days
    // trains the same muscles with only one rest day between, so the
    // split falls back to Push / Pull / Legs instead.
    return {
      label: 'Push / Pull / Legs, 6 days a week',
      days: [
        { name: 'Day 1: Push', workoutId: push, group: 'push' },
        { name: 'Day 2: Pull', workoutId: pull, group: 'pull' },
        { name: 'Day 3: Legs', workoutId: legs, group: 'legs' },
        { name: 'Day 4: Push', workoutId: push, group: 'push' },
        { name: 'Day 5: Pull', workoutId: pull, group: 'pull' },
        { name: 'Day 6: Legs', workoutId: legs, group: 'legs' },
      ],
    };
  }
  if (style === 'ppl') {
    return {
      label: days === 5 ? 'Push / Pull / Legs, 5 days a week' : 'Push / Pull / Legs, 6 days a week',
      days: [
        { name: 'Day 1: Push', workoutId: push, group: 'push' },
        { name: 'Day 2: Pull', workoutId: pull, group: 'pull' },
        { name: 'Day 3: Legs', workoutId: legs, group: 'legs' },
        { name: 'Day 4: Push', workoutId: push, group: 'push' },
        { name: 'Day 5: Pull', workoutId: pull, group: 'pull' },
        ...(days >= 6 ? [{ name: 'Day 6: Legs', workoutId: legs, group: 'legs' as const }] : []),
      ],
    };
  }
  if (style === 'short') {
    // Short daily sessions: 15 minutes a day, small dose (2 sets a move),
    // rotating the short blocks so no day is a full heavy session.
    return {
      label: days === 5 ? 'Short daily sessions, 5 days a week' : 'Short daily sessions, 6 days a week',
      days: [
        { name: 'Day 1: Short session 1', workoutId: 'track-block-1', group: 'short' },
        { name: 'Day 2: Short session 2', workoutId: 'track-block-2', group: 'short' },
        { name: 'Day 3: Core, Balance and Mobility', workoutId: 'core-balance-mobility', group: 'short' },
        { name: 'Day 4: Short session 1', workoutId: 'track-block-1', group: 'short' },
        { name: 'Day 5: Short session 2', workoutId: 'track-block-2', group: 'short' },
        ...(days >= 6 ? [{ name: 'Day 6: Core, Balance and Mobility', workoutId: 'core-balance-mobility', group: 'short' as const }] : []),
      ],
    };
  }
  if (days === 5) {
    return {
      label: 'Full-body A and B plus Core, Balance and Mobility, 5 days a week',
      days: [
        { name: 'Day 1: Full-body A', workoutId: a, group: 'full' },
        { name: 'Day 2: Full-body B', workoutId: b, group: 'full' },
        { name: 'Day 3: Full-body A', workoutId: a, group: 'full' },
        { name: 'Day 4: Full-body B', workoutId: b, group: 'full' },
        { name: 'Day 5: Core, Balance and Mobility', workoutId: 'core-balance-mobility', group: 'full' },
      ],
    };
  }
  // 6 days, Full-body asked for: not offered. Six full-body strength
  // days in a row breaks the rest rule for the same muscles, so the
  // split falls back to Push / Pull / Legs instead of pretending
  // Full-body works at 6 days.
  return {
    label: 'Push / Pull / Legs, 6 days a week',
    days: [
      { name: 'Day 1: Push', workoutId: push, group: 'push' },
      { name: 'Day 2: Pull', workoutId: pull, group: 'pull' },
      { name: 'Day 3: Legs', workoutId: legs, group: 'legs' },
      { name: 'Day 4: Push', workoutId: push, group: 'push' },
      { name: 'Day 5: Pull', workoutId: pull, group: 'pull' },
      { name: 'Day 6: Legs', workoutId: legs, group: 'legs' },
    ],
  };
}

// ------------------------------------------------- PUSH / PULL / LEGS
// One muscle group a day, for 5 to 6 training days a week. Built ONLY
// from moves already in the app (cloned by name, so how-to, regression,
// swap, and video all come along). No new moves, nothing new to film.
// NASM check, Nov 22: same loads as the phase full-body workouts, so a
// Phase 1 client never gets Phase 4/5 loads or power moves on a PPL day;
// compound lifts first; tempo is slow on the lowering (P1 4/2/1, P2
// 3/2/1, P3-5 3/1/1); rest follows the phase (P3 main lifts 90s-2min,
// accessories 0-60s; P4 main lifts 3-5min); each muscle is hit twice a
// week at 6 days, so weekly sets per muscle = 2 x per-session sets,
// inside PHASE_WEEKLY_SETS (P1 6-10, P2 8-12, P3 10-15, P4 12-18,
// P5 10-15); each muscle rests 2 to 3 days between its sessions; start
// with your fix-it warm-up (corrective work first, as the assessment
// flagged it). Phase gating is the same as the full-body workouts:
// the Workout.phase field drives the existing unlock checks, so Phase 4
// stays locked behind the Week 12 retest and Phase 5 behind a clean
// retest plus Coach approval. No brand names anywhere client-visible.

function pplEx(name: string, sets: number, reps: string, restSec: number, tempo: string): Exercise {
  const found = findExerciseByName(name);
  if (!found) throw new Error(`PPL exercise not found: ${name}`);
  return { ...found, sets, reps, restSec, tempo };
}

type PplRow = [string, number, string, number];
function pplWorkout(id: string, title: string, phase: number, minutes: number, note: string, tempo: string, rows: PplRow[]): Workout {
  return { id, title, phase, day: title.replace(`Phase ${phase} `, ''), minutes, note, exercises: rows.map(([name, sets, reps, restSec]) => pplEx(name, sets, reps, restSec, tempo)) };
}

export const PPL_WORKOUTS: Workout[] = [
  pplWorkout('p1push', 'Phase 1 Push', 1, 30, 'Push day: chest, shoulders, and triceps. Compound lifts first. Lower for 3 to 4 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Push day.', '4/2/1', [
    ['Dumbbell Bench Press', 2, '12 reps', 60], ['Dumbbell Overhead Press', 2, '12 reps', 60], ['Push-Up', 2, '12 reps', 60], ['Plank', 2, '20 seconds', 30],
  ]),
  pplWorkout('p1pull', 'Phase 1 Pull', 1, 30, 'Pull day: back and the hinge. Compound lifts first. Lower for 3 to 4 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Pull day.', '4/2/1', [
    ['Lat Pulldown', 2, '12 reps', 60], ['Seated Cable Row', 2, '12 reps', 60], ['Romanian Deadlift', 2, '12 reps', 60], ['Bird Dog', 2, '8 reps each side', 30],
  ]),
  pplWorkout('p1legs', 'Phase 1 Legs', 1, 30, 'Legs day: squat, single-leg, and hinge. Compound lifts first. Lower for 3 to 4 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Legs day.', '4/2/1', [
    ['Dumbbell Goblet Squat', 2, '12 reps', 60], ['Split Squat', 2, '10 reps each leg', 60], ['Single-Leg Romanian Deadlift', 2, '8 reps each leg', 60], ['Glute Bridge', 2, '15 reps', 30],
  ]),
  pplWorkout('p2push', 'Phase 2 Push', 2, 35, 'Push day: chest, shoulders, and triceps. Compound lifts first. Lower for 3 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Push day.', '3/2/1', [
    ['Dumbbell Bench Press', 3, '10 reps', 45], ['Dumbbell Overhead Press', 3, '10 reps', 45], ['Push-Up', 3, '10 reps', 45], ['Plank', 3, '30 seconds', 30],
  ]),
  pplWorkout('p2pull', 'Phase 2 Pull', 2, 35, 'Pull day: back and the hinge. Compound lifts first. Lower for 3 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Pull day.', '3/2/1', [
    ['Lat Pulldown', 3, '10 reps', 45], ['Seated Cable Row', 3, '10 reps', 45], ['Romanian Deadlift', 3, '10 reps', 45], ['Bird Dog', 3, '8 reps each side', 30],
  ]),
  pplWorkout('p2legs', 'Phase 2 Legs', 2, 35, 'Legs day: squat, single-leg, and hinge. Compound lifts first. Lower for 3 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Legs day.', '3/2/1', [
    ['Barbell Back Squat', 3, '8 reps', 60], ['Split Squat', 3, '10 reps each leg', 45], ['Single-Leg Romanian Deadlift', 3, '8 reps each leg', 45], ['Glute Bridge', 3, '12 reps', 30],
  ]),
  pplWorkout('p3push', 'Phase 3 Push', 3, 40, 'Push day: chest, shoulders, and triceps. Main lifts get 90 seconds to 2 minutes of rest. Accessories get 0 to 60 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Push day.', '3/1/1', [
    ['Dumbbell Bench Press', 3, '8 reps', 90], ['Dumbbell Overhead Press', 3, '8 reps', 90], ['Push-Up', 3, '8 reps', 45], ['Plank', 3, '40 seconds', 30],
  ]),
  pplWorkout('p3pull', 'Phase 3 Pull', 3, 40, 'Pull day: back and the hinge. Main lifts get 90 seconds to 2 minutes of rest. Accessories get 0 to 60 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Pull day.', '3/1/1', [
    ['Lat Pulldown', 3, '8 reps', 90], ['Seated Cable Row', 3, '10 reps', 45], ['Romanian Deadlift', 3, '8 reps', 90], ['Bird Dog', 3, '8 reps each side', 30],
  ]),
  pplWorkout('p3legs', 'Phase 3 Legs', 3, 40, 'Legs day: squat, single-leg, and hinge. Main lifts get 90 seconds to 2 minutes of rest. Accessories get 0 to 60 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Legs day.', '3/1/1', [
    ['Barbell Back Squat', 4, '6 reps', 120], ['Split Squat', 3, '10 reps each leg', 45], ['Single-Leg Romanian Deadlift', 3, '8 reps each leg', 45], ['Glute Bridge', 3, '12 reps', 30],
  ]),
  pplWorkout('p4push', 'Phase 4 Push', 4, 45, 'Push day: maximal strength. Rest 3 to 5 minutes between sets on main lifts. Only after Phase 3 and a clean Week 12 retest. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Push day.', '3/1/1', [
    ['Dumbbell Bench Press', 4, '5 reps', 180], ['Dumbbell Overhead Press', 4, '5 reps', 180], ['Push-Up', 4, '5 reps', 120], ['Plank', 3, '45 seconds', 60],
  ]),
  pplWorkout('p4pull', 'Phase 4 Pull', 4, 45, 'Pull day: maximal strength. Rest 3 to 5 minutes between sets on main lifts. Only after Phase 3 and a clean Week 12 retest. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Pull day.', '3/1/1', [
    ['Lat Pulldown', 4, '5 reps', 180], ['Seated Cable Row', 4, '5 reps', 120], ['Barbell Deadlift', 4, '3 reps', 240], ['Bird Dog', 3, '8 reps each side', 60],
  ]),
  pplWorkout('p4legs', 'Phase 4 Legs', 4, 45, 'Legs day: maximal strength. Rest 3 to 5 minutes between sets on main lifts. Only after Phase 3 and a clean Week 12 retest. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Legs day.', '3/1/1', [
    ['Barbell Back Squat', 5, '3 reps', 240], ['Split Squat', 4, '5 reps each leg', 120], ['Single-Leg Romanian Deadlift', 4, '5 reps each leg', 120], ['Glute Bridge', 3, '12 reps', 60],
  ]),
  pplWorkout('p5push', 'Phase 5 Push', 5, 45, 'Push day: power. Fast, controlled, explosive reps. Locked until a clean form retest AND Derek approves it in Coach. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Push day.', '3/1/1', [
    ['Dumbbell Bench Press', 3, '5 reps', 180], ['Dumbbell Overhead Press', 4, '5 reps', 180], ['Push-Up', 4, '5 reps', 180], ['Plank', 3, '30 seconds', 60],
  ]),
  pplWorkout('p5pull', 'Phase 5 Pull', 5, 45, 'Pull day: power. Fast, controlled, explosive reps. Locked until a clean form retest AND Derek approves it in Coach. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Pull day.', '3/1/1', [
    ['Lat Pulldown', 4, '5 reps', 120], ['Barbell Deadlift', 4, '3 reps', 240], ['Seated Cable Row', 3, '5 reps', 120], ['Bird Dog', 3, '8 reps each side', 60],
  ]),
  pplWorkout('p5legs', 'Phase 5 Legs', 5, 45, 'Legs day: power. Fast, controlled, explosive reps. Locked until a clean form retest AND Derek approves it in Coach. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Legs day.', '3/1/1', [
    ['Barbell Back Squat', 4, '3 reps', 240], ['Step-Up', 3, '5 reps each leg', 180], ['Single-Leg Romanian Deadlift', 3, '5 reps each leg', 120], ['Glute Bridge', 3, '12 reps', 60],
  ]),
];

// PPL workouts live in the main WORKOUTS list, so phase gating, the
// rest timer, swaps, class focus, PRs, and XP all treat them exactly
// like the full-body workouts.
WORKOUTS.push(...PPL_WORKOUTS);

// ------------------------------------------------- UPPER / LOWER
// Upper days (chest, back, shoulders, arms, core) and Lower days
// (legs, glutes, core) for 4 to 5 training days a week. Built ONLY
// from moves already in the app (cloned by name, so how-to, regression,
// swap, and video all come along). No new moves, nothing new to film.
// Same loads as the phase full-body workouts, so a Phase 1 client never
// gets Phase 4/5 loads or power moves on an Upper / Lower day; compound
// lifts first; tempo is slow on the lowering (P1 4/2/1, P2 3/2/1,
// P3-5 3/1/1); rest follows the phase (P3 main lifts 90s-2min,
// accessories 0-60s; P4 main lifts 3-5min); each muscle rests 2 to 3
// days between its sessions; start with your fix-it warm-up
// (corrective work first, as the assessment flagged it). Phase gating
// is the same as the full-body workouts: the Workout.phase field drives
// the existing unlock checks, so Phase 4 stays locked behind the Week
// 12 retest and Phase 5 behind a clean retest plus Coach approval.
// No brand names anywhere client-visible.

type UlRow = [string, number, string, number];
function ulWorkout(id: string, title: string, phase: number, minutes: number, note: string, tempo: string, rows: UlRow[]): Workout {
  return { id, title, phase, day: title.replace(`Phase ${phase} `, ''), minutes, note, exercises: rows.map(([name, sets, reps, restSec]) => pplEx(name, sets, reps, restSec, tempo)) };
}

export const UPPER_LOWER_WORKOUTS: Workout[] = [
  ulWorkout('p1upper-a', 'Phase 1 Upper A', 1, 30, 'Upper day: chest, back, shoulders, and core. Compound lifts first. Lower for 3 to 4 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Upper day.', '4/2/1', [
    ['Dumbbell Bench Press', 2, '12 reps', 60], ['Seated Cable Row', 2, '12 reps', 60], ['Dumbbell Overhead Press', 2, '12 reps', 60], ['Plank', 2, '20 seconds', 30],
  ]),
  ulWorkout('p1upper-b', 'Phase 1 Upper B', 1, 30, 'Upper day: chest, back, shoulders, and core. Compound lifts first. Lower for 3 to 4 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Upper day.', '4/2/1', [
    ['Push-Up', 2, '12 reps', 60], ['Lat Pulldown', 2, '12 reps', 60], ['Single-Arm Dumbbell Row', 2, '12 reps', 60], ['Side Plank', 2, '15 seconds each side', 30],
  ]),
  ulWorkout('p1lower-a', 'Phase 1 Lower A', 1, 30, 'Lower day: legs, glutes, and core. Compound lifts first. Lower for 3 to 4 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Lower day.', '4/2/1', [
    ['Dumbbell Goblet Squat', 2, '12 reps', 60], ['Split Squat', 2, '10 reps each leg', 60], ['Glute Bridge', 2, '15 reps', 30], ['Bird Dog', 2, '8 reps each side', 30],
  ]),
  ulWorkout('p1lower-b', 'Phase 1 Lower B', 1, 30, 'Lower day: legs, glutes, and core. Compound lifts first. Lower for 3 to 4 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Lower day.', '4/2/1', [
    ['Romanian Deadlift', 2, '12 reps', 60], ['Step-Up', 2, '10 reps each leg', 60], ['Single-Leg Romanian Deadlift', 2, '8 reps each leg', 60], ['Dead Bug', 2, '8 reps', 30],
  ]),
  ulWorkout('p2upper-a', 'Phase 2 Upper A', 2, 35, 'Upper day: chest, back, shoulders, and core. Compound lifts first. Lower for 3 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Upper day.', '3/2/1', [
    ['Dumbbell Bench Press', 3, '10 reps', 45], ['Seated Cable Row', 3, '10 reps', 45], ['Dumbbell Overhead Press', 3, '10 reps', 45], ['Plank', 3, '30 seconds', 30],
  ]),
  ulWorkout('p2upper-b', 'Phase 2 Upper B', 2, 35, 'Upper day: chest, back, shoulders, and core. Compound lifts first. Lower for 3 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Upper day.', '3/2/1', [
    ['Push-Up', 3, '10 reps', 45], ['Lat Pulldown', 3, '10 reps', 45], ['Single-Arm Dumbbell Row', 3, '10 reps each arm', 45], ['Side Plank', 3, '30 seconds each side', 30],
  ]),
  ulWorkout('p2lower-a', 'Phase 2 Lower A', 2, 35, 'Lower day: legs, glutes, and core. Compound lifts first. Lower for 3 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Lower day.', '3/2/1', [
    ['Barbell Back Squat', 3, '8 reps', 60], ['Split Squat', 3, '10 reps each leg', 45], ['Glute Bridge', 3, '12 reps', 30], ['Bird Dog', 3, '8 reps each side', 30],
  ]),
  ulWorkout('p2lower-b', 'Phase 2 Lower B', 2, 35, 'Lower day: legs, glutes, and core. Compound lifts first. Lower for 3 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Lower day.', '3/2/1', [
    ['Romanian Deadlift', 3, '10 reps', 45], ['Step-Up', 3, '10 reps each leg', 45], ['Single-Leg Romanian Deadlift', 3, '8 reps each leg', 45], ['Dead Bug', 3, '8 reps', 30],
  ]),
  ulWorkout('p3upper-a', 'Phase 3 Upper A', 3, 40, 'Upper day: chest, back, shoulders, and core. Main lifts get 90 seconds to 2 minutes of rest. Accessories get 0 to 60 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Upper day.', '3/1/1', [
    ['Dumbbell Bench Press', 3, '8 reps', 90], ['Seated Cable Row', 3, '10 reps', 45], ['Dumbbell Overhead Press', 3, '8 reps', 90], ['Plank', 3, '40 seconds', 30],
  ]),
  ulWorkout('p3upper-b', 'Phase 3 Upper B', 3, 40, 'Upper day: chest, back, shoulders, and core. Main lifts get 90 seconds to 2 minutes of rest. Accessories get 0 to 60 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Upper day.', '3/1/1', [
    ['Push-Up', 3, '8 reps', 45], ['Lat Pulldown', 3, '8 reps', 90], ['Single-Arm Dumbbell Row', 3, '8 reps each arm', 45], ['Pallof Press', 3, '10 reps each side', 30],
  ]),
  ulWorkout('p3lower-a', 'Phase 3 Lower A', 3, 40, 'Lower day: legs, glutes, and core. Main lifts get 90 seconds to 2 minutes of rest. Accessories get 0 to 60 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Lower day.', '3/1/1', [
    ['Barbell Back Squat', 4, '6 reps', 120], ['Split Squat', 3, '10 reps each leg', 45], ['Glute Bridge', 3, '12 reps', 30], ['Bird Dog', 3, '8 reps each side', 30],
  ]),
  ulWorkout('p3lower-b', 'Phase 3 Lower B', 3, 40, 'Lower day: legs, glutes, and core. Main lifts get 90 seconds to 2 minutes of rest. Accessories get 0 to 60 seconds. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Lower day.', '3/1/1', [
    ['Barbell Deadlift', 4, '6 reps', 120], ['Step-Up', 3, '10 reps each leg', 45], ['Single-Leg Romanian Deadlift', 3, '8 reps each leg', 45], ['Dead Bug', 3, '8 reps', 30],
  ]),
  ulWorkout('p4upper-a', 'Phase 4 Upper A', 4, 45, 'Upper day: maximal strength. Rest 3 to 5 minutes between sets on main lifts. Only after Phase 3 and a clean Week 12 retest. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Upper day.', '3/1/1', [
    ['Dumbbell Bench Press', 4, '5 reps', 180], ['Seated Cable Row', 4, '5 reps', 120], ['Dumbbell Overhead Press', 4, '5 reps', 180], ['Plank', 3, '45 seconds', 60],
  ]),
  ulWorkout('p4upper-b', 'Phase 4 Upper B', 4, 45, 'Upper day: maximal strength. Rest 3 to 5 minutes between sets on main lifts. Only after Phase 3 and a clean Week 12 retest. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Upper day.', '3/1/1', [
    ['Push-Up', 4, '5 reps', 120], ['Lat Pulldown', 4, '5 reps', 180], ['Single-Arm Dumbbell Row', 4, '5 reps each arm', 120], ['Pallof Press', 3, '10 reps each side', 60],
  ]),
  ulWorkout('p4lower-a', 'Phase 4 Lower A', 4, 45, 'Lower day: maximal strength. Rest 3 to 5 minutes between sets on main lifts. Only after Phase 3 and a clean Week 12 retest. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Lower day.', '3/1/1', [
    ['Barbell Back Squat', 5, '3 reps', 240], ['Split Squat', 4, '5 reps each leg', 120], ['Glute Bridge', 3, '12 reps', 60], ['Bird Dog', 3, '8 reps each side', 60],
  ]),
  ulWorkout('p4lower-b', 'Phase 4 Lower B', 4, 45, 'Lower day: maximal strength. Rest 3 to 5 minutes between sets on main lifts. Only after Phase 3 and a clean Week 12 retest. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Lower day.', '3/1/1', [
    ['Barbell Deadlift', 5, '3 reps', 240], ['Step-Up', 4, '5 reps each leg', 120], ['Single-Leg Romanian Deadlift', 4, '5 reps each leg', 120], ['Dead Bug', 3, '8 reps', 60],
  ]),
  ulWorkout('p5upper-a', 'Phase 5 Upper A', 5, 45, 'Upper day: power. Fast, controlled, explosive reps. Locked until a clean form retest AND Derek approves it in Coach. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Upper day.', '3/1/1', [
    ['Dumbbell Bench Press', 3, '5 reps', 180], ['Dumbbell Overhead Press', 4, '5 reps', 180], ['Push-Up', 4, '5 reps', 180], ['Plank', 3, '30 seconds', 60],
  ]),
  ulWorkout('p5upper-b', 'Phase 5 Upper B', 5, 45, 'Upper day: power. Fast, controlled, explosive reps. Locked until a clean form retest AND Derek approves it in Coach. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Upper day.', '3/1/1', [
    ['Lat Pulldown', 4, '5 reps', 120], ['Seated Cable Row', 3, '5 reps', 120], ['Single-Arm Dumbbell Row', 3, '5 reps each arm', 120], ['Pallof Press', 3, '10 reps each side', 60],
  ]),
  ulWorkout('p5lower-a', 'Phase 5 Lower A', 5, 45, 'Lower day: power. Fast, controlled, explosive reps. Locked until a clean form retest AND Derek approves it in Coach. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Lower day.', '3/1/1', [
    ['Barbell Back Squat', 4, '3 reps', 240], ['Step-Up', 3, '5 reps each leg', 180], ['Glute Bridge', 3, '12 reps', 60], ['Bird Dog', 3, '8 reps each side', 60],
  ]),
  ulWorkout('p5lower-b', 'Phase 5 Lower B', 5, 45, 'Lower day: power. Fast, controlled, explosive reps. Locked until a clean form retest AND Derek approves it in Coach. Start with your fix-it warm-up. Each muscle rests 2 to 3 days before its next Lower day.', '3/1/1', [
    ['Barbell Deadlift', 4, '3 reps', 240], ['Single-Leg Romanian Deadlift', 3, '5 reps each leg', 120], ['Split Squat', 3, '5 reps each leg', 120], ['Dead Bug', 3, '8 reps', 60],
  ]),
];

// Upper / Lower workouts live in the main WORKOUTS list, so phase gating,
// the rest timer, swaps, class focus, PRs, and XP all treat them exactly
// like the full-body workouts.
WORKOUTS.push(...UPPER_LOWER_WORKOUTS);

// ------------------------------------------------- MUSCLE MAP + VOLUME
// Primary muscle for every move in the app, by exercise name. One muscle
// per move, so the weekly volume table never double-counts a set. Used
// for the Workouts search filter and the per-muscle weekly sets table.
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'legs' | 'core';
export type FilterGroup = 'push' | 'pull' | 'legs' | 'core';

export const EXERCISE_MUSCLE: Record<string, MuscleGroup> = {
  'Dumbbell Bench Press': 'chest',
  'Push-Up': 'chest',
  'Dumbbell Overhead Press': 'shoulders',
  'Lat Pulldown': 'back',
  'Seated Cable Row': 'back',
  'Single-Arm Dumbbell Row': 'back',
  'Dumbbell Goblet Squat': 'legs',
  'Barbell Back Squat': 'legs',
  'Romanian Deadlift': 'legs',
  'Barbell Deadlift': 'legs',
  'Split Squat': 'legs',
  'Step-Up': 'legs',
  'Single-Leg Romanian Deadlift': 'legs',
  'Glute Bridge': 'legs',
  'Plank': 'core',
  'Dead Bug': 'core',
  'Bird Dog': 'core',
  'Side Plank': 'core',
  'Pallof Press': 'core',
};

/** Search filter group for a move: push is chest and shoulders, pull is back. */
export function filterGroupForExercise(name: string): FilterGroup {
  const m = EXERCISE_MUSCLE[name];
  if (m === 'chest' || m === 'shoulders') return 'push';
  if (m === 'back') return 'pull';
  if (m === 'legs') return 'legs';
  return 'core';
}

// ------------------------------------------------- CUSTOM WORKOUTS
// A workout the client did on their own, not from the plan (Derek,
// Nov 25, 2026). They pick the moves they did from the moves already
// in the app, and log weight, sets, reps, and rest for each one. No
// new moves, nothing new to film. The entry is stored as a normal
// workout log entry with workoutId 'custom-workout' and title
// 'My workout', plus the filter groups it hit, so volume, streaks,
// and the split rotation all read it the same as a planned workout.
export const CUSTOM_WORKOUT_ID = 'custom-workout';
export const CUSTOM_WORKOUT_TITLE = 'My workout';

/** Every move in the app, once each, by first appearance in the
 * planned workouts (full-body, Push / Pull / Legs, Upper / Lower).
 * Reference tracks reuse the same moves, so they add nothing new.
 * The Core, Balance and Mobility day adds Plank, Bird Dog, Dead Bug,
 * Glute Bridge, and Side Plank, all already in the planned workouts. */
export const ALL_EXERCISES: Exercise[] = (() => {
  const seen = new Set<string>();
  const out: Exercise[] = [];
  for (const w of WORKOUTS) {
    for (const ex of w.exercises) {
      if (seen.has(ex.id)) continue;
      seen.add(ex.id);
      out.push(ex);
    }
  }
  return [...out].sort((a, b) => a.name.localeCompare(b.name));
})();

export const EXERCISE_BY_ID: Map<string, Exercise> = new Map(
  ALL_EXERCISES.map((ex) => [ex.id, ex]),
);

/** Filter groups a custom log hit, most sets first. A group counts
 * when at least one logged move in it has sets. Used for the split
 * rotation: a custom legs day must not be followed by another legs
 * day, and a custom push day must not be followed by push again. */
export function customGroupsForLog(
  log: Record<string, { s?: string | number } | undefined> | undefined,
): FilterGroup[] {
  const setsByGroup: Record<FilterGroup, number> = { push: 0, pull: 0, legs: 0, core: 0 };
  for (const [exId, entry] of Object.entries(log || {})) {
    const sets = Number(entry?.s) || 0;
    if (sets <= 0) continue;
    const ex = EXERCISE_BY_ID.get(exId);
    if (!ex) continue;
    setsByGroup[filterGroupForExercise(ex.name)] += sets;
  }
  return (Object.keys(setsByGroup) as FilterGroup[])
    .filter((g) => setsByGroup[g] > 0)
    .sort((a, b) => setsByGroup[b] - setsByGroup[a]);
}

/** The split group a filter group maps to, for the client's style.
 * Push / Pull / Legs keeps push, pull, and legs apart. Upper / Lower
 * folds push and pull into upper, legs into lower. Core on its own
 * never blocks a strength day, so it maps to 'short', which no
 * planned split day in Push / Pull / Legs or Upper / Lower uses. */
export function splitGroupForFilterGroup(
  group: FilterGroup,
  style: 'full-body' | 'ppl' | 'short' | 'upper-lower',
): 'push' | 'pull' | 'legs' | 'short' | 'full' | 'upper' | 'lower' {
  if (style === 'upper-lower') {
    if (group === 'legs') return 'lower';
    if (group === 'core') return 'short';
    return 'upper';
  }
  if (group === 'core') return 'short';
  return group;
}

/** Weekly sets target range per muscle, by phase. Same ranges as
 * PHASE_WEEKLY_SETS, as numbers so the volume table can compare. */
export const PHASE_VOLUME_RANGE: Record<number, [number, number]> = {
  1: [6, 10],
  2: [8, 12],
  3: [10, 15],
  4: [12, 18],
  5: [10, 15],
};

export const VOLUME_MUSCLES: { id: MuscleGroup; label: string }[] = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'legs', label: 'Legs' },
  { id: 'core', label: 'Core' },
];

/** Sets per muscle per week, from the workouts in the client's current
 * split. Counts each exercise once, under its primary muscle. Legs run
 * high on purpose: squats, hinges, and single-leg moves all count
 * toward legs, so being over the range on legs is normal. */
export function weeklyVolumeForSplit(split: { days: SplitDay[] }, workouts: Workout[]): Record<MuscleGroup, number> {
  const out: Record<MuscleGroup, number> = { chest: 0, back: 0, shoulders: 0, legs: 0, core: 0 };
  const byId = new Map(workouts.map((w) => [w.id, w]));
  for (const day of split.days) {
    const w = byId.get(day.workoutId);
    if (!w) continue;
    for (const ex of w.exercises) {
      const m = EXERCISE_MUSCLE[ex.name];
      if (m) out[m] += ex.sets;
    }
  }
  return out;
}

// ------------------------------------------------- DAILY FOOD QUESTS
// One small rotating food quest a day, shown on Today when Nutrition is
// on. Skippable, no calorie counting, no tracking. Rotates by the day
// of the year, so every client sees the same quest on the same day.
export const FOOD_QUESTS: string[] = [
  'Add protein to breakfast',
  'Drink water with lunch',
  'Add a vegetable to dinner',
  'Eat a piece of fruit today',
  'Add protein to lunch',
  'Drink water before each meal',
  'Add a vegetable to lunch',
  'Eat until satisfied, about 80 percent full, at dinner',
  'Add protein to your afternoon snack',
  'Swap one sugary drink for water today',
  'Add a vegetable to breakfast',
  'Eat a handful of nuts or seeds today',
  'Add protein to dinner',
  'Drink a glass of water when you wake up',
];

export function foodQuestForDate(date: Date): string {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return FOOD_QUESTS[dayOfYear % FOOD_QUESTS.length];
}

// ------------------------------------------------ REFERENCE TRACKS
// Adapted reference tracks, built from the moves already in the app.
// Neutral names only. No brand credit anywhere client-visible. Each
// track reuses existing exercises, so nothing new needs filming.
// High-volume is reduced volume only, for advanced clients. Performance
// stays locked behind Phase 5, like the Phase 5 workouts.

function trackEx(name: string, sets: number, reps: string, restSec: number): Exercise {
  const found = findExerciseByName(name);
  if (!found) throw new Error(`Reference track exercise not found: ${name}`);
  return { ...found, sets, reps, restSec };
}

export interface ReferenceTrack {
  id: string;
  name: string;
  blurb: string;
  minutes: number;
  locked?: string;
  advancedOnly?: boolean;
  exercises: Exercise[];
}

export const REFERENCE_TRACKS: ReferenceTrack[] = [
  {
    id: 'track-over-40',
    name: 'Over-40 Track',
    blurb: 'Joint-friendly, slow and controlled. Good for beginners over 40.',
    minutes: 30,
    exercises: [
      trackEx('Dumbbell Goblet Squat', 2, '12 reps', 60),
      trackEx('Seated Cable Row', 2, '12 reps', 60),
      trackEx('Glute Bridge', 2, '12 reps', 30),
      trackEx('Bird Dog', 2, '8 reps each side', 30),
      trackEx('Plank', 2, '20 seconds', 30),
    ],
  },
  {
    id: 'track-muscle-builder',
    name: 'Muscle Builder Track',
    blurb: 'Heavier sets in the 6 to 12 rep range. For building muscle once form is solid.',
    minutes: 45,
    exercises: [
      trackEx('Barbell Back Squat', 4, '6 reps', 120),
      trackEx('Barbell Deadlift', 4, '6 reps', 120),
      trackEx('Dumbbell Bench Press', 3, '8 reps', 90),
      trackEx('Single-Arm Dumbbell Row', 3, '8 reps each arm', 45),
      trackEx('Plank', 3, '40 seconds', 30),
    ],
  },
  {
    id: 'track-high-volume',
    name: 'High-Volume Track',
    blurb: 'More sets than usual, reduced volume from the full version. Advanced clients only. Stop if form slips.',
    minutes: 45,
    advancedOnly: true,
    exercises: [
      trackEx('Dumbbell Goblet Squat', 4, '10 reps', 45),
      trackEx('Dumbbell Bench Press', 4, '10 reps', 45),
      trackEx('Lat Pulldown', 4, '10 reps', 45),
      trackEx('Romanian Deadlift', 4, '10 reps', 45),
      trackEx('Step-Up', 3, '10 reps each leg', 45),
    ],
  },
  {
    id: 'track-primer',
    name: 'Primer Track',
    blurb: 'A short primer before the main workout. Light, easy, and quick.',
    minutes: 15,
    exercises: [
      trackEx('Glute Bridge', 2, '12 reps', 30),
      trackEx('Bird Dog', 2, '8 reps each side', 30),
      trackEx('Dead Bug', 2, '8 reps', 30),
      trackEx('Plank', 2, '20 seconds', 30),
    ],
  },
  {
    id: 'track-primer-pro',
    name: 'Primer Pro Track',
    blurb: 'A longer primer with more moves, for days when you have more time.',
    minutes: 20,
    exercises: [
      trackEx('Glute Bridge', 2, '15 reps', 30),
      trackEx('Bird Dog', 2, '8 reps each side', 30),
      trackEx('Dead Bug', 2, '8 reps', 30),
      trackEx('Split Squat', 2, '10 reps each leg', 45),
      trackEx('Side Plank', 2, '15 seconds each side', 30),
    ],
  },
  {
    id: 'track-suspension',
    name: 'Suspension Track',
    blurb: 'Uses a suspension trainer, straps that hang. Bodyweight only, no barbell.',
    minutes: 30,
    exercises: [
      trackEx('Split Squat', 2, '10 reps each leg', 45),
      trackEx('Push-Up', 2, '8 reps', 45),
      trackEx('Single-Arm Dumbbell Row', 2, '10 reps each arm', 45),
      trackEx('Plank', 2, '30 seconds', 30),
      trackEx('Glute Bridge', 2, '12 reps', 30),
    ],
  },
  {
    id: 'track-unilateral',
    name: 'Unilateral Track',
    blurb: 'One side at a time. Weaker side first, then match it on the stronger side.',
    minutes: 30,
    exercises: [
      trackEx('Single-Leg Romanian Deadlift', 2, '8 reps each leg', 60),
      trackEx('Single-Arm Dumbbell Row', 3, '10 reps each arm', 45),
      trackEx('Split Squat', 2, '10 reps each leg', 45),
      trackEx('Step-Up', 2, '10 reps each leg', 45),
      trackEx('Side Plank', 2, '15 seconds each side', 30),
    ],
  },
  {
    id: 'track-performance',
    name: 'Performance Track',
    blurb: 'Fast, explosive moves for power. Locked until Phase 5.',
    minutes: 50,
    locked: 'Locked until Phase 5. You need a clean form retest and Derek approval in Coach.',
    exercises: [
      trackEx('Barbell Back Squat', 4, '3 reps', 240),
      trackEx('Barbell Deadlift', 4, '3 reps', 240),
      trackEx('Push-Up', 4, '5 reps', 180),
      trackEx('Step-Up', 4, '5 reps each leg', 180),
      trackEx('Single-Leg Romanian Deadlift', 3, '5 reps each leg', 120),
    ],
  },
  {
    id: 'track-advanced-builder',
    name: 'Advanced Builder Track',
    blurb: 'Heavier and longer than the Muscle Builder track. Advanced clients only, no failure sets.',
    minutes: 50,
    advancedOnly: true,
    exercises: [
      trackEx('Barbell Back Squat', 5, '3 reps', 240),
      trackEx('Barbell Deadlift', 5, '3 reps', 240),
      trackEx('Dumbbell Bench Press', 4, '5 reps', 180),
      trackEx('Dumbbell Overhead Press', 4, '5 reps', 180),
      trackEx('Lat Pulldown', 4, '5 reps', 120),
    ],
  },
  {
    id: 'track-strong',
    name: 'Strong Track',
    blurb: 'Heavy low-rep lifting for your strongest lifts. Only after Phase 3 and a clean Week 12 retest.',
    minutes: 50,
    exercises: [
      trackEx('Barbell Back Squat', 5, '3 reps', 240),
      trackEx('Barbell Deadlift', 5, '3 reps', 240),
      trackEx('Dumbbell Bench Press', 4, '5 reps', 180),
      trackEx('Seated Cable Row', 4, '5 reps', 120),
      trackEx('Plank', 3, '45 seconds', 60),
    ],
  },
];

// ---------------------------------------------------------- EQUIPMENT
// The Muse prototype had 14 equipment options. The assessment asks this
// question, and workouts swap out moves the user cannot do with what they
// have. "Gym full access" counts as having everything below it.

export const EQUIPMENT_OPTIONS: string[] = [
  'Bodyweight only',
  'Dumbbells',
  'Resistance bands',
  'Kettlebell',
  'Barbell',
  'Cable machine',
  'Bench',
  'Step platform',
  'Stability ball',
  'Foam roller',
  'Suspension trainer',
  'Pull-up bar',
  'Leg press machine',
  'Gym full access',
];

export const DEFAULT_EQUIPMENT: string[] = ['Bodyweight only', 'Dumbbells'];

export const EQUIPMENT_NOTES: Record<string, string> = {
  'Bodyweight only': 'No gear needed.',
  Dumbbells: 'Hand weights.',
  'Resistance bands': 'Stretchy bands.',
  Kettlebell: 'A handled weight.',
  Barbell: 'A long bar with plates.',
  'Cable machine': 'Pulley machine at a gym.',
  Bench: 'A flat workout bench.',
  'Step platform': 'A low step.',
  'Stability ball': 'A big exercise ball.',
  'Foam roller': 'For rolling tight muscles.',
  'Suspension trainer': 'Straps that hang, like TRX.',
  'Pull-up bar': 'A bar to hang from.',
  'Leg press machine': 'A gym machine for legs.',
  'Gym full access': 'You have everything.',
};

/** Equipment already saved, or the default for accounts made before this question existed. */
export function effectiveEquipment(equipment: string[] | undefined | null): string[] {
  return equipment && equipment.length > 0 ? equipment : [...DEFAULT_EQUIPMENT];
}

export function hasEquipment(equipment: string[] | undefined | null, need: string | null): boolean {
  if (!need) return true;
  const eff = effectiveEquipment(equipment);
  if (eff.includes('Gym full access')) return true;
  return eff.includes(need);
}

/** What a move needs, by exercise id. Bodyweight moves need nothing. */
export const EXERCISE_EQUIPMENT: Record<string, { need?: string; anyOf?: string[] }> = {
  'seated-cable-row': { need: 'Cable machine' },
  'lat-pulldown': { need: 'Cable machine' },
  'pallof-press': { anyOf: ['Cable machine', 'Resistance bands'] },
  'barbell-back-squat': { need: 'Barbell' },
  'barbell-deadlift': { need: 'Barbell' },
  'goblet-squat': { need: 'Dumbbells' },
  'dumbbell-bench-press': { need: 'Dumbbells' },
  'overhead-press': { need: 'Dumbbells' },
  'romanian-deadlift': { need: 'Dumbbells' },
  'single-leg-rdl': { need: 'Dumbbells' },
  'single-arm-dumbbell-row': { need: 'Dumbbells' },
  'step-up': { need: 'Step platform' },
};

/** Fallback moves, by exercise id, tried in order after the exercise's own swap field. */
export const EXERCISE_FALLBACKS: Record<string, string[]> = {
  'seated-cable-row': ['Single-Arm Dumbbell Row', 'Bird Dog'],
  'lat-pulldown': ['Seated Cable Row', 'Single-Arm Dumbbell Row', 'Bird Dog'],
  'pallof-press': ['Dead Bug'],
  'barbell-back-squat': ['Dumbbell Goblet Squat', 'Split Squat', 'Glute Bridge'],
  'barbell-deadlift': ['Romanian Deadlift', 'Glute Bridge'],
  'goblet-squat': ['Split Squat', 'Glute Bridge'],
  'dumbbell-bench-press': ['Push-Up', 'Dead Bug'],
  'overhead-press': ['Push-Up', 'Dead Bug'],
  'romanian-deadlift': ['Glute Bridge'],
  'single-leg-rdl': ['Romanian Deadlift', 'Glute Bridge'],
  'single-arm-dumbbell-row': ['Seated Cable Row', 'Bird Dog'],
  'step-up': ['Split Squat', 'Glute Bridge'],
};

export function exerciseNeeds(ex: Exercise): string | null {
  const gate = EXERCISE_EQUIPMENT[ex.id];
  if (!gate) return null;
  if (gate.anyOf) return gate.anyOf.join(' or ');
  return gate.need ?? null;
}

export function exerciseNeedsMet(ex: Exercise, equipment: string[] | undefined | null): boolean {
  const gate = EXERCISE_EQUIPMENT[ex.id];
  if (!gate) return true;
  const eff = effectiveEquipment(equipment);
  if (eff.includes('Gym full access')) return true;
  if (gate.anyOf) return gate.anyOf.some((n) => eff.includes(n));
  return eff.includes(gate.need ?? '');
}

export function findExerciseByName(name: string): Exercise | undefined {
  const want = name.trim().toLowerCase();
  for (const w of WORKOUTS) {
    const found = w.exercises.find((x) => x.name.trim().toLowerCase() === want);
    if (found) return found;
  }
  return undefined;
}

export interface ResolvedExercise {
  exercise: Exercise;
  swappedFrom: string | null;
  missingEquipment: string | null;
  unavailable: boolean;
}

/**
 * Swap a move the user cannot do for one they can, keeping the original
 * sets, reps, rest, and tempo. Tries the move's own swap field first, then
 * its fallback list. If nothing the user owns works, the original is kept
 * and marked unavailable so the UI can show the easier version instead.
 */
export function resolveExercise(ex: Exercise, equipment: string[] | undefined | null): ResolvedExercise {
  if (exerciseNeedsMet(ex, equipment)) {
    return { exercise: ex, swappedFrom: null, missingEquipment: null, unavailable: false };
  }
  const missing = exerciseNeeds(ex);
  const candidates: string[] = [];
  if (ex.swap) candidates.push(ex.swap);
  candidates.push(...(EXERCISE_FALLBACKS[ex.id] ?? []));
  for (const name of candidates) {
    const candidate = findExerciseByName(name);
    if (!candidate) continue;
    if (!exerciseNeedsMet(candidate, equipment)) continue;
    return {
      exercise: { ...candidate, sets: ex.sets, reps: ex.reps, restSec: ex.restSec, tempo: ex.tempo ?? candidate.tempo },
      swappedFrom: ex.name,
      missingEquipment: missing,
      unavailable: false,
    };
  }
  return { exercise: ex, swappedFrom: null, missingEquipment: missing, unavailable: true };
}

// ---------------------------------------------------------- CES TEMPLATES
// Corrective structure for each impairment: Inhibit (SMR, hold 30-60
// seconds), Lengthen (static stretch, 30 seconds), Activation (1-2 sets of
// 10-15 reps, tempo 4/2/1, 30 seconds rest), Integration.

export const CES_TEMPLATES: CesTemplate[] = [
  {
    id: 'feet-turn-out',
    name: 'Feet Turn Out',
    plainName: 'Feet that point outward when you squat or walk',
    inhibit: 'Foam roll the calves and the outside of the lower leg (peroneals). Hold tender spots for 30-60 seconds.',
    lengthen: 'Calf stretch against a wall, knee straight then knee bent. Hold 30 seconds each side.',
    activation: 'Side-lying hip abduction. 1-2 sets of 10-15 reps, tempo 4/2/1, rest 30 seconds.',
    integration: 'Squat with feet straight ahead, knees tracking over the second toe.',
    progression: [
      'Add a light resistance band around the knees during the squat.',
      'Move from a chair squat to a free goblet squat with feet straight.',
      'Check foot position in a mirror on every warm-up set.',
    ],
  },
  {
    id: 'heel-rise',
    name: 'Heel Rise',
    plainName: 'Heels lift off the floor when you squat',
    inhibit: 'Foam roll the calves and the soles of the feet. Hold tender spots for 30-60 seconds.',
    lengthen: 'Calf stretch against a wall, knee straight then knee bent. Hold 30 seconds each side.',
    activation: 'Heel raises with a slow lower, feet flat on the floor. 1-2 sets of 10-15 reps, tempo 4/2/1, rest 30 seconds.',
    integration: 'Squat to a box with heels glued to the floor.',
    progression: [
      'Lower the box height a little each week while heels stay down.',
      'Add a light goblet squat once heels stay down on a bodyweight squat.',
      'Practice ankle mobility daily, 2 minutes per side.',
    ],
  },
  {
    id: 'overpronation',
    name: 'Overpronation',
    plainName: 'Arches collapse inward when you stand or squat',
    inhibit: 'Foam roll the calves and the soles of the feet. Hold tender spots for 30-60 seconds.',
    lengthen: 'Calf stretch against a wall, knee straight then knee bent. Hold 30 seconds each side.',
    activation: 'Short foot exercise, scrunch the arch up without curling the toes. 1-2 sets of 10-15 reps, tempo 4/2/1, rest 30 seconds.',
    integration: 'Squat with weight spread across the whole foot, big toe pressing down.',
    progression: [
      'Hold the arch lift for 5 seconds per rep.',
      'Add the arch hold to a bodyweight squat.',
      'Practice barefoot balance on one foot, 30 seconds per side.',
    ],
  },
  {
    id: 'knee-dominance',
    name: 'Knee Dominance',
    plainName: 'Knees do most of the work and hips barely move',
    inhibit: 'Foam roll the quadriceps and the hip flexors. Hold tender spots for 30-60 seconds.',
    lengthen: 'Kneeling hip flexor stretch. Hold 30 seconds each side.',
    activation: 'Glute bridge with a 2 second hold at the top. 1-2 sets of 10-15 reps, tempo 4/2/1, rest 30 seconds.',
    integration: 'Hip hinge pattern first, then squat, so the hips share the work.',
    progression: [
      'Move from glute bridge to Romanian deadlift with light dumbbells.',
      'Add a hip hinge to every warm-up.',
      'Film one squat set a week and check that hips move back first.',
    ],
  },
  {
    id: 'knee-valgus',
    name: 'Knee Valgus',
    plainName: 'Knees cave inward when you squat',
    inhibit: 'Foam roll the inner thighs (adductors) and the calves. Hold tender spots for 30-60 seconds.',
    lengthen: 'Inner thigh stretch, seated wide legs leaning forward. Hold 30 seconds.',
    activation: 'Side-lying hip abduction and clamshells. 1-2 sets of 10-15 reps, tempo 4/2/1, rest 30 seconds.',
    integration: 'Squat with a light band around the knees, pressing out gently against it.',
    progression: [
      'Move from banded bodyweight squats to banded goblet squats.',
      'Add single-leg work like step-ups once knees track straight.',
      'Check knee tracking in a mirror on every squat set.',
    ],
  },
  {
    id: 'knee-varus',
    name: 'Knee Varus',
    plainName: 'Knees bow outward when you squat',
    inhibit: 'Foam roll the outer thighs (IT band area) and the calves. Hold tender spots for 30-60 seconds.',
    lengthen: 'Outer hip stretch, figure four lying down. Hold 30 seconds each side.',
    activation: 'Inner thigh squeeze with a ball between the knees. 1-2 sets of 10-15 reps, tempo 4/2/1, rest 30 seconds.',
    integration: 'Squat with knees tracking straight over the second toe, no bowing out.',
    progression: [
      'Add the ball squeeze to a wall sit.',
      'Move from bodyweight squats to goblet squats with straight knee tracking.',
      'Check knee position from the front in a mirror each session.',
    ],
  },
  {
    id: 'asymmetric-weight-shift',
    name: 'Asymmetric Weight Shift',
    plainName: 'You lean to one side when you squat',
    inhibit: 'Foam roll the calves, hip flexors, and outer hips on the side you lean toward. Hold tender spots for 30-60 seconds.',
    lengthen: 'Hip flexor stretch and calf stretch on the tighter side. Hold 30 seconds each side.',
    activation: 'Single-leg glute bridge on the weaker side. 1-2 sets of 10-15 reps, tempo 4/2/1, rest 30 seconds.',
    integration: 'Squat with even weight across both feet, using a mirror to check level hips.',
    progression: [
      'Add an extra set on the weaker side only.',
      'Move to split squats with even weight on both legs.',
      'Film one squat set a week and compare hip height left and right.',
    ],
  },
  {
    id: 'excessive-anterior-pelvic-tilt',
    name: 'Excessive Anterior Pelvic Tilt',
    plainName: 'Low back arches too much and belly pushes forward',
    inhibit: 'Foam roll the hip flexors and the low back muscles (beside the spine, never on it). Hold tender spots for 30-60 seconds.',
    lengthen: 'Kneeling hip flexor stretch. Hold 30 seconds each side.',
    activation: 'Dead bug with low back pressed to the floor. 1-2 sets of 10-15 reps, tempo 4/2/1, rest 30 seconds.',
    integration: 'Squat and hinge with ribs down and pelvis level.',
    progression: [
      'Add a plank with a posterior pelvic tilt, ribs down.',
      'Move to goblet squats with a level pelvis.',
      'Practice standing tall with ribs down for 2 minutes a day.',
    ],
  },
  {
    id: 'excessive-forward-trunk-lean',
    name: 'Excessive Forward Trunk Lean',
    plainName: 'Chest falls forward too far when you squat',
    inhibit: 'Foam roll the calves, hip flexors, and chest. Hold tender spots for 30-60 seconds.',
    lengthen: 'Calf stretch and doorway chest stretch. Hold 30 seconds each.',
    activation: 'Glute bridge with a 2 second hold at the top. 1-2 sets of 10-15 reps, tempo 4/2/1, rest 30 seconds.',
    integration: 'Squat to a box, chest tall, eyes forward.',
    progression: [
      'Lower the box height as the chest stays tall.',
      'Add a goblet squat with a light weight and a tall chest.',
      'Film one squat set a week and check trunk angle.',
    ],
  },
  {
    id: 'excessive-posterior-pelvic-tilt',
    name: 'Excessive Posterior Pelvic Tilt',
    plainName: 'Low back rounds and tucks under at the bottom of a squat',
    inhibit: 'Foam roll the hamstrings and glutes. Hold tender spots for 30-60 seconds.',
    lengthen: 'Seated hamstring stretch, back straight. Hold 30 seconds each side.',
    activation: 'Glute bridge with a 2 second hold at the top. 1-2 sets of 10-15 reps, tempo 4/2/1, rest 30 seconds.',
    integration: 'Squat only as deep as you can keep a flat low back.',
    progression: [
      'Add depth one inch at a time as the back stays flat.',
      'Add ankle mobility work if depth is limited by stiff ankles.',
      'Film one squat set a week and check the low back at the bottom.',
    ],
  },
  {
    id: 'arms-fall-forward',
    name: 'Arms Fall Forward',
    plainName: 'Arms drift forward when you raise them overhead',
    inhibit: 'Foam roll the chest and the lats. Hold tender spots for 30-60 seconds.',
    lengthen: 'Doorway chest stretch and lat stretch on a bench. Hold 30 seconds each.',
    activation: 'Prone Y raise, thumbs up, slow and light. 1-2 sets of 10-15 reps, tempo 4/2/1, rest 30 seconds.',
    integration: 'Overhead press with ribs down and arms in line with the ears.',
    progression: [
      'Add a light band to the Y raise.',
      'Move to a seated dumbbell overhead press with full range.',
      'Check arm position in a mirror on every press set.',
    ],
  },
  {
    id: 'scapular-winging',
    name: 'Scapular Winging',
    plainName: 'Shoulder blades stick out from the ribs',
    inhibit: 'Foam roll the chest and the lats. Hold tender spots for 30-60 seconds.',
    lengthen: 'Doorway chest stretch. Hold 30 seconds each side.',
    activation: 'Serratus wall slide, push the wall away as arms rise. 1-2 sets of 10-15 reps, tempo 4/2/1, rest 30 seconds.',
    integration: 'Push-up with shoulder blades wrapping the ribs at the top.',
    progression: [
      'Move from wall slides to floor slides on a towel.',
      'Add a push-up plus, pushing the floor away at the top.',
      'Check shoulder blades in a mirror during rows and presses.',
    ],
  },
  {
    id: 'shoulder-elevation-forward-head',
    name: 'Shoulder Elevation With Forward Head Posture',
    plainName: 'Shoulders shrug up and head sits forward',
    inhibit: 'Foam roll the upper traps and the chest. Hold tender spots for 30-60 seconds.',
    lengthen: 'Upper trap stretch, ear to shoulder, and doorway chest stretch. Hold 30 seconds each.',
    activation: 'Chin tucks and scapular depression, shoulders down and back. 1-2 sets of 10-15 reps, tempo 4/2/1, rest 30 seconds.',
    integration: 'Row and press with shoulders down, head stacked over the spine.',
    progression: [
      'Hold the chin tuck for 5 seconds per rep.',
      'Add rows with a focus on shoulders staying down.',
      'Set a daily reminder to check posture at your desk or in the car.',
    ],
  },
  {
    id: 'shoulder-elevation-no-forward-head',
    name: 'Shoulder Elevation Without Forward Head Posture',
    plainName: 'Shoulders shrug up, head position is fine',
    inhibit: 'Foam roll the upper traps and the lats. Hold tender spots for 30-60 seconds.',
    lengthen: 'Upper trap stretch, ear to shoulder. Hold 30 seconds each side.',
    activation: 'Scapular depression, pull shoulders down and hold. 1-2 sets of 10-15 reps, tempo 4/2/1, rest 30 seconds.',
    integration: 'Lat pulldown and rows with shoulders down and away from the ears.',
    progression: [
      'Hold the depression for 5 seconds per rep.',
      'Add a light lat pulldown with shoulders staying down.',
      'Check shoulder height in a mirror on every pull set.',
    ],
  },
  {
    id: 'elbow-flexion',
    name: 'Elbow Flexion',
    plainName: 'Elbows stay bent when arms should hang straight',
    inhibit: 'Foam roll the biceps and forearms. Hold tender spots for 30-60 seconds.',
    lengthen: 'Biceps stretch on a wall, arm straight, palm up. Hold 30 seconds each side.',
    activation: 'Triceps pressdown with a full straighten at the bottom. 1-2 sets of 10-15 reps, tempo 4/2/1, rest 30 seconds.',
    integration: 'Rows and pulldowns with arms fully straight at the start of each rep.',
    progression: [
      'Add a slow 4 second lower on the pressdown.',
      'Move to full-range rows with straight arms at the start.',
      'Check elbow position in a mirror on every pull set.',
    ],
  },
  {
    id: 'non-neutral-wrist',
    name: 'Non-neutral Wrist',
    plainName: 'Wrists bend back or flop during pressing',
    inhibit: 'Foam roll the forearms. Hold tender spots for 30-60 seconds.',
    lengthen: 'Wrist flexor stretch, palm up, gentle pull. Hold 30 seconds each side.',
    activation: 'Wrist curls and reverse wrist curls with a light weight. 1-2 sets of 10-15 reps, tempo 4/2/1, rest 30 seconds.',
    integration: 'Press with wrists straight and stacked over the forearms.',
    progression: [
      'Add a light grip squeeze hold, 5 seconds per rep.',
      'Move to dumbbell presses with straight wrists.',
      'Check wrist position in a mirror on every press set.',
    ],
  },
  {
    id: 'forward-head-posture',
    name: 'Forward Head Posture',
    plainName: 'Head sits forward of the shoulders',
    inhibit: 'Foam roll the upper traps and the chest. Hold tender spots for 30-60 seconds.',
    lengthen: 'Upper trap stretch and doorway chest stretch. Hold 30 seconds each.',
    activation: 'Chin tucks, pull the head straight back. 1-2 sets of 10-15 reps, tempo 4/2/1, rest 30 seconds.',
    integration: 'Stand, squat, and press with the head stacked over the spine.',
    progression: [
      'Hold each chin tuck for 5 seconds.',
      'Add chin tucks to your warm-up every session.',
      'Set a daily reminder to check head position at your desk or in the car.',
    ],
  },
];

// ------------------------------------------------------- CONTRAINDICATIONS

export const CONTRAINDICATIONS: Contraindication[] = [
  {
    flag: 'High blood pressure',
    appliesTo: 'Foam rolling, heavy lifting, and grip work',
    action: 'No foam rolling. Avoid heavy lifting, holding your breath under load (Valsalva), and hard overgripping. Use seated or standing moves only. Stand up slowly. Check with your doctor before starting.',
  },
  {
    flag: 'Pregnancy',
    appliesTo: 'Position, foam rolling, and high impact moves',
    action: 'No lying on your back or stomach after 12 weeks. No foam rolling on areas with varicose veins or swelling. No plyometrics in the 2nd or 3rd trimester. Check with your doctor before starting.',
  },
  {
    flag: 'Diabetes',
    appliesTo: 'Impact and foot care',
    action: 'Use lower impact moves. Check your feet after every session for blisters or sores. Keep glucose tablets nearby if your doctor advises it. Check with your doctor before starting.',
  },
  {
    flag: 'Coronary or heart condition',
    appliesTo: 'Heart rate, heavy lifting, and grip work',
    action: 'Monitor your heart rate and stay in the range your doctor gave you. Avoid heavy lifting, holding your breath under load, and hard overgripping. Stop and rest if you feel chest discomfort. Check with your doctor before starting.',
  },
  {
    flag: 'Osteoporosis',
    appliesTo: 'Spine loading and twisting',
    action: 'Avoid loaded spinal flexion, twisting under load, and high impact moves. Use supported, upright moves and light loads with perfect form. Check with your doctor before starting.',
  },
  {
    flag: 'Deep vein thrombosis (DVT)',
    appliesTo: 'Foam rolling and leg work',
    action: 'No foam rolling on the affected leg. Avoid hard squeezing or compression on that leg. Check with your doctor before starting.',
  },
  {
    flag: 'Cancer',
    appliesTo: 'Fatigue, bone health, and treatment side effects',
    action: 'Keep sessions short and gentle on treatment days. Skip moves that hurt or feel wrong. Check with your doctor before starting, and tell Derek about any treatment changes.',
  },
  {
    flag: 'Bleeding disorder or blood thinners',
    appliesTo: 'Foam rolling and bruising risk',
    action: 'Use very light foam rolling pressure or skip it. Watch for unusual bruising. Avoid moves that risk a hard bump or fall. Check with your doctor before starting.',
  },
  {
    flag: 'Recent injury or surgery',
    appliesTo: 'The injured or operated area',
    action: 'Follow your surgeon or physical therapist plan first. Skip moves that load the healing area until you are cleared. Tell Derek what you are cleared to do.',
  },
  {
    flag: 'Acute injury',
    appliesTo: 'Foam rolling and the injured area',
    action: 'No foam rolling on the low back, on joints, or on any acute injury. Rest the area and see a doctor or physical therapist. Do not train through sharp, new, or worsening pain.',
  },
];

// Boss rounds: one practice fight per land, with real health that drops
// when a spell lands. HP stays beaten once it hits 0.
export const BOSS_ROUNDS: { id: string; week: number; name: string; land: string; maxHp: number; unlockPhase: number }[] = [
  { id: 'boss-week-4', week: 4, name: 'Week 4 boss round', land: 'Sapphire Forest', maxHp: 100, unlockPhase: 1 },
  { id: 'boss-week-8', week: 8, name: 'Week 8 boss round', land: 'Crystal Shores', maxHp: 150, unlockPhase: 2 },
  { id: 'boss-week-12', week: 12, name: 'Week 12 boss round', land: 'Navy Peaks', maxHp: 200, unlockPhase: 3 },
  // Cycle 2, Ember Highlands. HP climbs every round, so each one is a
  // real step up from the last.
  { id: 'boss-week-16', week: 16, name: 'The Heavy Fog', land: 'Ember Highlands', maxHp: 220, unlockPhase: 3 },
  { id: 'boss-week-20', week: 20, name: 'The Rust Giant', land: 'Ember Highlands', maxHp: 240, unlockPhase: 4 },
  { id: 'boss-week-24', week: 24, name: 'The Ember Drake', land: 'Ember Highlands', maxHp: 260, unlockPhase: 4 },
  // Cycle 3, Storm Coast.
  { id: 'boss-week-28', week: 28, name: 'The Gale Howler', land: 'Storm Coast', maxHp: 280, unlockPhase: 4 },
  { id: 'boss-week-32', week: 32, name: 'The Tide Troll', land: 'Storm Coast', maxHp: 300, unlockPhase: 4 },
  { id: 'boss-week-36', week: 36, name: 'The Storm Serpent', land: 'Storm Coast', maxHp: 320, unlockPhase: 4 },
  // Cycle 4, Golden Summit, plus the Week 52 year review round.
  { id: 'boss-week-40', week: 40, name: 'The Gold Golem', land: 'Golden Summit', maxHp: 340, unlockPhase: 4 },
  { id: 'boss-week-44', week: 44, name: 'The Summit Wraith', land: 'Golden Summit', maxHp: 360, unlockPhase: 4 },
  { id: 'boss-week-48', week: 48, name: 'The Peak Keeper', land: 'Golden Summit', maxHp: 380, unlockPhase: 4 },
  { id: 'boss-week-52', week: 52, name: 'The Summit Review', land: 'Golden Summit', maxHp: 400, unlockPhase: 4 },
];

// ---------------------------------------------------------------- MONSTERS

export const MONSTERS: Monster[] = [
  {
    id: 'the-slump',
    name: 'The Slump',
    land: 'Sapphire Forest',
    castle: 'Forest Castle',
    weeks: 'Weeks 1-4',
    bossRound: 'Week 4',
    blurb: 'A heavy, sleepy fog that makes every chair feel like a trap. Beat it by showing up, day after day, and it clears. You move on without it.',
  },
  {
    id: 'stiff-hips-goblin',
    name: 'Stiff Hips Goblin',
    land: 'Sapphire Forest',
    castle: 'Forest Castle',
    weeks: 'Weeks 1-4',
    bossRound: 'Week 4',
    blurb: 'A grumpy little goblin who guards the forest paths and hates hip openers. Beat him with steady mobility work and he is gone. The path is yours.',
  },
  {
    id: 'achy-knees-troll',
    name: 'Achy Knees Troll',
    land: 'Crystal Shores',
    castle: 'Lake Castle',
    weeks: 'Weeks 5-8',
    bossRound: 'Week 8',
    blurb: 'A big troll who blocks the lake bridge and complains about every step. Teach your knees to track straight and you push past him. He stays behind you.',
  },
  {
    id: 'tired-back-beast',
    name: 'Tired Back Beast',
    land: 'Crystal Shores',
    castle: 'Lake Castle',
    weeks: 'Weeks 5-8',
    bossRound: 'Week 8',
    blurb: 'A tired old beast who carries too much and never rests. Beat it by recovering well, and it is done. You walk on, stronger than it was.',
  },
  {
    id: 'wobbly-balance-sprite',
    name: 'Wobbly Balance Sprite',
    land: 'Navy Peaks',
    castle: 'Navy Castle',
    weeks: 'Weeks 9-12',
    bossRound: 'Week 12',
    blurb: 'A quick, giggling sprite who loves to tip you over. Practice your balance holds and you beat it. It is gone, and you stay standing.',
  },
];

// ---------------------------------------------------------------- CREATURES

export const CREATURES: Creature[] = [
  {
    id: 'bram',
    name: 'Bram',
    kind: 'Dwarf blacksmith',
    place: 'Armor vault',
    line: 'Bram forges your armor, one piece at a time, and never lets you leave the forge with gear you have not earned.',
    meetWeek: 1,
    effect: '+5 XP on your first workout each week.',
  },
  {
    id: 'sylva',
    name: 'Sylva',
    kind: 'Elf guide',
    place: 'Cardio and balance',
    line: 'Sylva knows every forest trail and every balance beam in the kingdom, and she walks them with you.',
    meetWeek: 1,
    effect: '+5 XP when you log cardio.',
  },
  {
    id: 'kaelith',
    name: 'Kaelith',
    kind: 'Dragon',
    place: 'Week 12 final-round gate',
    line: 'Kaelith is a dragon you befriend at the Week 12 gate. She is not a boss. She opens the gate once your retest is done.',
    meetWeek: 12,
    effect: 'Opens the Week 12 gate once your retest is done. No XP.',
  },
  {
    id: 'tilda',
    name: 'Tilda',
    kind: 'Halfling innkeeper',
    place: 'Nutrition',
    line: 'Tilda runs the inn kitchen, serves real food in honest portions, and always saves you a seat.',
    meetWeek: 5,
    effect: '+5 XP when you log a rest day.',
  },
  {
    id: 'pip',
    name: 'Pip',
    kind: 'Gnome map keeper',
    place: 'Journey',
    line: 'Pip keeps your map, marks every step you take, and never lets you get lost on the road.',
    meetWeek: 5,
    effect: 'Shows your next step clearly on Journey. No XP, just guidance.',
  },
  {
    id: 'hoot',
    name: 'Hoot',
    kind: 'Owl',
    place: 'Progress',
    line: 'Hoot watches from the rafters, counts your wins, and hoots softly every time you show up.',
    meetWeek: 9,
    effect: '+5 XP when you check in.',
  },
  {
    id: 'ash',
    name: 'Ash',
    kind: 'Dire wolf',
    place: 'Journey',
    line: 'Ash is a dire wolf you befriend by showing up steady, week after week. He walks beside you and guards the road while you train.',
    meetWeek: 2,
    effect: '+5 XP when you train two or more times in a week.',
  },
  {
    id: 'ember',
    name: 'Ember',
    kind: 'Small dragon',
    place: 'Journey',
    line: 'Ember is a small friendly dragon you befriend after your first boss round. She is not a boss. She keeps your fire lit and cheers your wins.',
    meetWeek: 4,
    effect: '+5 XP when you cast a spell in a boss round.',
  },
  {
    id: 'rowan',
    name: 'Rowan',
    kind: 'Retired knight',
    place: 'Journey',
    line: 'Rowan is a retired knight you befriend on the road. He walks beside you and shows you how to pace yourself, never rushing a set.',
    meetWeek: 6,
    effect: '+5 XP when you finish a workout at a steady pace, not rushed.',
  },
  {
    id: 'mara',
    name: 'Mara',
    kind: 'Healer',
    place: 'Recovery',
    line: 'Mara is a healer you befriend after a hard week. She helps you rest and recover, and reminds you that sleep counts as training.',
    meetWeek: 8,
    effect: '+5 XP when you log sleep.',
  },
  {
    id: 'quill',
    name: 'Quill',
    kind: 'Raven',
    place: 'Journey',
    line: 'Quill is a raven you befriend with a few crumbs and a kind word. He carries your messages to Derek and brings back the replies.',
    meetWeek: 7,
    effect: '+5 XP when you message Derek.',
  },
  {
    id: 'miso',
    name: 'Miso',
    kind: 'Cat',
    place: 'Rest days',
    line: 'Miso is a cat you befriend at the inn. She keeps you company on rest days and naps beside you while you stretch.',
    meetWeek: 3,
    effect: '+5 XP when you log a rest day.',
  },
  // Cycle 2 to 4 companions. Befriendable people and animals only. Bosses
  // are never friends, and none of these four is a boss.
  {
    id: 'wren',
    name: 'Wren',
    kind: 'Scout',
    place: 'Ember Highlands',
    line: 'Wren is a scout you meet on the climb into the Ember Highlands. She knows every short cut and counts your steps along the way.',
    meetWeek: 14,
    effect: '+5 XP when you log steps.',
  },
  {
    id: 'fern',
    name: 'Fern',
    kind: 'Gardener',
    place: 'Ember Highlands',
    line: 'Fern is a gardener who tends the rest stops in the Highlands. She keeps a notebook of every measurement, and cheers when the numbers move.',
    meetWeek: 18,
    effect: '+5 XP when you log a measurement.',
  },
  {
    id: 'ansel',
    name: 'Ansel',
    kind: 'Old climber',
    place: 'Storm Coast',
    line: 'Ansel is an old climber you meet on the Storm Coast. He has climbed these stairs a hundred times and knows that steady beats fast.',
    meetWeek: 26,
    effect: '+5 XP when you set a personal record.',
  },
  {
    id: 'lark',
    name: 'Lark',
    kind: 'Messenger bird',
    place: 'Golden Summit',
    line: 'Lark is a messenger bird who flies ahead with news of the road home. She sings when a boss round falls.',
    meetWeek: 38,
    effect: '+5 XP when you beat a boss round.',
  },
];

// -------------------------------------------------------------------- STORY

export const STORY: { firstLine: string; expanded: string[] } = {
  firstLine: 'The guardian woke up tired and out of shape.',
  expanded: [
    'The guardian had spent a long time sitting, rushing, and putting everyone else first. One morning, the armor did not fit the way it used to, the stairs felt longer, and the forest outside felt very far away. So the guardian made a simple choice: start small, and keep going.',
    'The road runs through three lands. Sapphire Forest comes first, green and quiet, where the Forest Castle stands. Then Crystal Shores, where the Lake Castle shines. Then Navy Peaks, where the Navy Castle waits at the top of the climb. Each land has its own monsters, and each monster guards a lesson.',
    'In Weeks 1 to 4, the guardian meets The Slump and the Stiff Hips Goblin. In Weeks 5 to 8, the Achy Knees Troll and the Tired Back Beast block the road. In Weeks 9 to 12, the Wobbly Balance Sprite dances on the mountain path. At the end of each stretch, in Week 4, Week 8, and Week 12, a boss round tests everything the guardian has learned.',
    'The monsters are challenges, not friends. When you beat a monster with steady work, it is done and you move on. The Slump clears. The goblin is gone. The troll stays behind you. The beast is beaten. The sprite is gone, and you stay standing. Every win is yours, and the road ahead is open.',
    'Along the road you befriend people and animals: Bram, Sylva, Tilda, Pip, Hoot, Kaelith, Ash the dire wolf, Ember the small dragon, Rowan the retired knight, Mara the healer, Quill the raven, and Miso the cat. They walk with you. The monsters do not.',
    'Mana is the fuel for your spells. You earn mana by finishing workouts, checking in, and beating boss rounds. Spend it on spells that fit your class, or save it for the big rounds. A guardian who rests well earns more than a guardian who grinds without sleep.',
    'The journey follows five phases, from slow and steady control to real strength and then power. Each phase unlocks new gear, new moves, and new ground. After Week 12, the retest shows how far you have come, and Week 13 starts a new loop. Nothing resets. The phases cycle back to 1, 2, or 3 based on your retest and your new goal, and the story keeps going with you in it.',
  ],
};

// ----------------------------------------------------------- CLASSES, SPELLS

export const CLASS_GOOD_FOR: Record<string, string> = {
  Guardian: 'Good for: getting stronger, lifting heavy, sticking with it.',
  Ranger: 'Good for: moving better, balance, cardio and endurance.',
  Spellweaver: 'Good for: getting stronger, steady habits, sleep and recovery, weight loss.',
};

// Suggested goals per class, in plain words. Suggestions only: any goal type
// works with any class, and progress is driven by the goal, not the class.
export const CLASS_SUGGESTED_GOALS: Record<string, string[]> = {
  Guardian: ['stronger', 'consistency', 'weight-loss'],
  Ranger: ['move-better', 'balance', 'cardio', 'endurance', 'weight-loss'],
  Spellweaver: ['stronger', 'consistency', 'sleep', 'weight-loss'],
};

// -------------------------------------------------- CLASS WORKOUT FOCUS
// Class now changes workout focus and volume, not just spells, weapon,
// avatar, and background. Phase, phase reps and sets ranges, compound
// lifts first, and 1 to 2 rest days between strength days never change.
// No class removes strength work. Guardian adds volume to main lifts and
// trims core and balance moves. Ranger adds volume to balance, single-leg,
// and core moves, plus more cardio. Spellweaver adds volume to core and
// mobility moves, with the same strength work, not instead of it.

export const MAIN_LIFT_IDS: string[] = [
  'barbell-back-squat',
  'barbell-deadlift',
  'goblet-squat',
  'romanian-deadlift',
  'dumbbell-bench-press',
  'overhead-press',
  'lat-pulldown',
  'seated-cable-row',
  'single-arm-dumbbell-row',
  'push-up',
];

export const BALANCE_SINGLE_LEG_IDS: string[] = [
  'single-leg-rdl',
  'split-squat',
  'step-up',
  'bird-dog',
];

export const CORE_MOBILITY_IDS: string[] = [
  'plank',
  'side-plank',
  'dead-bug',
  'pallof-press',
  'glute-bridge',
  'bird-dog',
];

export const CLASS_WORKOUT_FOCUS: Record<string, { line: string; detail: string; cardioLine?: string }> = {
  Guardian: {
    line: 'Guardian focus: getting stronger.',
    detail:
      'Your Guardian focuses on getting stronger. You still do the same strength work, phases, and compound lifts first.',
  },
  Ranger: {
    line: 'Ranger focus: moving better.',
    detail:
      'Your Ranger focuses on moving better, with balance and steady cardio. Aim for 150 to 300 minutes of cardio a week, Zone 2.',
    cardioLine: 'Aim for the top of your cardio range, 150 to 300 minutes a week.',
  },
  Spellweaver: {
    line: 'Spellweaver focus: rest, recovery, and steady habits.',
    detail:
      'Your Spellweaver focuses on rest and recovery, with steady habits. Strength first, recovery built in, not instead of it.',
  },
};

/** Top of the phase sets range, e.g. Phase 1 is 1-3 sets, so the max is 3. */
export function phaseMaxSets(phase: number): number {
  const p = PHASES.find((x) => x.phase === phase);
  if (!p) return 5;
  const m = p.sets.match(/(\d+)\s*-\s*(\d+)/);
  return m ? Number(m[2]) : 5;
}

export interface ClassFocusResult {
  exercise: Exercise;
  delta: number;
  reason: string;
}

/**
 * Adjust one exercise for the client's class. Returns the exercise with
 * its sets changed, the change in sets, and a plain-words reason. Sets
 * never go below 1 or above the top of the phase range.
 */
export function applyClassFocus(
  ex: Exercise,
  classId: string | undefined | null,
  phase: number,
): ClassFocusResult {
  if (!classId) return { exercise: ex, delta: 0, reason: '' };
  const max = phaseMaxSets(phase);
  let delta = 0;
  let reason = '';
  if (classId === 'Guardian') {
    if (MAIN_LIFT_IDS.includes(ex.id)) {
      delta = 1;
      reason = 'guardian-main-lift';
    } else if (BALANCE_SINGLE_LEG_IDS.includes(ex.id) || CORE_MOBILITY_IDS.includes(ex.id)) {
      delta = -1;
      reason = 'guardian-core-balance';
    }
  } else if (classId === 'Ranger') {
    if (BALANCE_SINGLE_LEG_IDS.includes(ex.id)) {
      delta = 1;
      reason = 'ranger-balance-single-leg';
    } else if (CORE_MOBILITY_IDS.includes(ex.id)) {
      delta = 1;
      reason = 'ranger-core';
    }
  } else if (classId === 'Spellweaver') {
    if (CORE_MOBILITY_IDS.includes(ex.id)) {
      delta = 1;
      reason = 'spellweaver-core-mobility';
    }
  }
  if (delta === 0) return { exercise: ex, delta: 0, reason: '' };
  const sets = Math.max(1, Math.min(max, ex.sets + delta));
  if (sets === ex.sets) return { exercise: ex, delta: 0, reason: '' };
  return { exercise: { ...ex, sets }, delta: sets - ex.sets, reason };
}

export const CLASSES: ClassInfo[] = [
  {
    id: 'Guardian',
    name: 'Guardian',
    description: 'Steady and strong. The Guardian protects the party, lifts heavy, and never quits a set early.',
    spells: ['shield-wall', 'stone-grip'],
  },
  {
    id: 'Ranger',
    name: 'Ranger',
    description: 'Quick and sure-footed. The Ranger moves well, balances on any trail, and hits every target.',
    spells: ['steady-aim', 'forest-step'],
  },
  {
    id: 'Spellweaver',
    name: 'Spellweaver',
    description: 'Clever and calm. The Spellweaver trains strength like everyone else, and turns rest, food, and sleep into quiet power.',
    spells: ['deep-rest', 'clear-mind'],
  },
];

export const SPELLS: Spell[] = [
  {
    id: 'shield-wall',
    name: 'Shield Wall',
    classId: 'Guardian',
    cost: 3,
    damage: 15,
    blurb: 'Raise your shield and stand firm. Blocks the next boss hit and steadies your form.',
  },
  {
    id: 'stone-grip',
    name: 'Stone Grip',
    classId: 'Guardian',
    cost: 4,
    damage: 20,
    blurb: 'Grip like stone and lift with everything you have. Extra damage on heavy lifts.',
  },
  {
    id: 'steady-aim',
    name: 'Steady Aim',
    classId: 'Ranger',
    cost: 3,
    damage: 15,
    blurb: 'Breathe, aim, and strike true. A clean hit that never misses the target.',
  },
  {
    id: 'forest-step',
    name: 'Forest Step',
    classId: 'Ranger',
    cost: 4,
    damage: 20,
    blurb: 'Move quick and quiet through the trees. Extra damage on balance and single-leg rounds.',
  },
  {
    id: 'deep-rest',
    name: 'Deep Rest',
    classId: 'Spellweaver',
    cost: 3,
    damage: 15,
    blurb: 'Rest is a spell too. Recover mana and come back stronger for the next workout, not instead of it.',
  },
  {
    id: 'clear-mind',
    name: 'Clear Mind',
    classId: 'Spellweaver',
    cost: 4,
    damage: 20,
    blurb: 'Clear your mind and focus on the next set. Extra damage on check-in and consistency rounds.',
  },
  {
    id: 'second-wind',
    name: 'Power Strike',
    classId: 'any',
    cost: 6,
    damage: 30,
    blurb: 'Every class can learn this at Level 9. Hit hard when it matters most.',
  },
];

// ------------------------------------------------------------------- BADGES

export const BADGES: Badge[] = [
  { id: 'three-in-a-row', name: '3-in-a-Row', how: 'Finish 3 workouts in a row.' },
  { id: 'week-1-finished', name: 'Week 1 Finished', how: 'Finish your first full week.' },
  { id: 'three-day-checkin', name: '3-Day Check-In Streak', how: 'Check in 3 days in a row.' },
  { id: 'full-sequence-week', name: 'Full Sequence Week', how: 'Finish every workout in a week, in order.' },
  { id: 'balance-breakthrough', name: 'Balance Breakthrough', how: 'Beat your best balance hold.' },
  { id: '150-club', name: '150 Club', how: 'Hit 150 minutes of cardio in one week.' },
  { id: 'phase-1-finisher', name: 'Phase 1 Finisher', how: 'Finish Phase 1.' },
  { id: 'phase-2-finisher', name: 'Phase 2 Finisher', how: 'Finish Phase 2.' },
  { id: 'phase-3-finisher', name: 'Phase 3 Finisher', how: 'Finish Phase 3.' },
  { id: 'first-pr', name: 'First PR', how: 'Set your first personal record.' },
  { id: 'five-prs', name: 'Five PRs', how: 'Set 5 personal records.' },
  { id: 'two-to-three-strength', name: '2 to 3 Strength This Week', how: 'Finish 2 to 3 strength workouts in one week.' },
  // Year badges: one per cycle milestone, plus monthly result badges.
  { id: 'cycle-1-finisher', name: 'Cycle 1 Finisher', how: 'Finish Cycle 1: save the Week 12 retest.' },
  { id: 'cycle-2-finisher', name: 'Cycle 2 Finisher', how: 'Finish Cycle 2: save the Week 24 retest.' },
  { id: 'cycle-3-finisher', name: 'Cycle 3 Finisher', how: 'Finish Cycle 3: save the Week 36 retest.' },
  { id: 'cycle-4-finisher', name: 'Cycle 4 Finisher', how: 'Finish Cycle 4: save the Week 48 retest.' },
  { id: 'year-finisher', name: 'Summit Finisher', how: 'Save a review retest.' },
  { id: 'ten-prs', name: 'Ten PRs', how: 'Set 10 personal records.' },
  { id: 'twenty-five-workouts', name: '25 Workouts', how: 'Finish 25 workouts.' },
  { id: 'fifty-workouts', name: '50 Workouts', how: 'Finish 50 workouts.' },
  { id: 'two-week-checkin', name: '14-Day Check-In Streak', how: 'Check in 14 days in a row.' },
  { id: 'cardio-1000', name: '1,000 Cardio Minutes', how: 'Log 1,000 minutes of cardio in total.' },
  { id: 'sleep-30', name: '30 Nights Logged', how: 'Log sleep 30 times.' },
  { id: 'measurement-tracker', name: 'Measurement Tracker', how: 'Log 6 measurements.' },
];

// -------------------------------------------------------------------- ARMOR
// 18 level pieces: 10 Common by level, 4 Peakforged (Phase 4), 4 Stormforged
// (Phase 5). Plus 3 class weapons, 9 rarity pieces, and 8 epic weapons
// (famous-weapon-inspired, renamed). Every effect is plain
// words and never blocks a workout, quest, check-in, or retest.

export const ARMOR: ArmorPiece[] = [
  { id: 'travelers-boots', name: "Traveler's Boots", tier: 'Common', how: 'Finish your first workout.', effect: 'Steadier steps. Your walks feel a little easier.' },
  { id: 'apprentice-gloves', name: 'Apprentice Gloves', tier: 'Common', how: 'Reach Level 2.', effect: 'Better grip. Dumbbells feel more secure in your hands.' },
  { id: 'sturdy-belt', name: 'Sturdy Belt', tier: 'Common', how: 'Reach Level 3.', effect: 'A braced core. Your lifts feel more solid.' },
  { id: 'trail-cloak', name: 'Trail Cloak', tier: 'Common', how: 'Reach Level 4.', effect: 'Warm on cold mornings. You recover a little faster between sets.' },
  { id: 'iron-bracers', name: 'Iron Bracers', tier: 'Common', how: 'Reach Level 5.', effect: 'Stronger wrists. Presses feel more stable.' },
  { id: 'wanderers-helm', name: "Wanderer's Helm", tier: 'Common', how: 'Reach Level 6.', effect: 'Clear focus. You remember your cues on every rep.' },
  { id: 'sturdy-pauldrons', name: 'Sturdy Pauldrons', tier: 'Common', how: 'Reach Level 7.', effect: 'Shoulders sit tall. Your posture holds through the day.' },
  { id: 'trail-leggings', name: 'Trail Leggings', tier: 'Common', how: 'Reach Level 8.', effect: 'Springy legs. Stairs feel shorter than they used to.' },
  { id: 'guardians-tabard', name: "Guardian's Tabard", tier: 'Common', how: 'Reach Level 9.', effect: 'A calm chest. Your breathing stays steady under load.' },
  { id: 'veterans-chestplate', name: "Veteran's Chestplate", tier: 'Common', how: 'Reach Level 10.', effect: 'A strong heart. You finish workouts with energy to spare.' },
  { id: 'peakforged-helm', name: 'Peakforged Helm', tier: 'Rare', set: 'Peakforged', how: 'Unlock Phase 4.', effect: 'Mountain focus. Heavy sets feel less scary.' },
  { id: 'peakforged-chestplate', name: 'Peakforged Chestplate', tier: 'Rare', set: 'Peakforged', how: 'Finish your first Phase 4 workout.', effect: 'A braced torso. Your heavy lifts stay tight and safe.' },
  { id: 'peakforged-greaves', name: 'Peakforged Greaves', tier: 'Rare', set: 'Peakforged', how: 'Finish 4 Phase 4 workouts.', effect: 'Strong legs. Your squat and deadlift keep climbing.' },
  { id: 'peakforged-gauntlets', name: 'Peakforged Gauntlets', tier: 'Rare', set: 'Peakforged', how: 'Set a PR in Phase 4.', effect: 'An iron grip. The bar stays put in your hands.' },
  { id: 'stormforged-helm', name: 'Stormforged Helm', tier: 'Legendary', set: 'Stormforged', how: 'Unlock Phase 5.', effect: 'Lightning focus. Fast reps stay clean and controlled.' },
  { id: 'stormforged-chestplate', name: 'Stormforged Chestplate', tier: 'Legendary', set: 'Stormforged', how: 'Finish your first Phase 5 workout.', effect: 'Storm-strong core. Explosive moves stay safe.' },
  { id: 'stormforged-greaves', name: 'Stormforged Greaves', tier: 'Legendary', set: 'Stormforged', how: 'Finish 4 Phase 5 workouts.', effect: 'Quick feet. You move fast and land steady.' },
  { id: 'stormforged-gauntlets', name: 'Stormforged Gauntlets', tier: 'Legendary', set: 'Stormforged', how: 'Set a PR in Phase 5.', effect: 'A thunder grip. Power moves feel sharp and strong.' },
  { id: 'blade-long-game', name: 'Blade of the Long Game', tier: 'Rare', set: 'Class weapon', how: 'Guardian weapon. Set 3 personal records.', effect: 'Patience made sharp. Your progress adds up, week after week.' },
  { id: 'bow-steady-steps', name: 'Bow of Steady Steps', tier: 'Rare', set: 'Class weapon', how: 'Ranger weapon. Beat your best balance hold.', effect: 'True aim. Your balance holds longer with every try.' },
  { id: 'staff-deep-rest', name: 'Staff of Deep Rest', tier: 'Rare', set: 'Class weapon', how: 'Spellweaver weapon. Check in 7 days in a row.', effect: 'Rest made powerful. Good sleep fuels your next workout.' },
  { id: 'trailwarden-cloak', name: 'Trailwarden Cloak', tier: 'Rare', how: 'Finish 3 workouts in a row.', effect: 'The road trusts you. Streaks feel easier to keep.' },
  { id: 'ember-shortblade', name: 'Ember Shortblade', tier: 'Rare', how: 'Set 3 personal records.', effect: 'A warm edge. Your best lifts burn a little brighter.' },
  { id: 'riverstep-boots', name: 'Riverstep Boots', tier: 'Rare', how: 'Hit 150 minutes of cardio in one week.', effect: 'Light feet. Long walks feel like nothing.' },
  { id: 'sunforged-chestplate', name: 'Sunforged Chestplate', tier: 'Legendary', how: 'Finish Phase 2.', effect: 'Morning light in your chest. You wake up ready to move.' },
  { id: 'stormcaller-longbow', name: 'Stormcaller Longbow', tier: 'Legendary', how: 'Defeat your first boss round.', effect: 'Thunder on your side. Boss rounds feel winnable.' },
  { id: 'gauntlets-many-wins', name: 'Gauntlets of Many Wins', tier: 'Legendary', how: 'Earn 8 badges.', effect: 'Hands that have done the work. Every win is written on them.' },
  { id: 'voidforged-greatblade', name: 'Voidforged Greatblade', tier: 'Mythical', how: 'Defeat your first 3 boss rounds.', effect: 'A blade that has seen every boss fall. Nothing on the road scares you now.' },
  { id: 'mantle-long-road', name: 'Mantle of the Long Road', tier: 'Mythical', how: 'Finish 25 workouts.', effect: 'The road is yours. Twenty-five workouts prove you show up.' },
  { id: 'circlet-full-journey', name: 'Circlet of the Full Journey', tier: 'Mythical', how: 'Unlock Phase 5.', effect: 'A crown for the whole journey. You earned every step of it.' },
  // Year gear: one new set per cycle after the first, plus three year
  // pieces. Legendary and Mythical pieces stay hidden until earned.
  { id: 'emberforged-helm', name: 'Emberforged Helm', tier: 'Rare', set: 'Emberforged', how: 'Defeat the Week 16 boss round.', effect: 'Warm focus. The Highlands feel less steep.' },
  { id: 'emberforged-chestplate', name: 'Emberforged Chestplate', tier: 'Rare', set: 'Emberforged', how: 'Finish Cycle 2: save the Week 24 retest.', effect: 'A strong chest. Getting stronger feels normal now.' },
  { id: 'emberforged-greaves', name: 'Emberforged Greaves', tier: 'Rare', set: 'Emberforged', how: 'Set 10 personal records.', effect: 'Legs that keep a record of every PR.' },
  { id: 'tideforged-helm', name: 'Tideforged Helm', tier: 'Rare', set: 'Tideforged', how: 'Defeat the Week 28 boss round.', effect: 'Clear head in the storm. Heavy sets stay steady.' },
  { id: 'tideforged-chestplate', name: 'Tideforged Chestplate', tier: 'Rare', set: 'Tideforged', how: 'Finish Cycle 3: save the Week 36 retest.', effect: 'Storm-steady. You hold your form when the work gets hard.' },
  { id: 'tideforged-greaves', name: 'Tideforged Greaves', tier: 'Rare', set: 'Tideforged', how: 'Finish 40 workouts.', effect: 'Forty workouts of miles in these legs.' },
  { id: 'summitforged-helm', name: 'Summitforged Helm', tier: 'Rare', set: 'Summitforged', how: 'Defeat the Week 40 boss round.', effect: 'Summit focus. The top is in sight.' },
  { id: 'summitforged-chestplate', name: 'Summitforged Chestplate', tier: 'Rare', set: 'Summitforged', how: 'Finish Cycle 4: save the Week 48 retest.', effect: 'A peak chest. A long stretch of training sits behind every rep.' },
  { id: 'summitforged-greaves', name: 'Summitforged Greaves', tier: 'Rare', set: 'Summitforged', how: 'Finish 50 workouts.', effect: 'Fifty workouts. The road is worn smooth under your feet.' },
  { id: 'crown-year', name: 'Crown of the Summit', tier: 'Mythical', how: 'Save a review retest.', effect: 'A crown for a long road, well walked.' },
  { id: 'cloak-year', name: 'Cloak of Twenty Wins', tier: 'Legendary', how: 'Earn 20 badges.', effect: 'Twenty wins sewn into one cloak.' },
  { id: 'boots-year', name: 'Boots of a Thousand Minutes', tier: 'Legendary', how: 'Log 2,000 minutes of cardio in total.', effect: 'Two thousand minutes of moving. Your heart knows the road.' },
  // Epic weapons: inspired by famous weapons from popular movies and
  // shows, renamed so nothing here uses a movie, show, or brand name.
  // Legendary and Mythical, so they stay hidden until earned.
  { id: 'epic-excalibur', name: 'Excalibur, Sword of the Stone', tier: 'Mythical', set: 'Epic weapons', how: 'Defeat 5 boss rounds.', effect: 'A sword pulled from stone. Boss rounds feel winnable, because you have done it five times.' },
  { id: 'epic-stormhammer', name: 'Stormhammer Mjolnir', tier: 'Legendary', set: 'Epic weapons', how: 'Set 5 personal records.', effect: 'Thunder in your hands. Your heavy lifts hit harder and steadier.' },
  { id: 'epic-starforged-blade', name: 'Starforged Blade', tier: 'Legendary', set: 'Epic weapons', how: 'Finish 15 workouts.', effect: 'A blade that hums with light. Fifteen workouts, and it is yours.' },
  { id: 'epic-windrunner-bow', name: 'Windrunner Bow', tier: 'Legendary', set: 'Epic weapons', how: 'Beat your best balance hold of 45 seconds.', effect: 'An arrow that finds its mark. Balance you can trust on one leg.' },
  { id: 'epic-starfall-staff', name: 'Starfall Staff', tier: 'Legendary', set: 'Epic weapons', how: 'Check in 14 days in a row.', effect: 'A glowing crystal orb at the end of a gnarled staff. Showing up every day is the real magic.' },
  { id: 'epic-vanguard-shield', name: 'Vanguard Shield', tier: 'Mythical', set: 'Epic weapons', how: 'Earn 12 badges.', effect: 'A shield that has seen twelve wins. Nothing gets through.' },
  { id: 'epic-truthbound-lasso', name: 'Truthbound Lasso', tier: 'Legendary', set: 'Epic weapons', how: 'Log sleep 30 times.', effect: 'A rope that only tells the truth: rest is part of training.' },
  { id: 'epic-shadowstep-dagger', name: 'Shadowstep Dagger', tier: 'Mythical', set: 'Epic weapons', how: 'Reach Level 12.', effect: 'Quick and quiet. Twelve levels of showing up, in one small blade.' },
  { id: 'epic-feral-claws', name: 'Feral Claws', tier: 'Mythical', set: 'Epic weapons', how: 'Defeat 3 boss rounds.', effect: 'Three sharp claws, quick and fierce. For the days you need to fight through.' },
  // Epic helmets: famous helmets, retold, same rule as the epic
  // weapons — no movie, show, or brand names anywhere, in UI or
  // code. Names must include "Helm" so armorKind() in equip.ts
  // reads them as helms (a "Crown of the ..." name would read as
  // a crown instead). Legendary and Mythical stay hidden until earned.
  { id: 'epic-helm-mountain-king', name: 'Helm of the Mountain King', tier: 'Mythical', set: 'Epic helmets', how: 'Defeat 6 boss rounds.', effect: 'A crown of stone and gold, worn by the king under the mountain. Six boss rounds bow to it.' },
  { id: 'epic-helm-horned-north', name: 'Horned Helm of the North', tier: 'Legendary', set: 'Epic helmets', how: 'Finish 20 workouts.', effect: 'Two curved horns, a cold wind at your back. Twenty workouts of northern grit.' },
  { id: 'epic-helm-dragonlord', name: 'Helm of the Dragonlord', tier: 'Legendary', set: 'Epic helmets', how: 'Reach Level 11.', effect: 'Scales and fire, tempered into steel. Eleven levels of showing up.' },
  { id: 'epic-helm-winged-swift', name: 'Winged Helm of the Swift', tier: 'Rare', set: 'Epic helmets', how: 'Beat your best balance hold of 60 seconds.', effect: 'Small wings at the temples. Sixty seconds on one leg, steady as a hawk.' },
  { id: 'epic-helm-first-light', name: 'Helm of the First Light', tier: 'Mythical', set: 'Epic helmets', how: 'Check in 30 days in a row.', effect: 'Dawn on polished steel. Thirty days of showing up, and the light is yours.' },
];

// ---------------------------------------------------------------- NUTRITION

export const NUTRITION: {
  protein: NutritionSection;
  carbs: NutritionSection;
  fats: NutritionSection;
  fiber: NutritionSection;
  supplements: NutritionSection;
} = {
  protein: {
    title: 'Protein',
    short: 'Protein builds and repairs muscle. Aim for 0.7 to 1 gram per pound of goal body weight each day.',
    detail:
      'Protein cannot be stored, so daily intake matters. Spread it across your meals instead of eating it all at once. A palm-sized portion at each meal gets most people close. Portions scale with size: bigger people need bigger portions.',
    sources: ['Chicken breast', 'Eggs', 'Greek yogurt', 'Cottage cheese', 'Tuna', 'Lean ground beef', 'Tofu', 'Lentils'],
  },
  carbs: {
    title: 'Carbs',
    short: 'Carbs are fuel for workouts and daily life. Choose whole, slow foods most of the time.',
    detail:
      'Carbs are not the enemy. They give your muscles energy to train and recover. Whole carbs with fiber keep you full longer than white bread and sweets. Eat more on training days, a little less on rest days, and stop when you feel satisfied, about 80 percent full.',
    sources: ['Oats', 'Brown rice', 'Sweet potatoes', 'Whole wheat bread', 'Beans', 'Fruit', 'Quinoa'],
  },
  fats: {
    title: 'Healthy Fats',
    short: 'Healthy fats do not make you fat. Excess calories do.',
    detail:
      'Fat helps your hormones, your brain, and your joints. A little healthy fat at meals helps you feel full and satisfied. What adds body fat is eating more total calories than you burn, over time, not fat by itself.',
    sources: ['Olive oil', 'Avocados', 'Nuts', 'Salmon', 'Seeds', 'Nut butter'],
  },
  fiber: {
    title: 'Fiber',
    short: 'Fiber keeps you full and keeps digestion steady. About 25 grams a day for women, about 38 grams a day for men.',
    detail:
      'Fiber is the quiet helper in weight loss. It slows digestion, steadies energy, and helps a smaller meal feel like enough. Add it slowly and drink water with it, or your stomach will complain.',
    sources: ['Oats', 'Beans', 'Lentils', 'Berries', 'Apples', 'Broccoli', 'Whole wheat bread', 'Chia seeds'],
  },
  supplements: {
    title: 'Supplements',
    short: 'Food first. A few basics can help, but none of them replace real meals or training.',
    detail:
      'Creatine (5 grams a day) supports strength and muscle. Fish oil supports joints and heart health. Magnesium glycinate can help sleep. Protein powder is useful when a meal is short on protein. None of these are required, and none of them burn fat on their own.',
    sources: ['Creatine monohydrate', 'Fish oil', 'Magnesium glycinate', 'Whey or plant protein powder'],
  },
};

// ---------------------------------------------------------------------- FAQS

export const FAQS: Faq[] = [
  {
    q: 'How many rest days do I need between strength days?',
    a: 'Take 1 to 2 rest days between strength days. The gym gives the stimulus, recovery builds on it. Rest days can still include an easy walk.',
  },
  {
    q: 'How much protein should I eat?',
    a: 'Aim for 0.7 to 1 gram of protein per pound of goal body weight each day. Spread it across your meals. Protein cannot be stored, so daily intake matters.',
  },
  {
    q: 'What do I do if a move hurts?',
    a: 'Stop the move. Sharp, new, or worsening pain is a sign to see a doctor or physical therapist. Derek cannot fix, treat, diagnose, or cure pain. Try the regression or swap instead, and tell Derek what happened.',
  },
  {
    q: 'What if I miss a workout?',
    a: 'Nothing bad happens. Do the next workout when you can, and keep going. One missed session never ruins a week. If you miss a whole week, start again with the current week, not from the beginning.',
  },
  {
    q: 'Do I have to count calories?',
    a: 'No. The app does not count calories by default. Eat whole foods, stop when you feel satisfied at about 80 percent full, and hit your protein target. A rough calorie estimate is available only if Derek turns it on for you, and it is a starting guess to adjust as you progress or regress.',
  },
  {
    q: 'Do I have to film myself for the assessment?',
    a: 'No. Filming is optional, and there is always a Skip button that never blocks you from finishing. Videos help Derek see your form, but the assessment works fine without them.',
  },
  {
    q: 'How do check-ins work?',
    a: 'Your daily check-in is in the app. You complete your tasks in the app, then log how it went. You can also pick live video calls with Derek: 30 minutes each, at most once a week, 1, 2, 3, or 4 a month. You request times in the app, Derek confirms the time and sends the call link. The app itself does not do the video call.',
  },
  {
    q: 'How fast does Derek reply to check-ins?',
    a: 'Within one business day. If you check in on a weekend, expect a reply by the next business day.',
  },
];

// ---------------------------------------------------------------- GOAL TYPES

export const GOAL_TYPES: GoalTypeInfo[] = [
  { id: 'weight-loss', label: 'Lose weight', measures: 'Body weight, waist measurement, and how your clothes fit.', nextMilestone: 'Lose your first 5 pounds.' },
  { id: 'stronger', label: 'Get stronger', measures: 'Your best lifts and how many reps you can do.', nextMilestone: 'Set your first personal record.' },
  { id: 'move-better', label: 'Move better', measures: 'Your assessment findings and how daily moves feel.', nextMilestone: 'Clear your first assessment finding.' },
  { id: 'balance', label: 'Improve balance', measures: 'Your one-leg balance hold in seconds, left and right.', nextMilestone: 'Hold 30 seconds on each leg.' },
  { id: 'cardio', label: 'Improve cardio', measures: 'Minutes of Zone 2 cardio per week.', nextMilestone: 'Hit 150 minutes in one week.' },
  { id: 'endurance', label: 'Build endurance', measures: 'How long you can walk, hike, or ride without stopping.', nextMilestone: 'Walk 30 minutes without a break.' },
  { id: 'consistency', label: 'Stay consistent', measures: 'Workouts finished per week and check-in streaks.', nextMilestone: 'Finish 3 workouts in one week.' },
  { id: 'sleep', label: 'Sleep and recover better', measures: 'Sleep hours and morning energy on check-ins.', nextMilestone: 'Sleep 7 hours, 5 nights in a row.' },
  { id: 'eat-better', label: 'Eat better', measures: 'Protein at most meals, whole foods most of the time, and eating until satisfied.', nextMilestone: 'Eat protein at most meals for a full week.' },
  { id: 'own-words', label: 'Something else, in my own words', measures: 'Whatever you write down, tracked your way.', nextMilestone: 'Write your goal and pick your first small step.' },
];

// Goal finisher: a small optional add-on at the end of a workout, tied to
// the client's main goal. Only on a workout day, only after the last move,
// +5 XP, once per workout. It never moves the phase, the corrective order,
// or the rest between strength days. Own-words goals have no finisher.
export const GOAL_FINISHERS: Record<string, { name: string; text: string }> = {
  'weight-loss': { name: 'Walk it off', text: '5-minute easy walk after the workout.' },
  stronger: { name: 'Slow finish', text: 'One slow set of 5 bodyweight squats, easy pace.' },
  'move-better': { name: 'Long stretch', text: '2 minutes stretching the tightest area from your warm-up.' },
  balance: { name: 'Steady finish', text: '1-minute single-leg hold each side. Hold a chair if you need it.' },
  cardio: { name: 'Easy walk', text: '5-minute easy walk after the workout.' },
  endurance: { name: 'Easy walk', text: '5-minute easy walk after the workout.' },
  consistency: { name: 'Plan tomorrow', text: 'Write down tomorrow’s workout time before you leave.' },
  sleep: { name: 'Slow breathing', text: '2 minutes of slow breathing, in through the nose, out slow.' },
  'eat-better': { name: 'Plan protein', text: 'Drink a glass of water and plan tomorrow’s protein.' },
};

// ------------------------------------------------------------------- PRICING

export const PRICES: PriceOption[] = [
  { label: 'Monthly', price: 150, note: 'per month' },
  { label: '3 months prepaid', price: 420, note: 'Save $30 over monthly' },
  { label: '6 months prepaid', price: 810, note: 'Save $90 over monthly' },
  { label: '12 months prepaid', price: 1530, note: 'Save $270 over monthly' },
  { label: 'Household, each', price: 135, note: 'per month, per person, same household' },
];

export const TRIAL_DAYS = 14;
export const BETA_CODE = 'ACTIVEBETA';
export const BETA_USES = 25;
export const BETA_EXPIRES = '2027-02-19';

// ---------------------------------------------------------------------- HIIT

export const HIIT: { examples: string[]; precautions: string[] } = {
  examples: [
    'Bike intervals: 30 seconds hard, 90 seconds easy, repeat 6 to 8 times.',
    'Hill or incline walk: 1 minute brisk uphill, 2 minutes easy, repeat 5 to 6 times.',
    'Rower intervals: 30 seconds hard, 90 seconds easy, repeat 6 to 8 times.',
    'Elliptical intervals: 1 minute hard, 2 minutes easy, repeat 5 to 6 times.',
    'Pool intervals: 1 length fast, 1 length easy, repeat 6 to 8 times.',
    'Talk test: during the hard part you should only manage a few words. During the easy part you should be able to talk in full sentences.',
  ],
  precautions: [
    'Always warm up for 5 minutes and cool down for 5 minutes.',
    'Do high intensity work 1 to 2 times a week at most.',
    'Stop and rest if you feel chest pain, dizziness, or unusual shortness of breath.',
    'Check with your doctor first if you have a heart condition or high blood pressure.',
    'Start with low-impact options like the bike, pool, or incline walk.',
    'If a move hurts your joints, swap to a joint-friendly option or back to Zone 2 cardio.',
  ],
};

// -------------------------------------------------------------------- WEEK 13

export const WEEK13: { title: string; text: string; options: string[] } = {
  title: 'Week 13: Keep Going',
  text: 'You finished 12 weeks. Nothing resets. Your retest shows what changed, and the phases cycle back to 1, 2, or 3 based on your retest findings and your new goal. Pick what comes next.',
  options: [
    'Pick a new goal and keep training.',
    'Ask Derek for your next plan.',
    'Retest and cycle back to Phase 1, 2, or 3.',
  ],
};

// ------------------------------------------------------- ASSESSMENT QUESTIONS

export const ASSESSMENT_QUESTIONS: { questions: string[]; parq: string[] } = {
  questions: [
    'What is your main goal for the next 12 weeks?',
    'What is your health and training history?',
    'How much training experience do you have, and what have you done before?',
    'Do you have any aches, pains, or old injuries I should know about?',
    'Do you have any health flags, like high blood pressure, diabetes, or a heart condition?',
    'What equipment do you have at home or at the gym?',
    'What space do you have to train in?',
    'How much time can you train each week, and on which days?',
  ],
  parq: [
    'Has your doctor ever said you have a heart condition and should only do physical activity your doctor recommends?',
    'Do you feel pain in your chest when you do physical activity?',
    'In the past month, have you had chest pain when you were not doing physical activity?',
    'Do you lose your balance because of dizziness, or have you ever lost consciousness?',
    'Do you have a bone or joint problem that could be made worse by a change in your physical activity?',
    'Is your doctor currently prescribing drugs for your blood pressure or heart condition?',
    'Do you have high blood pressure?',
    'Do you have diabetes?',
    'Are you pregnant, or could you be pregnant?',
    'Have you had a recent injury or surgery?',
    'Do you know of any other reason you should not do physical activity?',
  ],
};

// ------------------------------------------- ASSESSMENT EXAMPLE DEMOS
// Text demos for each assessment move. There is no playable example video
// Assessment example videos. These are Derek's own clips from the posts he
// filmed: overhead squat, single-leg squat, postural assessment, and balance
// hold. The shoulder-check clip is NOT used here, it is not an assessment.
// The front-view squat clip is NOT used for the overhead squat, it shows
// arms crossed over the chest, not arms overhead.

export interface AssessmentExample {
  id: string;
  title: string;
  whatToDo: string[];
  goodForm: string;
  videoUrl: string;
}

export const ASSESSMENT_EXAMPLES: AssessmentExample[] = [
  {
    id: 'overhead-squat',
    title: 'Overhead squat',
    whatToDo: [
      'Stand with feet about shoulder width apart, toes pointing slightly out.',
      'Raise both arms straight overhead, elbows soft, palms facing each other.',
      'Sit back and down like you are sitting into a chair. Lower slowly for 3 to 4 seconds.',
      'Go as low as you can with your heels down and your chest up, then stand back up.',
    ],
    goodForm: 'Good form looks like heels staying down, knees tracking over toes, arms staying up, and a slow lowering.',
    videoUrl: '/videos/overhead-squat.mp4',
  },
  {
    id: 'single-leg-squat',
    title: 'Single-leg squat',
    whatToDo: [
      'Stand near something stable you can touch if you wobble.',
      'Lift one foot just off the floor and hold your arms out in front of you.',
      'Bend the standing knee a little and sit back. Lower slowly for 3 to 4 seconds.',
      'Come back up the same way. Do one side, then the other.',
    ],
    goodForm: 'Good form looks like the standing knee tracking over the toes, hips level, and a slow, controlled lowering.',
    videoUrl: '/videos/single-leg-squat.mp4',
  },
  {
    id: 'postural-assessment',
    title: 'Postural assessment',
    whatToDo: [
      'Stand tall and relaxed, arms at your sides, feet about shoulder width apart.',
      'Look straight ahead and breathe normally. Do not pose or pull yourself up.',
      'Derek looks at your head, shoulders, hips, knees, and feet from the front, side, and back.',
      'Note anything that looks uneven, like one shoulder higher than the other.',
    ],
    goodForm: 'Good posture looks like head over shoulders, shoulders over hips, and weight even on both feet.',
    videoUrl: '/videos/postural.mp4',
  },
  {
    id: 'balance-baseline',
    title: 'Balance baseline',
    whatToDo: [
      'Stand near something stable, like a chair or a wall.',
      'Lift one foot just off the floor and hold still.',
      'Count the seconds until you put your foot down or wobble too much to hold it.',
      'Do one side, then the other. Stop if you feel unsteady.',
    ],
    goodForm: 'Good balance looks like standing still, hips level, and arms relaxed at your sides.',
    videoUrl: '/videos/balance.mp4',
  },
];

// ----------------------------------------------------------- PHASE RECOMMENDER

export function recommendPhase(
  findingsCount: number,
  experience: 'new' | 'some' | 'regular',
  yearsTraining: 'under1' | '1to3' | 'over3',
  forms: { squatForm: FormRating; hingeForm: FormRating; benchForm: FormRating },
): { phase: 1 | 2 | 3; reason: string } {
  const allGood =
    forms.squatForm === 'good' && forms.hingeForm === 'good' && forms.benchForm === 'good';

  if (findingsCount > 0) {
    return {
      phase: 1,
      reason:
        'Your assessment found movement patterns to clean up first, so you start in Phase 1. Slow, controlled work builds the base that heavier phases need.',
    };
  }
  if (experience === 'new') {
    return {
      phase: 1,
      reason:
        'You are new to training, so you start in Phase 1. Slow, controlled work teaches good form before any heavier lifting.',
    };
  }
  if (experience === 'regular' && yearsTraining === 'over3' && allGood) {
    return {
      phase: 3,
      reason:
        'Your screen was clean, you train regularly with a long stretch of training behind you, and your form looked good on all three lifts. You start in Phase 3.',
    };
  }
  return {
    phase: 2,
    reason:
      'Your screen was clean and you have some training experience, so you start in Phase 2. It builds on what you already know with heavier, controlled work.',
  };
}
