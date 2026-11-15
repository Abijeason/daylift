# Testing and QA

Run all tests with `npm test`.

## Automated tests

- **Logic:** planner, weight suggestions, rest days, streaks and backups.
- **Plans and sharing:** the custom plan order, workout, plan and progress links, including crafted or broken links.
- **Feedback:** only answered questions are sent, and answers stay on screen when sending fails.
- **Every combination:** each goal, level, day count, workout length and equipment preset must give valid workouts.
- **Data:** every exercise must have complete content, valid labels and existing images.
- **Screens:** the main journeys for each screen, including error messages.

## Manual checks

Tested in a phone-sized browser:

- Setup through a logged workout to Progress
- Reloading mid-workout and resuming
- Reloading with the server off, to confirm offline use
- The iPhone 18 Pro simulator in Safari: setup, Home, logging a set with the number pad, and the rest timer
- Building a custom plan, opening a friend's progress link and saving it to Friends
- Sending feedback from the app and seeing it arrive in the Google Form

## Still to test before launch

- Real iPhone and Android phones, because vibration, install prompts and timer behaviour differ
- Watching each form video, using [the review list](VIDEO-REVIEW.md)
- Sharing plans and progress between two real phones
- Adding to the home screen from Safari and Chrome
