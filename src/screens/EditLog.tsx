import { useState } from 'react'
import { ExercisePicker } from '../components/ExercisePicker'
import { exercises } from '../data'
import { armSet, parseReps, parseWeight } from '../lib/progress'
import { moveItem, useReorder } from '../lib/reorder'
import { ATTACHMENTS, takesAttachment } from '../lib/rules'
import { useAppData } from '../state/useAppData'
import type { Exercise, LoggedExercise, LoggedSet, WorkoutLog } from '../types'

const byId = new Map(exercises.map(e => [e.id, e]))
const text = (n?: number) => (n === undefined ? '' : String(n))

type Pair = { weight: string; reps: string }
type Row = { both: Pair; left: Pair; right: Pair }
type Draft = Omit<LoggedExercise, 'sets'> & { sides: boolean; rows: Row[] }

const toRow = (s: LoggedSet): Row => ({
  both: { weight: text(s.weight), reps: text(s.reps) },
  left: { weight: text(s.left?.weight ?? s.weight), reps: text(s.left?.reps ?? s.reps) },
  right: { weight: text(s.right?.weight ?? s.weight), reps: text(s.right?.reps ?? s.reps) },
})
const emptyRow = (): Row => ({ both: { weight: '', reps: '' }, left: { weight: '', reps: '' }, right: { weight: '', reps: '' } })

const toDraft = (e: LoggedExercise): Draft => ({
  ...e, sides: e.sets.some(s => s.left && s.right), rows: e.sets.map(toRow),
})

