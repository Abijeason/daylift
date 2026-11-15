import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { App } from '../App'
import { encodePlan, WEEKDAYS, weekdayIndex } from '../lib/custom'
import { encodeFriend, snapshot } from '../lib/friends'
import { load, save } from '../lib/storage'
import { AppDataProvider } from '../state/useAppData'
import { testLog, testProfile } from '../test-utils'

afterEach(() => { window.location.hash = '' })

const start = (data = {}) => {
  save({ version: 1, profile: testProfile, history: [], inProgress: null, ...data })
  render(<AppDataProvider><App /></AppDataProvider>)
}

test('a friend\'s progress link saves them to Friends', async () => {
  const user = userEvent.setup()
  const friend = snapshot({ version: 1, profile: { ...testProfile, goal: 'buildMuscle' }, history: [testLog()], inProgress: null }, { id: 'sam', name: 'Sam' }, new Date())
  window.location.hash = `#friend=${encodeFriend(friend)}`
  start()
  await user.click(screen.getByRole('button', { name: /save to friends/i }))
  expect(screen.getByRole('heading', { name: /progress/i })).toBeInTheDocument()
  expect(screen.getByText('Sam')).toBeInTheDocument()
  expect(screen.getByText(/build muscle/i)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /remove sam/i }))
  expect(load().data.friends).toEqual([])
})

test('sharing my progress needs a name and remembers it', async () => {
  const user = userEvent.setup()
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.resolve() }, configurable: true })
  start()
  await user.click(screen.getByRole('button', { name: 'Progress' }))
  await user.click(screen.getByRole('button', { name: /share my progress/i }))
  expect(screen.getByRole('status')).toHaveTextContent(/add your name/i)
  await user.type(screen.getByLabelText(/your name for friends/i), 'Abi')
  await user.click(screen.getByRole('button', { name: /share my progress/i }))
  expect(load().data.me).toMatchObject({ name: 'Abi' })
  expect(await screen.findByRole('status')).toHaveTextContent(/link copied/i)
})

test('opening a new screen starts at the top', async () => {
  const user = userEvent.setup()
  start()
  vi.mocked(window.scrollTo).mockClear()
  await user.click(screen.getByRole('button', { name: 'Exercises' }))
  expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  await user.type(screen.getByRole('searchbox'), 'pushups')
  vi.mocked(window.scrollTo).mockClear()
  await user.click(screen.getAllByRole('button', { name: /pushups/i })[0])
  expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
})


const today = weekdayIndex(new Date())
const tomorrow = (today + 1) % 7
const week = (fill: Record<number, string>) => Array.from({ length: 7 }, (_, i) => fill[i] ?? null)

test('I pick a workout for today in my Monday to Sunday week, and Home follows it', async () => {
  const user = userEvent.setup()
  start()
  await user.click(screen.getByRole('button', { name: /customise plan/i }))
  await user.click(screen.getByRole('button', { name: /i pick/i }))
  expect(screen.getAllByText('Rest')).toHaveLength(7)
  await user.click(screen.getByRole('button', { name: `Change ${WEEKDAYS[today]}` }))
  await user.click(screen.getByRole('button', { name: /\+ upper body/i }))
  const saved = load().data
  const upper = saved.customWorkouts![0]
  expect(upper).toMatchObject({ name: 'Upper Body', plan: true })
  expect(saved.planWeek![today]).toBe(upper.id)
  expect(saved.planWeek!.filter(Boolean)).toHaveLength(1)
  await user.click(screen.getByRole('button', { name: /done/i }))
  expect(screen.getByRole('heading', { level: 1, name: /upper body/i })).toBeInTheDocument()
  // Plan days stay out of My workouts.
  expect(screen.queryByRole('button', { name: /start upper body/i })).not.toBeInTheDocument()
})

test('a rest day shows what is next and when', () => {
  const lower = { id: 'l1', name: 'Lower', exerciseIds: ['Goblet_Squat'], plan: true }
  start({ customWorkouts: [lower], planWeek: week({ [tomorrow]: 'l1' }), planMode: 'custom' })
  expect(screen.getByRole('heading', { level: 1, name: /rest day/i })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /up next: lower, tomorrow/i })).toBeInTheDocument()
})

