import { useState } from 'react'
import { requestPersistence } from './lib/storage'
import { newSession } from './lib/session'
import { Exercises } from './screens/Exercises'
import { Progress } from './screens/Progress'
import { Settings } from './screens/Settings'
import { Setup } from './screens/Setup'
import { Today } from './screens/Today'
import { Workout } from './screens/Workout'
import { useAppData } from './state/useAppData'

const TABS = ['Today', 'Exercises', 'Progress', 'Settings'] as const
type Tab = (typeof TABS)[number]

export function App() {
  const { data, update, saveFailed, damaged, reset } = useAppData()
  const [tab, setTab] = useState<Tab>('Today')
  const [inWorkout, setInWorkout] = useState(false)

  if (damaged) {
    return (
      <main className="screen">
        <h1>Your data couldn't be read</h1>
        <p>The saved data on this phone is damaged. A copy has been kept, but the app needs to start fresh. If you have a backup file, you can import it in Settings afterwards.</p>
        <button className="primary" onClick={reset}>Start fresh</button>
      </main>
    )
  }

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

  return (
    <>
      {warning}
      <div className="tab-screen" key={tab}>
        {tab === 'Today' && (
          <Today
            onStart={plan => {
              update(d => ({ ...d, inProgress: newSession(plan, d.profile!.units, new Date()) }))
              setInWorkout(true)
            }}
            onResume={() => setInWorkout(true)}
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
