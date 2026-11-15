import { useState } from 'react'
import { exercises } from '../data'
import { appLink, emptyWeek, encodePlan, prunePlan, shareOrCopy, trainingDays, WEEKDAYS } from '../lib/custom'
import { buildWorkout, rotation } from '../lib/planner'
import { WORKOUT_NAMES } from '../lib/rules'
import { useAppData } from '../state/useAppData'
import type { CustomWorkout, SavedData, WorkoutType } from '../types'

const TEMPLATES: { type: WorkoutType; name: string }[] = [
  { type: 'upper', name: 'Upper Body' }, { type: 'lower', name: 'Lower Body' },
  { type: 'push', name: 'Push Day' }, { type: 'pull', name: 'Pull Day' },
  { type: 'legs', name: 'Leg Day' }, { type: 'fullA', name: 'Full Body' },
]

export function PlanEditor({ onClose, onBuild }: { onClose(): void; onBuild(w: CustomWorkout | undefined, day: number): void }) {
  const { data, update } = useAppData()
  const profile = data.profile!
  const custom = data.planMode === 'custom'
  const all = data.customWorkouts ?? []
  const ids = data.planWeek ?? emptyWeek()
  const week = ids.map(id => all.find(w => w.id === id) ?? null)
  const inPlan = all.filter(w => w.plan && ids.includes(w.id))
  const mine = all.filter(w => !w.plan)
  const [picking, setPicking] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const setDay = (day: number, id: string | null, extra?: CustomWorkout) => {
    update(d => {
      const planWeek = [...(d.planWeek ?? emptyWeek())]
      planWeek[day] = id
      const customWorkouts = extra ? [...(d.customWorkouts ?? []), extra] : d.customWorkouts
      return prunePlan({ ...d, planWeek, customWorkouts } as SavedData)
    })
    setPicking(null)
  }

  // Templates and copies of your own workouts become plan days, separate from My workouts.
  const addTemplate = (day: number, t: (typeof TEMPLATES)[number]) => {
    const made = { id: `w${Date.now()}`, name: t.name, exerciseIds: buildWorkout(profile, t.type, exercises).exercises.map(e => e.id), plan: true }
    setDay(day, made.id, made)
  }
  const copyWorkout = (day: number, w: CustomWorkout) => {
    const copy = { id: `w${Date.now()}`, name: w.name, exerciseIds: [...w.exerciseIds], plan: true }
    setDay(day, copy.id, copy)
  }

  const share = async () => {
    const url = `${appLink()}#plan=${encodePlan(week)}`
    if (await shareOrCopy('Our Daylift week', 'Train this week with me on Daylift. Your app sets the reps and weights for you.', url) === 'copied') setCopied(true)
  }

  const count = trainingDays(week)

  return (
    <main className="screen builder">
      <button className="link back" onClick={onClose}>Done</button>
      <h1>Your plan</h1>

      <div className="segmented" role="group" aria-label="Who picks your workouts">
        <button aria-pressed={!custom} onClick={() => update(d => ({ ...d, planMode: 'default' }))}>Daylift picks</button>
        <button aria-pressed={custom} onClick={() => update(d => ({ ...d, planMode: 'custom' }))}>I pick</button>
      </div>

      {!custom ? (
        <>
          <p className="muted">Best if you train alone. Daylift rotates workouts for your goal, {profile.daysPerWeek} days a week, on whichever days you go:</p>
          <ol className="picked">
            {rotation(profile.daysPerWeek).map((t, i) => (
              <li key={i}><span className="index">{String(i + 1).padStart(2, '0')}</span><span><strong>{WORKOUT_NAMES[t]}</strong></span></li>
            ))}
          </ol>
        </>
      ) : (
        <>
          <p className="muted">
            Set each day of the week, Monday to Sunday. Good for training with friends: share the week and everyone does the same
            exercises on the same days, with sets, reps and weights for their own goal.
          </p>
          {count === 0 && <p className="card muted">Tap Change on your training days to pick a workout. Until then, Daylift keeps picking for you.</p>}

          <ol className="plan-week">
            {WEEKDAYS.map((name, day) => {
              const w = week[day]
              return (
                <li key={name} className={w ? 'week-day' : 'week-day week-rest'}>
                  <div className="week-row">
                    <span className="week-name">{name.slice(0, 3)}</span>
                    <span className="week-what">
                      <strong>{w ? w.name : 'Rest'}</strong>
                      {w && <small>{w.exerciseIds.length} exercises</small>}
                    </span>
                    <span className="picked-actions">
                      {w && <button aria-label={`Edit ${name}`} onClick={() => onBuild(w, day)}>✎</button>}
                      <button className="chip" aria-expanded={picking === day} aria-label={`Change ${name}`} onClick={() => setPicking(picking === day ? null : day)}>
                        {picking === day ? 'Close' : 'Change'}
                      </button>
                    </span>
                  </div>

                  {picking === day && (
                    <div className="week-picker">
                      <div className="chip-row">
                        <button className="chip" aria-pressed={!w} onClick={() => setDay(day, null)}>Rest</button>
                        {inPlan.map(p => (
                          <button key={p.id} className="chip" aria-pressed={w?.id === p.id} onClick={() => setDay(day, p.id)}>{p.name}</button>
                        ))}
                      </div>
                      <button className="secondary" onClick={() => onBuild(undefined, day)}>+ Create your own</button>
                      <p className="muted">Or start from one of these and change it after:</p>
                      <div className="chip-row">
                        {TEMPLATES.filter(t => !inPlan.some(p => p.name === t.name)).map(t => (
                          <button key={t.type} className="chip" onClick={() => addTemplate(day, t)}>+ {t.name}</button>
                        ))}
                      </div>
                      {mine.length > 0 && (
                        <>
                          <p className="muted">Or copy one of your workouts:</p>
                          <div className="chip-row">
                            {mine.map(m => <button key={m.id} className="chip" aria-label={`Copy ${m.name}`} onClick={() => copyWorkout(day, m)}>+ {m.name}</button>)}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>

          {count > 0 && <p className="muted">{count} training {count === 1 ? 'day' : 'days'} and {7 - count} rest {7 - count === 1 ? 'day' : 'days'} a week.</p>}

          {count > 0 && (
            <>
              <button className="secondary" onClick={share}>Share plan with friends</button>
              {copied && <p className="muted" role="status">Link copied. Paste it in your group chat.</p>}
              {confirmReset ? (
                <div className="card">
                  <p>Set every day back to Rest? Your workouts under My workouts aren't touched.</p>
                  <button className="danger" onClick={() => { update(d => prunePlan({ ...d, planWeek: emptyWeek() })); setConfirmReset(false) }}>Yes, reset plan</button>
                  <button className="link" onClick={() => setConfirmReset(false)}>Cancel</button>
                </div>
              ) : (
                <button className="link danger-text" onClick={() => setConfirmReset(true)}>Reset plan</button>
              )}
            </>
          )}
        </>
      )}
    </main>
  )
}
