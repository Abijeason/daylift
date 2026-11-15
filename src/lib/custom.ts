import { exercises as library } from '../data'
import { minutesPerExercise, prescription, WARMUP_MINUTES, WORKOUT_NAMES } from './rules'
import type { CustomWorkout, Exercise, PlannedWorkout, Profile, SavedData, WorkoutLog, WorkoutType } from '../types'

const MAX_NAME = 60
const MAX_EXERCISES = 30
const MAX_DAYS = 7
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

// Links carry JSON as base64url, so they survive chat apps.
export function toCode(data: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(data))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromCode(code: string): unknown {
  try {
    const binary = atob(code.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0))))
  } catch {
    return null
  }
}

// Anyone can write a link, so everything in it is checked before it is used.
function toWorkout(data: unknown): { name: string; exerciseIds: string[] } | null {
  const d = data as { n?: unknown; e?: unknown } | null
  const name = typeof d?.n === 'string' ? d.n.trim() : ''
  if (!name || name.length > MAX_NAME || !Array.isArray(d!.e) || d!.e.length > MAX_EXERCISES) return null
  const exerciseIds = d!.e.filter((id: unknown): id is string => typeof id === 'string' && known.has(id))
  return exerciseIds.length ? { name, exerciseIds } : null
}

// The link carries only a name and exercise ids, so nothing personal leaves the phone.
export const encodeShare = (w: Pick<CustomWorkout, 'name' | 'exerciseIds'>): string => toCode({ n: w.name, e: w.exerciseIds })

export const decodeShare = (code: string) => toWorkout(fromCode(code))

// The plan the person picked themselves, in order. Empty means Daylift picks.
export const myPlan = (d: SavedData): CustomWorkout[] =>
  d.planMode === 'custom' ? (d.planDays ?? []).flatMap(id => (d.customWorkouts ?? []).filter(w => w.id === id)) : []

// Days follow in order from the last plan day done, so a missed day waits for the next session.
export function nextPlanDay(days: number, history: WorkoutLog[]): number {
  const last = history.findLast(l => l.planDay !== undefined)
  return last ? (last.planDay! + 1) % days : 0
}

export function encodePlan(days: CustomWorkout[]): string {
  const unique = days.filter((w, i) => days.indexOf(w) === i)
  return toCode({ w: unique.map(w => ({ n: w.name, e: w.exerciseIds })), d: days.map(w => unique.indexOf(w)) })
}

export function decodePlan(code: string): { workouts: { name: string; exerciseIds: string[] }[]; days: number[] } | null {
  const data = fromCode(code) as { w?: unknown; d?: unknown } | null
  if (!Array.isArray(data?.w) || !Array.isArray(data.d) || data.w.length > MAX_DAYS || data.d.length > MAX_DAYS) return null
  const workouts = data.w.map(toWorkout)
  const days = data.d
  if (!workouts.length || workouts.some(w => !w) || !days.length) return null
  if (!days.every((i: unknown) => Number.isInteger(i) && (i as number) >= 0 && (i as number) < workouts.length)) return null
  return { workouts: workouts as { name: string; exerciseIds: string[] }[], days: days as number[] }
}

export const shareLink = (workout: Pick<CustomWorkout, 'name' | 'exerciseIds'>, base: string): string =>
  `${base}#workout=${encodeShare(workout)}`

export const LIMITS = { name: MAX_NAME, exercises: MAX_EXERCISES, days: MAX_DAYS }

export const appLink = (): string => window.location.origin + import.meta.env.BASE_URL

// The share sheet on phones; a copied link on computers.
export async function shareOrCopy(title: string, text: string, url: string): Promise<'shared' | 'copied' | null> {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url })
      return 'shared'
    }
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    // Closing the share sheet is not an error worth showing.
    return null
  }
}
