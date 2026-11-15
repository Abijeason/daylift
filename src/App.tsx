import { useEffect, useState } from 'react'
import { decodePlan, decodeShare } from './lib/custom'
import { decodeFriend } from './lib/friends'
import { GOALS } from './lib/rules'
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
import { PlanEditor } from './screens/PlanEditor'
import { WorkoutBuilder } from './screens/WorkoutBuilder'
import { useAppData } from './state/useAppData'
import { useScrollTop } from './lib/motion'

const TABS = ['Home', 'Exercises', 'Progress', 'Settings'] as const
type Tab = (typeof TABS)[number]


export function App() {
  const { data, update, saveFailed, damaged, reset } = useAppData()
  const [tab, setTab] = useState<Tab>('Home')
  const [inWorkout, setInWorkout] = useState(false)
  const [started, setStarted] = useState(false)
  const [building, setBuilding] = useState<{ workout?: CustomWorkout; toPlan?: boolean } | null>(null)
  const [planning, setPlanning] = useState(false)
  // A friend's workout, plan or progress arrives in the link, read when the app opens.
  const readShared = () => {
    const [, kind, code] = window.location.hash.match(/^#(workout|plan|friend)=(.+)$/) ?? []
    if (kind === 'workout') { const w = decodeShare(code); return w && { kind: 'workout' as const, ...w } }
    if (kind === 'plan') { const p = decodePlan(code); return p && { kind: 'plan' as const, ...p } }
    if (kind === 'friend') { const f = decodeFriend(code); return f && { kind: 'friend' as const, friend: f } }
    return null
  }
  const [shared, setShared] = useState(readShared)

  // An already-open app only sees the link change, so listen for it too.
  useEffect(() => {
    const onHash = () => { const next = readShared(); if (next) setShared(next) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const theme = data.theme ?? 'auto'
  useScrollTop(`${tab}|${inWorkout}|${building ? building.workout?.id ?? 'new' : ''}|${planning}|${started}|${!!data.profile}`)

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
    // A day made from the plan screen joins the plan straight away.
    const close = (saved?: CustomWorkout) => {
      if (saved && building.toPlan && !building.workout) update(d => ({ ...d, planDays: [...(d.planDays ?? []), saved.id] }))
      setBuilding(null)
    }
    return <><Backdrop />{warning}<WorkoutBuilder workout={building.workout} onClose={close} /></>
  }

  if (planning) {
    return <><Backdrop />{warning}<PlanEditor onClose={() => setPlanning(false)} onBuild={workout => setBuilding({ workout, toPlan: true })} /></>
  }

  const closeShared = () => {
    history.replaceState(null, '', window.location.pathname + window.location.search)
    setShared(null)
  }

  return (
    <>
      <Backdrop />
      {warning}
      {shared?.kind === 'workout' && (
        <aside className="import-card" role="dialog" aria-label="Shared workout">
          <p className="eyebrow">A friend shared a workout</p>
          <strong>{shared.name}</strong>
          <span className="muted">{shared.exerciseIds.length} exercises · your app sets the reps and weights for your level</span>
          <button className="primary" onClick={() => {
            update(d => ({ ...d, customWorkouts: [...(d.customWorkouts ?? []), { id: `w${Date.now()}`, name: shared.name, exerciseIds: shared.exerciseIds }] }))
            closeShared()
          }}>Add workout</button>
          <button className="link" onClick={closeShared}>Not now</button>
        </aside>
      )}
      {shared?.kind === 'plan' && (
        <aside className="import-card" role="dialog" aria-label="Shared plan">
          <p className="eyebrow">A friend shared their plan</p>
          <strong>{shared.days.map(i => shared.workouts[i].name).join(' → ')}</strong>
          <span className="muted">
            Same exercises on the same days, with reps and weights for your own goal.
            {data.planMode === 'custom' && (data.planDays ?? []).length > 0 && ' This replaces your current plan. Your own workouts stay saved.'}
          </span>
          <button className="primary" onClick={() => {
            const stamp = Date.now()
            const added = shared.workouts.map((w, i) => ({ id: `w${stamp}-${i}`, ...w }))
            update(d => ({
              ...d,
              customWorkouts: [...(d.customWorkouts ?? []), ...added],
              planDays: shared.days.map(i => added[i].id),
              planMode: 'custom',
            }))
            closeShared()
          }}>Use this plan</button>
          <button className="link" onClick={closeShared}>Not now</button>
        </aside>
      )}
      {shared?.kind === 'friend' && (
        <aside className="import-card" role="dialog" aria-label="Friend's progress">
          {shared.friend.id === data.me?.id ? (
            <>
              <p className="eyebrow">This is your own progress link</p>
              <span className="muted">Send it to friends so they can see how you're doing.</span>
              <button className="link" onClick={closeShared}>OK</button>
            </>
          ) : (
            <>
              <p className="eyebrow">{data.friends?.some(f => f.id === shared.friend.id) ? 'New progress from a friend' : 'A friend shared their progress'}</p>
              <strong>{shared.friend.name}</strong>
              <span className="muted">{GOALS[shared.friend.goal].label} · {shared.friend.total} workouts · {shared.friend.streak} week streak</span>
              <button className="primary" onClick={() => {
                update(d => ({ ...d, friends: [...(d.friends ?? []).filter(f => f.id !== shared.friend.id), shared.friend] }))
                closeShared()
                setTab('Progress')
              }}>Save to Friends</button>
              <button className="link" onClick={closeShared}>Not now</button>
            </>
          )}
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
            onPlan={() => setPlanning(true)}
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
