import { useRef, useState } from 'react'
import { Logo } from '../components/Logo'
import { exercises } from '../data'
import { EATING_TIPS } from '../data/copy'
import { nextWorkout, rotation } from '../lib/planner'
import { appLink, buildCustom, myPlan, nextPlanDay, planCount, shareLink, shareOrCopy, workoutName } from '../lib/custom'
import { isRestDay, lifetime, totalWeight, weekDays, weeklyStreak, workoutsThisWeek } from '../lib/progress'
import { HOLD_SECONDS, MUSCLE_NAMES, WORKOUT_NAMES } from '../lib/rules'
import { useScreenMotion } from '../lib/motion'
import { useAppData } from '../state/useAppData'
import type { CustomWorkout, PlannedWorkout } from '../types'

const isInstalled = () =>
  window.matchMedia?.('(display-mode: standalone)').matches
  || (navigator as Navigator & { standalone?: boolean }).standalone === true

function PlanList({ plan }: { plan: PlannedWorkout }) {
  const { sets, repMin, repMax } = plan.prescription
  return (
    <ol className="plan-list">
      {plan.exercises.map((e, i) => (
        <li key={e.id} data-reveal>
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

export function Today({ onStart, onResume, onBuild, onPlan }: {
  onStart(p: PlannedWorkout): void; onResume(): void; onBuild(w?: CustomWorkout): void; onPlan(): void
}) {
  const { data } = useAppData()
  const profile = data.profile!
  const now = new Date()
  const days = myPlan(data)
  const dayIndex = nextPlanDay(days.length, data.history)
  const plan = days.length
    ? { ...buildCustom(profile, days[dayIndex], exercises), planDay: dayIndex }
    : nextWorkout(profile, data.history, exercises)
  const rest = isRestDay(data.history, profile.daysPerWeek, now)
  const streak = weeklyStreak(data.history, profile.daysPerWeek, now)
  const done = Math.min(workoutsThisWeek(data.history, now), profile.daysPerWeek)
  const { lifted } = lifetime(data.history, profile.units)
  const week = weekDays(data.history, now)
  const last = data.history[data.history.length - 1]
  const tip = EATING_TIPS[profile.goal]
  const lead = plan.exercises[0]
  const ref = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const mine = data.customWorkouts ?? []
  const share = async (w: CustomWorkout) => {
    if (await shareOrCopy(w.name, `Train ${w.name} with me on Daylift`, shareLink(w, appLink())) === 'copied') setCopied(w.id)
  }
  useScreenMotion(ref)
  const order = days.length ? days.map(w => w.name) : rotation(profile.daysPerWeek).map(t => WORKOUT_NAMES[t])
  const position = days.length ? dayIndex : planCount(data.history)
  // On a rest day today's card is the rest, so the next workout is the planned one; otherwise it's the one after.
  const upcoming = (rest ? [1, 0] : [2, 1]).map(step => order[(position + step) % order.length])
  const title = data.inProgress ? workoutName(data.inProgress.plan) : rest ? 'Rest day' : workoutName(plan)

  return (
    <main className="screen" ref={ref}>
      <header className="home-head">
        <div className="home-brand"><Logo /><strong>Daylift</strong></div>
        <p className="eyebrow">{now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
      </header>

      <div className="plan-head">
        <p className="eyebrow">{data.inProgress ? 'In progress' : rest ? 'Coming up' : `Your next ${Math.min(3, order.length)} workouts`}</p>
        <button className="chip" onClick={onPlan}>{days.length ? 'My plan' : 'Customise plan'}</button>
      </div>

      <section className="deck" data-parallax>
        {!data.inProgress && order.length > 1 && upcoming.slice(order.length > 2 ? 0 : 1).map((name, i) => (
          <div key={i} className={`deck-back deck-back-${order.length > 2 ? i : 1}`} aria-hidden="true">
            <span>{name}</span>
            <span>{i === 0 && order.length > 2 ? 'Then' : 'Next'}</span>
          </div>
        ))}
        <div className={`deck-front${rest && !data.inProgress ? ' resting' : ''}`}>
          <div className="deck-meta">
            <span>{data.inProgress ? 'Resume' : 'Today'}</span>
            {!rest && !data.inProgress && <span>{plan.estMinutes} min</span>}
          </div>
          <h1 data-split>{title}</h1>
          <div className="deck-foot">
            <span>
              {data.inProgress
                ? 'Pick up where you left off.'
                : rest ? 'Muscles grow while you recover.' : `${plan.exercises.length} exercises${lead ? ` · ${MUSCLE_NAMES[lead.muscle]} first` : ''}`}
            </span>
            {data.inProgress
              ? <button className="pill" onClick={onResume}>Resume workout</button>
              : rest
                ? <button className="pill" onClick={() => onStart(plan)}>Train anyway</button>
                : <button className="pill" onClick={() => onStart(plan)}>Start workout</button>}
          </div>
        </div>
      </section>

      <section className="tiles">
        <div><strong className="number" data-count>{streak}</strong><span>Week streak</span></div>
        <div role="img" aria-label={`${done} of ${profile.daysPerWeek} workouts this week`}>
          <strong className="number" aria-hidden="true">{done}/{profile.daysPerWeek}</strong>
          <span className="week-dots" aria-hidden="true">{week.map((d, i) => <i key={i} className={`${d.trained ? 'on' : ''}${d.today ? ' today' : ''}`} />)}</span>
        </div>
        <div><strong className="number" data-count>{lifted.toLocaleString()}</strong><span>{profile.units} lifted</span></div>
      </section>

      <section className="mine">
        <div className="mine-head">
          <h2>My workouts</h2>
          <button className="chip" onClick={() => onBuild()}>+ Create workout</button>
        </div>
        {mine.length === 0 && <p className="muted">Build your own workout, or one to share with a friend. Each of you gets sets and reps for your own level.</p>}
        {mine.map(w => (
          <div className="mine-row" key={w.id}>
            <div>
              <strong>{w.name}</strong>
              <small>{w.exerciseIds.length} exercises{copied === w.id ? ' · Link copied' : ''}</small>
            </div>
            <div className="mine-actions">
              <button className="chip" aria-label={`Share ${w.name}`} onClick={() => share(w)}>Share</button>
              <button className="chip" aria-label={`Edit ${w.name}`} onClick={() => onBuild(w)}>Edit</button>
              {!data.inProgress && (
                <button className="pill small" aria-label={`Start ${w.name}`} onClick={() => onStart(buildCustom(profile, w, exercises))}>Start</button>
              )}
            </div>
          </div>
        ))}
      </section>

      {!data.inProgress && (
        <section>
          <h2>{rest ? `Up next: ${workoutName(plan)}` : "Today's exercises"}</h2>
          <PlanList plan={plan} />
        </section>
      )}

      {last && (
        <section data-reveal>
          <h2>Last workout</h2>
          <div className="row">
            <span>{workoutName(last)}</span>
            <span className="muted">
              {new Date(last.finishedAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
              {' · '}{totalWeight(last).toLocaleString()} {last.units}
            </span>
          </div>
        </section>
      )}

      {tip && <p className="card muted" data-reveal>{tip}</p>}

      {!isInstalled() && (
        <p className="card muted" data-reveal>
          Add Daylift to your home screen. It opens like an app, works offline and keeps your history safer.
        </p>
      )}
    </main>
  )
}
