# Feedback form

Daylift collects feedback through a free Google Form. The app shows a **Send feedback** button in Settings once `FEEDBACK_URL` in `src/data/copy.ts` holds the form's link. While it is empty, the button stays hidden.

## Set it up

1. Sign in to Google and create a blank form at forms.google.com, titled **Daylift feedback**.
2. Description: *Thanks for trying Daylift. This takes about 2 minutes. Please don't include health details or anything private.*
3. Add the questions below.
4. In Settings, turn off **Collect email addresses** so answers stay anonymous.
5. Press **Send**, choose the link icon, tick **Shorten URL**, and copy it into `FEEDBACK_URL`.

## Questions

| # | Question | Type | Choices |
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

Keep it to these nine. Short forms get finished.
