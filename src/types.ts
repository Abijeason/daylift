export const MUSCLES = [
  'abdominals', 'abductors', 'adductors', 'biceps', 'calves', 'chest', 'forearms', 'glutes', 'hamstrings',
  'lats', 'lower back', 'middle back', 'neck', 'quadriceps', 'shoulders', 'traps', 'triceps',
] as const
export const EQUIPMENT = [
  'dumbbells', 'barbellRack', 'bench', 'cable', 'latPulldown', 'seatedRow', 'chestPress', 'shoulderPress',
  'legPress', 'legExtension', 'legCurl', 'pullUpBar', 'kettlebells', 'bands', 'cardioMachine',
] as const

export type Muscle = (typeof MUSCLES)[number]
export type Equipment = (typeof EQUIPMENT)[number]
export type Goal = 'fitLean' | 'buildMuscle' | 'getStronger' | 'loseWeight' | 'toneUp' | 'buildStamina' | 'stayActive'
export type Level = 'brandNew' | 'beginner' | 'intermediate' | 'advanced'
export type WorkoutType =
  | 'fullA' | 'fullB' | 'fullC' | 'upperA' | 'upperB' | 'lowerA' | 'lowerB'
  | 'push' | 'pull' | 'legs' | 'upper' | 'lower'
export type Units = 'kg' | 'lb'
export type Theme = 'auto' | 'light' | 'dark'

export interface Exercise {
  id: string
  name: string
  muscle: Muscle
  level: 'beginner' | 'intermediate' | 'expert'
  needs: Equipment[]
  region: 'upper' | 'lower'
  bodyweight: boolean
  timed?: boolean
  images: string[]
  videoUrl: string | null
  steps: string[]
  mistakes: string[]
  easierIds: string[]
}

export interface Profile {
  goal: Goal
  level: Level
  daysPerWeek: number
  length: 'short' | 'standard'
  equipment: Equipment[]
  units: Units
}

export interface Prescription {
  sets: number
  repMin: number
  repMax: number
  restSec: number
  cardioMin: number
}

export interface PlannedWorkout {
  type: WorkoutType
  prescription: Prescription
  exercises: Exercise[]
  estMinutes: number
}

export interface LoggedSet {
  weight: number
  reps: number
}

export interface LoggedExercise {
  exerciseId: string
  name: string
  region: 'upper' | 'lower'
  targetSets: number
  repMax: number
  sets: LoggedSet[]
}

export interface WorkoutLog {
  id: string
  type: WorkoutType
  units: Units
  targetDays?: number
  startedAt: string
  finishedAt: string
  entries: LoggedExercise[]
}

export interface InProgress {
  log: WorkoutLog
  plan: PlannedWorkout
  exerciseIndex: number
  restEndsAt: number | null
}

export interface SavedData {
  version: 1
  profile: Profile | null
  history: WorkoutLog[]
  inProgress: InProgress | null
  timerNoteSeen?: boolean
  theme?: Theme
}
