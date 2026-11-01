import { exercises } from '../data'
import { EATING_TIPS } from '../data/copy'
import { Marquee, Plate, WeekBar } from '../components/GymArt'
import { nextWorkout } from '../lib/planner'
import { isRestDay, weeklyStreak, workoutsThisWeek } from '../lib/progress'
import { MUSCLE_NAMES, WORKOUT_NAMES } from '../lib/rules'
import { useAppData } from '../state/useAppData'
import type { PlannedWorkout } from '../types'

const isInstalled = () =>
  window.matchMedia?.('(display-mode: standalone)').matches
  || (navigator as Navigator & { standalone?: boolean }).standalone === true

export function Today({ onStart, onResume }: { onStart(p: PlannedWorkout): void; onResume(): void }) {
  const { data } = useAppData()
  const profile = data.profile!
  const now = new Date()
  const plan = nextWorkout(profile, data.history, exercises)
  const rest = isRestDay(data.history, profile.daysPerWeek, now)
  const streak = weeklyStreak(data.history, profile.daysPerWeek, now)
  const muscles = [...new Set(plan.exercises.map(e => MUSCLE_NAMES[e.muscle]))].slice(0, 4).join(', ')
  const tip = EATING_TIPS[profile.goal]
  const done = workoutsThisWeek(data.history, now)

  return (
    <main className="screen">
      <p className="eyebrow">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>

      {data.inProgress ? (
        <section className="hero">
          <div className="hero-plate"><Plate /></div>
          <h1>{WORKOUT_NAMES[data.inProgress.plan.type]}</h1>
          <p className="muted">You have a workout in progress.</p>
          <button className="primary" onClick={onResume}>Resume workout</button>
        </section>
      ) : rest ? (
        <section className="hero">
          <div className="hero-plate"><Plate /></div>
          <h1>Rest day</h1>
          <p className="muted">Muscles grow while you recover. Next up: {WORKOUT_NAMES[plan.type]}.</p>
          <button className="secondary" onClick={() => onStart(plan)}>Train anyway</button>
        </section>
      ) : (
        <section className="hero">
          <div className="hero-plate"><Plate /></div>
          <h1>{WORKOUT_NAMES[plan.type]}</h1>
          <p className="muted">{plan.exercises.length} exercises · about {plan.estMinutes} min</p>
          <p className="muscles">{muscles}</p>
          <button className="primary" onClick={() => onStart(plan)}>Start workout</button>
        </section>
      )}

      <section className="week-row">
        <WeekBar done={Math.min(done, profile.daysPerWeek)} target={profile.daysPerWeek} />
        <div className="streak"><strong className="number">{streak}</strong><span>week streak</span></div>
      </section>
      <Marquee text="Lift · Rest · Repeat ·" />

      {tip && <section className="card muted">{tip}</section>}

      {!isInstalled() && (
        <section className="card muted">
          Add Daylift to your home screen. It opens like an app, works offline and keeps your history safer.
        </section>
      )}
    </main>
  )
}
