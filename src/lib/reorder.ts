import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import { flushSync } from 'react-dom'

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

/**
 * Press and drag a ☰ handle to reorder a list: the item swaps places as the finger passes other items' middles.
 * Arrow keys on the handle do the same for keyboard and screen-reader users.
 */
export function useReorder<E extends HTMLElement>(count: number, move: (from: number, to: number) => void) {
  const list = useRef<E>(null)
  // A ref, not state, so quick finger moves between redraws always see where the item is now.
  const draggingRef = useRef<number | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const moveRef = useRef(move)
  moveRef.current = move

  const end = () => { draggingRef.current = null; setDragging(null) }
  const drag = (e: PointerEvent) => {
    const from = draggingRef.current
    if (from === null || !list.current) return
    const items = [...list.current.children]
    let to = items.findIndex(item => { const r = item.getBoundingClientRect(); return e.clientY < r.top + r.height / 2 })
    if (to === -1) to = items.length
    if (to > from) to -= 1
    if (to === from) return
    draggingRef.current = to
    // Redraw now, so the next move measures items in their new order.
    flushSync(() => { moveRef.current(from, to); setDragging(to) })
  }

  // The whole window follows the finger: moving an item in the page would drop a capture held by its handle.
  const active = dragging !== null
  useEffect(() => {
    if (!active) return
    window.addEventListener('pointermove', drag)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointermove', drag)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const handle = (i: number, name: string) => ({
    className: 'handle',
    'aria-label': `Reorder ${name}, or use the up and down arrow keys`,
    onPointerDown: (e: ReactPointerEvent) => { e.preventDefault(); draggingRef.current = i; setDragging(i) },
    onKeyDown: (e: KeyboardEvent) => {
      const to = e.key === 'ArrowUp' ? i - 1 : e.key === 'ArrowDown' ? i + 1 : -1
      if (to < 0 || to >= count) return
      e.preventDefault()
      move(i, to)
    },
  })

  return { list, dragging, handle }
}
