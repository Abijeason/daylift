import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Exercises } from './Exercises'
import { BodyMap } from '../components/BodyMap'
import { exercises } from '../data'

test('tapping a muscle lists its exercises', async () => {
  render(<Exercises />)
  await userEvent.click(screen.getAllByRole('button', { name: /^chest$/i })[0])
  expect(screen.getByRole('button', { name: /pushups/i })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /leg press/i })).not.toBeInTheDocument()
})

test('search finds by name, ignoring case', async () => {
  render(<Exercises />)
  await userEvent.type(screen.getByRole('searchbox'), 'GOBLET')
  expect(screen.getByRole('button', { name: /goblet squat/i })).toBeInTheDocument()
})

test('detail shows steps, mistakes, equipment, alternatives and the safety note', async () => {
  const user = userEvent.setup()
  render(<Exercises />)
  await user.type(screen.getByRole('searchbox'), 'goblet')
  await user.click(screen.getByRole('button', { name: /goblet squat/i }))
  expect(screen.getByRole('heading', { name: /goblet squat/i })).toBeInTheDocument()
  expect(screen.getByText(/hold one dumbbell at your chest/i)).toBeInTheDocument()
  expect(screen.getByText(/rounding your back/i)).toBeInTheDocument()
  expect(screen.getByText(/^dumbbells$/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /bodyweight squat/i })).toBeInTheDocument()
  expect(screen.getByText(/stop if something hurts/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /watch form/i })).toBeInTheDocument()
})

test('body map muscles are labelled buttons', () => {
  render(<BodyMap selected={null} onSelect={() => {}} />)
  for (const name of ['chest', 'biceps', 'quadriceps', 'lats', 'hamstrings', 'glutes']) {
    expect(screen.getAllByRole('button', { name: new RegExp(`^${name}$`, 'i') }).length).toBeGreaterThan(0)
  }
})

test('no search results shows a friendly message', async () => {
  render(<Exercises />)
  await userEvent.type(screen.getByRole('searchbox'), 'zzzz')
  expect(screen.getByText(/no exercises found/i)).toBeInTheDocument()
})

test('every exercise muscle can be reached from the body map', () => {
  render(<BodyMap selected={null} onSelect={() => {}} />)
  for (const m of new Set(exercises.map(e => e.muscle))) {
    expect(screen.getAllByRole('button', { name: new RegExp(`^${m}$`, 'i') }).length).toBeGreaterThan(0)
  }
})
