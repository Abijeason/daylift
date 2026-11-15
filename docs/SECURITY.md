# Security and privacy

## Authentication

Version 1 has no login. That means no passwords to protect, and users can start in seconds. Optional login is the first upgrade to consider if testers want their data on several devices.

## Privacy

- Workout data stays on the user's device and isn't sent anywhere.
- The app has no analytics or third-party scripts.
- Opening a form video takes the user to YouTube, where YouTube's own privacy terms apply.
- The feedback form, once added, is a separate Google Form.
- Share links carry data only in the part after `#`, which browsers don't send to the web server. A workout or plan link holds names and exercise ids. A progress link holds the name the person typed, their goal, streak, workout counts, up to six personal bests and their last three workout names. It's sent only when the person taps Share.

## Input checks

- Weight and reps are checked before saving.
- Saved data and backup files have every field checked before they're used.
- Workout, plan and progress links are checked the same way: lengths are capped, exercise ids must be known, and only the expected fields are kept.
- React escapes text on screen, and no user text is added as raw HTML.

## Secrets

The app has no API keys. Keys for any future AI feature must stay on a server and never in this code, because everything here is public.

## Reporting a problem

Open an issue on the GitHub repository.
