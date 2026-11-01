import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Exercises } from './Exercises'
import { BodyMap } from '../components/BodyMap'
import { exercises } from '../data'
import { MUSCLE_NAMES } from '../lib/rules'

test('tapping a muscle lists its exercises', async () => {
  render(<Exercises />)
  await userEvent.click(screen.getByRole('button', { name: /^chest$/i }))
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
  for (const name of ['Chest', 'Biceps', 'Triceps', 'Core', 'Quads', 'Lats', 'Hamstrings', 'Glutes']) {
    expect(screen.getByRole('button', { name })).toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: MUSCLE_NAMES[m] })).toBeInTheDocument()
  }
})

test('a muscle with no exercises says so', async () => {
  render(<Exercises />)
  await userEvent.click(screen.getByRole('button', { name: /^forearms$/i }))
  expect(screen.getByText(/no exercises for this muscle yet/i)).toBeInTheDocument()
})

test('selecting a muscle names it with an exercise count', async () => {
  render(<Exercises />)
  await userEvent.click(screen.getByRole('button', { name: 'Biceps' }))
  expect(screen.getByRole('heading', { name: 'Biceps' })).toBeInTheDocument()
  expect(screen.getByText(/6 exercises/i)).toBeInTheDocument()
})

test('abdominals are called Core', async () => {
  render(<Exercises />)
  await userEvent.click(screen.getByRole('button', { name: 'Core' }))
  expect(screen.getByRole('heading', { name: 'Core' })).toBeInTheDocument()
})
