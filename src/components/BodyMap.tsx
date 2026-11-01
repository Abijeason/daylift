import { useState } from 'react'
import { MUSCLE_NAMES } from '../lib/rules'
import type { Muscle } from '../types'

interface Region {
  muscle: Muscle
  shapes: string[]
}

// Simple symmetrical shapes in a 200 by 400 box.
const FRONT: Region[] = [
  { muscle: 'shoulders', shapes: ['M62 76c-14 2-22 12-24 26l20 4 10-26z', 'M138 76c14 2 22 12 24 26l-20 4-10-26z'] },
  { muscle: 'chest', shapes: ['M70 80h28v36H74c-6 0-12-6-12-14z', 'M130 80h-28v36h24c6 0 12-6 12-14z'] },
  { muscle: 'biceps', shapes: ['M38 108l20 4-4 42-20-2z', 'M162 108l-20 4 4 42 20-2z'] },
  { muscle: 'forearms', shapes: ['M33 156l20 2-6 48-18-2z', 'M167 156l-20 2 6 48 18-2z'] },
  { muscle: 'abdominals', shapes: ['M78 120h44l-4 74H82z'] },
  { muscle: 'quadriceps', shapes: ['M72 200h26l-2 84H74c-6-28-6-56-2-84z', 'M128 200h-26l2 84h22c6-28 6-56 2-84z'] },
  { muscle: 'calves', shapes: ['M76 296h20l-2 72H80z', 'M124 296h-20l2 72h14z'] },
]

const BACK: Region[] = [
  { muscle: 'traps', shapes: ['M100 58l30 22-30 30-30-30z'] },
  { muscle: 'shoulders', shapes: ['M62 76c-14 2-22 12-24 26l20 4 10-26z', 'M138 76c14 2 22 12 24 26l-20 4-10-26z'] },
  { muscle: 'triceps', shapes: ['M38 108l20 4-4 42-20-2z', 'M162 108l-20 4 4 42 20-2z'] },
  { muscle: 'lats', shapes: ['M68 100l22 24-2 38-18-18z', 'M132 100l-22 24 2 38 18-18z'] },
  { muscle: 'middle back', shapes: ['M94 118h12v46H94z'] },
  { muscle: 'lower back', shapes: ['M78 166h44v26H78z'] },
  { muscle: 'glutes', shapes: ['M74 196h24v38H76c-4-10-4-26-2-38z', 'M126 196h-24v38h22c4-10 4-26 2-38z'] },
  { muscle: 'hamstrings', shapes: ['M74 238h24l-2 48H76z', 'M126 238h-24l2 48h20z'] },
  { muscle: 'calves', shapes: ['M76 296h20l-2 72H80z', 'M124 296h-20l2 72h14z'] },
]

const ALL_MUSCLES = [...new Set([...FRONT, ...BACK].map(r => r.muscle))]

export function BodyMap({ selected, onSelect }: { selected: Muscle | null; onSelect(m: Muscle): void }) {
  const [side, setSide] = useState<'front' | 'back'>('front')
  const regions = side === 'front' ? FRONT : BACK
  return (
    <div className="body-map">
      <div className="segmented">
        <button aria-pressed={side === 'front'} onClick={() => setSide('front')}>Front</button>
        <button aria-pressed={side === 'back'} onClick={() => setSide('back')}>Back</button>
      </div>
      <svg viewBox="0 0 200 400" aria-hidden="true">
        <circle className="body-head" cx="100" cy="36" r="22" />
        {regions.map(r => (
          <g key={r.muscle} className={selected === r.muscle ? 'muscle on' : 'muscle'} onClick={() => onSelect(r.muscle)}>
            {r.shapes.map(d => <path key={d} d={d} />)}
          </g>
        ))}
      </svg>
      {/* The named buttons are the accessible way in. The drawing is a shortcut for touch. */}
      <div className="muscle-chips">
        {ALL_MUSCLES.map(m => (
          <button key={m} className="chip" aria-pressed={selected === m} onClick={() => onSelect(m)}>{MUSCLE_NAMES[m]}</button>
        ))}
      </div>
    </div>
  )
}
