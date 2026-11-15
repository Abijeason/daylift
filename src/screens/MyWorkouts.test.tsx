import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { App } from '../App'
import { WorkoutBuilder } from './WorkoutBuilder'
import { renderWithData, testProfile } from '../test-utils'
import { encodeShare } from '../lib/custom'
import { load, save } from '../lib/storage'
import { AppDataProvider } from '../state/useAppData'

const upper = { id: 'u1', name: 'Upper with Sam', exerciseIds: ['Dumbbell_Bench_Press', 'Pushups'] }

afterEach(() => { window.location.hash = '' })

test('the builder adds, orders and saves a named workout', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  renderWithData(<WorkoutBuilder onClose={onClose} />)
  await user.type(screen.getByLabelText(/workout name/i), 'Upper with Sam')
  await user.type(screen.getByRole('searchbox'), 'pushups')
  await user.click(screen.getByRole('button', { name: /add pushups/i }))
  await user.clear(screen.getByRole('searchbox'))
  await user.type(screen.getByRole('searchbox'), 'goblet')
  await user.click(screen.getByRole('button', { name: /add goblet squat/i }))
  await user.click(screen.getByRole('button', { name: /move goblet squat up/i }))
  await user.click(screen.getByRole('button', { name: /save workout/i }))
  const saved = load().data.customWorkouts!
  expect(saved).toHaveLength(1)
  expect(saved[0]).toMatchObject({ name: 'Upper with Sam', exerciseIds: ['Goblet_Squat', 'Pushups'] })
  expect(onClose).toHaveBeenCalled()
})

test('the builder needs a name and at least one exercise', async () => {
  renderWithData(<WorkoutBuilder onClose={vi.fn()} />)
  await userEvent.click(screen.getByRole('button', { name: /save workout/i }))
  expect(screen.getByRole('alert')).toHaveTextContent(/name/i)
  expect(load().data.customWorkouts ?? []).toHaveLength(0)
})

test('an existing workout can be edited and deleted', async () => {
  const user = userEvent.setup()
  renderWithData(<WorkoutBuilder workout={upper} onClose={vi.fn()} />, { customWorkouts: [upper] })
  expect(screen.getByLabelText(/workout name/i)).toHaveValue('Upper with Sam')
  await user.click(screen.getByRole('button', { name: /^delete$/i }))
  await user.click(screen.getByRole('button', { name: /yes, delete/i }))
  expect(load().data.customWorkouts).toEqual([])
})

test('home lists my workouts and starts one alongside the plan', async () => {
  const user = userEvent.setup()
  save({ version: 1, profile: testProfile, history: [], inProgress: null, customWorkouts: [upper] })
  render(<AppDataProvider><App /></AppDataProvider>)
  expect(screen.getByRole('heading', { name: /my workouts/i })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Full Body A' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /start upper with sam/i }))
  expect(load().data.inProgress!.plan.title).toBe('Upper with Sam')
})

test('opening a shared link offers to add the workout', async () => {
  const user = userEvent.setup()
  save({ version: 1, profile: testProfile, history: [], inProgress: null })
  window.location.hash = `#workout=${encodeShare(upper)}`
  render(<AppDataProvider><App /></AppDataProvider>)
  expect(screen.getByText(/upper with sam/i)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /add workout/i }))
  expect(load().data.customWorkouts![0]).toMatchObject({ name: 'Upper with Sam', exerciseIds: upper.exerciseIds })
  expect(window.location.hash).toBe('')
})

test('a shared exercise your gym lacks is flagged during the workout', async () => {
  const user = userEvent.setup()
  const barbell = { id: 'b1', name: 'Barbell day', exerciseIds: ['Barbell_Squat'] }
  save({ version: 1, profile: { ...testProfile, level: 'beginner' }, history: [], inProgress: null, customWorkouts: [barbell] })
  render(<AppDataProvider><App /></AppDataProvider>)
  await user.click(screen.getByRole('button', { name: /start barbell day/i }))
  await user.click(screen.getByRole('button', { name: /skip warm-up/i }))
  expect(screen.getByText(/not on your my gym list/i)).toBeInTheDocument()
  expect(screen.getByText(/above your level/i)).toBeInTheDocument()
})

test('a shared link opened while the app is already open still offers the workout', async () => {
  save({ version: 1, profile: testProfile, history: [], inProgress: null })
  render(<AppDataProvider><App /></AppDataProvider>)
  expect(screen.queryByRole('dialog', { name: /shared workout/i })).not.toBeInTheDocument()
  window.location.hash = `#workout=${encodeShare(upper)}`
  window.dispatchEvent(new HashChangeEvent('hashchange'))
  expect(await screen.findByRole('dialog', { name: /shared workout/i })).toHaveTextContent(/upper with sam/i)
})

test('when nothing can be swapped in, the flag says to skip instead', async () => {
  const user = userEvent.setup()
  const pull = { id: 'p1', name: 'Pull day', exerciseIds: ['Wide-Grip_Lat_Pulldown'] }
  save({ version: 1, profile: { ...testProfile, equipment: ['dumbbells'] }, history: [], inProgress: null, customWorkouts: [pull] })
  render(<AppDataProvider><App /></AppDataProvider>)
  await user.click(screen.getByRole('button', { name: /start pull day/i }))
  await user.click(screen.getByRole('button', { name: /skip warm-up/i }))
  expect(screen.getByText(/skip it with next exercise/i)).toBeInTheDocument()
})

test('reset puts an edited workout back the way it was', async () => {
  const user = userEvent.setup()
  renderWithData(<WorkoutBuilder workout={upper} onClose={vi.fn()} />, { customWorkouts: [upper] })
  expect(screen.queryByRole('button', { name: /^reset$/i })).not.toBeInTheDocument()
  await user.clear(screen.getByLabelText(/workout name/i))
  await user.type(screen.getByLabelText(/workout name/i), 'Changed')
  await user.click(screen.getByRole('button', { name: /remove pushups/i }))
  await user.click(screen.getByRole('button', { name: /^reset$/i }))
  await user.click(screen.getByRole('button', { name: /yes, reset/i }))
  expect(screen.getByLabelText(/workout name/i)).toHaveValue('Upper with Sam')
  expect(screen.getByRole('button', { name: /remove pushups/i })).toBeInTheDocument()
})

test('searching "bicep" in the builder offers every biceps exercise', async () => {
  const user = userEvent.setup()
  renderWithData(<WorkoutBuilder onClose={vi.fn()} />)
  await user.type(screen.getByRole('searchbox'), 'bicep')
  expect(screen.getByRole('button', { name: /add hammer curls/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /add concentration curls/i })).toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: /^add /i })).toHaveLength(6)
})
