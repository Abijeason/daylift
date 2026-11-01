import type { Exercise, Goal, Level, Prescription, Profile } from '../types'

export const WARMUP_MINUTES = 8

interface GoalRule {
  label: string
  blurb: string
  days: [number, number]
  minutes: [number, number]
  sets: number
  repMin: number
  repMax: number
  restSec: number
  cardioMin: number
}

export const GOALS: Record<Goal, GoalRule> = {
  fitLean: { label: 'Fit & Lean Muscle', blurb: 'Stay fit and build a bit of muscle', days: [3, 4], minutes: [45, 60], sets: 3, repMin: 8, repMax: 12, restSec: 75, cardioMin: 0 },
  buildMuscle: { label: 'Build Muscle', blurb: 'Add size', days: [4, 5], minutes: [60, 75], sets: 4, repMin: 8, repMax: 12, restSec: 90, cardioMin: 0 },
  getStronger: { label: 'Get Stronger', blurb: 'Lift heavier', days: [3, 4], minutes: [60, 75], sets: 4, repMin: 4, repMax: 6, restSec: 150, cardioMin: 0 },
  loseWeight: { label: 'Lose Weight', blurb: 'Weights plus cardio', days: [3, 5], minutes: [45, 60], sets: 3, repMin: 10, repMax: 15, restSec: 60, cardioMin: 10 },
  toneUp: { label: 'Tone Up', blurb: 'A firmer, defined look', days: [3, 4], minutes: [40, 50], sets: 3, repMin: 12, repMax: 15, restSec: 60, cardioMin: 0 },
  buildStamina: { label: 'Build Stamina', blurb: 'More energy and endurance', days: [3, 5], minutes: [40, 50], sets: 3, repMin: 15, repMax: 20, restSec: 40, cardioMin: 15 },
  stayActive: { label: 'Stay Active', blurb: 'Basic health, low pressure', days: [2, 3], minutes: [30, 40], sets: 2, repMin: 10, repMax: 15, restSec: 60, cardioMin: 0 },
}

interface LevelRule {
  label: string
  blurb: string
  maxDays: number
  setChange: number
  allowed: Exercise['level'][]
}

export const LEVELS: Record<Level, LevelRule> = {
  brandNew: { label: 'Brand new', blurb: 'Never trained in a gym', maxDays: 3, setChange: -1, allowed: ['beginner'] },
  beginner: { label: 'Beginner', blurb: 'Up to 6 months', maxDays: 4, setChange: 0, allowed: ['beginner'] },
  intermediate: { label: 'Intermediate', blurb: '6 months to 2 years', maxDays: 5, setChange: 0, allowed: ['beginner', 'intermediate'] },
  advanced: { label: 'Advanced', blurb: '2 years or more', maxDays: 5, setChange: 1, allowed: ['beginner', 'intermediate', 'expert'] },
}

export function allowedDays(goal: Goal, level: Level): number[] {
  const [min, max] = GOALS[goal].days
  const cap = LEVELS[level].maxDays
  if (min > cap) return [cap]
  const days: number[] = []
  for (let d = min; d <= Math.min(max, cap); d++) days.push(d)
  return days
}

export function prescription(goal: Goal, level: Level): Prescription {
  const { sets, repMin, repMax, restSec, cardioMin } = GOALS[goal]
  const result = { sets: Math.max(2, sets + LEVELS[level].setChange), repMin, repMax, restSec, cardioMin }
  if (goal === 'getStronger' && level === 'brandNew') return { ...result, repMin: 8, repMax: 10 }
  if (goal === 'getStronger' && level === 'beginner') return { ...result, repMin: 6, repMax: 8 }
  return result
}

export const workoutMinutes = (p: Profile): number => GOALS[p.goal].minutes[p.length === 'short' ? 0 : 1]

export const minutesPerExercise = (p: Prescription): number => p.sets * (0.75 + p.restSec / 60) + 1

export function exerciseCount(p: Prescription, minutes: number): number {
  const count = Math.floor((minutes - WARMUP_MINUTES - p.cardioMin) / minutesPerExercise(p))
  return Math.min(8, Math.max(3, count))
}
