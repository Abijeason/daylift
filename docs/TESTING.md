# Testing and QA

Run all tests with `npm test`.

## Automated tests

- **Logic:** planner, weight suggestions, rest days, streaks and backups.
- **Every combination:** each goal, level, day count, workout length and equipment preset must give valid workouts.
- **Data:** every exercise must have complete content, valid labels and existing images.
- **Screens:** the main journeys for each screen, including error messages.

## Manual checks

Tested in a phone-sized browser:

- Setup through a logged workout to Progress
- Reloading mid-workout and resuming
- Reloading with the server off, to confirm offline use

## Still to test before launch

- Real iPhone and Android phones, because vibration, install prompts and timer behaviour differ
- Watching each form video, using [the review list](VIDEO-REVIEW.md)
