import { useEffect, useRef, useState } from 'react'
import { FormDemo } from '../components/FormDemo'
import { MusclesWorked } from '../components/MusclesWorked'
import { TimerRing } from '../components/TimerRing'
import { exercises } from '../data'
import { FIRST_LIFT_TIP, WARMUPS } from '../data/warmups'
import { swapOptions } from '../lib/planner'
import { formatSet, lastPerformance, newBests, parseReps, parseWeight, suggestWeight, totalWeight, workoutsThisWeek } from '../lib/progress'
import { HOLD_SECONDS, WORKOUT_NAMES } from '../lib/rules'
import { addSet, finish, removeSet, secondsLeft, swapExercise } from '../lib/session'
import { useScreenMotion } from '../lib/motion'
import { formVideoLink } from '../lib/video'
import { useAppData } from '../state/useAppData'
import type { Exercise, InProgress, Units, WorkoutLog } from '../types'

function beep() {
  try {
    const audio = new AudioContext()
    const tone = audio.createOscillator()
    tone.connect(audio.destination)
    tone.frequency.value = 880
    tone.start()
    tone.stop(audio.currentTime + 0.2)
  } catch {
    // Sound is a bonus. The timer still shows on screen.
  }
  navigator.vibrate?.(200)
}

function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    const request = () => {
      if (document.visibilityState === 'visible') {
        navigator.wakeLock?.request('screen').then(l => { lock = l }).catch(() => {})
      }
    }
    request()
    document.addEventListener('visibilitychange', request)
    return () => {
      document.removeEventListener('visibilitychange', request)
      lock?.release().catch(() => {})
    }
  }, [])
}

function Summary({ log, bests, onExit }: { log: WorkoutLog; bests: string[]; onExit(): void }) {
  const { data } = useAppData()
  const minutes = Math.max(1, Math.round((Date.parse(log.finishedAt) - Date.parse(log.startedAt)) / 60000))
  const target = data.profile?.daysPerWeek ?? 3
  const thisWeek = Math.min(workoutsThisWeek(data.history, new Date()), target)
  const timed = new Set(exercises.filter(e => e.timed).map(e => e.id))
  const ref = useRef<HTMLElement>(null)
  useScreenMotion(ref)
  return (
    <main className="screen summary" ref={ref}>
      <div className="sweep" aria-hidden="true" />
      <h1 data-split>Workout complete</h1>
      <div className="stats">
        <div><strong className="number" data-count>{minutes}</strong><span>{minutes === 1 ? 'minute' : 'minutes'}</span></div>
        <div><strong className="number" data-count>{totalWeight(log).toLocaleString()}</strong><span>{log.units} lifted</span></div>
      </div>
      <p className="card streak"><strong className="number">{thisWeek}/{target}</strong><span>workouts this week</span></p>
      {bests.length > 0 && (
        <section className="card best">
          <h2>New personal best</h2>
          <ul>{bests.map(b => <li key={b}>{b}</li>)}</ul>
        </section>
      )}
      <section>
        <h2>What you did</h2>
        {log.entries.map(e => (
          <div className="done-row" key={e.exerciseId}>
            <strong>{e.name}</strong>
            <span className="done-sets">{e.sets.map((s, i) => <span key={i}>{formatSet(s.weight, s.reps, log.units, timed.has(e.exerciseId))}</span>)}</span>
          </div>
        ))}
      </section>
      <button className="primary" onClick={onExit}>Done</button>
    </main>
  )
}

