import type { LoggedExercise, Units, WorkoutLog } from '../types'

const LB_PER_KG = 2.20462
const MAX_WEIGHT = 1000
const MAX_REPS = 200
const STEP: Record<Units, number> = { kg: 2.5, lb: 5 }
const INCREASE: Record<Units, Record<'upper' | 'lower', number>> = {
  kg: { upper: 2.5, lower: 5 },
  lb: { upper: 5, lower: 10 },
}
const DAYS_IN_A_ROW: Record<number, number> = { 2: 1, 3: 1, 4: 2, 5: 3 }

export function parseWeight(text: string): number | null {
  const clean = text.trim().replace(',', '.')
  // Two decimal places at most, so "1,000" is never read as 1.
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null
  const value = Number(clean)
  return value > 0 && value < MAX_WEIGHT ? value : null
}

export function parseReps(text: string): number | null {
  const clean = text.trim()
  if (!/^\d+$/.test(clean)) return null
  const value = Number(clean)
  return value >= 1 && value <= MAX_REPS ? value : null
}

export function convert(weight: number, from: Units, to: Units): number {
  if (from === to) return weight
  const value = to === 'lb' ? weight * LB_PER_KG : weight / LB_PER_KG
  return Math.max(STEP[to], Math.round(value / STEP[to]) * STEP[to])
}

const heaviest = (entry: LoggedExercise): number => Math.max(0, ...entry.sets.map(s => s.weight))

const toKg = (weight: number, units: Units): number => (units === 'kg' ? weight : weight / LB_PER_KG)

export function suggestWeight(history: WorkoutLog[], exerciseId: string, units: Units): { weight: number | null; increase: boolean } {
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i].entries.find(e => e.exerciseId === exerciseId && e.sets.length > 0)
    if (!entry) continue
    const last = heaviest(entry)
    if (last === 0) break
    const weight = convert(last, history[i].units, units)
    const increase = entry.sets.length >= entry.targetSets && entry.sets.every(s => s.reps >= entry.repMax)
    return { weight: increase ? weight + INCREASE[units][entry.region] : weight, increase }
  }
  return { weight: null, increase: false }
}

type Best = { name: string; weight: number; units: Units; reps: number }

// Heavier wins; at the same weight, more reps wins. Bodyweight sets (weight 0) compete on reps alone.
// Weights are compared in kg to 2 decimals so kg and lb logs of the same load count as equal.
function beats(weight: number, units: Units, reps: number, best: Best): boolean {
  const kg = Math.round(toKg(weight, units) * 100)
  const bestKg = Math.round(toKg(best.weight, best.units) * 100)
  return kg > bestKg || (kg === bestKg && reps > best.reps)
}

export function personalBests(history: WorkoutLog[]): Record<string, Best> {
  const bests: Record<string, Best> = {}
  for (const log of history) {
    for (const entry of log.entries) {
      for (const set of entry.sets) {
        const current = bests[entry.exerciseId]
        if (!current || beats(set.weight, log.units, set.reps, current)) {
          bests[entry.exerciseId] = { name: entry.name, weight: set.weight, units: log.units, reps: set.reps }
        }
      }
    }
  }
  return bests
}

export function newBests(log: WorkoutLog, priorHistory: WorkoutLog[]): string[] {
  const prior = personalBests(priorHistory)
  const today = personalBests([log])
  return log.entries
    .filter(e => {
      const best = prior[e.exerciseId]
      const top = today[e.exerciseId]
      return best && top && beats(top.weight, top.units, top.reps, best)
    })
    .map(e => e.name)
}

export const totalWeight = (log: WorkoutLog): number =>
  log.entries.reduce((sum, e) => sum + e.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0)

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function shiftDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function weekStart(date: Date): Date {
  return shiftDays(date, -((date.getDay() + 6) % 7))
}

const logsInWeek = (history: WorkoutLog[], start: Date): WorkoutLog[] => {
  const end = shiftDays(start, 7)
  return history.filter(l => {
    const t = new Date(l.finishedAt)
    return t >= start && t < end
  })
}

// A week is judged by the plan it was trained under, so changing plans can't erase a streak.
function metTarget(history: WorkoutLog[], start: Date, daysPerWeek: number): boolean {
  const logs = logsInWeek(history, start)
  return logs.length >= (logs[logs.length - 1]?.targetDays ?? daysPerWeek)
    && logs.length > 0
}

export const workoutsThisWeek = (history: WorkoutLog[], now: Date): number => logsInWeek(history, weekStart(now)).length

export function weekDays(history: WorkoutLog[], now: Date): { letter: string; trained: boolean; today: boolean }[] {
  const trained = new Set(history.map(l => dayKey(new Date(l.finishedAt))))
  const start = weekStart(now)
  return [...'MTWTFSS'].map((letter, i) => {
    const key = dayKey(shiftDays(start, i))
    return { letter, trained: trained.has(key), today: key === dayKey(now) }
  })
}

export function lifetime(history: WorkoutLog[], units: Units): { workouts: number; lifted: number } {
  const kg = history.reduce((sum, log) => sum + toKg(totalWeight(log), log.units), 0)
  return { workouts: history.length, lifted: Math.round(units === 'kg' ? kg : kg * LB_PER_KG) }
}

export function isRestDay(history: WorkoutLog[], daysPerWeek: number, now: Date): boolean {
  if (logsInWeek(history, weekStart(now)).length >= daysPerWeek) return true
  const trained = new Set(history.map(l => dayKey(new Date(l.finishedAt))))
  let day = trained.has(dayKey(now)) ? now : shiftDays(now, -1)
  let inARow = 0
  while (trained.has(dayKey(day))) {
    inARow++
    day = shiftDays(day, -1)
  }
  return inARow >= DAYS_IN_A_ROW[daysPerWeek]
}

export function weeklyStreak(history: WorkoutLog[], daysPerWeek: number, now: Date): number {
  let week = weekStart(now)
  let streak = metTarget(history, week, daysPerWeek) ? 1 : 0
  week = shiftDays(week, -7)
  while (metTarget(history, week, daysPerWeek)) {
    streak++
    week = shiftDays(week, -7)
  }
  return streak
}
