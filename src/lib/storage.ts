import { EQUIPMENT } from '../types'
import type { SavedData } from '../types'

export const STORAGE_KEY = 'daylift.v1'
const DAMAGED_KEY = 'daylift.v1.damaged'

const fresh = (): SavedData => ({ version: 1, profile: null, history: [], inProgress: null })

const GOALS = ['fitLean', 'buildMuscle', 'getStronger', 'loseWeight', 'toneUp', 'buildStamina', 'stayActive']
const LEVELS = ['brandNew', 'beginner', 'intermediate', 'advanced']
const WORKOUTS = ['fullA', 'fullB', 'fullC', 'upperA', 'upperB', 'lowerA', 'lowerB', 'push', 'pull', 'legs', 'upper', 'lower']
const UNITS = ['kg', 'lb']

type Fields = Record<string, unknown>

const isObject = (v: unknown): v is Fields => typeof v === 'object' && v !== null
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isString = (v: unknown): v is string => typeof v === 'string'
const oneOf = (list: readonly string[], v: unknown) => isString(v) && list.includes(v)

// Saved data and backups can be edited or damaged, so every field the screens read is checked.
function isProfile(p: unknown): boolean {
  return isObject(p)
    && oneOf(GOALS, p.goal)
    && oneOf(LEVELS, p.level)
    && isNumber(p.daysPerWeek) && p.daysPerWeek >= 2 && p.daysPerWeek <= 5 && Number.isInteger(p.daysPerWeek)
    && oneOf(['short', 'standard'], p.length)
    && Array.isArray(p.equipment) && p.equipment.every(e => oneOf(EQUIPMENT, e))
    && oneOf(UNITS, p.units)
}

const isSet = (s: unknown) => isObject(s) && isNumber(s.weight) && isNumber(s.reps)

const isEntry = (e: unknown) => isObject(e)
  && isString(e.exerciseId) && isString(e.name)
  && oneOf(['upper', 'lower'], e.region)
  && isNumber(e.targetSets) && isNumber(e.repMax)
  && Array.isArray(e.sets) && e.sets.every(isSet)

const isDate = (v: unknown) => isString(v) && !Number.isNaN(Date.parse(v))

const isLog = (l: unknown) => isObject(l)
  && isString(l.id)
  && oneOf(WORKOUTS, l.type)
  && oneOf(UNITS, l.units)
  && isDate(l.startedAt) && isDate(l.finishedAt)
  && Array.isArray(l.entries) && l.entries.every(isEntry)

const isExercise = (e: unknown) => isObject(e)
  && isString(e.id) && isString(e.name) && isString(e.muscle)
  && [e.needs, e.images, e.steps, e.mistakes].every(Array.isArray)

function isSession(s: unknown): boolean {
  if (!isObject(s) || !isLog(s.log) || !isObject(s.plan)) return false
  const { plan, log } = s as { plan: Fields; log: { entries: unknown[] } }
  const p = plan.prescription
  return oneOf(WORKOUTS, plan.type)
    && isObject(p) && [p.sets, p.repMin, p.repMax, p.restSec, p.cardioMin].every(isNumber)
    && Array.isArray(plan.exercises) && plan.exercises.every(isExercise)
    && plan.exercises.length === log.entries.length
    && isNumber(s.exerciseIndex)
    && (s.restEndsAt === null || isNumber(s.restEndsAt))
}

function parse(text: string): SavedData | null {
  try {
    const d = JSON.parse(text)
    const valid = isObject(d) && d.version === 1
      && (d.profile === null || isProfile(d.profile))
      && Array.isArray(d.history) && d.history.every(isLog)
      && (d.inProgress === null || isSession(d.inProgress))
    return valid ? (d as unknown as SavedData) : null
  } catch {
    return null
  }
}

export function load(): { data: SavedData; damaged: string | null } {
  let text: string | null = null
  try {
    text = localStorage.getItem(STORAGE_KEY)
  } catch {
    return { data: fresh(), damaged: null }
  }
  if (text === null) return { data: fresh(), damaged: null }
  const data = parse(text)
  if (data) return { data, damaged: null }
  try {
    localStorage.setItem(DAMAGED_KEY, text)
  } catch {
    // The damaged text is still returned, so the user can be told about it.
  }
  return { data: fresh(), damaged: text }
}

export function save(data: SavedData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function clearSaved(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing else can be done here. The recovery screen stays up.
  }
}

export const exportBackup = (data: SavedData): string => JSON.stringify(data, null, 2)

export const importBackup = (text: string): SavedData | null => parse(text)

export async function requestPersistence(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    // Not supported everywhere, and the app still works without it.
  }
}