function SetForm({ exercise, units, lastWeight, onDone }: {
  exercise: Exercise
  units: Units
  lastWeight?: number
  onDone(weight: number, reps: number): void
}) {
  const { data } = useAppData()
  const [weight, setWeight] = useState(lastWeight ? String(lastWeight) : '')
  const [reps, setReps] = useState('')
  const [error, setError] = useState('')
  const hint = suggestWeight(data.history, exercise.id, units)
  const last = lastPerformance(data.history, exercise.id)

  const submit = () => {
    const w = exercise.bodyweight ? 0 : parseWeight(weight)
    const r = parseReps(reps)
    if (w === null) return setError('Enter a weight more than 0 and under 1000, like 22.5.')
    if (r === null) return setError(exercise.timed ? 'Enter your seconds as a whole number.' : 'Enter your reps as a whole number.')
    navigator.vibrate?.(30)
    onDone(w, r)
  }

  return (
    <form className="set-form" onSubmit={e => { e.preventDefault(); submit() }}>
      {last && <p className="last-time">Last time: {formatSet(last.weight, last.reps, last.units, exercise.timed)}</p>}
      {!exercise.bodyweight && (
        <p className="muted">
          {hint.weight === null
            ? 'Choose a weight where the last reps feel hard but your form stays clean.'
            : `Try ${hint.weight} ${units}.${hint.increase ? ' You earned an increase!' : ''}`}
        </p>
      )}
      <div className="set-inputs">
        {!exercise.bodyweight && (
          <label>Weight ({units})
            <input inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder={hint.weight?.toString()} />
          </label>
        )}
        <label>{exercise.timed ? 'Seconds held' : 'Reps'}
          <input inputMode="numeric" value={reps} onChange={e => setReps(e.target.value)} />
        </label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" type="submit">Finish set</button>
    </form>
  )
}

