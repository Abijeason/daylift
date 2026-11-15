# Data model

There's no server database. The app saves one JSON record in the browser's localStorage under `daylift.v1`. Types are in `src/types.ts`.

| Field | Holds |
|---|---|
| `version` | Format version, currently 1 |
| `profile` | Goal, level, days, workout length, equipment and units |
| `history` | Finished workouts, each with its exercises and sets |
| `inProgress` | The current workout, saved after every set |
| `timerNoteSeen` | Whether the locked phone note has been shown |
| `theme` | Light, dark or match the phone |
| `customWorkouts` | Workouts the person built or added from a friend's link |
| `planMode` | `default` (Daylift picks) or `custom` (I pick) |
| `planWeek` | The custom week, Monday to Sunday: a workout id, or `null` for a rest day |
| `me` | A random id and the name shown to friends |
| `friends` | The latest progress snapshot each friend sent |

Workouts with `plan: true` belong to the custom week and are hidden from My workouts. When no day uses one any more, it's removed.

Each history record keeps the exercise name and its own units, so old history still works if an exercise is removed or the user switches between kg and lb.

## Exercise data

Exercises aren't saved per person; they ship with the app. Each has a main muscle, helper muscles, level, equipment (`needs`, from the My Gym list, plus an optional `gear` label such as "Medicine ball"), photos, steps, common mistakes and easier options. Library exercises are marked `library: true`, may have no mistakes or easier options, and are never chosen by the automatic planner.

## Why localStorage

The data is small, and it needs no account. The trade-off is that data lives on one device.

## Protecting data

- An error boundary offers a way to start fresh if a screen ever crashes.
- Damaged data is copied to `daylift.v1.damaged`, and the user is told.
- A failed save shows a warning.
- The app asks the browser for persistent storage.
- Settings has Export and Import backup. Imports are checked before anything is replaced.

Cloud backup is on the Coming soon list.
