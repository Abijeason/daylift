import { useRef, useState } from 'react'
import { Logo } from '../components/Logo'
import { exercises, imageUrl } from '../data'
import { EATING_TIPS } from '../data/copy'
import { nextWorkout, rotation } from '../lib/planner'
import { appLink, buildCustom, myWeek, planCount, shareLink, shareOrCopy, SHORT_DAYS, upcomingDays, WEEKDAYS, weeklyTarget, workoutName } from '../lib/custom'
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
          <img src={imageUrl(e, e.images[0])} alt="" loading="lazy" />
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
  const myDays = myWeek(data)
  const trainedToday = data.history.some(l => new Date(l.finishedAt).toDateString() === now.toDateString())
  const next = myDays ? upcomingDays(myDays, now, trainedToday) : []
  const plan = myDays ? buildCustom(profile, next[0].workout, exercises) : nextWorkout(profile, data.history, exercises)
  const target = weeklyTarget(data)
  // Once today's training is logged, today's card is done, whatever the plan says.
  const rest = trainedToday || (myDays ? next[0].offset > 0 : isRestDay(data.history, profile.daysPerWeek, now))
  const streak = weeklyStreak(data.history, target, now)
  const done = Math.min(workoutsThisWeek(data.history, now), target)
  const { lifted } = lifetime(data.history, profile.units)
  const week = weekDays(data.history, now)
  const last = data.history[data.history.length - 1]
  const tip = EATING_TIPS[profile.goal]
  const lead = plan.exercises[0]
  const ref = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [choosing, setChoosing] = useState(false)
  // On a rest day any workout from my week can be trained, soonest first.
  const choices = next.map(x => x.workout).filter((w, i, all) => all.indexOf(w) === i)
  const daysOf = (w: CustomWorkout) => (myDays ?? []).flatMap((d, i) => (d?.id === w.id ? [SHORT_DAYS[i]] : [])).join(', ')
  const mine = (data.customWorkouts ?? []).filter(w => !w.plan)
  const share = async (w: CustomWorkout) => {
    if (await shareOrCopy(w.name, `Train ${w.name} with me on Daylift`, shareLink(w, appLink())) === 'copied') setCopied(w.id)
  }
  useScreenMotion(ref)
  // The cards behind today's: furthest first. On a rest day the first card behind is the next workout.
  let behind: { name: string; when: string }[]
  if (myDays) {
    behind = (rest ? next.slice(0, 2) : next.slice(1, 3))
      .map(x => ({ name: x.workout.name, when: x.offset === 1 ? 'Tomorrow' : SHORT_DAYS[x.day] }))
      .reverse()
  } else {
    const order = rotation(profile.daysPerWeek).map(t => WORKOUT_NAMES[t])
    const steps = (rest ? [1, 0] : [2, 1]).slice(order.length > 2 ? 0 : order.length > 1 ? 1 : 2)
    const labels = steps.length === 2 ? ['Then', 'Next'] : ['Next']
    behind = steps.map((step, i) => ({ name: order[(planCount(data.history) + step) % order.length], when: labels[i] }))
  }
  const title = data.inProgress ? workoutName(data.inProgress.plan) : rest ? (trainedToday ? 'Done for today' : 'Rest day') : workoutName(plan)
  const again = trainedToday ? 'Train again' : 'Train anyway'

  return (
    <main className="screen" ref={ref}>
      <header className="home-head">
        <div className="home-brand"><Logo /><strong>Daylift</strong></div>
        <p className="eyebrow">{now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
      </header>

      <div className="plan-head">
        <p className="eyebrow">{data.inProgress ? 'In progress' : rest ? 'Coming up' : `Your next ${behind.length + 1} workouts`}</p>
        <button className="chip" onClick={onPlan}>{myDays ? 'My plan' : 'Customise plan'}</button>
      </div>

      <section className="deck" data-parallax>
        {!data.inProgress && behind.map((b, i) => (
          <div key={i} className={`deck-back deck-back-${behind.length === 2 ? i : 1}`} aria-hidden="true">
            <span>{b.name}</span>
            <span>{b.when}</span>
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
                : rest ? (trainedToday ? 'Nice work today. Muscles grow while you recover.' : 'Muscles grow while you recover.') : `${plan.exercises.length} exercises${lead ? ` · ${MUSCLE_NAMES[lead.muscle]} first` : ''}`}
            </span>
            {data.inProgress
              ? <button className="pill" onClick={onResume}>Resume workout</button>
              : rest
                ? <button className="pill" aria-expanded={myDays ? choosing : undefined} onClick={() => (myDays && choices.length > 1 ? setChoosing(v => !v) : onStart(plan))}>{again}</button>
                : <button className="pill" onClick={() => onStart(plan)}>Start workout</button>}
          </div>
        </div>
      </section>

      {choosing && rest && !data.inProgress && (
        <section className="choose" aria-label="Pick a workout to train">
          <p className="eyebrow">{again}: pick a workout</p>
          {choices.map(w => (
            <button key={w.id} className="option" aria-label={`Train ${w.name}`} onClick={() => onStart(buildCustom(profile, w, exercises))}>
              <strong>{w.name}</strong>
              <span>{w.exerciseIds.length} {w.exerciseIds.length === 1 ? 'exercise' : 'exercises'} · usually {daysOf(w)}</span>
            </button>
          ))}
        </section>
      )}

      <section className="tiles">
        <div><strong className="number" data-count>{streak}</strong><span>Week streak</span></div>
        <div role="img" aria-label={`${done} of ${target} workouts this week`}>
          <strong className="number" aria-hidden="true">{done}/{target}</strong>
          <span className="week-dots" aria-hidden="true">{week.map((d, i) => <i key={i} className={`${d.trained ? 'on' : ''}${d.today ? ' today' : ''}`} />)}</span>
        </div>
        <div><strong className="number" data-count>{lifted.toLocaleString()}</strong><span>{profile.units} lifted</span></div>
      </section>

      <section className="mine">
        <div className="mine-head">
          <h2>My workouts</h2>
          <button className="chip" onClick={() => onBuild()}>+ Create workout</button>
        </div>
        {mine.length > 0 && <p className="muted">Extra sessions you can start any time. Your plan stays where it is.</p>}
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
          <h2>{rest ? `Up next: ${workoutName(plan)}${myDays ? `, ${next[0].offset === 1 ? 'tomorrow' : WEEKDAYS[next[0].day]}` : ''}` : "Today's exercises"}</h2>
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