export function Workout({ onExit }: { onExit(): void }) {
  const { data, update } = useAppData()
  const session = data.inProgress
  const [done, setDone] = useState<{ log: WorkoutLog; bests: string[] } | null>(null)
  const [swapping, setSwapping] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [now, setNow] = useState(Date.now)
  const [showNote] = useState(!data.timerNoteSeen)
  const beeped = useRef<number | null>(null)
  useWakeLock()

  const rest = secondsLeft(session?.restEndsAt ?? null, now)

  useEffect(() => {
    if (!rest) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [rest > 0])

  useEffect(() => {
    const refresh = () => setNow(Date.now())
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [])

  useEffect(() => {
    const endsAt = session?.restEndsAt ?? null
    if (endsAt !== null && rest === 0 && endsAt > now - 2000 && beeped.current !== endsAt) {
      beeped.current = endsAt
      beep()
    }
  }, [rest])

  if (done) return <Summary log={done.log} bests={done.bests} onExit={onExit} />
  if (!session) return null

  const { plan, exerciseIndex: index, log } = session
  const exercise = plan.exercises[index]
  const profile = data.profile!
  const set = (fn: (s: InProgress) => InProgress) =>
    update(d => (d.inProgress ? { ...d, inProgress: fn(d.inProgress) } : d))

  const end = () => {
    const finished = finish(session, new Date())
    if (!finished) {
      update(d => ({ ...d, inProgress: null }))
      onExit()
      return
    }
    const bests = newBests(finished, data.history)
    update(d => ({ ...d, inProgress: null, history: [...d.history, finished] }))
    setDone({ log: finished, bests })
  }

  const header = (
    <header className="workout-head">
      <span className="eyebrow">{WORKOUT_NAMES[plan.type]}</span>
      <button className="link" onClick={() => setConfirmEnd(true)}>End workout</button>
      {confirmEnd && (
        <div className="card end-card" role="dialog" aria-label="End workout">
          <p>End this workout now? Anything you've logged will be saved.</p>
          <button className="primary" onClick={end}>Yes, end workout</button>
          <button className="link" onClick={() => setConfirmEnd(false)}>Keep going</button>
        </div>
      )}
    </header>
  )

  const goTo = (i: number) => set(s => ({ ...s, exerciseIndex: i, restEndsAt: null }))
  const nextExercise = plan.exercises[index]
  const nextEntry = log.entries[index]
  const upNext = nextExercise && nextEntry
    ? `Next: ${nextExercise.name}, set ${nextEntry.sets.length + 1} of ${nextEntry.targetSets}`
    : plan.prescription.cardioMin > 0 ? 'Next: cardio finisher' : 'Next: finish your workout'

  if (index === -1) {
    return (
      <main className="screen">
        {header}
        <h1>Warm-up</h1>
        <ol className="steps">{WARMUPS[plan.type].map(s => <li key={s}>{s}</li>)}</ol>
        <p className="muted">{FIRST_LIFT_TIP}</p>
        <button className="primary" onClick={() => set(s => ({ ...s, exerciseIndex: 0 }))}>Warm-up done</button>
        <button className="link" onClick={() => set(s => ({ ...s, exerciseIndex: 0 }))}>Skip warm-up</button>
      </main>
    )
  }

  if (rest > 0) {
    return (
      <main className="screen rest">
        {header}
        <div className="tick" aria-hidden="true" />
        <h1>Rest</h1>
        <p className="center muted">{upNext}</p>
        <TimerRing seconds={rest} total={plan.prescription.restSec} />
        {showNote && <p className="muted">If your phone is locked, the alert may not sound. The timer stays correct when you come back.</p>}
        <div className="rest-actions">
          <button className="secondary" onClick={() => set(s => ({ ...s, restEndsAt: (s.restEndsAt ?? 0) + 15000 }))}>Add 15 sec</button>
          <button className="primary" onClick={() => set(s => ({ ...s, restEndsAt: null }))}>Skip rest</button>
        </div>
      </main>
    )
  }

  if (!exercise) {
    return (
      <main className="screen">
        {header}
        {plan.prescription.cardioMin > 0 ? (
          <>
            <h1>Cardio finisher</h1>
            <p>{plan.prescription.cardioMin} minutes at a pace that makes you breathe harder. A treadmill, bike, or brisk walk all work.</p>
          </>
        ) : (
          <h1>All sets done</h1>
        )}
        <button className="primary" onClick={end}>Finish workout</button>
      </main>
    )
  }

  const entry = log.entries[index]
  const options = swapOptions(profile, exercise, plan, exercises)

  return (
    <main className="screen">
      {header}
      <div className="exercise-count" aria-hidden="true">
        {plan.exercises.map((e, i) => <span key={e.id} className={i < index ? 'on' : i === index ? 'now' : ''} />)}
      </div>
      <h1>{exercise.name}</h1>
      <p className="target">
        {entry.sets.length >= entry.targetSets
          ? `All ${entry.targetSets} sets done · log an extra set or move on`
          : `Set ${entry.sets.length + 1} of ${entry.targetSets} · ${exercise.timed ? `hold ${HOLD_SECONDS}` : `${plan.prescription.repMin}–${plan.prescription.repMax} reps`}`}
      </p>
      {entry.sets.length > 0 && (
        <ol className="logged">
          {entry.sets.map((s, i) => (
            <li key={i}>
              <span className="muted">Set {i + 1}</span>
              <span>{formatSet(s.weight, s.reps, log.units, exercise.timed)}</span>
              <button className="remove" aria-label={`Remove set ${i + 1}`} onClick={() => set(st => removeSet(st, i))}>×</button>
            </li>
          ))}
        </ol>
      )}
      <SetForm
        key={`${exercise.id}-${entry.sets.length}`}
        exercise={exercise}
        units={log.units}
        lastWeight={entry.sets[entry.sets.length - 1]?.weight}
        onDone={(weight, reps) => {
          update(d => (d.inProgress
            ? { ...d, timerNoteSeen: true, inProgress: addSet(d.inProgress, { weight, reps }, Date.now()) }
            : d))
          setSwapping(false)
          setNow(Date.now())
        }}
      />
      <div className="step-nav">
        {index > 0 ? <button className="link" onClick={() => goTo(index - 1)}>← Previous exercise</button> : <span />}
        <button className="link" onClick={() => goTo(index + 1)}>Next exercise →</button>
      </div>
      <FormDemo exercise={exercise} />
      <div className="demo-actions">
        <a className="chip" href={formVideoLink(exercise)} target="_blank" rel="noreferrer">Watch form</a>
        {entry.sets.length === 0 && options.length > 0 && (
          <button className="chip" onClick={() => setSwapping(v => !v)}>Swap</button>
        )}
      </div>
      {swapping && entry.sets.length === 0 && (
        <div className="swap-list">
          {options.map(o => (
            <button key={o.id} className="option" aria-label={`Use ${o.name}`} onClick={() => { set(s => swapExercise(s, o)); setSwapping(false) }}>
              <strong>{o.name}</strong>
            </button>
          ))}
        </div>
      )}
      <MusclesWorked exercise={exercise} />
      <details className="tips">
        <summary>Form tips</summary>
        <ol>{exercise.steps.map(s => <li key={s}>{s}</li>)}</ol>
        <h2>Common mistakes</h2>
        <ul>{exercise.mistakes.map(m => <li key={m}>{m}</li>)}</ul>
      </details>
    </main>
  )
}
