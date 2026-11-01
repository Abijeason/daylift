import { allowedDays, exerciseCount, prescription, workoutMinutes } from './rules'
import type { Goal, Level, Profile } from '../types'

test.each<[Goal, Level, number[]]>([
  ['fitLean', 'brandNew', [3]],
  ['buildMuscle', 'brandNew', [3]],
  ['buildMuscle', 'beginner', [4]],
  ['stayActive', 'brandNew', [2, 3]],
  ['loseWeight', 'beginner', [3, 4]],
  ['loseWeight', 'advanced', [3, 4, 5]],
  ['buildMuscle', 'advanced', [4, 5]],
  ['getStronger', 'intermediate', [3, 4]],
])('allowedDays %s %s', (g, l, d) => expect(allowedDays(g, l)).toEqual(d))

test('brand new has one fewer set, minimum 2', () => {
  expect(prescription('fitLean', 'brandNew').sets).toBe(2)
  expect(prescription('stayActive', 'brandNew').sets).toBe(2)
})

test('advanced adds a set', () => expect(prescription('buildMuscle', 'advanced').sets).toBe(5))

test('get stronger is safer for new lifters', () => {
  expect(prescription('getStronger', 'brandNew')).toMatchObject({ repMin: 8, repMax: 10 })
  expect(prescription('getStronger', 'beginner')).toMatchObject({ repMin: 6, repMax: 8 })
  expect(prescription('getStronger', 'intermediate')).toMatchObject({ repMin: 4, repMax: 6 })
})

test('cardio finisher values', () => {
  expect(prescription('loseWeight', 'beginner').cardioMin).toBe(10)
  expect(prescription('buildStamina', 'beginner').cardioMin).toBe(15)
})

test('exercise count', () => {
  expect(exerciseCount(prescription('fitLean', 'beginner'), 45)).toBe(5)
  expect(exerciseCount(prescription('fitLean', 'beginner'), 60)).toBe(7)
  expect(exerciseCount(prescription('buildStamina', 'beginner'), 40)).toBe(3)
  expect(exerciseCount(prescription('stayActive', 'brandNew'), 30)).toBe(4)
})

test('count stays between 3 and 8', () => {
  const p = prescription('fitLean', 'beginner')
  expect(exerciseCount(p, 10)).toBe(3)
  expect(exerciseCount(p, 300)).toBe(8)
})

test('workout minutes follow goal and length', () => {
  const profile: Profile = { goal: 'stayActive', level: 'beginner', daysPerWeek: 2, length: 'short', equipment: [], units: 'kg' }
  expect(workoutMinutes(profile)).toBe(30)
  expect(workoutMinutes({ ...profile, length: 'standard' })).toBe(40)
})
