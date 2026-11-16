import { useEffect, useMemo, useRef, useState } from 'react'
import { FormDemo } from '../components/FormDemo'
import { MusclesWorked } from '../components/MusclesWorked'
import { TimerRing } from '../components/TimerRing'
import { exercises } from '../data'
import { FIRST_LIFT_TIP, WARMUPS } from '../data/warmups'
import { swapOptions } from '../lib/planner'
import { armSet, describeSet, formatSet, lastPerformance, lastUsed, newBests, parseReps, parseWeight, suggestWeight, totalWeight, workoutsThisWeek } from '../lib/progress'
import { ATTACHMENTS, equipmentLabel, HOLD_SECONDS, LEVELS, MUSCLE_NAMES, searchExercises, takesAttachment } from '../lib/rules'
import { useMore } from '../lib/more'
import { addExercise, addSet, finish, removeExercise, removeSet, secondsLeft, setAttachment, swapExercise } from '../lib/session'
import { useScreenMotion, useScrollTop } from '../lib/motion'
import { appLink, shareOrCopy, workoutName } from '../lib/custom'
import { encodeFriend, snapshot } from '../lib/friends'
import { formVideoLink } from '../lib/video'
import { useAppData } from '../state/useAppData'
import type { Exercise, InProgress, LoggedSet, Units, WorkoutLog } from '../types'

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

function Summary({ log, bests, onExit, onResume }: { log: WorkoutLog; bests: string[]; onExit(): void; onResume(): void }) {
  const { data } = useAppData()
  const minutes = Math.max(1, Math.round((Date.parse(log.finishedAt) - Date.parse(log.startedAt)) / 60000))
  const target = data.profile?.daysPerWeek ?? 3
  const thisWeek = Math.min(workoutsThisWeek(data.history, new Date()), target)
  const timed = new Set(exercises.filter(e => e.timed).map(e => e.id))
  const ref = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)
  useScreenMotion(ref)
  // Right after training is when the group wants to see it, so the progress link is offered here too.
  const sendToFriends = async () => {
    const url = `${appLink()}#friend=${encodeFriend(snapshot(data, data.me!, new Date()))}`
    if (await shareOrCopy(`${data.me!.name}'s Daylift progress`, `Just finished ${workoutName(log)} on Daylift.`, url) === 'copied') setCopied(true)
  }
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
            <strong>{e.name}{e.attachment ? ` · ${e.attachment}` : ''}</strong>
            <span className="done-sets">{e.sets.map((s, i) => <span key={i}>{describeSet(s, log.units, timed.has(e.exerciseId))}</span>)}</span>
          </div>
        ))}
      </section>
      {data.me && <button className="secondary" onClick={sendToFriends}>Send progress to friends</button>}
      {copied && <p className="muted" role="status">Link copied. Paste it in your group chat.</p>}
      <button className="primary" onClick={onExit}>Done</button>
      <button className="link" onClick={onResume}>Ended by mistake? Resume workout</button>
    </main>
  )
}

// Any exercise can be picked mid-workout; suggestions for the same muscle show before searching.
function ExercisePicker({ title, warning, suggestions, exclude, onPick, onClose }: {
  title: string
  warning?: string
  suggestions: Exercise[]
  exclude: string[]
  onPick(e: Exercise): void
  onClose(): void
}) {
  const [query, setQuery] = useState('')
  // Keyed by ids, so a redraw with equal lists doesn't reset Show more.
  const suggestionIds = suggestions.map(e => e.id).join()
  const excludeIds = exclude.join()
  const results = useMemo(
    () => (query.trim() ? searchExercises(exercises, query).filter(e => !exclude.includes(e.id)) : suggestions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, suggestionIds, excludeIds],
  )
  const shown = useMore(results)
  return (
    <div className="picker" role="dialog" aria-label={title}>
      <div className="mine-head">
        <h2>{title}</h2>
        <button className="link" onClick={onClose}>Cancel</button>
      </div>
      {warning && <p className="flag">{warning}</p>}
      <input type="search" className="search" aria-label="Search exercises" placeholder="Search a name or muscle, like biceps" value={query} onChange={e => setQuery(e.target.value)} />
      {!query.trim() && suggestions.length > 0 && <p className="muted">Suggestions for this muscle, or search for any exercise:</p>}
      <div className="list">
        {shown.visible.map(e => (
          <button key={e.id} className="option" aria-label={`Use ${e.name}`} onClick={() => onPick(e)}>
            <strong>{e.name}</strong>
            <span>{MUSCLE_NAMES[e.muscle]} · {equipmentLabel(e)}</span>
          </button>
        ))}
      </div>
      {shown.hasMore && <div ref={shown.end}><button className="link" onClick={shown.more}>Show more</button></div>}
    </div>
  )
}

