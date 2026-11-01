import { useState } from 'react'
import { LineChart } from '../components/LineChart'
import { convert, personalBests } from '../lib/progress'
import { WORKOUT_NAMES } from '../lib/rules'
import { useAppData } from '../state/useAppData'

export function Progress() {
  const { data } = useAppData()
  const history = data.history
  const units = data.profile?.units ?? 'kg'
  const bests = Object.entries(personalBests(history))
  const [chosen, setChosen] = useState<string | null>(null)
  const chartId = chosen ?? bests[0]?.[0]

  if (history.length === 0) {
    return (
      <main className="screen">
        <h1>Progress</h1>
        <p className="muted">Finish your first workout and your history will show up here.</p>
      </main>
    )
  }

  const points = history.flatMap(log => {
    const entry = log.entries.find(e => e.exerciseId === chartId)
    return entry ? [convert(Math.max(...entry.sets.map(s => s.weight)), log.units, units)] : []
  })

  return (
    <main className="screen">
      <h1>Progress</h1>
      {bests.length > 0 && (
        <section>
          <h2>Weight over time</h2>
          <label className="field">Exercise
            <select value={chartId} onChange={e => setChosen(e.target.value)}>
              {bests.map(([id, b]) => <option key={id} value={id}>{b.name}</option>)}
            </select>
          </label>
          <LineChart label={bests.find(([id]) => id === chartId)?.[1].name ?? ''} values={points} />
        </section>
      )}
      {bests.length > 0 && (
        <section>
          <h2>Personal bests</h2>
          {bests.map(([id, b]) => (
            <div className="row" key={id}>
              <span>{b.name}</span>
              <strong>{b.weight} {b.units}</strong>
            </div>
          ))}
        </section>
      )}
      <section>
        <h2>History</h2>
        {[...history].reverse().map(log => (
          <div className="row" key={log.id}>
            <span>{WORKOUT_NAMES[log.type]}</span>
            <span className="muted">{new Date(log.finishedAt).toLocaleDateString()}</span>
          </div>
        ))}
      </section>
    </main>
  )
}
