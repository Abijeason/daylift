import type { Goal } from '../types'

export const SAFETY_NOTE = 'Daylift gives general fitness guidance, not medical advice. If you have an injury, a health condition or are pregnant, ask a doctor before you start.'

export const EXERCISE_SAFETY = 'Stop if something hurts. Ask a gym trainer to check your form before heavy lifts.'

export const EATING_TIPS: Partial<Record<Goal, string>> = {
  buildMuscle: 'Muscle grows from training, sleep and regular meals with plenty of protein.',
  loseWeight: 'Steady habits work best. Focus on regular, balanced meals rather than strict rules.',
}

export const COMING_SOON = [
  'AI photo scan',
  'AI coach',
  'Reminders when the app is closed',
  'Cloud backup',
  'Live friend updates',
  'App Store and Play Store apps',
  'Custom form video clips',
]

// Add the Google Form address before launch. The feedback link stays hidden until then.
export const FEEDBACK_URL = ''
