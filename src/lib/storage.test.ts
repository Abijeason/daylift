import { vi } from 'vitest'
import { clearSaved, exportBackup, importBackup, load, save, STORAGE_KEY } from './storage'
import type { SavedData } from '../types'

const sample: SavedData = {
  version: 1,
  profile: { goal: 'fitLean', level: 'beginner', daysPerWeek: 3, length: 'short', equipment: ['dumbbells'], units: 'kg' },
  history: [{
    id: '1', type: 'fullA', units: 'kg', startedAt: '2026-11-01T10:00:00.000Z', finishedAt: '2026-11-01T11:00:00.000Z',
    entries: [],
  }],
  inProgress: null,
}

afterEach(() => vi.restoreAllMocks())

test('empty storage gives a fresh record', () => {
  expect(load()).toEqual({ data: { version: 1, profile: null, history: [], inProgress: null }, damaged: null })
})

test('save then load round-trips', () => {
  expect(save(sample)).toBe(true)
  expect(load().data).toEqual(sample)
})

test('damaged JSON is kept and fresh data returned', () => {
  localStorage.setItem(STORAGE_KEY, '{oops')
  const r = load()
  expect(r.damaged).toBe('{oops')
  expect(r.data.history).toEqual([])
  expect(localStorage.getItem('daylift.v1.damaged')).toBe('{oops')
})

test('valid JSON with the wrong shape counts as damaged', () => {
  localStorage.setItem(STORAGE_KEY, '{"version":1,"history":5}')
  expect(load().damaged).not.toBeNull()
})

test('save returns false when storage is full', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full') })
  expect(save(sample)).toBe(false)
})

test.each([
  'not json',
  '{}',
  'null',
  '{"version":2,"profile":null,"history":[],"inProgress":null}',
  '{"version":1,"profile":null,"history":"x","inProgress":null}',
  '{"version":1,"profile":{"goal":"fitLean"},"history":[],"inProgress":null}',
])('import rejects %s', t => {
  expect(importBackup(t)).toBeNull()
})

const base = '{"version":1,"profile":null,"history":%s,"inProgress":%s}'
test.each([
  base.replace('%s', '[{}]').replace('%s', 'null'),
  base.replace('%s', '[]').replace('%s', '{}'),
  '{"version":1,"profile":{"goal":"nope","level":"beginner","daysPerWeek":3,"length":"short","equipment":[],"units":"kg"},"history":[],"inProgress":null}',
  '{"version":1,"profile":{"goal":"fitLean","level":"beginner","daysPerWeek":7,"length":"short","equipment":[],"units":"kg"},"history":[],"inProgress":null}',
  '{"version":1,"profile":{"goal":"fitLean","level":"beginner","daysPerWeek":3,"length":"short","equipment":["rocket"],"units":"kg"},"history":[],"inProgress":null}',
])('rejects malformed content %s', t => {
  expect(importBackup(t)).toBeNull()
  localStorage.setItem(STORAGE_KEY, t)
  expect(load().damaged).toBe(t)
})

test('rejects an unknown theme', () => {
  expect(importBackup('{"version":1,"profile":null,"history":[],"inProgress":null,"theme":"neon"}')).toBeNull()
})

test('clearSaved removes the record', () => {
  save(sample)
  clearSaved()
  expect(load().data.history).toEqual([])
})

test('a rejected import leaves saved data untouched', () => {
  save(sample)
  importBackup('not json')
  expect(load().data).toEqual(sample)
})

test('export then import round-trips', () => {
  expect(importBackup(exportBackup(sample))).toEqual(sample)
})
