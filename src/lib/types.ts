// Active Life Quest content/data layer types.
// Plain TypeScript only. No React imports. No em-dashes in user-facing copy.

export type ClassId = 'Guardian' | 'Ranger' | 'Spellweaver';

export interface Guardian {
  name: string;
  classId: ClassId;
  color: string;
  gem: string;
  cape: string;
}

export type FindingId =
  | 'feet-turn-out'
  | 'heel-rise'
  | 'overpronation'
  | 'knee-dominance'
  | 'knee-valgus'
  | 'knee-varus'
  | 'asymmetric-weight-shift'
  | 'excessive-anterior-pelvic-tilt'
  | 'excessive-forward-trunk-lean'
  | 'excessive-posterior-pelvic-tilt'
  | 'arms-fall-forward'
  | 'scapular-winging'
  | 'shoulder-elevation-forward-head'
  | 'shoulder-elevation-no-forward-head'
  | 'elbow-flexion'
  | 'non-neutral-wrist'
  | 'forward-head-posture';

export type FormRating = 'good' | 'ok' | 'poor';

export interface AssessmentResult {
  findings: FindingId[];
  balanceLeftSec: number;
  balanceRightSec: number;
  experience: 'new' | 'some' | 'regular';
  yearsTraining: 'under1' | '1to3' | 'over3';
  squatForm: FormRating;
  hingeForm: FormRating;
  benchForm: FormRating;
  startingPhase: 1 | 2 | 3;
  recommendedPhase: 1 | 2 | 3;
  reason: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  tempo?: string;
  howTo: string[];
  regression: string;
  swap?: string;
  videoLabel?: string;
  videoUrl?: string;
  demoUrl?: string;
}

export interface Workout {
  id: string;
  title: string;
  phase: number;
  day: string;
  minutes: number;
  exercises: Exercise[];
  note?: string;
}

export interface CesTemplate {
  id: FindingId;
  name: string;
  plainName: string;
  inhibit: string;
  lengthen: string;
  activation: string;
  integration: string;
  progression: string[];
}

export interface Monster {
  id: string;
  name: string;
  land: string;
  castle: string;
  weeks: string;
  bossRound: string;
  blurb: string;
}

export interface Creature {
  id: string;
  name: string;
  kind: string;
  place: string;
  line: string;
  meetWeek: number;
  effect: string;
}

export interface Badge {
  id: string;
  name: string;
  how: string;
}

export type ArmorTier = 'Common' | 'Rare' | 'Legendary' | 'Mythical';

export interface ArmorPiece {
  id: string;
  name: string;
  tier: ArmorTier;
  how: string;
  effect: string;
  /** Optional set label, used for the Peakforged (Phase 4), Stormforged (Phase 5) and class weapon sets, plus the year sets Emberforged (Cycle 2), Tideforged (Cycle 3) and Summitforged (Cycle 4). */
  set?: 'Peakforged' | 'Stormforged' | 'Class weapon' | 'Emberforged' | 'Tideforged' | 'Summitforged' | 'Epic weapons';
}

export interface Spell {
  id: string;
  name: string;
  classId: ClassId | 'any';
  cost: number;
  damage: number;
  blurb: string;
}

export type GoalType =
  | 'weight-loss'
  | 'stronger'
  | 'move-better'
  | 'balance'
  | 'cardio'
  | 'endurance'
  | 'consistency'
  | 'sleep'
  | 'eat-better'
  | 'own-words';

export interface Faq {
  q: string;
  a: string;
}

export interface Checkin {
  id: string;
  date: string;
  energy: number;
  sleepHours: number;
  soreness: number;
  note: string;
}

export interface NutritionSection {
  title: string;
  short: string;
  detail: string;
  sources: string[];
}

export interface PhaseInfo {
  phase: number;
  name: string;
  weeks: string;
  reps: string;
  sets: string;
  rest: string;
  description: string;
  why: string;
}

export interface Contraindication {
  flag: string;
  appliesTo: string;
  action: string;
}

export interface ClassInfo {
  id: ClassId;
  name: string;
  description: string;
  spells: string[];
}

export interface PriceOption {
  label: string;
  price: number;
  note?: string;
}

export interface GoalTypeInfo {
  id: GoalType;
  label: string;
  measures: string;
  nextMilestone: string;
}