test('switching back to Daylift picks keeps my week for later', async () => {
  const user = userEvent.setup()
  const upper = { id: 'u1', name: 'Upper', exerciseIds: ['Pushups'], plan: true }
  start({ customWorkouts: [upper], planWeek: week({ [today]: 'u1' }), planMode: 'custom' })
  await user.click(screen.getByRole('button', { name: /my plan/i }))
  await user.click(screen.getByRole('button', { name: /daylift picks/i }))
  await user.click(screen.getByRole('button', { name: /done/i }))
  expect(screen.getByRole('heading', { level: 1, name: /full body a/i })).toBeInTheDocument()
  expect(load().data.planWeek![today]).toBe('u1')
})

test('I can create my own workout for a day, and it stays out of My workouts', async () => {
  const user = userEvent.setup()
  start({ planMode: 'custom' })
  await user.click(screen.getByRole('button', { name: /customise plan/i }))
  await user.click(screen.getByRole('button', { name: `Change ${WEEKDAYS[today]}` }))
  await user.click(screen.getByRole('button', { name: /create your own/i }))
  await user.type(screen.getByLabelText(/workout name/i), 'Arms with Sam')
  await user.type(screen.getByRole('searchbox'), 'pushups')
  await user.click(screen.getByRole('button', { name: 'Add Pushups' }))
  await user.click(screen.getByRole('button', { name: /save workout/i }))
  expect(screen.getByRole('heading', { name: /your plan/i })).toBeInTheDocument()
  expect(screen.getByText('Arms with Sam')).toBeInTheDocument()
  const saved = load().data
  expect(saved.customWorkouts![0]).toMatchObject({ name: 'Arms with Sam', plan: true })
  expect(saved.planWeek![today]).toBe(saved.customWorkouts![0].id)
  await user.click(screen.getByRole('button', { name: `Edit ${WEEKDAYS[today]}` }))
  expect(screen.getByLabelText(/workout name/i)).toHaveValue('Arms with Sam')
})

test('copying one of my workouts into the plan leaves the original alone', async () => {
  const user = userEvent.setup()
  const arms = { id: 'm1', name: 'Arms', exerciseIds: ['Pushups'] }
  start({ customWorkouts: [arms], planMode: 'custom' })
  await user.click(screen.getByRole('button', { name: /customise plan/i }))
  await user.click(screen.getByRole('button', { name: `Change ${WEEKDAYS[today]}` }))
  await user.click(screen.getByRole('button', { name: 'Copy Arms' }))
  const saved = load().data
  expect(saved.customWorkouts).toHaveLength(2)
  expect(saved.customWorkouts![0]).toEqual(arms)
  expect(saved.customWorkouts![1]).toMatchObject({ name: 'Arms', plan: true })
})

test('a friend\'s plan link sets up the same week, rest days included', async () => {
  const user = userEvent.setup()
  const upper = { id: 'x', name: 'Upper', exerciseIds: ['Pushups'] }
  const lower = { id: 'y', name: 'Lower', exerciseIds: ['Goblet_Squat'] }
  window.location.hash = `#plan=${encodePlan([upper, lower, null, upper, lower, null, null])}`
  start()
  const card = screen.getByRole('dialog', { name: /shared plan/i })
  expect(card).toHaveTextContent('Mon Upper · Tue Lower · Wed Rest · Thu Upper · Fri Lower · Sat Rest · Sun Rest')
  await user.click(within(card).getByRole('button', { name: /use this plan/i }))
  const saved = load().data
  expect(saved.planMode).toBe('custom')
  expect(saved.customWorkouts!.map(w => [w.name, w.plan])).toEqual([['Upper', true], ['Lower', true]])
  expect(saved.planWeek!.map(id => saved.customWorkouts!.find(w => w.id === id)?.name ?? null)).toEqual(['Upper', 'Lower', null, 'Upper', 'Lower', null, null])
  expect(window.location.hash).toBe('')
})

test('reset plan makes every day rest and keeps my own workouts', async () => {
  const user = userEvent.setup()
  const upper = { id: 'u1', name: 'Upper', exerciseIds: ['Pushups'], plan: true }
  const arms = { id: 'm1', name: 'Arms', exerciseIds: ['Pushups'] }
  start({ customWorkouts: [upper, arms], planWeek: week({ [today]: 'u1' }), planMode: 'custom' })
  await user.click(screen.getByRole('button', { name: /my plan/i }))
  await user.click(screen.getByRole('button', { name: /reset plan/i }))
  await user.click(screen.getByRole('button', { name: /yes, reset plan/i }))
  expect(load().data.planWeek).toEqual(Array(7).fill(null))
  expect(load().data.customWorkouts).toEqual([arms])
})