function SetForm({ exercise, units, lastSet, onDone }: {
  exercise: Exercise
  units: Units
  lastSet?: LoggedSet
  onDone(set: LoggedSet): void
}) {
  const { data } = useAppData()
  const start = (w?: number) => (w ? String(w) : '')
  const [sides, setSides] = useState(lastSet ? !!lastSet.left : lastUsed(data.history, exercise.id).sides)
  const [weight, setWeight] = useState(start(lastSet?.weight))
  const [reps, setReps] = useState('')
  const [left, setLeft] = useState({ weight: start(lastSet?.left?.weight ?? lastSet?.weight), reps: '' })
  const [right, setRight] = useState({ weight: start(lastSet?.right?.weight ?? lastSet?.weight), reps: '' })
  const [error, setError] = useState('')
  const hint = suggestWeight(data.history, exercise.id, units)
  const last = lastPerformance(data.history, exercise.id)
  const repsWord = exercise.timed ? 'seconds' : 'reps'

  const read = (w: string, r: string, side = '') => {
    const pw = exercise.bodyweight ? 0 : parseWeight(w)
    const pr = parseReps(r)
    if (pw === null) { setError(`Enter a ${side}weight more than 0 and under 1000, like 22.5.`); return null }
    if (pr === null) { setError(`Enter your ${side}${repsWord} as a whole number.`); return null }
    return { weight: pw, reps: pr }
  }

  const submit = () => {
    let set: LoggedSet | null
    if (sides) {
      const l = read(left.weight, left.reps, 'left arm ')
      const r = l && read(right.weight, right.reps, 'right arm ')
      set = l && r ? armSet(l, r) : null
    } else {
      set = read(weight, reps)
    }
    if (!set) return
    navigator.vibrate?.(30)
    onDone(set)
  }

  const fields = (label: string, value: { weight: string; reps: string }, change: (v: { weight: string; reps: string }) => void) => (
    <fieldset className="arm">
      <legend>{label}</legend>
      <div className="set-inputs">
        {!exercise.bodyweight && (
          <label>{label} weight ({units})
            <input inputMode="decimal" value={value.weight} onChange={e => change({ ...value, weight: e.target.value })} placeholder={hint.weight?.toString()} />
          </label>
        )}
        <label>{label} {repsWord}
          <input inputMode="numeric" value={value.reps} onChange={e => change({ ...value, reps: e.target.value })} />
        </label>
      </div>
    </fieldset>
  )

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
      {!exercise.timed && (
        <label className="toggle">
          <input type="checkbox" checked={sides} onChange={e => { setSides(e.target.checked); setError('') }} />
          Each arm separately
        </label>
      )}
      {sides ? (
        <>
          {fields('Left', left, setLeft)}
          {fields('Right', right, setRight)}
        </>
      ) : (
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
      )}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" type="submit">Finish set</button>
    </form>
  )
}

