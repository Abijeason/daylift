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
| `planDays` | The custom plan, as an ordered list of custom workout ids |
| `me` | A random id and the name shown to friends |
| `friends` | The latest progress snapshot each friend sent |

A finished workout from the custom plan stores `planDay`, its position in the plan. The next day is the one after the last `planDay`, so extra workouts don't skip a day.

Each history record keeps the exercise name and its own units, so old history still works if an exercise is removed or the user switches between kg and lb.

## Why localStorage

The data is small, and it needs no account. The trade-off is that data lives on one device.

## Protecting data

- An error boundary offers a way to start fresh if a screen ever crashes.
- Damaged data is copied to `daylift.v1.damaged`, and the user is told.
- A failed save shows a warning.
- The app asks the browser for persistent storage.
- Settings has Export and Import backup. Imports are checked before anything is replaced.

Cloud backup is on the Coming soon list.
