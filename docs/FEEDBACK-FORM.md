# Feedback form

People give feedback inside the app, under **Settings → Tell us what you think**. The app sends the answers in the background to the owner's Google Form, and Google emails the owner each new response. Daylift has no server of its own.

## How it works

- `FEEDBACK_FORM` in `src/data/copy.ts` holds the form's `formResponse` address and one `entry.<id>` field per question.
- `src/lib/feedback.ts` posts only the answered questions, each capped at 2,000 characters. Google Forms doesn't let another site read its reply, so the app can only detect a network failure. When that happens, or the phone is offline, the answers stay on screen so the person can try again.
- The Google Form uses Paragraph questions for everything, so it accepts whatever the app's buttons send.
- Email collection is off. Responses are anonymous unless someone writes their name.
- Email notifications are on (Responses tab → ⋮ → Get email notifications for new responses).

## Changing the questions

Questions can be added or renamed in the Google Form. A new question needs its `entry.<id>`, which is in the form's public page source in `FB_PUBLIC_LOAD_DATA_`. Add it to `FEEDBACK_FORM.fields` and to the screen in `src/screens/Feedback.tsx`. Deleting a question in the form makes its answers disappear quietly, so remove it from the app at the same time.

## Questions

| # | Question | In the app | Choices |
|---|----------|------|---------|
| 1 | How long have you been going to the gym? | Multiple choice | Brand new · Under 6 months · 6 months to 2 years · 2+ years |
| 2 | Do you train alone or with friends? | Multiple choice | Mostly alone · Mostly with friends · Both |
| 3 | How easy was it to know what to do at the gym today? | Linear scale 1–5 | 1 = very confusing, 5 = very clear |
| 4 | Which parts did you use? | Checkboxes | Today's workout · My workouts · Custom plan · Friends · Exercises and body map · Progress chart · Form videos |
| 5 | What does Daylift do best? | Paragraph | |
| 6 | What's missing or annoying? | Paragraph | |
| 7 | Did anything break or look wrong? What phone were you on? | Paragraph | |
| 8 | How likely are you to keep using Daylift? | Linear scale 1–5 | 1 = not at all, 5 = every workout |
| 9 | Anything else? | Short answer | |

The app shows the choice questions as buttons. Keep it to these nine. Short forms get finished.
