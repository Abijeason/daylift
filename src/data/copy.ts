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

// Answers go to the owner's Google Form, which emails them. Field ids come from the form's public page.
export const FEEDBACK_FORM = {
  action: 'https://docs.google.com/forms/d/e/1FAIpQLSdCwCsKnxYhfcPey37kFyDG7p1OgikzL7jvp1FeGX-Zn5ssTQ/formResponse',
  fields: {
    experience: 'entry.1922861483',
    together: 'entry.1041387749',
    clarity: 'entry.753220531',
    used: 'entry.922470283',
    best: 'entry.1139281202',
    missing: 'entry.427195843',
    broken: 'entry.319918400',
    keepUsing: 'entry.241534032',
    other: 'entry.473572808',
  },
}
