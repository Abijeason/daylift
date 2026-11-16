import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import { flushSync } from 'react-dom'

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

const SLIDE = 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1)'
const EDGE = 80
const LIFT = 'scale(1.02)'

type Drag = {
  from: number
  to: number
  items: HTMLElement[]
  mids: number[]   // each item's middle, in page coordinates, at the start
  size: number     // the lifted item's height plus the gap, which is how far the others move
  startY: number   // finger position, in page coordinates, at the start
  lastClientY: number
}

// Where the lifted item would land: past every item whose middle its own middle has crossed.
export function dropIndex(mids: number[], from: number, center: number): number {
  let to = from
  for (let k = from + 1; k < mids.length; k++) if (center > mids[k]) to = k
  for (let k = from - 1; k >= 0; k--) if (center < mids[k]) to = k
  return to
}

/**
 * Press and drag a ☰ handle to reorder a list. The lifted item follows the finger, the others slide out of its way,
 * and on release it glides into place. Arrow keys on the handle do the same for keyboard and screen-reader users.
 */
export function useReorder<E extends HTMLElement>(count: number, move: (from: number, to: number) => void) {
  const list = useRef<E>(null)
  const drag = useRef<Drag | null>(null)
  const frame = useRef(0)
  const [dragging, setDragging] = useState<number | null>(null)
  const moveRef = useRef(move)
  moveRef.current = move

  const reduce = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  const follow = (clientY: number) => {
    const d = drag.current
    if (!d) return
    d.lastClientY = clientY
    const dy = clientY + window.scrollY - d.startY
    d.items[d.from].style.transform = `translateY(${dy}px) ${LIFT}`
    d.to = dropIndex(d.mids, d.from, d.mids[d.from] + dy)
    d.items.forEach((el, k) => {
      if (k === d.from) return
      const shift = k > d.from && k <= d.to ? -d.size : k < d.from && k >= d.to ? d.size : 0
      el.style.transform = shift ? `translateY(${shift}px)` : ''
    })
  }

  // Holding near the top or bottom edge scrolls the page, so long lists can be reordered too.
  const autoScroll = () => {
    const d = drag.current
    if (!d) return
    const y = d.lastClientY
    const speed = y < EDGE ? -(EDGE - y) / 4 : y > window.innerHeight - EDGE ? (y - (window.innerHeight - EDGE)) / 4 : 0
    if (speed) { window.scrollBy(0, speed); follow(y) }
    frame.current = requestAnimationFrame(autoScroll)
  }

  const start = (i: number, e: ReactPointerEvent) => {
    const items = list.current ? [...list.current.children] as HTMLElement[] : []
    if (!items[i]) return
    e.preventDefault()
    const rects = items.map(el => el.getBoundingClientRect())
    const gap = items.length > 1 ? Math.max(0, rects[1].top - rects[0].bottom) : 0
    drag.current = {
      from: i, to: i, items,
      mids: rects.map(r => r.top + window.scrollY + r.height / 2),
      size: rects[i].height + gap,
      startY: e.clientY + window.scrollY,
      lastClientY: e.clientY,
    }
    const slide = reduce() ? 'none' : SLIDE
    items.forEach((el, k) => { el.style.transition = k === i ? 'none' : slide })
    items[i].style.transform = LIFT
    document.body.style.userSelect = 'none'
    setDragging(i)
    frame.current = requestAnimationFrame(autoScroll)
  }

  const end = () => {
    const d = drag.current
    if (!d) return
    drag.current = null
    cancelAnimationFrame(frame.current)
    document.body.style.userSelect = ''
    const lifted = d.items[d.from]
    const dy = d.lastClientY + window.scrollY - d.startY
    // How far the lifted item's slot moved: the heights of the items it passed.
    const passed = d.to > d.from
      ? d.items.slice(d.from + 1, d.to + 1).reduce((sum, el) => sum + el.offsetHeight, 0) + (d.size - lifted.offsetHeight) * (d.to - d.from)
      : -d.items.slice(d.to, d.from).reduce((sum, el) => sum + el.offsetHeight, 0) - (d.size - lifted.offsetHeight) * (d.from - d.to)
    if (d.to !== d.from) flushSync(() => moveRef.current(d.from, d.to))
    // The others now sit where they were shown, so they snap without moving. The lifted one glides home from where it was dropped.
    d.items.forEach(el => { el.style.transition = 'none'; el.style.transform = '' })
    lifted.style.transform = `translateY(${dy - passed}px) ${LIFT}`
    void lifted.offsetHeight
    lifted.style.transition = reduce() ? 'none' : SLIDE
    lifted.style.transform = ''
    const clean = () => { lifted.style.transition = ''; lifted.removeEventListener('transitionend', clean) }
    lifted.addEventListener('transitionend', clean)
    setDragging(null)
  }

  // The whole window follows the finger: a capture held by the handle would be dropped when the list reorders.
  const active = dragging !== null
  useEffect(() => {
    if (!active) return
    const onMove = (e: PointerEvent) => follow(e.clientY)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const handle = (i: number, name: string) => ({
    className: 'handle',
    'aria-label': `Reorder ${name}, or use the up and down arrow keys`,
    onPointerDown: (e: ReactPointerEvent) => start(i, e),
    onKeyDown: (e: KeyboardEvent) => {
      const to = e.key === 'ArrowUp' ? i - 1 : e.key === 'ArrowDown' ? i + 1 : -1
      if (to < 0 || to >= count) return
      e.preventDefault()
      move(i, to)
    },
  })

  return { list, dragging, handle }
}
