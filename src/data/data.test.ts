import { existsSync } from 'node:fs'
import { exercises } from './index'
import { COMING_SOON, EATING_TIPS, SAFETY_NOTE } from './copy'
import { WARMUPS } from './warmups'
import { EQUIPMENT, MUSCLES } from '../types'

const ids = exercises.map(e => e.id)

test('about 90 exercises', () => expect(exercises.length).toBeGreaterThanOrEqual(80))

test('ids are unique', () => expect(new Set(ids).size).toBe(ids.length))

test.each(exercises)('$id is complete', e => {
  expect(MUSCLES).toContain(e.muscle)
  e.secondary.forEach(m => expect(MUSCLES).toContain(m))
  expect(e.secondary).not.toContain(e.muscle)
  e.needs.forEach(n => expect(EQUIPMENT).toContain(n))
  expect(e.steps.length).toBeGreaterThan(0)
  expect(e.mistakes.length).toBeGreaterThan(0)
  e.images.forEach(i => expect(existsSync(`public/exercises/${i}`)).toBe(true))
  e.easierIds.forEach(id => expect(ids).toContain(id))
})

test.each(['chest', 'quadriceps', 'glutes', 'abdominals', 'triceps'])('%s has a no-equipment or band option', m => {
  expect(exercises.some(e => e.muscle === m && (e.needs.length === 0 || e.needs.includes('bands')))).toBe(true)
})

test('every workout type has a warm-up of 3 or more steps', () => {
  expect(Object.keys(WARMUPS)).toHaveLength(13)
  Object.values(WARMUPS).forEach(w => expect(w.length).toBeGreaterThanOrEqual(3))
})

test('copy has no calorie numbers', () => {
  Object.values(EATING_TIPS).forEach(t => expect(t).not.toMatch(/\d/))
  expect(SAFETY_NOTE).toMatch(/doctor/)
})

test('coming soon lists the future features', () => {
  expect(COMING_SOON).toEqual(expect.arrayContaining(['AI photo scan', 'AI coach', 'Cloud backup']))
})

test('band exercises log no weight', () => {
  exercises.filter(e => e.needs.includes('bands')).forEach(e => expect(e.bodyweight).toBe(true))
})
