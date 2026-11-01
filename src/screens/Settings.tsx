import { useState } from 'react'
import { COMING_SOON, FEEDBACK_URL } from '../data/copy'
import { allowedDays, GOALS, LEVELS } from '../lib/rules'
import { exportBackup, importBackup } from '../lib/storage'
import { useAppData } from '../state/useAppData'
import { EquipmentPicker } from './Setup'
import type { Goal, Level, Profile, SavedData } from '../types'

export function Settings() {
  const { data, update, reset } = useAppData()
  const profile = data.profile
  const [importError, setImportError] = useState('')
  const [pending, setPending] = useState<SavedData | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  if (!profile) return null

  const change = (next: Partial<Profile>) => update(d => {
    const merged = { ...d.profile!, ...next }
    const days = allowedDays(merged.goal, merged.level)
    return { ...d, profile: { ...merged, daysPerWeek: days.includes(merged.daysPerWeek) ? merged.daysPerWeek : days[days.length - 1] } }
  })

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportBackup(data)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `daylift-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const chooseFile = async (file: File | undefined) => {
    if (!file) return
    const backup = importBackup(await file.text())
    setImportError(backup ? '' : "That file isn't a valid Daylift backup. Your data hasn't changed.")
    setPending(backup)
  }

  return (
    <main className="screen">
      <h1>Settings</h1>

      <section>
        <h2>Your plan</h2>
        <label className="field">Goal
          <select value={profile.goal} onChange={e => change({ goal: e.target.value as Goal })}>
            {(Object.keys(GOALS) as Goal[]).map(g => <option key={g} value={g}>{GOALS[g].label}</option>)}
          </select>
        </label>
        <label className="field">Experience
          <select value={profile.level} onChange={e => change({ level: e.target.value as Level })}>
            {(Object.keys(LEVELS) as Level[]).map(l => <option key={l} value={l}>{LEVELS[l].label}</option>)}
          </select>
        </label>
        <label className="field">Days per week
          <select value={profile.daysPerWeek} onChange={e => change({ daysPerWeek: Number(e.target.value) })}>
            {allowedDays(profile.goal, profile.level).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label className="field">Workout length
          <select value={profile.length} onChange={e => change({ length: e.target.value as Profile['length'] })}>
            <option value="short">Short</option>
            <option value="standard">Standard</option>
          </select>
        </label>
        <label className="field">Units
          <select value={profile.units} onChange={e => change({ units: e.target.value as Profile['units'] })}>
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </label>
      </section>

      <section>
        <h2>My Gym</h2>
        <EquipmentPicker value={profile.equipment} onChange={equipment => change({ equipment })} />
      </section>

      <section>
        <h2>Your data</h2>
        <p className="muted">Your history is saved only on this phone. Export a backup before you clear your browser or change phones.</p>
        <button className="secondary" onClick={download}>Export backup</button>
        <label className="secondary file">Import backup
          <input className="sr-only" type="file" accept="application/json,.json" onChange={e => chooseFile(e.target.files?.[0])} />
        </label>
        {importError && <p className="error" role="alert">{importError}</p>}
        {pending && (
          <div className="card">
            <p>This backup has {pending.history.length} workouts. It will replace everything on this phone.</p>
            <button className="primary" onClick={() => { update(() => pending); setPending(null) }}>Replace my data</button>
            <button className="link" onClick={() => setPending(null)}>Cancel</button>
          </div>
        )}
        {confirmReset ? (
          <div className="card">
            <p>This deletes your plan and all your history. It can't be undone.</p>
            <button className="danger" onClick={reset}>Yes, delete everything</button>
            <button className="link" onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        ) : (
          <button className="link danger-text" onClick={() => setConfirmReset(true)}>Reset all data</button>
        )}
      </section>

      {FEEDBACK_URL && (
        <section>
          <h2>Tell us what you think</h2>
          <a className="secondary" href={FEEDBACK_URL} target="_blank" rel="noreferrer">Send feedback</a>
        </section>
      )}

      <section>
        <h2>Coming soon</h2>
        <ul className="soon">{COMING_SOON.map(item => <li key={item}>{item}</li>)}</ul>
      </section>
    </main>
  )
}
