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

test('change exercise replaces it with a suggestion', async () => {
  const user = userEvent.setup()
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  await user.click(screen.getByRole('button', { name: /change exercise/i }))
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
  expect(screen.getByText(/this week/i)).toBeInTheDocument()
})

test('the change list closes after a set, so logged sets are not wiped by accident', async () => {
  const user = userEvent.setup()
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  await user.click(screen.getByRole('button', { name: /change exercise/i }))
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

test('the workout shows which muscles the exercise works', () => {
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  expect(screen.getByRole('region', { name: /muscles worked/i })).toBeInTheDocument()
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

test('the set form comes before the exercise photo', () => {
  const { container } = renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  const form = container.querySelector('.set-form')!
  const photo = container.querySelector('.form-demo')!
  expect(form.compareDocumentPosition(photo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

test('logged sets are listed and a mistake can be removed', async () => {
  const user = userEvent.setup()
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  await logSet('125', '10')
  await user.click(screen.getByRole('button', { name: /skip rest/i }))
  expect(screen.getByText('125 kg × 10')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /remove set 1/i }))
  expect(load().data.inProgress!.log.entries[0].sets).toEqual([])
})

test('you can go back to the previous exercise and skip ahead', async () => {
  const user = userEvent.setup()
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: session({ exerciseIndex: 1 }) })
  await user.click(screen.getByRole('button', { name: /previous exercise/i }))
  expect(screen.getByRole('heading', { name: plan.exercises[0].name })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /next exercise/i }))
  expect(screen.getByRole('heading', { name: plan.exercises[1].name })).toBeInTheDocument()
})

test('shows what you lifted last time', () => {
  const first = plan.exercises[0]
  const past = { id: 'p', type: 'fullA' as const, units: 'kg' as const, startedAt: '2026-10-01T10:00:00.000Z', finishedAt: '2026-10-01T11:00:00.000Z',
    entries: [{ exerciseId: first.id, name: first.name, region: first.region, targetSets: 3, repMax: 12, sets: [{ weight: 20, reps: 10 }] }] }
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst(), history: [past] })
  expect(screen.getByText(/last time: 20 kg × 10/i)).toBeInTheDocument()
})

test('the rest screen says what comes next', async () => {
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  await logSet('20', '10')
  expect(screen.getByText(new RegExp(`next: ${plan.exercises[0].name}, set 2 of`, 'i'))).toBeInTheDocument()
})

test('the summary lists what you did and this week, with correct grammar', async () => {
  const user = userEvent.setup()
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: { ...newSession(plan, 'kg', new Date()), exerciseIndex: 0 } })
  await logSet('20', '10')
  await user.click(screen.getByRole('button', { name: /skip rest/i }))
  await user.click(screen.getByRole('button', { name: /end workout/i }))
  await user.click(screen.getByRole('button', { name: /yes, end/i }))
  expect(screen.getByText(plan.exercises[0].name)).toBeInTheDocument()
  expect(screen.getByText('20 kg × 10')).toBeInTheDocument()
  expect(screen.getByText(/this week/i)).toBeInTheDocument()
  expect(screen.getByText('minute')).toBeInTheDocument()
})

test('a zero weight is explained clearly', async () => {
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  await logSet('0', '10')
  expect(screen.getByRole('alert')).toHaveTextContent(/more than 0/i)
})

test('finishing a set closes the phone keyboard', async () => {
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  const reps = screen.getByLabelText(/reps/i)
  await logSet('20', '10')
  expect(document.activeElement).not.toBe(reps)
  expect(document.activeElement?.tagName).not.toBe('INPUT')
})

test('once I have a name for friends, the summary offers to send my progress', async () => {
  const user = userEvent.setup()
  renderWithData(<Workout onExit={vi.fn()} />, { me: { id: 'f1', name: 'Abi' }, inProgress: { ...newSession(plan, 'kg', new Date()), exerciseIndex: 0 } })
  await logSet('20', '10')
  await user.click(screen.getByRole('button', { name: /skip rest/i }))
  await user.click(screen.getByRole('button', { name: /end workout/i }))
  await user.click(screen.getByRole('button', { name: /yes, end/i }))
  await user.click(screen.getByRole('button', { name: /send progress to friends/i }))
  expect(await screen.findByRole('status')).toHaveTextContent(/link copied/i)
  // user-event provides the test clipboard.
  expect(await navigator.clipboard.readText()).toContain('#friend=')
})

test('each arm can be logged separately', async () => {
  const user = userEvent.setup()
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  await user.click(screen.getByRole('checkbox', { name: /each arm separately/i }))
  for (const [label, value] of [[/left weight/i, '12'], [/left reps/i, '8'], [/right weight/i, '14'], [/right reps/i, '10']] as const) {
    await user.clear(screen.getByLabelText(label))
    await user.type(screen.getByLabelText(label), value)
  }
  await user.click(screen.getByRole('button', { name: /finish set/i }))
  expect(load().data.inProgress!.log.entries[0].sets[0]).toEqual({ weight: 12, reps: 8, left: { weight: 12, reps: 8 }, right: { weight: 14, reps: 10 } })
})

test('a cable exercise saves the attachment used', async () => {
  const user = userEvent.setup()
  const cable = exercises.find(e => e.id === 'Triceps_Pushdown')!
  const cablePlan = { ...plan, exercises: [cable] }
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: { ...newSession(cablePlan, 'kg', new Date()), exerciseIndex: 0 } })
  await user.selectOptions(screen.getByLabelText(/attachment/i), 'Rope')
  await logSet('20', '10')
  expect(load().data.inProgress!.log.entries[0].attachment).toBe('Rope')
})

