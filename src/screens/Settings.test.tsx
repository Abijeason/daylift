import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Settings } from './Settings'
import { renderWithData, testLog, testProfile } from '../test-utils'
import { exportBackup, load } from '../lib/storage'
import { COMING_SOON } from '../data/copy'

test('changing goal keeps history', async () => {
  renderWithData(<Settings />, { history: [testLog()] })
  await userEvent.selectOptions(screen.getByLabelText(/goal/i), 'toneUp')
  expect(load().data.profile!.goal).toBe('toneUp')
  expect(load().data.history).toHaveLength(1)
})

test('changing goal corrects days that are no longer allowed', async () => {
  renderWithData(<Settings />)
  await userEvent.selectOptions(screen.getByLabelText(/goal/i), 'buildMuscle')
  expect(load().data.profile!.daysPerWeek).toBe(4)
})

test('switching to lb does not change stored logs', async () => {
  renderWithData(<Settings />, { history: [testLog()] })
  await userEvent.selectOptions(screen.getByLabelText(/units/i), 'lb')
  expect(load().data.profile!.units).toBe('lb')
  expect(load().data.history[0].units).toBe('kg')
  expect(load().data.history[0].entries[0].sets[0].weight).toBe(20)
})

test('bad backup shows an error and changes nothing', async () => {
  renderWithData(<Settings />, { history: [testLog()] })
  const file = new File(['nonsense'], 'b.json', { type: 'application/json' })
  await userEvent.upload(screen.getByLabelText(/import backup/i), file)
  expect(await screen.findByRole('alert')).toHaveTextContent(/isn't a valid/i)
  expect(load().data.history).toHaveLength(1)
})

test('good backup asks before replacing data', async () => {
  const user = userEvent.setup()
  const backup = { version: 1 as const, profile: testProfile, history: [testLog(), testLog('2026-10-02')], inProgress: null }
  renderWithData(<Settings />)
  await user.upload(screen.getByLabelText(/import backup/i), new File([exportBackup(backup)], 'b.json'))
  expect(load().data.history).toHaveLength(0)
  await user.click(await screen.findByRole('button', { name: /replace my data/i }))
  expect(load().data.history).toHaveLength(2)
})

test('reset needs confirmation', async () => {
  const user = userEvent.setup()
  renderWithData(<Settings />, { history: [testLog()] })
  await user.click(screen.getByRole('button', { name: /reset all data/i }))
  expect(load().data.history).toHaveLength(1)
  await user.click(screen.getByRole('button', { name: /yes, delete everything/i }))
  expect(load().data.history).toHaveLength(0)
})

test('feedback link is hidden while FEEDBACK_URL is empty', () => {
  renderWithData(<Settings />)
  expect(screen.queryByRole('link', { name: /feedback/i })).not.toBeInTheDocument()
})

test('coming soon lists every item', () => {
  renderWithData(<Settings />)
  COMING_SOON.forEach(item => expect(screen.getByText(item)).toBeInTheDocument())
})

test('export creates a backup file', async () => {
  const create = vi.fn(() => 'blob:x')
  URL.createObjectURL = create
  URL.revokeObjectURL = vi.fn()
  renderWithData(<Settings />)
  await userEvent.click(screen.getByRole('button', { name: /export backup/i }))
  expect(create).toHaveBeenCalled()
})
