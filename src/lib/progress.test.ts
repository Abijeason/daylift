import { lifetime, weekDays, workoutsThisWeek, isRestDay, newBests, parseReps, parseWeight, personalBests, suggestWeight, totalWeight, weeklyStreak } from './progress'
import type { LoggedExercise, Units, WorkoutLog } from '../types'

function entry(over: Partial<LoggedExercise> = {}): LoggedExercise {
  return {
    exerciseId: 'x', name: 'Row', region: 'upper', targetSets: 3, repMax: 12,
    sets: [{ weight: 40, reps: 12 }, { weight: 40, reps: 12 }, { weight: 40, reps: 12 }],
    ...over,
  }
}
function log(entries: LoggedExercise[], day = '2026-11-02', units: Units = 'kg'): WorkoutLog {
  const finishedAt = new Date(`${day}T12:00:00`).toISOString()
  return { id: day, type: 'fullA', units, startedAt: finishedAt, finishedAt, entries }
}
const days = (...d: string[]) => d.map(x => log([entry()], x))

test.each([['20', 20], ['22.5', 22.5], ['22,5', 22.5], [' 40 ', 40]])('parse %s', (t, n) => {
  expect(parseWeight(t)).toBe(n)
})
test.each(['', 'abc', '-5', '0', '1000', '1e3', '12kg', '1,000'])('reject weight %s', t => {
  expect(parseWeight(t)).toBeNull()
})
test('reps are whole numbers from 1 to 200', () => {
  expect(parseReps('12')).toBe(12)
  expect(parseReps('1.5')).toBeNull()
  expect(parseReps('0')).toBeNull()
  expect(parseReps('201')).toBeNull()
  expect(parseReps('')).toBeNull()
})

test('no history gives no number', () => {
  expect(suggestWeight([], 'x', 'kg')).toEqual({ weight: null, increase: false })
})
test('all sets at top adds 2.5 kg upper', () => {
  expect(suggestWeight([log([entry()])], 'x', 'kg')).toEqual({ weight: 42.5, increase: true })
})
test('all sets at top adds 5 kg lower', () => {
  expect(suggestWeight([log([entry({ region: 'lower' })])], 'x', 'kg').weight).toBe(45)
})
test('lb uses 5 and 10', () => {
  expect(suggestWeight([log([entry()], '2026-11-02', 'lb')], 'x', 'lb').weight).toBe(45)
  expect(suggestWeight([log([entry({ region: 'lower' })], '2026-11-02', 'lb')], 'x', 'lb').weight).toBe(50)
})
test('falling short keeps the weight', () => {
  const short = entry({ sets: [{ weight: 40, reps: 12 }, { weight: 40, reps: 9 }, { weight: 40, reps: 8 }] })
  expect(suggestWeight([log([short])], 'x', 'kg')).toEqual({ weight: 40, increase: false })
})
test('fewer sets than target keeps the weight', () => {
  const few = entry({ sets: [{ weight: 40, reps: 12 }] })
  expect(suggestWeight([log([few])], 'x', 'kg')).toEqual({ weight: 40, increase: false })
})
test('bodyweight exercise gives no number', () => {
  const bw = entry({ sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 12 }, { weight: 0, reps: 12 }] })
  expect(suggestWeight([log([bw])], 'x', 'kg')).toEqual({ weight: null, increase: false })
})
test('history in kg converts when units are lb', () => {
  const short = entry({ sets: [{ weight: 40, reps: 5 }] })
  expect(suggestWeight([log([short])], 'x', 'lb').weight).toBe(90)
})
test('a tiny weight never converts to zero', () => {
  const small = entry({ sets: [{ weight: 1, reps: 5 }] })
  expect(suggestWeight([log([small])], 'x', 'lb').weight).toBe(5)
})
test('uses the most recent log with that exercise', () => {
  const older = log([entry()], '2026-11-01')
  const newer = log([entry({ sets: [{ weight: 50, reps: 5 }] })], '2026-11-03')
  const other = log([entry({ exerciseId: 'y' })], '2026-11-04')
  expect(suggestWeight([older, newer, other], 'x', 'kg').weight).toBe(50)
})

