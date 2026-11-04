import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ErrorBoundary } from './components/ErrorBoundary'
import { App } from './App'
import { load, save } from './lib/storage'
import { AppDataProvider } from './state/useAppData'
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

test('the saved theme is applied to the page', () => {
  save({ version: 1, profile: testProfile, history: [], inProgress: null, theme: 'dark' })
  render(<AppDataProvider><App /></AppDataProvider>)
  expect(document.documentElement.dataset.theme).toBe('dark')
})

test('the theme follows the phone by default', () => {
  save({ version: 1, profile: testProfile, history: [], inProgress: null })
  render(<AppDataProvider><App /></AppDataProvider>)
  expect(document.documentElement.dataset.theme).toBe('auto')
})

test('first-time users land on the welcome page, then setup', async () => {
  render(<AppDataProvider><App /></AppDataProvider>)
  expect(screen.getByRole('heading', { name: 'Daylift' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /get started/i }))
  expect(screen.getByRole('heading', { name: /what's your goal/i })).toBeInTheDocument()
})

test('returning users go straight to Home', () => {
  save({ version: 1, profile: testProfile, history: [], inProgress: null })
  render(<AppDataProvider><App /></AppDataProvider>)
  expect(screen.queryByRole('button', { name: /get started/i })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByText('Daylift')).toBeInTheDocument()
})

test('the welcome page is giant DAY and LIFT type with the logo, not a photo', () => {
  const { container } = render(<AppDataProvider><App /></AppDataProvider>)
  expect(container.querySelector('.welcome .logo-mark')).toBeInTheDocument()
  const lines = [...container.querySelectorAll('.welcome-word > span')].map(l => l.textContent)
  expect(lines).toEqual(['Day', 'lift'])
  expect(container.querySelectorAll('.welcome-word i')).toHaveLength(7)
  expect(screen.getByText('Goal')).toBeInTheDocument()
  expect(container.querySelectorAll('.welcome img')).toHaveLength(0)
})
