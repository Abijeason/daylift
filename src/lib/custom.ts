import { exercises as library } from '../data'
import { minutesPerExercise, prescription, WARMUP_MINUTES, WORKOUT_NAMES } from './rules'
import type { CustomWorkout, Exercise, PlannedWorkout, Profile, SavedData, WorkoutLog, WorkoutType } from '../types'

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

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const SHORT_DAYS = WEEKDAYS.map(d => d.slice(0, 3))
export const weekdayIndex = (d: Date): number => (d.getDay() + 6) % 7
export const emptyWeek = (): (string | null)[] => Array(7).fill(null)

// The week the person picked, Monday first. Null while Daylift picks or no day has a workout yet.
export function myWeek(d: SavedData): (CustomWorkout | null)[] | null {
  if (d.planMode !== 'custom' || !d.planWeek) return null
  const week = d.planWeek.map(id => (d.customWorkouts ?? []).find(w => w.id === id) ?? null)
  return week.some(Boolean) ? week : null
}

export const trainingDays = (week: (CustomWorkout | null)[]): number => week.filter(Boolean).length

// The next workout days from today, soonest first. Today counts only if it hasn't been trained yet.
export function upcomingDays(week: (CustomWorkout | null)[], now: Date, trainedToday: boolean): { day: number; offset: number; workout: CustomWorkout }[] {
  const today = weekdayIndex(now)
  const list: { day: number; offset: number; workout: CustomWorkout }[] = []
  for (let offset = trainedToday ? 1 : 0; offset <= 7; offset++) {
    const day = (today + offset) % 7
    const workout = week[day]
    if (workout) list.push({ day, offset, workout })
  }
  return list
}

// Plan workouts no day uses any more are removed, so nothing hidden piles up.
export function prunePlan(d: SavedData): SavedData {
  const used = new Set(d.planWeek ?? [])
  return { ...d, customWorkouts: (d.customWorkouts ?? []).filter(w => !w.plan || used.has(w.id)) }
}

export function encodePlan(week: (CustomWorkout | null)[]): string {
  const unique = week.filter((w, i): w is CustomWorkout => !!w && week.indexOf(w) === i)
  return toCode({ w: unique.map(w => ({ n: w.name, e: w.exerciseIds })), d: week.map(w => (w ? unique.indexOf(w) : -1)) })
}

export function decodePlan(code: string): { workouts: { name: string; exerciseIds: string[] }[]; week: number[] } | null {
  const data = fromCode(code) as { w?: unknown; d?: unknown } | null
  if (!Array.isArray(data?.w) || !Array.isArray(data.d) || data.w.length > 7 || data.d.length !== 7) return null
  const workouts = data.w.map(toWorkout)
  if (!workouts.length || workouts.some(w => !w)) return null
  const week = data.d
  if (!week.every((i: unknown) => Number.isInteger(i) && (i as number) >= -1 && (i as number) < workouts.length)) return null
  if (!week.some((i: number) => i >= 0)) return null
  return { workouts: workouts as { name: string; exerciseIds: string[] }[], week: week as number[] }
}

export const shareLink = (workout: Pick<CustomWorkout, 'name' | 'exerciseIds'>, base: string): string =>
  `${base}#workout=${encodeShare(workout)}`

export const LIMITS = { name: MAX_NAME, exercises: MAX_EXERCISES }

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

// The weekly goal for streaks: training days in my week, or the days set up in Setup.
export function weeklyTarget(d: SavedData): number {
  const week = myWeek(d)
  return week ? trainingDays(week) : d.profile!.daysPerWeek
}
