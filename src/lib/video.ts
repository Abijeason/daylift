import type { Exercise } from '../types'

export function formVideoLink(exercise: Pick<Exercise, 'name' | 'videoUrl'>): string {
  if (exercise.videoUrl) return exercise.videoUrl
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} proper form`)}`
}
