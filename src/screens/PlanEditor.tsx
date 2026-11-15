import { useState } from 'react'
import { exercises } from '../data'
import { appLink, encodePlan, LIMITS, myPlan, shareOrCopy } from '../lib/custom'
import { buildWorkout, rotation } from '../lib/planner'
import { WORKOUT_NAMES } from '../lib/rules'
import { useAppData } from '../state/useAppData'
import type { CustomWorkout, WorkoutType } from '../types'

const TEMPLATES: { type: WorkoutType; name: string }[] = [
  { type: 'upper', name: 'Upper Body' }, { type: 'lower', name: 'Lower Body' },
  { type: 'push', name: 'Push Day' }, { type: 'pull', name: 'Pull Day' },
  { type: 'legs', name: 'Leg Day' }, { type: 'fullA', name: 'Full Body' },
]

export function PlanEditor({ onClose, onBuild }: { onClose(): void; onBuild(w?: CustomWorkout): void }) {
  const { data, update } = useAppData()
  const profile = data.profile!
  const custom = data.planMode === 'custom'
  const days = myPlan({ ...data, planMode: 'custom' })
  const mine = data.customWorkouts ?? []
  const own = mine.filter(w => !TEMPLATES.some(t => t.name === w.name))
  const [copied, setCopied] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const setDays = (next: CustomWorkout[]) => update(d => ({ ...d, planDays: next.map(w => w.id) }))
  const addDay = (w: CustomWorkout) => setDays([...days, w])
  const move = (i: number, by: number) => {
    const next = [...days]
    ;[next[i], next[i + by]] = [next[i + by], next[i]]
    setDays(next)
  }

  // A template becomes one of your workouts, so you can edit its exercises and share it.
  const addTemplate = (t: (typeof TEMPLATES)[number]) => {
    const existing = mine.find(w => w.name === t.name)
    if (existing) return addDay(existing)
    const made = { id: `w${Date.now()}`, name: t.name, exerciseIds: buildWorkout(profile, t.type, exercises).exercises.map(e => e.id) }
    update(d => ({ ...d, customWorkouts: [...(d.customWorkouts ?? []), made], planDays: [...days.map(w => w.id), made.id] }))
  }

  const share = async () => {
    const url = `${appLink()}#plan=${encodePlan(days)}`
    if (await shareOrCopy('Our Daylift plan', 'Train this plan with me on Daylift. Your app sets the reps and weights for you.', url) === 'copied') setCopied(true)
  }

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
          <p className="muted">Best if you train alone. Daylift rotates workouts for your goal and {profile.daysPerWeek} days a week:</p>
          <ol className="picked">
            {rotation(profile.daysPerWeek).map((t, i) => (
              <li key={i}><span className="index">{String(i + 1).padStart(2, '0')}</span><span><strong>{WORKOUT_NAMES[t]}</strong></span></li>
            ))}
          </ol>
        </>
      ) : (
        <>
          <p className="muted">
            Pick each day yourself, like upper body then lower body. Days go in order, so a missed day waits for your next session.
            Share the plan and friends do the same exercises, with sets, reps and weights for their own goal.
          </p>
          {days.length === 0 && <p className="card muted">Add your first day below. Until then, Daylift keeps picking for you.</p>}
          <ol className="picked">
            {days.map((w, i) => (
              <li key={i}>
                <span className="index">{String(i + 1).padStart(2, '0')}</span>
                <span><strong>{w.name}</strong><small>{w.exerciseIds.length} exercises</small></span>
                <span className="picked-actions">
                  <button aria-label={`Edit day ${i + 1}`} onClick={() => onBuild(w)}>✎</button>
                  <button aria-label={`Move day ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                  <button aria-label={`Move day ${i + 1} down`} disabled={i === days.length - 1} onClick={() => move(i, 1)}>↓</button>
                  <button aria-label={`Remove day ${i + 1}`} onClick={() => setDays(days.filter((_, k) => k !== i))}>×</button>
                </span>
              </li>
            ))}
          </ol>

          {days.length < LIMITS.days && (
            <section>
              <h2>Add a day</h2>
              <button className="secondary" onClick={() => onBuild()}>+ Create your own day</button>
              <p className="muted">Name it and pick every exercise. Or start from one of these and change it after:</p>
              <div className="chip-row">
                {TEMPLATES.map(t => <button key={t.type} className="chip" onClick={() => addTemplate(t)}>+ {t.name}</button>)}
              </div>
              {own.length > 0 && (
                <>
                  <p className="muted">Or one of your workouts:</p>
                  <div className="chip-row">
                    {own.map(w => <button key={w.id} className="chip" aria-label={`Add ${w.name}`} onClick={() => addDay(w)}>+ {w.name}</button>)}
                  </div>
                </>
              )}
            </section>
          )}

          {days.length > 0 && (
            <>
              <button className="secondary" onClick={share}>Share plan with friends</button>
              {copied && <p className="muted" role="status">Link copied. Paste it in your group chat.</p>}
            </>
          )}
          {days.length > 0 && (confirmReset ? (
            <div className="card">
              <p>Clear all {days.length} days from your plan? Your workouts stay saved under My workouts.</p>
              <button className="danger" onClick={() => { update(d => ({ ...d, planDays: [] })); setConfirmReset(false) }}>Yes, reset plan</button>
              <button className="link" onClick={() => setConfirmReset(false)}>Cancel</button>
            </div>
          ) : (
            <button className="link danger-text" onClick={() => setConfirmReset(true)}>Reset plan</button>
          ))}
          {days.length > 0 && days.length !== profile.daysPerWeek && (
            <p className="muted">Your weekly goal is {profile.daysPerWeek} workouts. You can change it in Settings.</p>
          )}
        </>
      )}
    </main>
  )
}
