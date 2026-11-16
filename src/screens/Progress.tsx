import { useRef, useState } from 'react'
import { LineChart } from '../components/LineChart'
import { exercises } from '../data'
import { convert, describeSet, formatSet, personalBests } from '../lib/progress'
import { appLink, shareOrCopy, workoutName } from '../lib/custom'
import { encodeFriend, LIMITS, snapshot } from '../lib/friends'
import { GOALS } from '../lib/rules'
import { useScreenMotion } from '../lib/motion'
import { EditLog } from './EditLog'
import { SwipeToDelete } from '../components/SwipeToDelete'
import type { WorkoutLog } from '../types'
import { useAppData } from '../state/useAppData'

const timed = new Set(exercises.filter(e => e.timed).map(e => e.id))
const names = new Map(exercises.map(e => [e.id, e.name]))
const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

// No accounts: you send a progress link, and a friend's card changes only when they send a new one.
function Friends() {
  const { data, update } = useAppData()
  const [name, setName] = useState(data.me?.name ?? '')
  const [status, setStatus] = useState('')
  const friends = data.friends ?? []

  const share = async () => {
    const trimmed = name.trim()
    if (!trimmed) return setStatus('Add your name first, so friends know who sent it.')
    const me = { id: data.me?.id ?? `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, name: trimmed }
    update(d => ({ ...d, me }))
    const url = `${appLink()}#friend=${encodeFriend(snapshot(data, me, new Date()))}`
    const done = await shareOrCopy(`${trimmed}'s Daylift progress`, `Here's how my training is going on Daylift.`, url)
    setStatus(done === 'copied' ? 'Link copied. Paste it in your group chat.' : '')
  }

  return (
    <section className="friends">
      <h2>Friends</h2>
      <p className="muted">Send your progress to friends, and ask them to send theirs. Cards update each time someone sends a new link. Nothing is uploaded.</p>
      <label className="field">Your name for friends
        <input className="search" value={name} maxLength={LIMITS.name} placeholder="Sam" onChange={e => setName(e.target.value)} />
      </label>
      <button className="secondary" onClick={share}>Share my progress</button>
      {status && <p className="muted" role="status">{status}</p>}

      {friends.map(f => (
        <article className="friend" key={f.id} data-reveal>
          <header>
            <strong>{f.name}</strong>
            <small>{GOALS[f.goal].label} · sent {shortDate(f.sentAt)}</small>
          </header>
          <div className="friend-stats">
            <span><b className="number">{f.streak}</b>week streak</span>
            <span><b className="number">{Math.min(f.thisWeek, f.daysPerWeek)}/{f.daysPerWeek}</b>that week</span>
            <span><b className="number">{f.total}</b>workouts</span>
          </div>
          {f.recent[0] && <p className="muted">Last: {f.recent[0].name}, {shortDate(f.recent[0].at)}</p>}
          {f.bests.slice(-3).map(b => (
            <div className="row" key={b.exerciseId}>
              <span>{names.get(b.exerciseId)}</span>
              <strong>{formatSet(b.weight, b.reps, f.units, timed.has(b.exerciseId))}</strong>
            </div>
          ))}
          <button className="link danger-text" aria-label={`Remove ${f.name}`}
            onClick={() => update(d => ({ ...d, friends: (d.friends ?? []).filter(x => x.id !== f.id) }))}>Remove</button>
        </article>
      ))}
    </section>
  )
}


export function Progress() {
  const { data, update } = useAppData()
  const history = data.history
  const [editing, setEditing] = useState<string | null>(null)
  // The last deleted workout and where it was, so Undo puts it back in place.
  const [deleted, setDeleted] = useState<{ log: WorkoutLog; at: number } | null>(null)
  const remove = (log: WorkoutLog) => {
    setDeleted({ log, at: history.findIndex(l => l.id === log.id) })
    update(d => ({ ...d, history: d.history.filter(l => l.id !== log.id) }))
  }
  const undo = () => {
    if (!deleted) return
    update(d => ({ ...d, history: [...d.history.slice(0, deleted.at), deleted.log, ...d.history.slice(deleted.at)] }))
    setDeleted(null)
  }
  const units = data.profile?.units ?? 'kg'
  const bests = Object.entries(personalBests(history))
  // Only weighted exercises have a weight to chart.
  const charted = bests.filter(([, b]) => b.weight > 0)
  const [chosen, setChosen] = useState<string | null>(null)
  const chartId = chosen ?? charted[0]?.[0]
  const ref = useRef<HTMLElement>(null)
  useScreenMotion(ref, [history.length])

  const undoBar = deleted && (
    <div className="undo-bar" role="status">
      <span>Deleted {workoutName(deleted.log)}</span>
      <button className="link" onClick={undo}>Undo</button>
    </div>
  )

  if (history.length === 0) {
    return (
      <main className="screen" ref={ref}>
        <h1 data-split>Progress</h1>
        <p className="muted">Finish your first workout and your history will show up here.</p>
        <Friends />
        {undoBar}
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
      <Friends />
      <section>
        <h2>History</h2>
        {[...history].reverse().map(log => (
          <SwipeToDelete key={log.id} label={`${workoutName(log)} on ${shortDate(log.finishedAt)}`} onDelete={() => remove(log)}>
          <details className="history" data-reveal>
            <summary className="row">
              <span>{workoutName(log)}</span>
              <span className="muted">{shortDate(log.finishedAt)}</span>
            </summary>
            {editing === log.id ? <EditLog log={log} onDone={() => setEditing(null)} /> : (
              <>
                {log.entries.map(e => (
                  <div className="done-row" key={e.exerciseId}>
                    <strong>{e.name}{e.attachment ? ` · ${e.attachment}` : ''}</strong>
                    <span className="done-sets">{e.sets.map((s, i) => <span key={i}>{describeSet(s, log.units, timed.has(e.exerciseId))}</span>)}</span>
                  </div>
                ))}
                <button className="chip" aria-label={`Edit ${workoutName(log)} on ${shortDate(log.finishedAt)}`} onClick={() => setEditing(log.id)}>Edit</button>
              </>
            )}
          </details>
          </SwipeToDelete>
        ))}
      </section>
      {undoBar}
    </main>
  )
}
