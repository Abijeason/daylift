import type { WorkoutType } from '../types'

const cardio = '3 minutes of easy cardio, such as brisk walking or light cycling'
const upper = [cardio, '10 arm circles each way', '10 slow shoulder rolls', '10 band pull-aparts or wall slides', '8 slow push-ups against a wall']
const lower = [cardio, '10 bodyweight squats', '10 glute bridges', '10 leg swings on each side', '8 slow lunges on each side']
const full = [cardio, '10 arm circles each way', '10 bodyweight squats', '10 glute bridges', '8 slow push-ups against a wall']
const push = [cardio, '10 arm circles each way', '10 slow shoulder rolls', '8 slow push-ups against a wall', '10 chest openers']
const pull = [cardio, '10 band pull-aparts or wall slides', '10 cat-cow stretches', '10 slow shoulder rolls', '10 hip hinges with no weight']

export const WARMUPS: Record<WorkoutType, string[]> = {
  fullA: full, fullB: full, fullC: full,
  upperA: upper, upperB: upper, upper,
  lowerA: lower, lowerB: lower, lower, legs: lower,
  push, pull,
}

export const FIRST_LIFT_TIP = 'Before your first big lift, do 2 lighter sets of 5 to 8 reps. These warm-up sets are not logged.'
