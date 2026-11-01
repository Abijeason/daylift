import { Plate } from './GymArt'

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const left = Math.min(1, seconds / total)
  return (
    <div className={seconds <= 5 ? 'timer final' : 'timer'} role="timer" aria-label={`Rest, ${seconds} seconds left`}>
      <div className="timer-plate"><Plate /></div>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="timer-track" cx="60" cy="60" r={RADIUS} />
        <circle
          className="timer-value" cx="60" cy="60" r={RADIUS}
          strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - left)}
        />
      </svg>
      <strong className="number">{seconds}</strong>
    </div>
  )
}
