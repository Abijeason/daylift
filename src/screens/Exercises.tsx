import { useMemo, useState } from 'react'
import { BodyMap } from '../components/BodyMap'
import { FormDemo } from '../components/FormDemo'
import { exercises } from '../data'
import { EXERCISE_SAFETY } from '../data/copy'
import { EQUIPMENT_LABELS } from '../lib/rules'
import { formVideoLink } from '../lib/video'
import type { Exercise, Muscle } from '../types'

function Detail({ exercise, onOpen, onBack }: { exercise: Exercise; onOpen(e: Exercise): void; onBack(): void }) {
  const easier = exercise.easierIds.flatMap(id => exercises.filter(e => e.id === id))
  return (
    <main className="screen">
      <button className="link back" onClick={onBack}>Back</button>
      <h1>{exercise.name}</h1>
      <FormDemo exercise={exercise} />
      <a className="chip" href={formVideoLink(exercise)} target="_blank" rel="noreferrer">Watch form</a>
      <h2>How to do it</h2>
      <ol className="steps">{exercise.steps.map(s => <li key={s}>{s}</li>)}</ol>
      <h2>Common mistakes</h2>
      <ul className="steps">{exercise.mistakes.map(m => <li key={m}>{m}</li>)}</ul>
      <h2>Equipment</h2>
      {exercise.needs.length === 0
        ? <p>No equipment needed</p>
        : exercise.needs.map(n => <p key={n}>{EQUIPMENT_LABELS[n]}</p>)}
      {easier.length > 0 && (
        <>
          <h2>Easier alternatives</h2>
          {easier.map(e => <button key={e.id} className="option" onClick={() => onOpen(e)}><strong>{e.name}</strong></button>)}
        </>
      )}
      <p className="card muted">{EXERCISE_SAFETY}</p>
    </main>
  )
}

export function Exercises() {
  const [muscle, setMuscle] = useState<Muscle | null>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Exercise | null>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q) return exercises.filter(e => e.name.toLowerCase().includes(q))
    return muscle ? exercises.filter(e => e.muscle === muscle) : []
  }, [query, muscle])

  if (open) return <Detail exercise={open} onOpen={setOpen} onBack={() => setOpen(null)} />

  return (
    <main className="screen">
      <h1>Exercises</h1>
      <input
        type="search" className="search" placeholder="Search exercises" aria-label="Search exercises"
        value={query} onChange={e => setQuery(e.target.value)}
      />
      {!query && <BodyMap selected={muscle} onSelect={setMuscle} />}
      {!query && !muscle && <p className="muted center">Tap a muscle to see its exercises.</p>}
      {query && results.length === 0 && <p className="muted">No exercises found. Try another name.</p>}
      <div className="list">
        {results.map(e => (
          <button key={e.id} className="option" onClick={() => setOpen(e)}>
            <strong>{e.name}</strong>
          </button>
        ))}
      </div>
    </main>
  )
}
