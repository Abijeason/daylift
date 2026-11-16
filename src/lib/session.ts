import type { Exercise, InProgress, LoggedExercise, LoggedSet, PlannedWorkout, Units, WorkoutLog } from '../types'

export const secondsLeft = (endsAt: number | null, now: number): number =>
  endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / 1000))

const toEntry = (e: Exercise, plan: PlannedWorkout): LoggedExercise => ({
  exerciseId: e.id,
  name: e.name,
  region: e.region,
  targetSets: plan.prescription.sets,
  repMax: plan.prescription.repMax,
  sets: [],
})

// exerciseIndex -1 is the warm-up. An index past the last exercise is the cardio finisher.
export function newSession(plan: PlannedWorkout, units: Units, now: Date, targetDays?: number): InProgress {
  const at = now.toISOString()
  return {
    plan,
    exerciseIndex: -1,
    restEndsAt: null,
    log: { id: at, type: plan.type, title: plan.title, units, targetDays, startedAt: at, finishedAt: at, entries: plan.exercises.map(e => toEntry(e, plan)) },
  }
}

export function addSet(s: InProgress, set: LoggedSet, now: number): InProgress {
  const i = s.exerciseIndex
  const entries = s.log.entries.map((e, n) => (n === i ? { ...e, sets: [...e.sets, set] } : e))
  const done = entries[i].sets.length >= entries[i].targetSets
  return {
    ...s,
    log: { ...s.log, entries },
    exerciseIndex: done ? i + 1 : i,
    restEndsAt: now + s.plan.prescription.restSec * 1000,
  }
}

export function removeSet(s: InProgress, setIndex: number): InProgress {
  const i = s.exerciseIndex
  const entries = s.log.entries.map((e, n) => (n === i ? { ...e, sets: e.sets.filter((_, k) => k !== setIndex) } : e))
  return { ...s, log: { ...s.log, entries } }
}

export function swapExercise(s: InProgress, next: Exercise): InProgress {
  const i = s.exerciseIndex
  const plan = { ...s.plan, exercises: s.plan.exercises.map((e, n) => (n === i ? next : e)) }
  const entries = s.log.entries.map((e, n) => (n === i ? toEntry(next, plan) : e))
  return { ...s, plan, log: { ...s.log, entries } }
}

export function finish(s: InProgress, now: Date): WorkoutLog | null {
  const entries = s.log.entries.filter(e => e.sets.length > 0)
  return entries.length === 0 ? null : { ...s.log, entries, finishedAt: now.toISOString() }
}

export function setAttachment(s: InProgress, index: number, attachment: string): InProgress {
  const entries = s.log.entries.map((e, n) => (n === index ? { ...e, attachment: attachment || undefined } : e))
  return { ...s, log: { ...s.log, entries } }
}

// The group changed its mind mid-workout: add an exercise at the end and go straight to it.
export function addExercise(s: InProgress, next: Exercise): InProgress {
  const plan = { ...s.plan, exercises: [...s.plan.exercises, next] }
  return { ...s, plan, exerciseIndex: plan.exercises.length - 1, restEndsAt: null, log: { ...s.log, entries: [...s.log.entries, toEntry(next, plan)] } }
}

export function removeExercise(s: InProgress, index: number): InProgress {
  const plan = { ...s.plan, exercises: s.plan.exercises.filter((_, n) => n !== index) }
  const entries = s.log.entries.filter((_, n) => n !== index)
  const exerciseIndex = s.exerciseIndex > index ? s.exerciseIndex - 1 : Math.min(s.exerciseIndex, plan.exercises.length)
  return { ...s, plan, exerciseIndex, log: { ...s.log, entries } }
}
