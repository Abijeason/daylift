import { buildWorkout, nextWorkout, PRESETS, rotation, swapOptions } from './planner'
import { allowedDays, GOALS, LEVELS } from './rules'
import { exercises } from '../data'
import type { Equipment, Goal, Level, Profile, WorkoutLog } from '../types'

const profile = (over: Partial<Profile> = {}): Profile => ({
  goal: 'fitLean', level: 'beginner', daysPerWeek: 3, length: 'standard', equipment: PRESETS.full, units: 'kg', ...over,
})
const logs = (n: number) => Array.from({ length: n }, () => ({}) as WorkoutLog)

test.each([
  [2, ['fullA', 'fullB']],
  [3, ['fullA', 'fullB', 'fullC']],
  [4, ['upperA', 'lowerA', 'upperB', 'lowerB']],
  [5, ['push', 'pull', 'legs', 'upper', 'lower']],
])('rotation %i', (d, r) => expect(rotation(d)).toEqual(r))

test('same input gives same workout', () => {
  expect(buildWorkout(profile(), 'fullA', exercises)).toEqual(buildWorkout(profile(), 'fullA', exercises))
})

test('no duplicate exercises in a workout', () => {
  const ids = buildWorkout(profile(), 'fullA', exercises).exercises.map(e => e.id)
  expect(new Set(ids).size).toBe(ids.length)
})

test('only uses owned equipment', () => {
  const p = profile({ equipment: PRESETS.dumbbells })
  const w = buildWorkout(p, 'fullA', exercises)
  w.exercises.forEach(e => e.needs.forEach(n => expect(p.equipment).toContain(n)))
})

test('brand new only gets beginner exercises', () => {
  const w = buildWorkout(profile({ level: 'brandNew' }), 'fullA', exercises)
  w.exercises.forEach(e => expect(e.level).toBe('beginner'))
})

test('cardio machines are never strength exercises', () => {
  const w = buildWorkout(profile(), 'legs', exercises)
  w.exercises.forEach(e => expect(e.needs).not.toContain('cardioMachine'))
})

test('workouts differ between variants', () => {
  const a = buildWorkout(profile(), 'fullA', exercises).exercises.map(e => e.id)
  const b = buildWorkout(profile(), 'fullB', exercises).exercises.map(e => e.id)
  expect(a).not.toEqual(b)
})

test('next workout follows completed count, not weekdays', () => {
  expect(nextWorkout(profile(), logs(2), exercises).type).toBe('fullC')
  expect(nextWorkout(profile(), logs(3), exercises).type).toBe('fullA')
})

test('no equipment still gives 3 or more exercises', () => {
  for (const type of ['fullA', 'lowerA', 'upperA', 'push', 'pull'] as const) {
    const days = type === 'push' || type === 'pull' ? 5 : 3
    const w = buildWorkout(profile({ equipment: [], daysPerWeek: days }), type, exercises)
    expect(w.exercises.length).toBeGreaterThanOrEqual(3)
  }
})

const sets: Equipment[][] = [PRESETS.full, PRESETS.basic, PRESETS.dumbbells, []]
const goals = Object.keys(GOALS) as Goal[]
const levels = Object.keys(LEVELS) as Level[]

test('every goal, level, day count and preset gives valid workouts', () => {
  for (const goal of goals) for (const level of levels) for (const daysPerWeek of allowedDays(goal, level))
    for (const equipment of sets) for (const length of ['short', 'standard'] as const) {
      const p = profile({ goal, level, daysPerWeek, equipment, length })
      for (const type of rotation(daysPerWeek)) {
        const w = buildWorkout(p, type, exercises)
        expect(w.exercises.length).toBeGreaterThanOrEqual(3)
        expect(w.estMinutes).toBeGreaterThan(0)
      }
    }
})

test('swap keeps muscle and equipment and excludes planned exercises', () => {
  const p = profile()
  const w = buildWorkout(p, 'fullA', exercises)
  const options = swapOptions(p, w.exercises[0], w, exercises)
  expect(options.length).toBeGreaterThan(0)
  options.forEach(o => {
    expect(o.muscle).toBe(w.exercises[0].muscle)
    expect(w.exercises.map(e => e.id)).not.toContain(o.id)
  })
})
