import { useState } from 'react'
import { exercises } from '../data'
import { armSet, parseReps, parseWeight } from '../lib/progress'
import { useAppData } from '../state/useAppData'
import type { LoggedExercise, LoggedSet, WorkoutLog } from '../types'

const byId = new Map(exercises.map(e => [e.id, e]))
const text = (n?: number) => (n === undefined ? '' : String(n))

type Row = { weight: string; reps: string; left?: { weight: string; reps: string }; right?: { weight: string; reps: string } }

const toRow = (s: LoggedSet): Row => ({
  weight: text(s.weight), reps: text(s.reps),
  ...(s.left && s.right && {
    left: { weight: text(s.left.weight), reps: text(s.left.reps) },
    right: { weight: text(s.right.weight), reps: text(s.right.reps) },
  }),
})

// Fixes a finished workout: change, add or remove sets, or delete it. Bests and charts follow history, so they update too.
export function EditLog({ log, onDone }: { log: WorkoutLog; onDone(): void }) {
  const { update } = useAppData()
  const [rows, setRows] = useState(log.entries.map(e => e.sets.map(toRow)))
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const change = (entry: number, set: number, row: Row) => setRows(all => all.map((r, i) => (i === entry ? r.map((x, k) => (k === set ? row : x)) : r)))
  const remove = (entry: number, set: number) => setRows(all => all.map((r, i) => (i === entry ? r.filter((_, k) => k !== set) : r)))
  const add = (entry: number) => setRows(all => all.map((r, i) => {
    if (i !== entry) return r
    const last = r[r.length - 1]
    return [...r, last ? { ...last, reps: '', ...(last.left && { left: { ...last.left, reps: '' }, right: { ...last.right!, reps: '' } }) } : { weight: '', reps: '' }]
  }))

  const save = () => {
    const entries: LoggedExercise[] = []
    for (const [i, entry] of log.entries.entries()) {
      const bodyweight = byId.get(entry.exerciseId)?.bodyweight ?? false
      const read = (w: string, r: string) => {
        const weight = bodyweight ? 0 : parseWeight(w)
        const reps = parseReps(r)
        return weight === null || reps === null ? null : { weight, reps }
      }
      const sets: LoggedSet[] = []
      for (const [k, row] of rows[i].entries()) {
        const set = row.left && row.right
          ? (() => { const l = read(row.left.weight, row.left.reps); const r = read(row.right.weight, row.right.reps); return l && r ? armSet(l, r) : null })()
          : read(row.weight, row.reps)
        if (!set) return setError(`Check set ${k + 1} of ${entry.name}: weight more than 0 and under 1000, and whole-number reps.`)
        sets.push(set)
      }
      if (sets.length) entries.push({ ...entry, sets })
    }
    if (entries.length === 0) return setError('Every set is removed. Use Delete workout instead.')
    update(d => ({ ...d, history: d.history.map(l => (l.id === log.id ? { ...log, entries } : l)) }))
    onDone()
  }

  const input = (label: string, value: string, set: (v: string) => void, mode: 'decimal' | 'numeric') => (
    <label>{label}<input inputMode={mode} value={value} onChange={e => set(e.target.value)} /></label>
  )

  return (
    <div className="edit-log">
      {log.entries.map((entry, i) => {
        const bodyweight = byId.get(entry.exerciseId)?.bodyweight ?? false
        return (
          <section key={entry.exerciseId}>
            <h3>{entry.name}</h3>
            {rows[i].map((row, k) => (
              <div className="edit-set" key={k}>
                <span className="muted">Set {k + 1}</span>
                {row.left && row.right ? (
                  <>
                    {!bodyweight && input(`Set ${k + 1} left weight (${log.units})`, row.left.weight, v => change(i, k, { ...row, left: { ...row.left!, weight: v } }), 'decimal')}
                    {input(`Set ${k + 1} left reps`, row.left.reps, v => change(i, k, { ...row, left: { ...row.left!, reps: v } }), 'numeric')}
                    {!bodyweight && input(`Set ${k + 1} right weight (${log.units})`, row.right.weight, v => change(i, k, { ...row, right: { ...row.right!, weight: v } }), 'decimal')}
                    {input(`Set ${k + 1} right reps`, row.right.reps, v => change(i, k, { ...row, right: { ...row.right!, reps: v } }), 'numeric')}
                  </>
                ) : (
                  <>
                    {!bodyweight && input(`Set ${k + 1} weight (${log.units})`, row.weight, v => change(i, k, { ...row, weight: v }), 'decimal')}
                    {input(`Set ${k + 1} reps`, row.reps, v => change(i, k, { ...row, reps: v }), 'numeric')}
                  </>
                )}
                <button className="remove" aria-label={`Remove set ${k + 1} of ${entry.name}`} onClick={() => remove(i, k)}>×</button>
              </div>
            ))}
            <button className="link" onClick={() => add(i)}>+ Add a set to {entry.name}</button>
          </section>
        )
      })}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" onClick={save}>Save changes</button>
      <button className="link" onClick={onDone}>Cancel</button>
      {confirmDelete ? (
        <div className="card">
          <p>Delete this whole workout from your history? This can't be undone.</p>
          <button className="danger" onClick={() => update(d => ({ ...d, history: d.history.filter(l => l.id !== log.id) }))}>Yes, delete workout</button>
          <button className="link" onClick={() => setConfirmDelete(false)}>Cancel</button>
        </div>
      ) : (
        <button className="link danger-text" onClick={() => setConfirmDelete(true)}>Delete workout</button>
      )}
    </div>
  )
}
