# Architecture

Daylift is a client-only React app. Everything runs on the user's phone.

```
Screens (src/screens)          what the user sees
Shared state (src/state)       one saved record, shared through React context
Logic (src/lib)                plain, tested functions
Data (src/data)                exercises, warm-ups and copy
localStorage                   saved through src/lib/storage.ts only
```

## Why these tools

- **React:** six screens share changing data such as timers, sets and streaks. It's also a step towards React Native for store apps.
- **TypeScript:** the data has a fixed shape, so type checks catch mistakes early. It adds no cost when the app runs.
- **Vite and vite-plugin-pwa:** fast builds, plus offline support and installing to the home screen.
- **GSAP:** screen motion, scroll reveals and count-ups, through one hook. It's free under GSAP's standard licence.
- **No router or state library:** four tabs and one saved record don't need them.

## How a workout is planned

`lib/rules.ts` holds the goal and level tables. `lib/planner.ts` picks a rotation from the days per week, then fills muscle slots with exercises the user's equipment and level allow. The same inputs always give the same workout.

## Why there's no API

Workout planning is a simple calculation, and data stays on the phone, so a server would add cost and privacy risk without helping users. A future API would be needed for cloud backup or AI features.

## Integrations

- **free-exercise-db:** copied in at build time, so there's no runtime dependency.
- **YouTube:** Watch form buttons open videos on YouTube. Nothing is embedded.
- **Google Forms:** the in-app feedback form posts to the owner's Google Form (`FEEDBACK_FORM` in `src/data/copy.ts`), which emails each response. See `docs/FEEDBACK-FORM.md`.
- **GitHub Pages:** planned hosting for static files.