export function Workout({ onExit }: { onExit(): void }) {
  const { data, update } = useAppData()
  const session = data.inProgress
  const [done, setDone] = useState<{ log: WorkoutLog; bests: string[]; resume: InProgress } | null>(null)
  const [picking, setPicking] = useState<'change' | 'add' | null>(null)
  const [removing, setRemoving] = useState<number | null>(null)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [now, setNow] = useState(Date.now)
  const [showNote] = useState(!data.timerNoteSeen)
  const beeped = useRef<number | null>(null)
  useWakeLock()

  const rest = secondsLeft(session?.restEndsAt ?? null, now)
  useScrollTop(`${session?.exerciseIndex}|${rest > 0}|${!!done}`)

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

  // Ending by mistake is undone by taking the log back out of history and carrying on where it stopped.
  const resume = () => {
    if (!done) return
    update(d => ({ ...d, history: d.history.filter(l => l.id !== done.log.id), inProgress: { ...done.resume, restEndsAt: null } }))
    setDone(null)
  }
  if (done) return <Summary log={done.log} bests={done.bests} onExit={onExit} onResume={resume} />
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
    setDone({ log: finished, bests, resume: session })
  }

  const header = (
    <header className="workout-head">
      <span className="eyebrow">{workoutName(plan)}</span>
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
  const attachment = entry.attachment ?? lastUsed(data.history, exercise.id).attachment
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
      {!exercise.needs.every(n => profile.equipment.includes(n)) && (
        <p className="flag">Not on your My Gym list. {options.length > 0 ? 'Use Change exercise if you need to.' : 'Change it, or skip it with Next exercise if you need to.'}</p>
      )}
      {!LEVELS[profile.level].allowed.includes(exercise.level) && (
        <p className="flag">This one may be above your level. Swap for an easier option if it feels too hard.</p>
      )}
      {takesAttachment(exercise) && (
        <label className="field">Attachment
          <select value={attachment ?? ''} onChange={e => set(s => setAttachment(s, index, e.target.value))}>
            <option value="">Not set</option>
            {ATTACHMENTS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
      )}
      {entry.sets.length > 0 && (
        <ol className="logged">
          {entry.sets.map((s, i) => (
            <li key={i}>
              <span className="muted">Set {i + 1}</span>
              <span>{describeSet(s, log.units, exercise.timed)}</span>
              <button className="remove" aria-label={`Remove set ${i + 1}`} onClick={() => set(st => removeSet(st, i))}>×</button>
            </li>
          ))}
        </ol>
      )}
      <SetForm
        key={`${exercise.id}-${entry.sets.length}`}
        exercise={exercise}
        units={log.units}
        lastSet={entry.sets[entry.sets.length - 1]}
        onDone={done => {
          // The attachment shown (picked now, or last time's) is saved with the first set.
          update(d => (d.inProgress
            ? { ...d, timerNoteSeen: true, inProgress: addSet(attachment ? setAttachment(d.inProgress, index, attachment) : d.inProgress, done, Date.now()) }
            : d))
          setPicking(null)
          setNow(Date.now())
        }}
      />
      <div className="step-nav">
        {index > 0 ? <button className="link" onClick={() => goTo(index - 1)}>← Previous exercise</button> : <span />}
        <button className="link" onClick={() => goTo(index + 1)}>Next exercise →</button>
      </div>
      <details className="jump">
        <summary>All exercises · go to any one</summary>
        <ol>
          {plan.exercises.map((e, i) => (
            <li key={e.id}>
              {removing === i ? (
                <div className="card">
                  <p>Remove {e.name}{log.entries[i].sets.length ? ` and its ${log.entries[i].sets.length} logged sets` : ''} from this workout?</p>
                  <button className="danger" onClick={() => { set(s => removeExercise(s, i)); setRemoving(null) }}>Yes, remove</button>
                  <button className="link" onClick={() => setRemoving(null)}>Cancel</button>
                </div>
              ) : (
                <div className="jump-row">
                  <button className="option" aria-current={i === index ? 'step' : undefined} aria-label={`Go to ${e.name}`} onClick={() => goTo(i)}>
                    <strong>{e.name}</strong>
                    <span>{log.entries[i].sets.length} of {log.entries[i].targetSets} sets</span>
                  </button>
                  {plan.exercises.length > 1 && <button className="remove" aria-label={`Remove ${e.name} from this workout`} onClick={() => setRemoving(i)}>×</button>}
                </div>
              )}
            </li>
          ))}
        </ol>
        {picking === 'add' ? (
          <ExercisePicker
            title="Add an exercise"
            suggestions={[]}
            exclude={plan.exercises.map(e => e.id)}
            onPick={e => { set(s => addExercise(s, e)); setPicking(null) }}
            onClose={() => setPicking(null)}
          />
        ) : (
          <button className="link" onClick={() => setPicking('add')}>+ Add an exercise</button>
        )}
      </details>
      <FormDemo exercise={exercise} />
      <div className="demo-actions">
        <a className="chip" href={formVideoLink(exercise)} target="_blank" rel="noreferrer">Watch form</a>
        <button className="chip" onClick={() => setPicking(picking === 'change' ? null : 'change')}>Change exercise</button>
      </div>
      {picking === 'change' && (
        <ExercisePicker
          title={`Change ${exercise.name}`}
          warning={entry.sets.length > 0 ? `Your ${entry.sets.length} logged ${entry.sets.length === 1 ? 'set' : 'sets'} for ${exercise.name} will be removed.` : undefined}
          suggestions={options}
          exclude={plan.exercises.map(e => e.id)}
          onPick={e => { set(s => swapExercise(s, e)); setPicking(null) }}
          onClose={() => setPicking(null)}
        />
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
