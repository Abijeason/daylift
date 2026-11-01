import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { load, save } from '../lib/storage'
import type { SavedData } from '../types'

interface AppData {
  data: SavedData
  update(fn: (d: SavedData) => SavedData): void
  saveFailed: boolean
  damaged: string | null
  reset(): void
}

const Context = createContext<AppData | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(load)
  const [data, setData] = useState(initial.data)
  const [damaged, setDamaged] = useState(initial.damaged)
  const [saveFailed, setSaveFailed] = useState(false)
  // A ref keeps quick updates in order, even before React redraws.
  const latest = useRef(data)

  const update = useCallback((fn: (d: SavedData) => SavedData) => {
    const next = fn(latest.current)
    latest.current = next
    setData(next)
    setSaveFailed(!save(next))
  }, [])

  const reset = useCallback(() => {
    update(() => ({ version: 1, profile: null, history: [], inProgress: null }))
    setDamaged(null)
  }, [update])

  const value = useMemo(() => ({ data, update, saveFailed, damaged, reset }), [data, update, saveFailed, damaged, reset])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useAppData(): AppData {
  const value = useContext(Context)
  if (!value) throw new Error('useAppData needs AppDataProvider')
  return value
}
