import { useState } from 'react'
import { MUSCLE_NAMES } from '../lib/rules'
import type { Muscle } from '../types'
import { BACK, BACK_OUTLINE, FRONT, FRONT_OUTLINE } from './bodyShapes'

// Every muscle with exercises gets a named button, including ones the drawing doesn't show.
const CHIPS: Muscle[] = [
  'shoulders', 'chest', 'biceps', 'triceps', 'forearms', 'abdominals', 'lats', 'middle back',
  'lower back', 'traps', 'glutes', 'quadriceps', 'hamstrings', 'calves',
]

export function BodyMap({ selected, onSelect }: { selected: Muscle | null; onSelect(m: Muscle): void }) {
  const [side, setSide] = useState<'front' | 'back'>('front')
  const regions = side === 'front' ? FRONT : BACK
  const outline = side === 'front' ? FRONT_OUTLINE : BACK_OUTLINE
  return (
    <div className="body-map">
      <div className="segmented">
        <button aria-pressed={side === 'front'} onClick={() => setSide('front')}>Front</button>
        <button aria-pressed={side === 'back'} onClick={() => setSide('back')}>Back</button>
      </div>
      <svg viewBox="0 0 100 200" aria-hidden="true" key={side}>
        {outline.map(points => <polygon key={points} className="body-outline" points={points} />)}
        {regions.map(r => (
          <g key={r.muscle} className={selected === r.muscle ? 'muscle on' : 'muscle'} onClick={() => onSelect(r.muscle)}>
            {r.shapes.map(points => <polygon key={points} points={points} />)}
          </g>
        ))}
      </svg>
      {/* The named buttons are the accessible way in. The drawing is a shortcut for touch. */}
      <div className="muscle-chips">
        {CHIPS.map(m => (
          <button key={m} className="chip" aria-pressed={selected === m} onClick={() => onSelect(m)}>{MUSCLE_NAMES[m]}</button>
        ))}
      </div>
    </div>
  )
}
