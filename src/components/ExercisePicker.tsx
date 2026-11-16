import { useMemo, useState } from 'react'
import { exercises } from '../data'
import { useMore } from '../lib/more'
import { equipmentLabel, MUSCLE_NAMES, searchExercises } from '../lib/rules'
import type { Exercise } from '../types'

// Pick any exercise, during a workout or when fixing one afterwards; suggestions for the same muscle show before searching.
export function ExercisePicker({ title, warning, suggestions, exclude, onPick, onClose }: {
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
