import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../App'
import { encodePlan } from '../lib/custom'
import { encodeFriend, snapshot } from '../lib/friends'
import { load, save } from '../lib/storage'
import { AppDataProvider } from '../state/useAppData'
import { testLog, testProfile } from '../test-utils'

afterEach(() => { window.location.hash = '' })

const start = (data = {}) => {
  save({ version: 1, profile: testProfile, history: [], inProgress: null, ...data })
  render(<AppDataProvider><App /></AppDataProvider>)
}

test('I can pick my own days, and Home follows them', async () => {
  const user = userEvent.setup()
  start()
  await user.click(screen.getByRole('button', { name: /customise plan/i }))
  await user.click(screen.getByRole('button', { name: /i pick/i }))
  await user.click(screen.getByRole('button', { name: /\+ upper body/i }))
  await user.click(screen.getByRole('button', { name: /\+ lower body/i }))
  await user.click(screen.getByRole('button', { name: /\+ upper body/i }))
  const saved = load().data
  expect(saved.planMode).toBe('custom')
  expect(saved.customWorkouts).toHaveLength(2)
  expect(saved.planDays).toEqual([saved.customWorkouts![0].id, saved.customWorkouts![1].id, saved.customWorkouts![0].id])
  await user.click(screen.getByRole('button', { name: /done/i }))
  expect(screen.getByRole('heading', { level: 1, name: /upper body/i })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /start workout/i }))
  expect(load().data.inProgress!.log.planDay).toBe(0)
})

test('switching back to Daylift picks keeps my days for later', async () => {
  const user = userEvent.setup()
  const upper = { id: 'u1', name: 'Upper with Sam', exerciseIds: ['Pushups'] }
  start({ customWorkouts: [upper], planDays: ['u1'], planMode: 'custom' })
  await user.click(screen.getByRole('button', { name: /my plan/i }))
  await user.click(screen.getByRole('button', { name: /daylift picks/i }))
  await user.click(screen.getByRole('button', { name: /done/i }))
  expect(screen.getByRole('heading', { level: 1, name: /full body a/i })).toBeInTheDocument()
  expect(load().data.planDays).toEqual(['u1'])
})

test('a friend\'s plan link sets up the same days', async () => {
  const user = userEvent.setup()
  const upper = { id: 'x', name: 'Upper', exerciseIds: ['Pushups'] }
  const lower = { id: 'y', name: 'Lower', exerciseIds: ['Goblet_Squat'] }
  window.location.hash = `#plan=${encodePlan([upper, lower, upper, lower])}`
  start()
  const card = screen.getByRole('dialog', { name: /shared plan/i })
  expect(card).toHaveTextContent('Upper → Lower → Upper → Lower')
  await user.click(within(card).getByRole('button', { name: /use this plan/i }))
  const saved = load().data
  expect(saved.planMode).toBe('custom')
  expect(saved.customWorkouts!.map(w => w.name)).toEqual(['Upper', 'Lower'])
  expect(saved.planDays).toHaveLength(4)
  expect(window.location.hash).toBe('')
})

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
