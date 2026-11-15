import { Fragment, useMemo, useState } from 'react'
import { useMore } from '../lib/more'
import { exercises } from '../data'
import { LIMITS } from '../lib/custom'
import { equipmentLabel, MUSCLE_NAMES, searchExercises } from '../lib/rules'
import { useAppData } from '../state/useAppData'
import type { CustomWorkout } from '../types'

const byId = new Map(exercises.map(e => [e.id, e]))

export function WorkoutBuilder({ workout, forPlan, onClose }: { workout?: CustomWorkout; forPlan?: boolean; onClose(saved?: CustomWorkout): void }) {
  const { data, update } = useAppData()
  const [name, setName] = useState(workout?.name ?? '')
  const [ids, setIds] = useState<string[]>(workout?.exerciseIds ?? [])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const original = { name: workout?.name ?? '', ids: workout?.exerciseIds ?? [] }
  const changed = name !== original.name || ids.join() !== original.ids.join()
  const resetChanges = () => { setName(original.name); setIds(original.ids); setError(''); setConfirmReset(false) }

  const results = useMemo(() => {
    return searchExercises(exercises, query).filter(e => !ids.includes(e.id))
  }, [query, ids])
  const shown = useMore(results)

  const move = (i: number, by: number) => setIds(list => {
    const next = [...list]
    ;[next[i], next[i + by]] = [next[i + by], next[i]]
    return next
  })

  const saveWorkout = () => {
    const trimmed = name.trim()
    if (!trimmed) return setError('Give your workout a name.')
    if (ids.length === 0) return setError('Add at least one exercise.')
    const saved: CustomWorkout = { id: workout?.id ?? `w${Date.now()}`, name: trimmed, exerciseIds: ids, ...((workout?.plan || forPlan) && { plan: true }) }
    update(d => {
      const list = d.customWorkouts ?? []
      return { ...d, customWorkouts: workout ? list.map(w => (w.id === workout.id ? saved : w)) : [...list, saved] }
    })
    onClose(saved)
  }

  const deleteWorkout = () => {
    update(d => ({
      ...d,
      customWorkouts: (d.customWorkouts ?? []).filter(w => w.id !== workout?.id),
      planWeek: d.planWeek?.map(id => (id === workout?.id ? null : id)),
    }))
    onClose()
  }

  return (
    <main className="screen builder">
      <div className="builder-head">
        <button className="link back" onClick={() => onClose()}>Cancel</button>
        {workout && !confirmDelete && <button className="link danger-text" onClick={() => setConfirmDelete(true)}>Delete</button>}
      </div>
      {workout && confirmDelete && (
        <div className="card">
          <p>Delete "{workout.name}"? Your past workouts stay in your history{data.planWeek?.includes(workout.id) ? ', and its days in your plan become rest days' : ''}.</p>
          <button className="danger" onClick={deleteWorkout}>Yes, delete</button>
          <button className="link" onClick={() => setConfirmDelete(false)}>Cancel</button>
        </div>
      )}
      <h1>{workout ? 'Edit workout' : 'New workout'}</h1>
      <label className="field">Workout name
        <input className="search" value={name} maxLength={LIMITS.name} placeholder="Upper with Sam" onChange={e => setName(e.target.value)} />
      </label>

      <h2>Exercises ({ids.length})</h2>
      {ids.length === 0 && <p className="muted">Search below and add exercises in the order you'll do them.</p>}
      <ol className="picked">
        {ids.map((id, i) => {
          const e = byId.get(id)
          if (!e) return null
          return (
            <li key={id}>
              <span className="index">{String(i + 1).padStart(2, '0')}</span>
              <span><strong>{e.name}</strong><small>{MUSCLE_NAMES[e.muscle]}</small></span>
              <span className="picked-actions">
                <button aria-label={`Move ${e.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button aria-label={`Move ${e.name} down`} disabled={i === ids.length - 1} onClick={() => move(i, 1)}>↓</button>
                <button aria-label={`Remove ${e.name}`} onClick={() => setIds(list => list.filter(x => x !== id))}>×</button>
              </span>
            </li>
          )
        })}
      </ol>

      <input type="search" className="search" placeholder="Search a name or muscle, like biceps" aria-label="Search exercises to add" value={query} onChange={e => setQuery(e.target.value)} />
      {query.trim() && results.length === 0 && <p className="muted">No exercises found. Try a name or a muscle, like biceps.</p>}
      <div className="list">
        {shown.visible.map((e, i) => (
          <Fragment key={e.id}>
            {e.library && !shown.visible[i - 1]?.library && <p className="eyebrow list-divider">More exercises</p>}
            <button
              className="option" aria-label={`Add ${e.name}`}
              disabled={ids.length >= LIMITS.exercises}
              onClick={() => { setIds(list => [...list, e.id]); setQuery('') }}
            >
              <strong>+ {e.name}</strong>
              <span>{MUSCLE_NAMES[e.muscle]} · {equipmentLabel(e)}</span>
            </button>
          </Fragment>
        ))}
      </div>
      {shown.hasMore && <div ref={shown.end}><button className="link" onClick={shown.more}>Show more</button></div>}

      <p className="muted">Sets, reps and weights come from your own goal and level, so friends can share this workout and each train at their own level.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" onClick={saveWorkout}>Save workout</button>

      {changed && (confirmReset ? (
        <div className="card">
          <p>{workout ? `Undo your changes to "${workout.name}"?` : 'Clear the name and all exercises?'}</p>
          <button className="danger" onClick={resetChanges}>Yes, reset</button>
          <button className="link" onClick={() => setConfirmReset(false)}>Cancel</button>
        </div>
      ) : (
        <button className="link" onClick={() => setConfirmReset(true)}>Reset</button>
      ))}

    </main>
  )
}
