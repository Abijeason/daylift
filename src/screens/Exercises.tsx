import { Fragment, useMemo, useRef, useState } from 'react'
import { useMore } from '../lib/more'
import { BodyMap } from '../components/BodyMap'
import { FormDemo } from '../components/FormDemo'
import { MusclesWorked } from '../components/MusclesWorked'
import { exercises } from '../data'
import { EXERCISE_SAFETY } from '../data/copy'
import { equipmentLabel, MUSCLE_NAMES, searchExercises } from '../lib/rules'
import { useScreenMotion, useScrollTop } from '../lib/motion'
import { useBack } from '../lib/back'
import { formVideoLink } from '../lib/video'
import type { Exercise, Muscle } from '../types'

function Detail({ exercise, onOpen, onBack }: { exercise: Exercise; onOpen(e: Exercise): void; onBack(): void }) {
  const easier = exercise.easierIds.flatMap(id => exercises.filter(e => e.id === id))
  return (
    <div className="screen">
      <button className="link back" onClick={onBack}>Back</button>
      <h1 data-split>{exercise.name}</h1>
      <FormDemo exercise={exercise} />
      <a className="chip" href={formVideoLink(exercise)} target="_blank" rel="noreferrer">Watch form</a>
      <MusclesWorked exercise={exercise} />
      <h2>How to do it</h2>
      <ol className="steps">{exercise.steps.map(s => <li key={s}>{s}</li>)}</ol>
      {exercise.mistakes.length > 0 && (
        <>
          <h2>Common mistakes</h2>
          <ul className="steps">{exercise.mistakes.map(m => <li key={m}>{m}</li>)}</ul>
        </>
      )}
      <h2>Equipment</h2>
      <p>{exercise.needs.length || exercise.gear ? equipmentLabel(exercise) : 'No equipment needed'}</p>
      {exercise.library && <p className="muted">From the open exercise library. Check the form video, and start light if it's new to you.</p>}
      {easier.length > 0 && (
        <>
          <h2>Easier alternatives</h2>
          {easier.map(e => <button key={e.id} className="option" onClick={() => onOpen(e)}><strong>{e.name}</strong></button>)}
        </>
      )}
      <p className="card muted">{EXERCISE_SAFETY}</p>
    </div>
  )
}

export function Exercises() {
  const [muscle, setMuscle] = useState<Muscle | null>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Exercise | null>(null)
  useScrollTop(open?.id)
  useBack(open !== null, () => setOpen(null))
  const ref = useRef<HTMLElement>(null)
  useScreenMotion(ref, [open])

  const results = useMemo(() => {
    if (query.trim()) return searchExercises(exercises, query)
    return muscle ? exercises.filter(e => e.muscle === muscle) : []
  }, [query, muscle])

  const list = useMore(results)

  if (open) return <main ref={ref}><Detail exercise={open} onOpen={setOpen} onBack={() => setOpen(null)} /></main>

  return (
    <main className="screen" ref={ref}>
      <h1 data-split>Exercises</h1>
      <input
        type="search" className="search" placeholder="Search exercises" aria-label="Search exercises"
        value={query} onChange={e => setQuery(e.target.value)}
      />
      {!query && (
        <div className="muscle-title" key={muscle ?? 'none'} aria-live="polite">
          {muscle ? (
            <>
              <h2>{MUSCLE_NAMES[muscle]}</h2>
              <span>{results.length} exercises</span>
            </>
          ) : (
            <span>Tap a muscle to see its exercises.</span>
          )}
        </div>
      )}
      {!query && <BodyMap selected={muscle} onSelect={setMuscle} />}
      {query && results.length === 0 && <p className="muted">No exercises found. Try a name or a muscle, like biceps.</p>}
      {!query && muscle && results.length === 0 && <p className="muted center">No exercises for this muscle yet.</p>}
      <div className="list" key={`${muscle}-${query}`}>
        {list.visible.map((e, i) => (
          <Fragment key={e.id}>
            {e.library && !list.visible[i - 1]?.library && <p className="eyebrow list-divider">More exercises</p>}
            <button className="option" onClick={() => setOpen(e)}>
              <strong>{e.name}</strong>
              <span>{equipmentLabel(e)}</span>
            </button>
          </Fragment>
        ))}
      </div>
      {list.hasMore && <div ref={list.end}><button className="link" onClick={list.more}>Show more</button></div>}
    </main>
  )
}
