import { exercises } from '../data'
import { fromCode, toCode, workoutName } from './custom'
import { convert, personalBests, weeklyStreak, workoutsThisWeek } from './progress'
import { isFriendSnapshot } from './storage'
import type { Friend, SavedData } from '../types'

const known = new Set(exercises.map(e => e.id))
const MAX_NAME = 40

// Only what a friend needs to cheer you on: no body weight, equipment or full history.
export function snapshot(d: SavedData, me: { id: string; name: string }, now: Date): Friend {
  const profile = d.profile!
  const bests = Object.entries(personalBests(d.history)).slice(-6).map(([exerciseId, b]) => ({
    exerciseId, weight: convert(b.weight, b.units, profile.units), reps: b.reps,
  }))
  return {
    id: me.id,
    name: me.name,
    goal: profile.goal,
    daysPerWeek: profile.daysPerWeek,
    units: profile.units,
    sentAt: now.toISOString(),
    streak: weeklyStreak(d.history, profile.daysPerWeek, now),
    thisWeek: workoutsThisWeek(d.history, now),
    total: d.history.length,
    bests,
    recent: d.history.slice(-3).reverse().map(l => ({ name: workoutName(l), at: l.finishedAt })),
  }
}

export const encodeFriend = (f: Friend): string => toCode(f)

export function decodeFriend(code: string): Friend | null {
  const f = fromCode(code)
  if (!isFriendSnapshot(f)) return null
  const friend = f as Friend
  const name = friend.name.trim()
  if (!name || name.length > MAX_NAME || friend.id.length > 40) return null
  if (friend.bests.length > 6 || friend.recent.length > 3 || friend.recent.some(r => r.name.length > 60)) return null
  // Keep only the listed fields, so a crafted link can't slip extra data into storage.
  return {
    id: friend.id, name, goal: friend.goal, daysPerWeek: friend.daysPerWeek, units: friend.units, sentAt: friend.sentAt,
    streak: friend.streak, thisWeek: friend.thisWeek, total: friend.total,
    bests: friend.bests.filter(b => known.has(b.exerciseId)).map(({ exerciseId, weight, reps }) => ({ exerciseId, weight, reps })),
    recent: friend.recent.map(({ name, at }) => ({ name, at })),
  }
}

export const LIMITS = { name: MAX_NAME }
