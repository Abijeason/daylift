export function Dumbbell() {
  return (
    <svg viewBox="0 0 120 48" aria-hidden="true">
      <rect x="4" y="12" width="10" height="24" rx="3" />
      <rect x="16" y="4" width="16" height="40" rx="4" />
      <rect x="32" y="20" width="56" height="8" rx="3" />
      <rect x="88" y="4" width="16" height="40" rx="4" />
      <rect x="106" y="12" width="10" height="24" rx="3" />
    </svg>
  )
}

export function Plate({ label = '20' }: { label?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path fillRule="evenodd" d="M50 2a48 48 0 1 0 0 96 48 48 0 0 0 0-96zm0 36a12 12 0 1 1 0 24 12 12 0 0 1 0-24z" />
      <circle className="plate-groove" cx="50" cy="50" r="38" />
      <text x="50" y="26" textAnchor="middle">{label}</text>
      <text x="50" y="86" textAnchor="middle">KG</text>
    </svg>
  )
}

export function Kettlebell() {
  return (
    <svg viewBox="0 0 80 100" aria-hidden="true">
      <path fillRule="evenodd" d="M24 8h32c8 0 12 6 11 13l-4 16c10 7 15 18 15 29 0 18-14 32-38 32S2 84 2 66c0-11 5-22 15-29l-4-16C12 14 16 8 24 8zm2 12l3 12c7-2 15-2 22 0l3-12z" />
    </svg>
  )
}

const ITEMS = [
  { Art: Dumbbell, x: 6, y: 8, size: 120, tilt: -18, time: 26, kind: 'lime' },
  { Art: Plate, x: 70, y: 16, size: 130, tilt: 0, time: 34, kind: 'coral spin' },
  { Art: Kettlebell, x: 12, y: 46, size: 76, tilt: 10, time: 30, kind: 'cyan' },
  { Art: Dumbbell, x: 62, y: 58, size: 150, tilt: 24, time: 38, kind: 'coral' },
  { Art: Plate, x: -8, y: 74, size: 170, tilt: 0, time: 44, kind: 'lime spin' },
  { Art: Kettlebell, x: 78, y: 84, size: 90, tilt: -14, time: 28, kind: 'cyan' },
]

export function GymBackdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      {ITEMS.map(({ Art, x, y, size, tilt, time, kind }, i) => (
        <div
          key={i} className={`float ${kind}`}
          style={{ left: `${x}%`, top: `${y}%`, width: size, '--tilt': `${tilt}deg`, '--time': `${time}s`, animationDelay: `-${i * 5}s` } as React.CSSProperties}
        >
          <Art />
        </div>
      ))}
    </div>
  )
}

export function WeekBar({ done, target }: { done: number; target: number }) {
  const slots = Array.from({ length: target }, (_, i) => i)
  return (
    <div className="weekbar" role="img" aria-label={`${done} of ${target} workouts this week`}>
      <div className="bar" />
      <div className="plates left">
        {slots.map(i => <span key={i} className={i < done ? 'on' : ''} style={{ animationDelay: `${i * 120}ms` }} />)}
      </div>
      <div className="plates right">
        {slots.map(i => <span key={i} className={i < done ? 'on' : ''} style={{ animationDelay: `${i * 120}ms` }} />)}
      </div>
    </div>
  )
}

export function Marquee({ text }: { text: string }) {
  return (
    <div className="marquee" aria-hidden="true">
      <div>{Array.from({ length: 8 }, (_, i) => <span key={i}>{text}</span>)}</div>
    </div>
  )
}

export function PlateRain() {
  return (
    <div className="plate-rain" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => (
        <i key={i} style={{ left: `${(i * 7.3 + 3) % 100}%`, animationDelay: `${(i % 5) * 110}ms` }} className={['lime', 'coral', 'cyan'][i % 3]} />
      ))}
    </div>
  )
}
