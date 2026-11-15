import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { FEEDBACK_FORM } from '../data/copy'
import { feedbackBody } from '../lib/feedback'
import { Feedback } from './Feedback'

afterEach(() => { vi.unstubAllGlobals(); Object.defineProperty(navigator, 'onLine', { value: true, configurable: true }) })

test('only answered questions go to the form, trimmed and capped', () => {
  const body = feedbackBody({ experience: 'Brand new', best: '  The plan  ', missing: ' ', other: 'x'.repeat(3000) })
  expect(body.get(FEEDBACK_FORM.fields.experience)).toBe('Brand new')
  expect(body.get(FEEDBACK_FORM.fields.best)).toBe('The plan')
  expect(body.has(FEEDBACK_FORM.fields.missing)).toBe(false)
  expect(body.get(FEEDBACK_FORM.fields.other)).toHaveLength(2000)
})

test('the form sends my answers and thanks me', async () => {
  const user = userEvent.setup()
  const fetch = vi.fn(() => Promise.resolve(new Response()))
  vi.stubGlobal('fetch', fetch)
  render(<Feedback />)
  await user.click(screen.getByRole('button', { name: /give feedback/i }))
  await user.click(screen.getByRole('button', { name: /send feedback/i }))
  expect(screen.getByRole('alert')).toHaveTextContent(/at least one/i)
  await user.click(screen.getByRole('button', { name: 'Mostly with friends' }))
  await user.click(screen.getByRole('button', { name: 'Custom plan' }))
  await user.click(screen.getByRole('button', { name: 'Friends' }))
  await user.type(screen.getByLabelText(/what's missing/i), 'Body weight tracking')
  await user.click(screen.getByRole('button', { name: /send feedback/i }))
  expect(await screen.findByRole('status')).toHaveTextContent(/thanks/i)
  const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
  expect(url).toBe(FEEDBACK_FORM.action)
  const body = init.body as URLSearchParams
  expect(body.get(FEEDBACK_FORM.fields.together)).toBe('Mostly with friends')
  expect(body.get(FEEDBACK_FORM.fields.used)).toBe('Custom plan, Friends')
  expect(body.get(FEEDBACK_FORM.fields.missing)).toBe('Body weight tracking')
})

test('offline, the answers stay so I can try again', async () => {
  const user = userEvent.setup()
  Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
  vi.stubGlobal('fetch', vi.fn())
  render(<Feedback />)
  await user.click(screen.getByRole('button', { name: /give feedback/i }))
  await user.type(screen.getByLabelText(/anything else/i), 'Great app')
  await user.click(screen.getByRole('button', { name: /send feedback/i }))
  expect(screen.getByRole('alert')).toHaveTextContent(/check your internet/i)
  expect(screen.getByLabelText(/anything else/i)).toHaveValue('Great app')
})