// Fully edits a finished workout: exercises, sets, one-arm sets and attachments. Bests and charts follow history.
export function EditLog({ log, onDone }: { log: WorkoutLog; onDone(): void }) {
  const { update } = useAppData()
  const [drafts, setDrafts] = useState(log.entries.map(toDraft))
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const reorder = useReorder<HTMLDivElement>(drafts.length, (from, to) => setDrafts(all => moveItem(all, from, to)))

  const change = (i: number, fn: (d: Draft) => Draft) => setDrafts(all => all.map((d, k) => (k === i ? fn(d) : d)))
  const setRow = (i: number, k: number, row: Row) => change(i, d => ({ ...d, rows: d.rows.map((r, n) => (n === k ? row : r)) }))
  const addRow = (i: number) => change(i, d => {
    const last = d.rows[d.rows.length - 1]
    // A new set starts at the last weight, with reps left for the person to fill in.
    const keep = (p: Pair): Pair => ({ weight: p.weight, reps: '' })
    return { ...d, rows: [...d.rows, last ? { both: keep(last.both), left: keep(last.left), right: keep(last.right) } : emptyRow()] }
  })
  const addExercise = (e: Exercise) => {
    const like = log.entries[0]
    setDrafts(all => [...all, {
      exerciseId: e.id, name: e.name, region: e.region, targetSets: like?.targetSets ?? 3, repMax: like?.repMax ?? 12,
      sides: false, rows: [emptyRow()],
    }])
    setAdding(false)
  }

  const save = () => {
    const entries: LoggedExercise[] = []
    for (const d of drafts) {
      const bodyweight = byId.get(d.exerciseId)?.bodyweight ?? false
      const read = (p: Pair) => {
        const weight = bodyweight ? 0 : parseWeight(p.weight)
        const reps = parseReps(p.reps)
        return weight === null || reps === null ? null : { weight, reps }
      }
      const sets: LoggedSet[] = []
      for (const [k, row] of d.rows.entries()) {
        let set: LoggedSet | null
        if (d.sides) {
          const l = read(row.left)
          const r = read(row.right)
          set = l && r ? armSet(l, r) : null
        } else {
          set = read(row.both)
        }
        if (!set) return setError(`Check set ${k + 1} of ${d.name}: weight more than 0 and under 1000, and whole-number reps.`)
        sets.push(set)
      }
      const { sides: _sides, rows: _rows, ...entry } = d
      if (sets.length) entries.push({ ...entry, sets })
    }
    if (entries.length === 0) return setError('There are no sets left. Use Delete workout instead.')
    update(d => ({ ...d, history: d.history.map(l => (l.id === log.id ? { ...log, entries } : l)) }))
    onDone()
  }

  // Short visible labels keep a phone row tidy; the full name is for screen readers.
  const field = (shown: string, full: string, value: string, set: (v: string) => void, mode: 'decimal' | 'numeric') => (
    <label>{shown}<input aria-label={full} inputMode={mode} value={value} onChange={e => set(e.target.value)} /></label>
  )
  const pair = (side: string, prefix: string, p: Pair, set: (p: Pair) => void, bodyweight: boolean) => (
    <div className="edit-pair">
      {side && <span className="edit-side">{side}</span>}
      {!bodyweight && field(log.units, `${prefix} weight (${log.units})`, p.weight, v => set({ ...p, weight: v }), 'decimal')}
      {field('reps', `${prefix} reps`, p.reps, v => set({ ...p, reps: v }), 'numeric')}
    </div>
  )

  return (
    <div className="edit-log">
      {drafts.length > 1 && <p className="muted">Drag ☰ to put the exercises in the order you did them.</p>}
      <div className="edit-exercises" ref={reorder.list}>
      {drafts.map((d, i) => {
        const exercise = byId.get(d.exerciseId)
        const bodyweight = exercise?.bodyweight ?? false
        return (
          <section key={d.exerciseId} className={reorder.dragging === i ? 'dragging' : undefined}>
            <div className="mine-head">
              <h3>{d.name}</h3>
              <span className="picked-actions">
                <button className="remove" aria-label={`Remove ${d.name} from this workout`} onClick={() => setDrafts(all => all.filter((_, k) => k !== i))}>×</button>
                {drafts.length > 1 && <button {...reorder.handle(i, d.name)}>☰</button>}
              </span>
            </div>
            {!exercise?.timed && (
              <label className="toggle">
                <input type="checkbox" checked={d.sides} onChange={e => change(i, x => ({ ...x, sides: e.target.checked }))} aria-label={`Each arm separately for ${d.name}`} />
                Each arm separately
              </label>
            )}
            {exercise && takesAttachment(exercise) && (
              <label className="field">Attachment
                <select value={d.attachment ?? ''} onChange={e => change(i, x => ({ ...x, attachment: e.target.value || undefined }))}>
                  <option value="">Not set</option>
                  {ATTACHMENTS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>
            )}
            {d.rows.map((row, k) => (
              <div className="edit-set" key={k}>
                <div className="edit-set-head">
                  <span className="muted">Set {k + 1}</span>
                  <button className="remove" aria-label={`Remove set ${k + 1} of ${d.name}`} onClick={() => change(i, x => ({ ...x, rows: x.rows.filter((_, n) => n !== k) }))}>×</button>
                </div>
                {d.sides ? (
                  <>
                    {pair('Left', `Set ${k + 1} left`, row.left, p => setRow(i, k, { ...row, left: p }), bodyweight)}
                    {pair('Right', `Set ${k + 1} right`, row.right, p => setRow(i, k, { ...row, right: p }), bodyweight)}
                  </>
                ) : (
                  pair('', `Set ${k + 1}`, row.both, p => setRow(i, k, { ...row, both: p }), bodyweight)
                )}
              </div>
            ))}
            <button className="link" onClick={() => addRow(i)}>+ Add a set to {d.name}</button>
          </section>
        )
      })}
      </div>

      {adding ? (
        <ExercisePicker
          title="Add an exercise"
          suggestions={[]}
          exclude={drafts.map(d => d.exerciseId)}
          onPick={addExercise}
          onClose={() => setAdding(false)}
        />
      ) : (
        <button className="secondary" onClick={() => setAdding(true)}>+ Add an exercise</button>
      )}

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
