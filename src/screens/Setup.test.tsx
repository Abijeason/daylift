import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Setup } from './Setup'
import { PRESETS } from '../lib/planner'

async function pick(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await user.click(screen.getByRole('button', { name }))
}

test('walks through setup and returns a profile', async () => {
  const user = userEvent.setup()
  const onDone = vi.fn()
  render(<Setup onDone={onDone} />)
  await pick(user, /not sure yet/i)
  await pick(user, /^beginner/i)
  await pick(user, /^3 days/i)
  await pick(user, /^short/i)
  await pick(user, /dumbbells only/i)
  await pick(user, /continue/i)
  await pick(user, /i understand/i)
  expect(onDone).toHaveBeenCalledWith({
    goal: 'fitLean', level: 'beginner', daysPerWeek: 3, length: 'short', equipment: PRESETS.dumbbells, units: 'kg',
  })
})

test('only offers days allowed for the goal and level', async () => {
  const user = userEvent.setup()
  render(<Setup onDone={vi.fn()} />)
  await pick(user, /build muscle/i)
  await pick(user, /brand new/i)
  expect(screen.getByRole('button', { name: /^3 days/i })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /^4 days/i })).not.toBeInTheDocument()
})

test('cannot finish before the safety note is accepted', async () => {
  const user = userEvent.setup()
  const onDone = vi.fn()
  render(<Setup onDone={onDone} />)
  await pick(user, /not sure yet/i)
  await pick(user, /^beginner/i)
  await pick(user, /^3 days/i)
  await pick(user, /^standard/i)
  await pick(user, /continue/i)
  expect(screen.getByText(/not medical advice/i)).toBeInTheDocument()
  expect(onDone).not.toHaveBeenCalled()
})

test('equipment can be tapped on and off', async () => {
  const user = userEvent.setup()
  render(<Setup onDone={vi.fn()} />)
  await pick(user, /not sure yet/i)
  await pick(user, /^beginner/i)
  await pick(user, /^3 days/i)
  await pick(user, /^short/i)
  const item = screen.getByRole('button', { name: /leg press/i })
  expect(item).toHaveAttribute('aria-pressed', 'false')
  await user.click(item)
  expect(item).toHaveAttribute('aria-pressed', 'true')
})
