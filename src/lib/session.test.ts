import { addSet, finish, newSession, secondsLeft, swapExercise } from './session'
import { formVideoLink } from './video'
import { buildWorkout } from './planner'
import { exercises } from '../data'
import { testProfile } from '../test-utils'

const plan = buildWorkout(testProfile, 'fullA', exercises)
const session = () => newSession(plan, 'kg', new Date('2026-11-02T10:00:00'))

test('counts down from the saved end time', () => expect(secondsLeft(10_000, 4_000)).toBe(6))
test('never goes negative', () => expect(secondsLeft(1_000, 9_000)).toBe(0))
test('no timer is zero', () => expect(secondsLeft(null, 9_000)).toBe(0))

test('a new session starts at the warm-up with an entry per exercise', () => {
  const s = session()
  expect(s.exerciseIndex).toBe(-1)
  expect(s.log.entries).toHaveLength(plan.exercises.length)
})

test('adding a set saves it and starts rest', () => {
  const s = addSet({ ...session(), exerciseIndex: 0 }, { weight: 20, reps: 10 }, 1_000)
  expect(s.log.entries[0].sets).toEqual([{ weight: 20, reps: 10 }])
  expect(s.restEndsAt).toBe(1_000 + plan.prescription.restSec * 1000)
})

test('the last set moves to the next exercise', () => {
  let s = { ...session(), exerciseIndex: 0 }
  for (let i = 0; i < plan.prescription.sets; i++) s = addSet(s, { weight: 20, reps: 10 }, 1_000)
  expect(s.exerciseIndex).toBe(1)
})

test('swap replaces the plan and the entry', () => {
  const other = exercises.find(e => !plan.exercises.includes(e))!
  const s = swapExercise({ ...session(), exerciseIndex: 0 }, other)
  expect(s.plan.exercises[0].id).toBe(other.id)
  expect(s.log.entries[0].exerciseId).toBe(other.id)
})

test('finish keeps only exercises with sets', () => {
  const s = addSet({ ...session(), exerciseIndex: 0 }, { weight: 20, reps: 10 }, 1_000)
  const log = finish(s, new Date('2026-11-02T11:00:00'))!
  expect(log.entries).toHaveLength(1)
  expect(log.finishedAt).toBe(new Date('2026-11-02T11:00:00').toISOString())
})

test('finish with no sets gives no log', () => {
  expect(finish(session(), new Date())).toBeNull()
})

test('form video uses the hand-picked link', () => {
  expect(formVideoLink({ name: 'Plank', videoUrl: 'https://youtu.be/abc' })).toBe('https://youtu.be/abc')
})

test('form video falls back to a YouTube search', () => {
  expect(formVideoLink({ name: 'Goblet Squat', videoUrl: null }))
    .toBe('https://www.youtube.com/results?search_query=Goblet%20Squat%20proper%20form')
})
