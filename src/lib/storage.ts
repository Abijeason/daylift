import type { SavedData } from '../types'

export const STORAGE_KEY = 'daylift.v1'
const DAMAGED_KEY = 'daylift.v1.damaged'

const fresh = (): SavedData => ({ version: 1, profile: null, history: [], inProgress: null })

function isProfile(value: unknown): boolean {
  if (value === null) return true
  const p = value as Record<string, unknown>
  return typeof p === 'object'
    && typeof p.goal === 'string'
    && typeof p.level === 'string'
    && typeof p.daysPerWeek === 'number'
    && typeof p.length === 'string'
    && Array.isArray(p.equipment)
    && typeof p.units === 'string'
}

function parse(text: string): SavedData | null {
  try {
    const d = JSON.parse(text)
    const valid = d && d.version === 1 && Array.isArray(d.history) && 'inProgress' in d && isProfile(d.profile)
    return valid ? d : null
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

export const exportBackup = (data: SavedData): string => JSON.stringify(data, null, 2)

export const importBackup = (text: string): SavedData | null => parse(text)

export async function requestPersistence(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    // Not supported everywhere, and the app still works without it.
  }
}
