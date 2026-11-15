import { toCode } from './custom'
import { decodeFriend, encodeFriend, snapshot } from './friends'
import { testLog, testProfile } from '../test-utils'
import type { SavedData } from '../types'

const me = { id: 'f1', name: 'Abi' }
const data: SavedData = { version: 1, profile: testProfile, history: [testLog('2026-11-02'), testLog('2026-11-03')], inProgress: null }

test('a progress link carries my stats and round-trips', () => {
  const snap = snapshot(data, me, new Date('2026-11-04T12:00:00'))
  expect(snap).toMatchObject({ id: 'f1', name: 'Abi', goal: 'fitLean', total: 2, thisWeek: 2, units: 'kg' })
  expect(snap.bests).toEqual([{ exerciseId: 'Dumbbell_Bench_Press', weight: 20, reps: 10 }])
  expect(snap.recent).toHaveLength(2)
  expect(decodeFriend(encodeFriend(snap))).toEqual(snap)
})

test('a crafted progress link is refused or trimmed to known fields', () => {
  const snap = snapshot(data, me, new Date('2026-11-04T12:00:00'))
  expect(decodeFriend('nonsense')).toBeNull()
  expect(decodeFriend(toCode({ ...snap, goal: 'hack' }))).toBeNull()
  expect(decodeFriend(toCode({ ...snap, name: 'x'.repeat(41) }))).toBeNull()
  const cleaned = decodeFriend(toCode({ ...snap, extra: '<script>', bests: [{ exerciseId: 'Nope', weight: 1, reps: 1 }] }))!
  expect(cleaned).not.toHaveProperty('extra')
  expect(cleaned.bests).toEqual([])
})
