import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { save } from './lib/storage'
import { AppDataProvider } from './state/useAppData'
import type { Profile, SavedData, WorkoutLog } from './types'

export const testProfile: Profile = {
  goal: 'fitLean', level: 'beginner', daysPerWeek: 3, length: 'standard',
  equipment: ['dumbbells', 'bench', 'cable', 'latPulldown', 'legPress'], units: 'kg',
}

export function testLog(day = '2026-10-01', over: Partial<WorkoutLog> = {}): WorkoutLog {
  const at = new Date(`${day}T12:00:00`).toISOString()
  return {
    id: day, type: 'fullA', units: 'kg', startedAt: at, finishedAt: at,
    entries: [{
      exerciseId: 'Dumbbell_Bench_Press', name: 'Dumbbell Bench Press', region: 'upper', targetSets: 3, repMax: 12,
      sets: [{ weight: 20, reps: 10 }],
    }],
    ...over,
  }
}

export function renderWithData(ui: ReactElement, data: Partial<SavedData> = {}) {
  save({ version: 1, profile: testProfile, history: [], inProgress: null, ...data })
  return render(<AppDataProvider>{ui}</AppDataProvider>)
}
