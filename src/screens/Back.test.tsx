import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../App'
import { save } from '../lib/storage'
import { AppDataProvider } from '../state/useAppData'
import { testProfile } from '../test-utils'

const start = (profile: typeof testProfile | null = testProfile) => {
  save({ version: 1, profile, history: [], inProgress: null })
  render(<AppDataProvider><App /></AppDataProvider>)
}

// The phone's back gesture and Safari's back button both fire history.back().
const pressBack = () => history.back()

test('back closes the plan screen, then leaves the tab for Home', async () => {
  const user = userEvent.setup()
  start()
  await user.click(screen.getByRole('button', { name: /customise plan/i }))
  expect(screen.getByRole('heading', { name: /your plan/i })).toBeInTheDocument()
  pressBack()
  expect(await screen.findByRole('button', { name: /customise plan/i })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Progress' }))
  pressBack()
  expect(await screen.findByRole('button', { name: /customise plan/i })).toBeInTheDocument()
})

test('back from an exercise returns to the list', async () => {
  const user = userEvent.setup()
  start()
  await user.click(screen.getByRole('button', { name: 'Exercises' }))
  await user.type(screen.getByRole('searchbox'), 'pushups')
  await user.click(screen.getAllByRole('button', { name: /pushups/i })[0])
  expect(screen.getByRole('button', { name: /^back$/i })).toBeInTheDocument()
  pressBack()
  expect(await screen.findByRole('searchbox')).toBeInTheDocument()
})

test('in-app buttons and back stay in step, so back never skips a screen', async () => {
  const user = userEvent.setup()
  start()
  await user.click(screen.getByRole('button', { name: /customise plan/i }))
  await user.click(screen.getByRole('button', { name: /done/i }))
  await user.click(screen.getByRole('button', { name: 'Exercises' }))
  await user.type(screen.getByRole('searchbox'), 'pushups')
  await user.click(screen.getAllByRole('button', { name: /pushups/i })[0])
  pressBack()
  expect(await screen.findByRole('searchbox')).toBeInTheDocument()
  pressBack()
  expect(await screen.findByRole('button', { name: /customise plan/i })).toBeInTheDocument()
})

test('back during setup goes to the previous question', async () => {
  const user = userEvent.setup()
  start(null)
  await user.click(screen.getByRole('button', { name: /get started/i }))
  const first = screen.getByRole('heading', { level: 1 }).textContent
  await user.click(screen.getAllByRole('button').find(b => b.className.includes('option'))!)
  expect(screen.getByRole('heading', { level: 1 }).textContent).not.toBe(first)
  pressBack()
  await screen.findByRole('heading', { level: 1, name: first! })
})
