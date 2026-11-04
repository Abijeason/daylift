import { useRef, useState } from 'react'
import { LineChart } from '../components/LineChart'
import { exercises } from '../data'
import { convert, formatSet, personalBests } from '../lib/progress'
import { workoutName } from '../lib/custom'
import { useScreenMotion } from '../lib/motion'
import { useAppData } from '../state/useAppData'

const timed = new Set(exercises.filter(e => e.timed).map(e => e.id))


export function Progress() {
  const { data } = useAppData()
  const history = data.history
  const units = data.profile?.units ?? 'kg'
  const bests = Object.entries(personalBests(history))
  // Only weighted exercises have a weight to chart.
  const charted = bests.filter(([, b]) => b.weight > 0)
  const [chosen, setChosen] = useState<string | null>(null)
  const chartId = chosen ?? charted[0]?.[0]
  const ref = useRef<HTMLElement>(null)
  useScreenMotion(ref, [history.length])

  if (history.length === 0) {
    return (
      <main className="screen" ref={ref}>
        <h1 data-split>Progress</h1>
        <p className="muted">Finish your first workout and your history will show up here.</p>
      </main>
    )
  }

  const points = history.flatMap(log => {
    const entry = log.entries.find(e => e.exerciseId === chartId)
    return entry ? [convert(Math.max(...entry.sets.map(s => s.weight)), log.units, units)] : []
  })
  const change = points.length ? Math.round((points[points.length - 1] - points[0]) * 10) / 10 : 0

  return (
    <main className="screen" ref={ref}>
      <h1 data-split>Progress</h1>
      {charted.length > 0 && (
        <section>
          <h2>Weight over time</h2>
          <label className="field">Exercise
            <select value={chartId} onChange={e => setChosen(e.target.value)}>
              {charted.map(([id, b]) => <option key={id} value={id}>{b.name}</option>)}
            </select>
          </label>
          <p className="muted">Your heaviest set each time you did this exercise.</p>
          {points.length < 2 ? (
            <p className="card muted">
              One session logged so far, at {points[0]} {units}. Do this exercise again to start your trend line.
            </p>
          ) : (
            <>
              <div className="chart-head">
                <span>{points.length} sessions</span>
                <strong>{change > 0 ? '+' : ''}{change} {units}</strong>
              </div>
              <LineChart label={charted.find(([id]) => id === chartId)?.[1].name ?? ''} values={points} units={units} />
            </>
          )}
        </section>
      )}
      {bests.length > 0 && (
        <section>
          <h2>Personal bests</h2>
          {bests.map(([id, b]) => (
            <div className="row" key={id} data-reveal>
              <span>{b.name}</span>
              <strong>{formatSet(b.weight, b.reps, b.units, timed.has(id))}</strong>
            </div>
          ))}
        </section>
      )}
      <section>
        <h2>History</h2>
        {[...history].reverse().map(log => (
          <details className="history" key={log.id} data-reveal>
            <summary className="row">
              <span>{workoutName(log)}</span>
              <span className="muted">{new Date(log.finishedAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </summary>
            {log.entries.map(e => (
              <div className="done-row" key={e.exerciseId}>
                <strong>{e.name}</strong>
                <span className="done-sets">{e.sets.map((s, i) => <span key={i}>{formatSet(s.weight, s.reps, log.units, timed.has(e.exerciseId))}</span>)}</span>
              </div>
            ))}
          </details>
        ))}
      </section>
    </main>
  )
}