test('personal bests keep the stored name for removed exercises', () => {
  expect(personalBests([log([entry({ exerciseId: 'gone', name: 'Old Move' })])]).gone)
    .toEqual({ name: 'Old Move', weight: 40, units: 'kg', reps: 12 })
})
test('personal bests compare across units', () => {
  const bests = personalBests([log([entry()], '2026-11-01'), log([entry({ sets: [{ weight: 60, reps: 5 }] })], '2026-11-02', 'lb')])
  expect(bests.x.weight).toBe(40)
})
test('new bests ignore first-time exercises', () => {
  const first = log([entry()])
  expect(newBests(first, [])).toEqual([])
})
test('new bests name a heavier lift', () => {
  const later = log([entry({ sets: [{ weight: 45, reps: 8 }] })], '2026-11-03')
  expect(newBests(later, [log([entry()])])).toEqual(['Row'])
})
test('total weight adds weight times reps', () => {
  expect(totalWeight(log([entry()]))).toBe(1440)
})

const now = new Date('2026-11-05T09:00:00') // a Thursday

test('rest after 1 workout on a 3-day plan', () => {
  expect(isRestDay(days('2026-11-04'), 3, now)).toBe(true)
  expect(isRestDay(days('2026-11-03'), 3, now)).toBe(false)
})
test('no rest after 1 workout on a 4-day plan, rest after 2', () => {
  expect(isRestDay(days('2026-11-04'), 4, now)).toBe(false)
  expect(isRestDay(days('2026-11-03', '2026-11-04'), 4, now)).toBe(true)
})
test('rest after 3 in a row on a 5-day plan', () => {
  expect(isRestDay(days('2026-11-03', '2026-11-04'), 5, now)).toBe(false)
  expect(isRestDay(days('2026-11-02', '2026-11-03', '2026-11-04'), 5, now)).toBe(true)
})
test('rest when weekly target is met', () => {
  expect(isRestDay(days('2026-11-02'), 2, new Date('2026-11-04T09:00:00'))).toBe(false)
  expect(isRestDay(days('2026-11-02', '2026-11-03'), 2, new Date('2026-11-05T09:00:00'))).toBe(true)
})
test('no history is not a rest day', () => expect(isRestDay([], 3, now)).toBe(false))

test('streak counts weeks that met the target', () => {
  const h = days('2026-10-20', '2026-10-22', '2026-10-27', '2026-10-29')
  expect(weeklyStreak(h, 2, now)).toBe(2)
})
test('the current unfinished week does not break the streak', () => {
  const h = days('2026-10-27', '2026-10-29')
  expect(weeklyStreak(h, 2, now)).toBe(1)
})
test('the current week counts once met', () => {
  const h = days('2026-10-27', '2026-10-29', '2026-11-03', '2026-11-04')
  expect(weeklyStreak(h, 2, now)).toBe(2)
})
test('a missed full week resets to 0', () => {
  const h = days('2026-10-13', '2026-10-15')
  expect(weeklyStreak(h, 2, now)).toBe(0)
})
test('past weeks use the target they were trained under', () => {
  const h = days('2026-10-20', '2026-10-22', '2026-10-27', '2026-10-29').map(l => ({ ...l, targetDays: 2 }))
  expect(weeklyStreak(h, 4, now)).toBe(2)
})
test('Sunday belongs to the week that started on Monday', () => {
  const h = days('2026-11-02', '2026-11-08')
  expect(weeklyStreak(h, 2, new Date('2026-11-08T20:00:00'))).toBe(1)
})

test('workouts this week ignores earlier weeks', () => {
  expect(workoutsThisWeek(days('2026-10-27', '2026-11-03', '2026-11-04'), now)).toBe(2)
})

test('week days run Monday to Sunday and mark training and today', () => {
  const week = weekDays(days('2026-11-03'), now)
  expect(week.map(d => d.letter).join('')).toBe('MTWTFSS')
  expect(week[1].trained).toBe(true)
  expect(week[3].today).toBe(true)
  expect(week.filter(d => d.trained)).toHaveLength(1)
})
test('lifetime totals workouts and weight in the chosen units', () => {
  expect(lifetime([log([entry()])], 'kg')).toEqual({ workouts: 1, lifted: 1440 })
  expect(lifetime([log([entry()], '2026-11-02', 'lb')], 'kg').lifted).toBe(653)
})
