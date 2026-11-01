import { screen } from '@testing-library/react'
import { Progress } from './Progress'
import { renderWithData, testLog, testProfile } from '../test-utils'

test('empty history shows a friendly start message', () => {
  renderWithData(<Progress />)
  expect(screen.getByText(/finish your first workout/i)).toBeInTheDocument()
})

test('history and bests are listed', () => {
  renderWithData(<Progress />, { history: [testLog()] })
  expect(screen.getAllByText('Full Body A').length).toBeGreaterThan(0)
  expect(screen.getByText('20 kg')).toBeInTheDocument()
})

test('history with a removed exercise still shows its name', () => {
  const log = testLog('2026-10-01', {
    entries: [{ exerciseId: 'gone', name: 'Old Move', region: 'upper', targetSets: 3, repMax: 12, sets: [{ weight: 30, reps: 5 }] }],
  })
  renderWithData(<Progress />, { history: [log] })
  expect(screen.getAllByText('Old Move').length).toBeGreaterThan(0)
})

test('chart handles a single point', () => {
  renderWithData(<Progress />, { history: [testLog()] })
  expect(screen.getByRole('img', { name: /Dumbbell Bench Press/ })).toBeInTheDocument()
})

test('chart converts old weights to the current units', () => {
  renderWithData(<Progress />, {
    profile: { ...testProfile, units: 'lb' },
    history: [testLog(), testLog('2026-10-02', { units: 'lb', entries: [{ exerciseId: 'Dumbbell_Bench_Press', name: 'Dumbbell Bench Press', region: 'upper', targetSets: 3, repMax: 12, sets: [{ weight: 50, reps: 10 }] }] })],
  })
  expect(screen.getByRole('img', { name: /from 45 to 50/ })).toBeInTheDocument()
})
