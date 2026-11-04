import { useState } from 'react'
import { MUSCLE_NAMES } from '../lib/rules'
import type { Muscle } from '../types'
import { BACK, BACK_OUTLINE, FRONT, FRONT_OUTLINE } from './bodyShapes'

// Every muscle with exercises gets a named button, including ones the drawing doesn't show.
const CHIPS: Muscle[] = [
  'shoulders', 'chest', 'biceps', 'triceps', 'forearms', 'abdominals', 'lats', 'middle back',
  'lower back', 'traps', 'glutes', 'quadriceps', 'hamstrings', 'calves',
]

const onFront = new Set(FRONT.map(r => r.muscle))
// Mid back has no shape of its own; it sits under the lats on the back view.
const onBack = new Set<Muscle>([...BACK.map(r => r.muscle), 'middle back'])

export function BodyMap({ selected, onSelect }: { selected: Muscle | null; onSelect(m: Muscle): void }) {
  const [side, setSide] = useState<'front' | 'back'>('front')
  const regions = side === 'front' ? FRONT : BACK
  const outline = side === 'front' ? FRONT_OUTLINE : BACK_OUTLINE
  // Muscles drawn on only one side flip the figure to that side; shared ones keep the current view.
  const pick = (m: Muscle) => {
    if (onBack.has(m) && !onFront.has(m)) setSide('back')
    if (onFront.has(m) && !onBack.has(m)) setSide('front')
    onSelect(m)
  }
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
          <button key={m} className="chip" aria-pressed={selected === m} onClick={() => pick(m)}>{MUSCLE_NAMES[m]}</button>
        ))}
      </div>
    </div>
  )
}
