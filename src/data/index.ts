import raw from './exercises.json'
import rawLibrary from './library.json'
import type { Exercise } from '../types'

// The checked set Daylift plans from, then the rest of the open library.
export const curated = raw as Exercise[]
export const exercises = [...curated, ...(rawLibrary as Exercise[])]

// Curated photos install with the app; library photos are saved the first time they're viewed.
export const imageUrl = (e: Pick<Exercise, 'library'>, path: string): string =>
  `${import.meta.env.BASE_URL}${e.library ? 'library' : 'exercises'}/${path}`
