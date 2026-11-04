import { buildCustom, decodeShare, encodeShare, planCount, shareLink, workoutName } from './custom'
import { nextWorkout } from './planner'
import { exercises } from '../data'
import { testLog, testProfile } from '../test-utils'
import type { CustomWorkout, Profile } from '../types'

const upper: CustomWorkout = { id: 'u1', name: 'Upper with Sam', exerciseIds: ['Dumbbell_Bench_Press', 'Wide-Grip_Lat_Pulldown', 'Side_Lateral_Raise'] }

test('a custom workout keeps the chosen exercises in order', () => {
  const plan = buildCustom(testProfile, upper, exercises)
  expect(plan.type).toBe('custom')
  expect(plan.title).toBe('Upper with Sam')
  expect(plan.exercises.map(e => e.id)).toEqual(upper.exerciseIds)
})

test('each person gets sets and reps for their own goal and level', () => {
  const beginner = buildCustom({ ...testProfile, goal: 'toneUp', level: 'brandNew' }, upper, exercises)
  const advanced: Profile = { ...testProfile, goal: 'getStronger', level: 'advanced' }
  const strong = buildCustom(advanced, upper, exercises)
  expect(beginner.prescription).toMatchObject({ sets: 2, repMin: 12, repMax: 15 })
  expect(strong.prescription).toMatchObject({ sets: 5, repMin: 4, repMax: 6 })
  expect(strong.exercises.map(e => e.id)).toEqual(beginner.exercises.map(e => e.id))
})

test('exercises no longer in the library are skipped', () => {
  const plan = buildCustom(testProfile, { ...upper, exerciseIds: ['Gone', 'Pushups'] }, exercises)
  expect(plan.exercises.map(e => e.id)).toEqual(['Pushups'])
})

test('custom workouts do not move the automatic plan forward', () => {
  const custom = testLog('2026-10-02', { type: 'custom', title: 'Upper with Sam' })
  expect(planCount([testLog(), custom])).toBe(1)
  expect(nextWorkout(testProfile, [testLog(), custom], exercises).type).toBe('fullB')
})

test('custom logs show their own name', () => {
  expect(workoutName({ type: 'custom', title: 'Upper with Sam' })).toBe('Upper with Sam')
  expect(workoutName({ type: 'fullA' })).toBe('Full Body A')
})

test('a shared workout round-trips through the link', () => {
  const code = encodeShare(upper)
  expect(decodeShare(code)).toEqual({ name: 'Upper with Sam', exerciseIds: upper.exerciseIds })
  expect(shareLink(upper, 'https://x.test/daylift/')).toBe(`https://x.test/daylift/#workout=${code}`)
})

test('names with emoji and accents survive the link', () => {
  const w = { ...upper, name: 'Jour de jambes 🦵' }
  expect(decodeShare(encodeShare(w))?.name).toBe('Jour de jambes 🦵')
})

test.each([
  'nonsense',
  btoa('{"n":"","e":["Pushups"]}'),
  btoa('{"n":"Legs","e":[]}'),
  btoa('{"n":"Legs","e":["NotReal"]}'),
  btoa(JSON.stringify({ n: 'x'.repeat(61), e: ['Pushups'] })),
  btoa(JSON.stringify({ n: 'Legs', e: Array(31).fill('Pushups') })),
])('a bad or empty link is rejected: %s', code => {
  expect(decodeShare(code)).toBeNull()
})

test('unknown exercises in a link are dropped, known ones kept', () => {
  const code = btoa(JSON.stringify({ n: 'Mix', e: ['NotReal', 'Pushups'] }))
  expect(decodeShare(code)).toEqual({ name: 'Mix', exerciseIds: ['Pushups'] })
})
