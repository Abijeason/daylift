import { exerciseCount, LEVELS, minutesPerExercise, prescription, WARMUP_MINUTES, workoutMinutes } from './rules'
import { EQUIPMENT } from '../types'
import type { Equipment, Exercise, Muscle, PlannedWorkout, Profile, WorkoutLog, WorkoutType } from '../types'

export const PRESETS: Record<'full' | 'basic' | 'dumbbells', Equipment[]> = {
  full: [...EQUIPMENT],
  basic: ['dumbbells', 'bench', 'cable', 'latPulldown', 'legPress', 'cardioMachine'],
  dumbbells: ['dumbbells'],
}

const lowerSlots: Muscle[] = ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'quadriceps', 'hamstrings', 'glutes']
const upperSlots: Muscle[] = ['chest', 'lats', 'shoulders', 'middle back', 'biceps', 'triceps', 'abdominals', 'traps']

const SLOTS: Record<WorkoutType, Muscle[]> = {
  fullA: ['quadriceps', 'chest', 'lats', 'shoulders', 'hamstrings', 'abdominals', 'biceps', 'triceps'],
  fullB: ['hamstrings', 'shoulders', 'middle back', 'quadriceps', 'chest', 'abdominals', 'triceps', 'biceps'],
  fullC: ['glutes', 'chest', 'lats', 'quadriceps', 'shoulders', 'abdominals', 'biceps', 'triceps'],
  upperA: upperSlots,
  upperB: ['shoulders', 'middle back', 'chest', 'lats', 'triceps', 'biceps', 'abdominals', 'traps'],
  upper: upperSlots,
  lowerA: lowerSlots,
  lowerB: ['hamstrings', 'quadriceps', 'glutes', 'calves', 'abdominals', 'hamstrings', 'quadriceps', 'glutes'],
  lower: lowerSlots,
  push: ['chest', 'shoulders', 'triceps', 'chest', 'shoulders', 'triceps', 'abdominals', 'chest'],
  pull: ['lats', 'middle back', 'biceps', 'shoulders', 'traps', 'lats', 'biceps', 'abdominals'],
  legs: ['quadriceps', 'glutes', 'hamstrings', 'calves', 'abdominals', 'quadriceps', 'hamstrings', 'glutes'],
}

const VARIANT: Partial<Record<WorkoutType, number>> = { fullB: 1, fullC: 2, upperB: 1, lowerB: 1, upper: 2, lower: 2 }

const ROTATIONS: Record<number, WorkoutType[]> = {
  2: ['fullA', 'fullB'],
  3: ['fullA', 'fullB', 'fullC'],
  4: ['upperA', 'lowerA', 'upperB', 'lowerB'],
  5: ['push', 'pull', 'legs', 'upper', 'lower'],
}

export const rotation = (daysPerWeek: number): WorkoutType[] => ROTATIONS[daysPerWeek]

function candidates(profile: Profile, all: Exercise[]): Exercise[] {
  const usable = all.filter(e =>
    !e.needs.includes('cardioMachine')
    && e.needs.every(n => profile.equipment.includes(n))
    && LEVELS[profile.level].allowed.includes(e.level))
  // Equipment moves come first, so bodyweight moves are the fallback at a full gym.
  return [...usable.filter(e => !e.bodyweight), ...usable.filter(e => e.bodyweight)]
}

export function buildWorkout(profile: Profile, type: WorkoutType, all: Exercise[]): PlannedWorkout {
  const p = prescription(profile.goal, profile.level)
  const count = exerciseCount(p, workoutMinutes(profile))
  const pool = candidates(profile, all)
  const variant = VARIANT[type] ?? 0
  const chosen: Exercise[] = []

  for (const muscle of SLOTS[type]) {
    if (chosen.length === count) break
    const options = pool.filter(e => e.muscle === muscle && !chosen.includes(e))
    if (options.length > 0) chosen.push(options[variant % options.length])
  }
  // Very small gyms can miss whole muscles, so any usable exercise keeps the workout worthwhile.
  for (const e of pool) {
    if (chosen.length >= 3) break
    if (!chosen.includes(e)) chosen.push(e)
  }

  const estMinutes = Math.round(WARMUP_MINUTES + p.cardioMin + chosen.length * minutesPerExercise(p))
  return { type, prescription: p, exercises: chosen, estMinutes }
}

export function nextWorkout(profile: Profile, history: WorkoutLog[], all: Exercise[]): PlannedWorkout {
  const order = rotation(profile.daysPerWeek)
  return buildWorkout(profile, order[history.length % order.length], all)
}

export function swapOptions(profile: Profile, current: Exercise, plan: PlannedWorkout, all: Exercise[]): Exercise[] {
  const planned = plan.exercises.map(e => e.id)
  return candidates(profile, all).filter(e => e.muscle === current.muscle && !planned.includes(e.id))
}
