import { useEffect, useRef } from 'react'

// Screens open inside one page, so each open screen adds a browser history entry.
// The phone's back gesture or Safari's back button then closes the top screen.
const handlers: (() => void)[] = []
let ignore = 0

window.addEventListener('popstate', () => {
  if (ignore > 0) { ignore--; return }
  handlers[handlers.length - 1]?.()
})

/** While `open`, back calls `onBack`. A new `key` (like a setup step) keeps one entry for the new screen. */
export function useBack(open: boolean, onBack: () => void, key?: unknown): void {
  const latest = useRef(onBack)
  latest.current = onBack

  useEffect(() => {
    if (!open) return
    let popped = false
    const handler = () => {
      popped = true
      handlers.splice(handlers.indexOf(handler), 1)
      latest.current()
    }
    handlers.push(handler)
    history.pushState(history.state, '')
    return () => {
      if (popped) return
      // Closed with an in-app button, so its history entry is removed quietly.
      handlers.splice(handlers.indexOf(handler), 1)
      ignore++
      history.back()
    }
  }, [open, key])
}
