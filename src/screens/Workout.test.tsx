import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Workout } from './Workout'
import { renderWithData, testProfile } from '../test-utils'
import { buildWorkout } from '../lib/planner'
import { load } from '../lib/storage'
import { newSession } from '../lib/session'
import { AppDataProvider } from '../state/useAppData'
import { exercises } from '../data'

const plan = buildWorkout(testProfile, 'fullA', exercises)
const session = (over = {}) => ({ ...newSession(plan, 'kg', new Date('2026-11-02T10:00:00')), ...over })
const atFirst = () => session({ exerciseIndex: 0 })

async function logSet(weight: string, reps: string) {
  const user = userEvent.setup()
  const w = screen.queryByLabelText(/^weight/i)
  if (w) { await user.clear(w); await user.type(w, weight) }
  await user.clear(screen.getByLabelText(/reps/i))
  await user.type(screen.getByLabelText(/reps/i), reps)
  await user.click(screen.getByRole('button', { name: /finish set/i }))
}

test('warm-up can be skipped', async () => {
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: session() })
  expect(screen.getByRole('heading', { name: /warm-up/i })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /skip warm-up/i }))
  expect(screen.getByRole('heading', { name: plan.exercises[0].name })).toBeInTheDocument()
})

test('finishing a set saves it and starts rest', async () => {
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  await logSet('20', '10')
  const saved = load().data.inProgress!
  expect(saved.log.entries[0].sets).toEqual([{ weight: 20, reps: 10 }])
  expect(saved.restEndsAt).not.toBeNull()
  expect(screen.getByRole('timer')).toBeInTheDocument()
})

test('invalid weight is refused with a clear message', async () => {
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  await logSet('abc', '10')
  expect(screen.getByRole('alert')).toHaveTextContent(/weight/i)
  expect(load().data.inProgress!.log.entries[0].sets).toEqual([])
})

test('bodyweight exercise needs only reps', async () => {
  const bw = exercises.find(e => e.id === 'Pushups')!
  const p = { ...plan, exercises: [bw, ...plan.exercises.slice(1)] }
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: { ...newSession(p, 'kg', new Date()), exerciseIndex: 0 } })
  expect(screen.queryByLabelText(/weight/i)).not.toBeInTheDocument()
  await logSet('', '12')
  expect(load().data.inProgress!.log.entries[0].sets).toEqual([{ weight: 0, reps: 12 }])
})

test('swap replaces the exercise', async () => {
  const user = userEvent.setup()
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  await user.click(screen.getByRole('button', { name: /swap/i }))
  await user.click(screen.getAllByRole('button', { name: /use /i })[0])
  expect(screen.queryByRole('heading', { name: plan.exercises[0].name })).not.toBeInTheDocument()
})

test('a reload resumes at the same exercise', async () => {
  const { unmount } = renderWithData(<Workout onExit={vi.fn()} />, { inProgress: session({ exerciseIndex: 1 }) })
  unmount()
  render(<AppDataProvider><Workout onExit={vi.fn()} /></AppDataProvider>)
  expect(screen.getByRole('heading', { name: plan.exercises[1].name })).toBeInTheDocument()
})

test('finish adds a log and clears in-progress', async () => {
  const user = userEvent.setup()
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  await logSet('20', '10')
  await user.click(screen.getByRole('button', { name: /skip rest/i }))
  await user.click(screen.getByRole('button', { name: /end workout/i }))
  expect(load().data.history).toHaveLength(0)
  await user.click(screen.getByRole('button', { name: /yes, end/i }))
  expect(load().data.history).toHaveLength(1)
  expect(load().data.inProgress).toBeNull()
  expect(screen.getByRole('heading', { name: /workout complete/i })).toBeInTheDocument()
})

test('finishing with no sets adds no log', async () => {
  const onExit = vi.fn()
  renderWithData(<Workout onExit={onExit} />, { inProgress: atFirst() })
  await userEvent.click(screen.getByRole('button', { name: /end workout/i }))
  await userEvent.click(screen.getByRole('button', { name: /yes, end/i }))
  expect(load().data.history).toHaveLength(0)
  expect(onExit).toHaveBeenCalled()
})

test('an expired timer shows as finished, not negative', () => {
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: session({ exerciseIndex: 0, restEndsAt: 1000 }) })
  expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  expect(screen.getByLabelText(/reps/i)).toBeInTheDocument()
})

test('shows a one-time locked phone timer note', async () => {
  const { unmount } = renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  await logSet('20', '10')
  expect(screen.getByText(/locked/i)).toBeInTheDocument()
  unmount()
  render(<AppDataProvider><Workout onExit={vi.fn()} /></AppDataProvider>)
  expect(screen.queryByText(/locked/i)).not.toBeInTheDocument()
})

test('cardio finisher appears for lose weight', () => {
  const lose = buildWorkout({ ...testProfile, goal: 'loseWeight' }, 'fullA', exercises)
  renderWithData(<Workout onExit={vi.fn()} />, {
    inProgress: { ...newSession(lose, 'kg', new Date()), exerciseIndex: lose.exercises.length },
  })
  expect(screen.getByRole('heading', { name: /cardio/i })).toBeInTheDocument()
  expect(screen.getByText(/10 minutes/i)).toBeInTheDocument()
})

test('summary shows the streak', async () => {
  const user = userEvent.setup()
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  await logSet('20', '10')
  await user.click(screen.getByRole('button', { name: /end workout/i }))
  await user.click(screen.getByRole('button', { name: /yes, end/i }))
  expect(screen.getByText(/week streak/i)).toBeInTheDocument()
})

test('swap list closes after a set, so logged sets cannot be wiped', async () => {
  const user = userEvent.setup()
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  await user.click(screen.getByRole('button', { name: /swap/i }))
  await logSet('20', '10')
  await user.click(screen.getByRole('button', { name: /skip rest/i }))
  expect(screen.queryAllByRole('button', { name: /^use /i })).toHaveLength(0)
})

test('the next set keeps the last weight', async () => {
  const user = userEvent.setup()
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  await logSet('20', '10')
  await user.click(screen.getByRole('button', { name: /skip rest/i }))
  expect(screen.getByLabelText(/weight/i)).toHaveValue('20')
})

test('a timed exercise asks for seconds', () => {
  const plank = exercises.find(e => e.id === 'Plank')!
  const p = { ...plan, exercises: [plank, ...plan.exercises.slice(1)] }
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: { ...newSession(p, 'kg', new Date()), exerciseIndex: 0 } })
  expect(screen.getByText(/hold 20/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/seconds/i)).toBeInTheDocument()
  expect(screen.queryByText(/8–12 reps/)).not.toBeInTheDocument()
})

test('band exercises need no weight', () => {
  const band = exercises.find(e => e.id === 'Band_Pull_Apart')!
  const p = { ...plan, exercises: [band, ...plan.exercises.slice(1)] }
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: { ...newSession(p, 'kg', new Date()), exerciseIndex: 0 } })
  expect(screen.queryByLabelText(/weight/i)).not.toBeInTheDocument()
})

test('watch form links to YouTube', () => {
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  expect(screen.getByRole('link', { name: /watch form/i })).toHaveAttribute('href', expect.stringContaining('youtube.com'))
})

test('no timer note after rest is skipped keeps act clean', async () => {
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  await logSet('20', '10')
  await act(async () => { await userEvent.click(screen.getByRole('button', { name: /skip rest/i })) })
  expect(screen.queryByRole('timer')).not.toBeInTheDocument()
})
