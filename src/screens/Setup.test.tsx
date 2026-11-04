import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Setup } from './Setup'
import { existsSync } from 'node:fs'
import { PRESETS } from '../lib/planner'
import { EQUIPMENT_PHOTOS } from '../lib/rules'
import { EQUIPMENT } from '../types'

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
  await pick(user, /^kilograms/i)
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
  await pick(user, /^kilograms/i)
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
  await pick(user, /^kilograms/i)
  const item = screen.getByRole('button', { name: /leg press/i })
  expect(item).toHaveAttribute('aria-pressed', 'false')
  await user.click(item)
  expect(item).toHaveAttribute('aria-pressed', 'true')
})

test('every equipment item has a photo that exists', () => {
  EQUIPMENT.forEach(item => expect(existsSync(`public/exercises/${EQUIPMENT_PHOTOS[item]}`)).toBe(true))
})

test('equipment tiles show a photo beside their name', async () => {
  const user = userEvent.setup()
  const { container } = render(<Setup onDone={vi.fn()} />)
  await pick(user, /not sure yet/i)
  await pick(user, /^beginner/i)
  await pick(user, /^3 days/i)
  await pick(user, /^short/i)
  await pick(user, /^kilograms/i)
  expect(container.querySelectorAll('.tile img')).toHaveLength(EQUIPMENT.length)
  expect(screen.getByRole('button', { name: 'Leg press' })).toBeInTheDocument()
})

test('pounds can be chosen during setup', async () => {
  const user = userEvent.setup()
  const onDone = vi.fn()
  render(<Setup onDone={onDone} />)
  await pick(user, /not sure yet/i)
  await pick(user, /^beginner/i)
  await pick(user, /^3 days/i)
  await pick(user, /^short/i)
  await pick(user, /^pounds/i)
  await pick(user, /continue/i)
  await pick(user, /i understand/i)
  expect(onDone.mock.calls[0][0].units).toBe('lb')
})

test('quick taps on equipment are all kept', async () => {
  const user = userEvent.setup()
  render(<Setup onDone={vi.fn()} />)
  await pick(user, /not sure yet/i)
  await pick(user, /^beginner/i)
  await pick(user, /^3 days/i)
  await pick(user, /^short/i)
  await pick(user, /^kilograms/i)
  const tiles = ['Dumbbells', 'Adjustable bench', 'Cable machine'].map(name => screen.getByRole('button', { name }))
  tiles.forEach(t => fireEvent.click(t))
  tiles.forEach(t => expect(t).toHaveAttribute('aria-pressed', 'true'))
})
