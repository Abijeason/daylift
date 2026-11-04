import { useEffect, useState } from 'react'
import { decodeShare } from './lib/custom'
import { Backdrop } from './components/Backdrop'
import type { CustomWorkout } from './types'
import { requestPersistence } from './lib/storage'
import { newSession } from './lib/session'
import { Exercises } from './screens/Exercises'
import { Progress } from './screens/Progress'
import { Settings } from './screens/Settings'
import { Setup } from './screens/Setup'
import { Today } from './screens/Today'
import { Welcome } from './screens/Welcome'
import { Workout } from './screens/Workout'
import { WorkoutBuilder } from './screens/WorkoutBuilder'
import { useAppData } from './state/useAppData'

const TABS = ['Home', 'Exercises', 'Progress', 'Settings'] as const
type Tab = (typeof TABS)[number]


export function App() {
  const { data, update, saveFailed, damaged, reset } = useAppData()
  const [tab, setTab] = useState<Tab>('Home')
  const [inWorkout, setInWorkout] = useState(false)
  const [started, setStarted] = useState(false)
  const [building, setBuilding] = useState<{ workout?: CustomWorkout } | null>(null)
  // A friend's shared workout arrives in the link, read once when the app opens.
  const readShared = () => decodeShare(window.location.hash.match(/^#workout=(.+)$/)?.[1] ?? '')
  const [shared, setShared] = useState(readShared)

  // An already-open app only sees the link change, so listen for it too.
  useEffect(() => {
    const onHash = () => { const next = readShared(); if (next) setShared(next) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const theme = data.theme ?? 'auto'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  if (damaged) {
    return (
      <main className="screen">
        <h1>Your data couldn't be read</h1>
        <p>The saved data on this phone is damaged. A copy has been kept, but the app needs to start fresh. If you have a backup file, you can import it in Settings afterwards.</p>
        <button className="primary" onClick={reset}>Start fresh</button>
      </main>
    )
  }

  if (!data.profile && !started) return <Welcome onStart={() => setStarted(true)} />

  if (!data.profile) {
    return (
      <Setup onDone={profile => {
        update(d => ({ ...d, profile }))
        requestPersistence()
      }} />
    )
  }

  const warning = saveFailed && <p className="save-warning" role="alert">Saving failed. Your phone may be out of storage, so your latest sets may be lost.</p>

  if (inWorkout) {
    return <>{warning}<Workout onExit={() => setInWorkout(false)} /></>
  }

  if (building) {
    return <><Backdrop />{warning}<WorkoutBuilder workout={building.workout} onClose={() => setBuilding(null)} /></>
  }

  const closeShared = () => {
    history.replaceState(null, '', window.location.pathname + window.location.search)
    setShared(null)
  }

  return (
    <>
      <Backdrop />
      {warning}
      {shared && (
        <aside className="import-card" role="dialog" aria-label="Shared workout">
          <p className="eyebrow">A friend shared a workout</p>
          <strong>{shared.name}</strong>
          <span className="muted">{shared.exerciseIds.length} exercises · your app sets the reps and weights for your level</span>
          <button className="primary" onClick={() => {
            update(d => ({ ...d, customWorkouts: [...(d.customWorkouts ?? []), { id: `w${Date.now()}`, ...shared }] }))
            closeShared()
          }}>Add workout</button>
          <button className="link" onClick={closeShared}>Not now</button>
        </aside>
      )}
      <div className="tab-screen" key={tab}>
        {tab === 'Home' && (
          <Today
            onStart={plan => {
              update(d => ({ ...d, inProgress: newSession(plan, d.profile!.units, new Date(), d.profile!.daysPerWeek) }))
              setInWorkout(true)
            }}
            onResume={() => setInWorkout(true)}
            onBuild={workout => setBuilding({ workout })}
          />
        )}
        {tab === 'Exercises' && <Exercises />}
        {tab === 'Progress' && <Progress />}
        {tab === 'Settings' && <Settings />}
      </div>
      <nav className="tabs" aria-label="Main">
        {TABS.map(t => (
          <button key={t} aria-current={tab === t ? 'page' : undefined} onClick={() => setTab(t)}>{t}</button>
        ))}
      </nav>
    </>
  )
}
