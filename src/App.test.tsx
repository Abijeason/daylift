import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ErrorBoundary } from './components/ErrorBoundary'
import { load, save } from './lib/storage'
import { testProfile } from './test-utils'

function Broken(): never {
  throw new Error('boom')
}

test('a crash shows a recovery screen that can clear data', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  save({ version: 1, profile: testProfile, history: [], inProgress: null })
  render(<ErrorBoundary><Broken /></ErrorBoundary>)
  expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /start fresh/i }))
  expect(load().data.profile).toBeNull()
})
