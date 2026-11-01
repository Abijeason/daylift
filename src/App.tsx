import { useState } from 'react'
import { GymBackdrop } from './components/GymArt'
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

const ICONS: Record<Tab, string> = {
  Today: 'M2 10h2v4H2zM5 7h3v10H5zM9 11h6v2H9zM16 7h3v10h-3zM20 10h2v4h-2z',
  Exercises: 'M12 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM5 9h14v2l-5 1v4l2 6h-2l-2-5-2 5H8l2-6v-4l-5-1z',
  Progress: 'M3 20h18v2H3zM5 12h3v7H5zM10.5 7h3v12h-3zM16 3h3v16h-3z',
  Settings: 'M3 6h11a3 3 0 0 1 6 0h1v2h-1a3 3 0 0 1-6 0H3zM3 16h1a3 3 0 0 1 6 0h11v2H10a3 3 0 0 1-6 0H3z',
}

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
      <>
        <GymBackdrop />
        <Setup onDone={profile => {
          update(d => ({ ...d, profile }))
          requestPersistence()
        }} />
      </>
    )
  }

  const warning = saveFailed && <p className="save-warning" role="alert">Saving failed. Your phone may be out of storage, so your latest sets may be lost.</p>

  if (inWorkout) {
    return <><GymBackdrop />{warning}<Workout onExit={() => setInWorkout(false)} /></>
  }

  return (
    <>
      <GymBackdrop />
      {warning}
      <div className="tab-screen" key={tab}>
        {tab === 'Today' && (
          <Today
            onStart={plan => {
              update(d => ({ ...d, inProgress: newSession(plan, d.profile!.units, new Date(), d.profile!.daysPerWeek) }))
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
          <button key={t} aria-current={tab === t ? 'page' : undefined} onClick={() => setTab(t)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={ICONS[t]} /></svg>
            {t}
          </button>
        ))}
      </nav>
    </>
  )
}
