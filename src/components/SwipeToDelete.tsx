import { useRef, useState } from 'react'
import type { ReactNode } from 'react'

const OPEN = -96

// Swipe left to show Delete, like phone mail apps. The Delete button stays reachable by keyboard and screen readers.
export function SwipeToDelete({ label, onDelete, children }: { label: string; onDelete(): void; children: ReactNode }) {
  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef<{ x: number; y: number; from: number } | null>(null)
  const moved = useRef(false)

  const down = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY, from: x }
    moved.current = false
  }
  const move = (e: React.PointerEvent) => {
    const s = start.current
    if (!s) return
    const dx = e.clientX - s.x
    // Only a sideways swipe moves the row; an up-down one is left to scroll the page.
    if (!moved.current && (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - s.y))) return
    if (!moved.current) e.currentTarget.setPointerCapture?.(e.pointerId)
    moved.current = true
    setDragging(true)
    setX(Math.min(0, Math.max(OPEN * 1.4, s.from + dx)))
  }
  const up = () => {
    if (!start.current) return
    start.current = null
    setDragging(false)
    setX(v => (v < OPEN / 2 ? OPEN : 0))
  }

  return (
    <div className="swipe">
      <button className="swipe-delete" aria-label={`Delete ${label}`} tabIndex={x === 0 ? -1 : 0} onClick={onDelete}>Delete</button>
      <div
        className={`swipe-row${dragging ? ' dragging' : ''}`}
        style={{ transform: `translateX(${x}px)` }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        // A swipe shouldn't also open the row underneath it.
        onClickCapture={e => { if (moved.current) { e.preventDefault(); e.stopPropagation(); moved.current = false } else if (x !== 0) { e.preventDefault(); setX(0) } }}
      >
        {children}
      </div>
    </div>
  )
}