test('ending by mistake can be undone from the summary', async () => {
  const user = userEvent.setup()
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: { ...newSession(plan, 'kg', new Date()), exerciseIndex: 0 } })
  await logSet('20', '10')
  await user.click(screen.getByRole('button', { name: /skip rest/i }))
  await user.click(screen.getByRole('button', { name: /end workout/i }))
  await user.click(screen.getByRole('button', { name: /yes, end/i }))
  expect(load().data.history).toHaveLength(1)
  await user.click(screen.getByRole('button', { name: /resume workout/i }))
  const saved = load().data
  expect(saved.history).toHaveLength(0)
  expect(saved.inProgress!.log.entries[0].sets).toHaveLength(1)
  expect(screen.getByRole('heading', { name: plan.exercises[0].name })).toBeInTheDocument()
})

test('mid-workout, exercises can be done in any order, added and removed', async () => {
  const user = userEvent.setup()
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  const last = plan.exercises[plan.exercises.length - 1]
  await user.click(screen.getByText(/all exercises/i))
  await user.click(screen.getByRole('button', { name: `Go to ${last.name}` }))
  expect(screen.getByRole('heading', { name: last.name })).toBeInTheDocument()

  await user.click(screen.getByText(/all exercises/i))
  await user.click(screen.getByRole('button', { name: /add an exercise/i }))
  await user.type(screen.getByRole('searchbox', { name: /search exercises/i }), 'hammer curls')
  await user.click(screen.getByRole('button', { name: 'Use Hammer Curls' }))
  expect(screen.getByRole('heading', { name: 'Hammer Curls' })).toBeInTheDocument()

  await user.click(screen.getByText(/all exercises/i))
  await user.click(screen.getByRole('button', { name: `Remove ${plan.exercises[0].name} from this workout` }))
  await user.click(screen.getByRole('button', { name: /yes, remove/i }))
  const names = load().data.inProgress!.plan.exercises.map(e => e.name)
  expect(names).not.toContain(plan.exercises[0].name)
  expect(names[names.length - 1]).toBe('Hammer Curls')
})

test('change exercise can pick any exercise, and warns that logged sets go', async () => {
  const user = userEvent.setup()
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  await logSet('20', '10')
  await user.click(screen.getByRole('button', { name: /skip rest/i }))
  await user.click(screen.getByRole('button', { name: /change exercise/i }))
  expect(screen.getByText(/1 logged set .* will be removed/i)).toBeInTheDocument()
  await user.type(screen.getByRole('searchbox', { name: /search exercises/i }), 'preacher curl')
  await user.click(screen.getByRole('button', { name: 'Use Preacher Curl' }))
  expect(screen.getByRole('heading', { name: 'Preacher Curl' })).toBeInTheDocument()
  expect(load().data.inProgress!.log.entries[0].sets).toEqual([])
})

test('the set starts filled in, so a repeat set is one tap, and -/+ adjust it', async () => {
  const user = userEvent.setup()
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  // First set ever: reps start at the bottom of the target range.
  expect(screen.getByLabelText(/^reps/i)).toHaveValue(String(plan.prescription.repMin))
  await logSet('20', '10')
  await user.click(screen.getByRole('button', { name: /skip rest/i }))
  // The next set repeats the last one.
  expect(screen.getByLabelText(/^weight/i)).toHaveValue('20')
  expect(screen.getByLabelText(/^reps/i)).toHaveValue('10')
  await user.click(screen.getByRole('button', { name: '+2.5 kg' }))
  await user.click(screen.getByRole('button', { name: '-1 rep' }))
  await user.click(screen.getByRole('button', { name: /finish set/i }))
  expect(load().data.inProgress!.log.entries[0].sets[1]).toEqual({ weight: 22.5, reps: 9 })
})

test('a removed set can be put back with Undo', async () => {
  const user = userEvent.setup()
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: atFirst() })
  await logSet('20', '10')
  await user.click(screen.getByRole('button', { name: /skip rest/i }))
  await user.click(screen.getByRole('button', { name: /remove set 1/i }))
  expect(load().data.inProgress!.log.entries[0].sets).toEqual([])
  await user.click(screen.getByRole('button', { name: /undo/i }))
  expect(load().data.inProgress!.log.entries[0].sets).toEqual([{ weight: 20, reps: 10 }])
})

test('each arm separately only shows where one arm can be loaded on its own', async () => {
  const user = userEvent.setup()
  const barbell = exercises.find(e => e.id === 'Barbell_Squat')!
  const curl = exercises.find(e => e.id === 'Dumbbell_Bicep_Curl')!
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: { ...newSession({ ...plan, exercises: [barbell, curl] }, 'kg', new Date()), exerciseIndex: 0 } })
  expect(screen.queryByRole('checkbox', { name: /each arm separately/i })).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /next exercise/i }))
  expect(screen.getByRole('checkbox', { name: /each arm separately/i })).toBeInTheDocument()
})

test('pressing Next on the last exercise can be undone, and the end screen is honest', async () => {
  const user = userEvent.setup()
  const last = plan.exercises.length - 1
  renderWithData(<Workout onExit={vi.fn()} />, { inProgress: session({ exerciseIndex: last }) })
  await user.click(screen.getByRole('button', { name: /next exercise/i }))
  expect(screen.queryByRole('heading', { name: /all sets done/i })).not.toBeInTheDocument()
  expect(screen.getByText(/sets still to do/i)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /back to/i }))
  expect(screen.getByRole('heading', { name: plan.exercises[0].name })).toBeInTheDocument()
})
