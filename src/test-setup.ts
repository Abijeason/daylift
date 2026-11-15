import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

// jsdom has no matchMedia. Nothing matches, so motion stays off and tests see final content.
window.matchMedia ??= (query: string) => ({
  matches: false, media: query, onchange: null,
  addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
}) as MediaQueryList

// jsdom can't scroll; screens still call scrollTo, so tests can check it.
window.scrollTo = vi.fn() as typeof window.scrollTo
