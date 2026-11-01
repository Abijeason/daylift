import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Today } from './Today'
import { renderWithData, testLog, testProfile } from '../test-utils'
import { buildWorkout } from '../lib/planner'
import { newSession } from '../lib/session'
import { exercises } from '../data'

const props = { onStart: vi.fn(), onResume: vi.fn() }
const yesterday = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return testLog(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
}

test('shows workout, time and streak', () => {
  renderWithData(<Today {...props} />)
  expect(screen.getByRole('heading', { name: 'Full Body A' })).toBeInTheDocument()
  expect(screen.getByText(/min/)).toBeInTheDocument()
  expect(screen.getByText(/week streak/i)).toBeInTheDocument()
})

test('start passes the planned workout', async () => {
  const onStart = vi.fn()
  renderWithData(<Today onStart={onStart} onResume={vi.fn()} />)
  await userEvent.click(screen.getByRole('button', { name: /start workout/i }))
  expect(onStart.mock.calls[0][0].type).toBe('fullA')
})

test('rest day shows message and Train anyway', () => {
  renderWithData(<Today {...props} />, { history: [yesterday()] })
  expect(screen.getByRole('heading', { name: /rest day/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /train anyway/i })).toBeInTheDocument()
})

test('shows Resume when a workout is in progress', () => {
  const plan = buildWorkout(testProfile, 'fullA', exercises)
  renderWithData(<Today {...props} />, {
    inProgress: newSession(plan, 'kg', new Date()),
  })
  expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument()
})

test('shows the install tip unless running standalone', () => {
  renderWithData(<Today {...props} />)
  expect(screen.getByText(/home screen/i)).toBeInTheDocument()
})

test('shows the eating tip only for build muscle and lose weight', () => {
  const { unmount } = renderWithData(<Today {...props} />)
  expect(screen.queryByText(/protein/i)).not.toBeInTheDocument()
  unmount()
  renderWithData(<Today {...props} />, { profile: { ...testProfile, goal: 'buildMuscle', daysPerWeek: 4 } })
  expect(screen.getByText(/protein/i)).toBeInTheDocument()
})
