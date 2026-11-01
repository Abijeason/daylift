import { FormDemo } from '../components/FormDemo'
import { exercises } from '../data'
import { EATING_TIPS } from '../data/copy'
import { nextWorkout } from '../lib/planner'
import { isRestDay, lifetime, totalWeight, weekDays, weeklyStreak, workoutsThisWeek } from '../lib/progress'
import { HOLD_SECONDS, MUSCLE_NAMES, WORKOUT_NAMES } from '../lib/rules'
import { useAppData } from '../state/useAppData'
import type { PlannedWorkout } from '../types'

const isInstalled = () =>
  window.matchMedia?.('(display-mode: standalone)').matches
  || (navigator as Navigator & { standalone?: boolean }).standalone === true

function PlanList({ plan }: { plan: PlannedWorkout }) {
  const { sets, repMin, repMax } = plan.prescription
  return (
    <ol className="plan-list">
      {plan.exercises.map((e, i) => (
        <li key={e.id}>
          <span className="index">{String(i + 1).padStart(2, '0')}</span>
          <img src={`${import.meta.env.BASE_URL}exercises/${e.images[0]}`} alt="" loading="lazy" />
          <div>
            <strong>{e.name}</strong>
            <small>{MUSCLE_NAMES[e.muscle]}</small>
          </div>
          <span className="sets">{e.timed ? `${sets} × ${HOLD_SECONDS}` : `${sets} × ${repMin}–${repMax}`}</span>
        </li>
      ))}
    </ol>
  )
}

export function Today({ onStart, onResume }: { onStart(p: PlannedWorkout): void; onResume(): void }) {
  const { data } = useAppData()
  const profile = data.profile!
  const now = new Date()
  const plan = nextWorkout(profile, data.history, exercises)
  const rest = isRestDay(data.history, profile.daysPerWeek, now)
  const streak = weeklyStreak(data.history, profile.daysPerWeek, now)
  const done = Math.min(workoutsThisWeek(data.history, now), profile.daysPerWeek)
  const { workouts, lifted } = lifetime(data.history, profile.units)
  const week = weekDays(data.history, now)
  const last = data.history[data.history.length - 1]
  const tip = EATING_TIPS[profile.goal]
  const lead = plan.exercises[0]
  const title = data.inProgress ? WORKOUT_NAMES[data.inProgress.plan.type] : rest ? 'Rest day' : WORKOUT_NAMES[plan.type]

  return (
    <main className="screen">
      <p className="eyebrow">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>

      <section className="hero">
        <h1><span>{title}</span></h1>
        <div className="rule" aria-hidden="true" />
        {data.inProgress ? (
          <>
            <p className="muted">You have a workout in progress.</p>
            <button className="primary" onClick={onResume}>Resume workout</button>
          </>
        ) : rest ? (
          <>
            <p className="muted">Muscles grow while you recover.</p>
            <button className="secondary" onClick={() => onStart(plan)}>Train anyway</button>
          </>
        ) : (
          <>
            <p className="muted">{plan.exercises.length} exercises · about {plan.estMinutes} min</p>
            {lead && (
              <figure className="hero-demo" style={{ margin: 0 }}>
                <FormDemo exercise={lead} />
                <figcaption>First up: {lead.name}</figcaption>
              </figure>
            )}
            <button className="primary" onClick={() => onStart(plan)}>Start workout</button>
          </>
        )}
      </section>

      <section>
        <div className="week-head"><span>This week</span><strong>{done} / {profile.daysPerWeek}</strong></div>
        <div className="week" role="img" aria-label={`${done} of ${profile.daysPerWeek} workouts this week`} style={{ marginTop: 8 }}>
          {week.map((d, i) => (
            <div key={i} className={`day${d.trained ? ' trained' : ''}${d.today ? ' today' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
              <i />
              <span>{d.letter}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="stat-row">
        <div><strong className="number">{streak}</strong><span>Week streak</span></div>
        <div><strong className="number">{workouts}</strong><span>Workouts</span></div>
        <div><strong className="number">{lifted.toLocaleString()}</strong><span>{profile.units} lifted</span></div>
      </section>

      {!data.inProgress && (
        <section>
          <h2>{rest ? `Up next: ${WORKOUT_NAMES[plan.type]}` : "Today's exercises"}</h2>
          <PlanList plan={plan} />
        </section>
      )}

      {last && (
        <section>
          <h2>Last workout</h2>
          <div className="row">
            <span>{WORKOUT_NAMES[last.type]}</span>
            <span className="muted">
              {new Date(last.finishedAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
              {' · '}{totalWeight(last).toLocaleString()} {last.units}
            </span>
          </div>
        </section>
      )}

      {tip && <p className="card muted">{tip}</p>}

      {!isInstalled() && (
        <p className="card muted">
          Add Daylift to your home screen. It opens like an app, works offline and keeps your history safer.
        </p>
      )}
    </main>
  )
}
