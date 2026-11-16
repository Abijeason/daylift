import { act, fireEvent, screen } from '@testing-library/react'
import { vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { Progress } from './Progress'
import { renderWithData, testLog, testProfile } from '../test-utils'
import { load } from '../lib/storage'

test('empty history shows a friendly start message', () => {
  renderWithData(<Progress />)
  expect(screen.getByText(/finish your first workout/i)).toBeInTheDocument()
})

test('history and bests are listed', () => {
  renderWithData(<Progress />, { history: [testLog()] })
  expect(screen.getAllByText('Full Body A').length).toBeGreaterThan(0)
  expect(screen.getAllByText('20 kg × 10').length).toBeGreaterThan(0)
})

test('history with a removed exercise still shows its name', () => {
  const log = testLog('2026-10-01', {
    entries: [{ exerciseId: 'gone', name: 'Old Move', region: 'upper', targetSets: 3, repMax: 12, sets: [{ weight: 30, reps: 5 }] }],
  })
  renderWithData(<Progress />, { history: [log] })
  expect(screen.getAllByText('Old Move').length).toBeGreaterThan(0)
})

test('one session explains how to start a trend instead of drawing a dot', () => {
  renderWithData(<Progress />, { history: [testLog()] })
  expect(screen.queryByRole('img', { name: /Dumbbell Bench Press/ })).not.toBeInTheDocument()
  expect(screen.getByText(/do this exercise again/i)).toBeInTheDocument()
})

test('two sessions show a labelled trend with the change', () => {
  const later = testLog('2026-10-05', { entries: [{ exerciseId: 'Dumbbell_Bench_Press', name: 'Dumbbell Bench Press', region: 'upper', targetSets: 3, repMax: 12, sets: [{ weight: 25, reps: 10 }] }] })
  renderWithData(<Progress />, { history: [testLog(), later] })
  expect(screen.getByRole('img', { name: /from 20 to 25/ })).toBeInTheDocument()
  expect(screen.getByText('+5 kg')).toBeInTheDocument()
  expect(screen.getByText(/2 sessions/i)).toBeInTheDocument()
})

test('chart converts old weights to the current units', () => {
  renderWithData(<Progress />, {
    profile: { ...testProfile, units: 'lb' },
    history: [testLog(), testLog('2026-10-02', { units: 'lb', entries: [{ exerciseId: 'Dumbbell_Bench_Press', name: 'Dumbbell Bench Press', region: 'upper', targetSets: 3, repMax: 12, sets: [{ weight: 50, reps: 10 }] }] })],
  })
  expect(screen.getByRole('img', { name: /from 45 to 50/ })).toBeInTheDocument()
})

test('bodyweight and timed bests show reps and seconds', () => {
  const log = testLog('2026-10-01', {
    entries: [
      { exerciseId: 'Pushups', name: 'Pushups', region: 'upper', targetSets: 3, repMax: 12, sets: [{ weight: 0, reps: 25 }] },
      { exerciseId: 'Plank', name: 'Plank', region: 'upper', targetSets: 3, repMax: 12, sets: [{ weight: 0, reps: 45 }] },
    ],
  })
  renderWithData(<Progress />, { history: [log] })
  expect(screen.getAllByText('25 reps').length).toBeGreaterThan(0)
  expect(screen.getAllByText('45 sec').length).toBeGreaterThan(0)
  expect(screen.queryByRole('heading', { name: /weight over time/i })).not.toBeInTheDocument()
})

test('a past workout opens to show what was done, with a readable date', async () => {
  renderWithData(<Progress />, { history: [testLog()] })
  const day = new Date('2026-10-01T12:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
  expect(screen.getByText(day)).toBeInTheDocument()
  await userEvent.click(screen.getByText('Full Body A', { selector: 'summary *' }))
  expect(screen.getAllByText('20 kg × 10').length).toBeGreaterThan(1)
})

test('a finished workout can be edited: change a set, add one, or delete the workout', async () => {
  const user = userEvent.setup()
  renderWithData(<Progress />, { history: [testLog()] })
  await user.click(screen.getAllByText('Full Body A')[0])
  await user.click(screen.getByRole('button', { name: /edit full body a/i }))
  const reps = screen.getByLabelText(/set 1 reps/i)
  await user.clear(reps)
  await user.type(reps, '12')
  await user.click(screen.getByRole('button', { name: /add a set/i }))
  await user.type(screen.getByLabelText(/set 2 reps/i), '9')
  await user.click(screen.getByRole('button', { name: /save changes/i }))
  expect(load().data.history[0].entries[0].sets).toEqual([{ weight: 20, reps: 12 }, { weight: 20, reps: 9 }])

  await user.click(screen.getByRole('button', { name: /edit full body a/i }))
  await user.click(screen.getByRole('button', { name: /^delete workout$/i }))
  await user.click(screen.getByRole('button', { name: /yes, delete workout/i }))
  expect(load().data.history).toEqual([])
})

test('an edit with a bad number is refused with a clear message', async () => {
  const user = userEvent.setup()
  renderWithData(<Progress />, { history: [testLog()] })
  await user.click(screen.getAllByText('Full Body A')[0])
  await user.click(screen.getByRole('button', { name: /edit full body a/i }))
  await user.clear(screen.getByLabelText(/set 1 reps/i))
  await user.click(screen.getByRole('button', { name: /save changes/i }))
  expect(screen.getByRole('alert')).toHaveTextContent(/check set 1/i)
  expect(load().data.history[0].entries[0].sets).toEqual([{ weight: 20, reps: 10 }])
})

test('swiping a workout left shows Delete, and Undo brings it back', async () => {
  const user = userEvent.setup()
  renderWithData(<Progress />, { history: [testLog('2026-10-01'), testLog('2026-10-02', { id: 'second' })] })
  const row = screen.getAllByText('Full Body A')[0].closest('.swipe-row')!
  fireEvent.pointerDown(row, { clientX: 300, clientY: 20 })
  fireEvent.pointerMove(row, { clientX: 220, clientY: 22 })
  fireEvent.pointerMove(row, { clientX: 180, clientY: 22 })
  fireEvent.pointerUp(row, { clientX: 180, clientY: 22 })
  expect(row).toHaveStyle({ transform: 'translateX(-96px)' })
  await user.click(screen.getAllByRole('button', { name: /^delete full body a/i })[0])
  expect(load().data.history.map(l => l.id)).toEqual(['2026-10-01'])
  await user.click(screen.getByRole('button', { name: /undo/i }))
  expect(load().data.history.map(l => l.id)).toEqual(['2026-10-01', 'second'])
})

test('an up-and-down scroll does not open Delete', () => {
  renderWithData(<Progress />, { history: [testLog()] })
  const row = screen.getAllByText('Full Body A')[0].closest('.swipe-row')!
  fireEvent.pointerDown(row, { clientX: 200, clientY: 100 })
  fireEvent.pointerMove(row, { clientX: 190, clientY: 200 })
  fireEvent.pointerUp(row, { clientX: 190, clientY: 200 })
  expect(row).toHaveStyle({ transform: 'translateX(0px)' })
})

test('history editing can add an exercise, switch to each arm, and remove an exercise', async () => {
  const user = userEvent.setup()
  renderWithData(<Progress />, { history: [testLog()] })
  await user.click(screen.getAllByText('Full Body A')[0])
  await user.click(screen.getByRole('button', { name: /edit full body a/i }))

  await user.click(screen.getByRole('button', { name: /\+ add an exercise/i }))
  await user.type(screen.getByRole('searchbox', { name: /search exercises/i }), 'hammer curls')
  await user.click(screen.getByRole('button', { name: 'Use Hammer Curls' }))
  await user.click(screen.getByRole('checkbox', { name: /each arm separately for hammer curls/i }))
  await user.type(screen.getAllByLabelText(/set 1 left weight/i)[0], '10')
  await user.type(screen.getAllByLabelText(/set 1 left reps/i)[0], '8')
  await user.type(screen.getAllByLabelText(/set 1 right weight/i)[0], '12')
  await user.type(screen.getAllByLabelText(/set 1 right reps/i)[0], '10')

  await user.click(screen.getByRole('button', { name: /remove dumbbell bench press from this workout/i }))
  await user.click(screen.getByRole('button', { name: /save changes/i }))
  const entries = load().data.history[0].entries
  expect(entries.map(e => e.name)).toEqual(['Hammer Curls'])
  expect(entries[0].sets[0]).toEqual({ weight: 10, reps: 8, left: { weight: 10, reps: 8 }, right: { weight: 12, reps: 10 } })
})

test('the Undo bar goes away after 5 seconds', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  renderWithData(<Progress />, { history: [testLog()] })
  const row = screen.getAllByText('Full Body A')[0].closest('.swipe-row')!
  fireEvent.pointerDown(row, { clientX: 300, clientY: 20 })
  fireEvent.pointerMove(row, { clientX: 180, clientY: 22 })
  fireEvent.pointerUp(row, { clientX: 180, clientY: 22 })
  await user.click(screen.getByRole('button', { name: /^delete full body a/i }))
  expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
  act(() => { vi.advanceTimersByTime(5100) })
  expect(screen.queryByRole('button', { name: /undo/i })).not.toBeInTheDocument()
  vi.useRealTimers()
})

test('history editing can reorder exercises into the order they were done', async () => {
  const user = userEvent.setup()
  const log = testLog()
  const curl = { ...log.entries[0], exerciseId: 'Hammer_Curls', name: 'Hammer Curls', sets: [{ weight: 10, reps: 10 }] }
  renderWithData(<Progress />, { history: [{ ...log, entries: [...log.entries, curl] }] })
  await user.click(screen.getAllByText('Full Body A')[0])
  await user.click(screen.getByRole('button', { name: /edit full body a/i }))
  screen.getByRole('button', { name: /reorder hammer curls/i }).focus()
  await user.keyboard('{ArrowUp}')
  await user.click(screen.getByRole('button', { name: /save changes/i }))
  expect(load().data.history[0].entries.map(e => e.name)).toEqual(['Hammer Curls', 'Dumbbell Bench Press'])
})
