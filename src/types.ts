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
  | 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'custom'
export type Units = 'kg' | 'lb'
export type Theme = 'auto' | 'light' | 'dark'

export interface Exercise {
  id: string
  name: string
  muscle: Muscle
  secondary: Muscle[]
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

export interface CustomWorkout {
  id: string
  name: string
  exerciseIds: string[]
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
  title?: string
  planDay?: number
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
  title?: string
  targetDays?: number
  planDay?: number
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
  customWorkouts?: CustomWorkout[]
  planMode?: 'default' | 'custom'
  planDays?: string[]
  me?: { id: string; name: string }
  friends?: Friend[]
}

// A snapshot a friend sent in a link. It only changes when they send a new one.
export interface Friend {
  id: string
  name: string
  goal: Goal
  daysPerWeek: number
  units: Units
  sentAt: string
  streak: number
  thisWeek: number
  total: number
  bests: { exerciseId: string; weight: number; reps: number }[]
  recent: { name: string; at: string }[]
}
