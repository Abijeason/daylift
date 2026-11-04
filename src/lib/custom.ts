import { exercises as library } from '../data'
import { minutesPerExercise, prescription, WARMUP_MINUTES, WORKOUT_NAMES } from './rules'
import type { CustomWorkout, Exercise, PlannedWorkout, Profile, WorkoutLog, WorkoutType } from '../types'

const MAX_NAME = 60
const MAX_EXERCISES = 30
const known = new Set(library.map(e => e.id))

export const workoutName = (w: { type: WorkoutType; title?: string }): string =>
  w.type === 'custom' && w.title ? w.title : WORKOUT_NAMES[w.type]

// Custom workouts sit alongside the plan, so only plan workouts move the rotation on.
export const planCount = (history: WorkoutLog[]): number => history.filter(l => l.type !== 'custom').length

// The person picks the exercises; their own goal and level decide sets, reps and rest.
export function buildCustom(profile: Profile, workout: CustomWorkout, all: Exercise[]): PlannedWorkout {
  const p = prescription(profile.goal, profile.level)
  const chosen = workout.exerciseIds.flatMap(id => all.filter(e => e.id === id))
  const estMinutes = Math.round(WARMUP_MINUTES + p.cardioMin + chosen.length * minutesPerExercise(p))
  return { type: 'custom', title: workout.name, prescription: p, exercises: chosen, estMinutes }
}

// The link carries only a name and exercise ids, so nothing personal leaves the phone.
export function encodeShare(workout: Pick<CustomWorkout, 'name' | 'exerciseIds'>): string {
  const bytes = new TextEncoder().encode(JSON.stringify({ n: workout.name, e: workout.exerciseIds }))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeShare(code: string): { name: string; exerciseIds: string[] } | null {
  try {
    const binary = atob(code.replace(/-/g, '+').replace(/_/g, '/'))
    const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0))))
    const name = typeof data?.n === 'string' ? data.n.trim() : ''
    if (!name || name.length > MAX_NAME || !Array.isArray(data.e) || data.e.length > MAX_EXERCISES) return null
    const exerciseIds = data.e.filter((id: unknown): id is string => typeof id === 'string' && known.has(id))
    return exerciseIds.length ? { name, exerciseIds } : null
  } catch {
    return null
  }
}

export const shareLink = (workout: Pick<CustomWorkout, 'name' | 'exerciseIds'>, base: string): string =>
  `${base}#workout=${encodeShare(workout)}`

export const LIMITS = { name: MAX_NAME, exercises: MAX_EXERCISES }
