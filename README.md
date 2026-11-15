# Daylift

Daylift tells gym-goers exactly what to do today and shows them how to do it safely. It builds a weekly plan around your goal, experience and the equipment your gym has, then guides you through each workout set by set.

It's a free, installable web app. There's no account to create, and your workout history stays on your phone.

**Try it:** [abijeason.github.io/daylift](https://abijeason.github.io/daylift/)

## Why Daylift?

There are plenty of gym apps. Most are built for one person training alone, ask you to create an account, and keep their smarter features behind a subscription. Daylift is built around three things they don't do together:

- **Friends at different levels can train together.** One person shares a plan, and everyone gets the same exercises on the same days. Each phone then sets its own sets, reps, rest and weights for that person's goal and level, and flags anything their gym doesn't have. A beginner who wants to tone up and a friend who's bulking can follow one plan. Progress links let friends see how each other are doing.
- **It's free, private and works offline.** There's no account, no ads and no subscription. Workout history stays on the phone, and the app works with no signal once it's installed.
- **It's made for people who don't know what to do yet.** It plans around the equipment your gym actually has, explains warm-ups, shows which muscles each exercise works, and links to form videos.

It doesn't try to win on everything. Friends' progress updates when someone sends a link rather than live, and there's no App Store version or Apple Health connection yet.

## Features

- Seven goals, from Fit & Lean Muscle to Build Stamina, across four experience levels
- A My Gym equipment list, so workouts only use what's available
- Warm-ups matched to each workout
- Guided sets with suggested weights and an automatic rest timer
- 850 exercises: 83 checked ones with tips, common mistakes and easier options that the automatic plan uses, plus the full open library for search and your own workouts
- Form photos, form videos and the muscles each exercise works
- A tappable body map
- Personal bests, weekly streaks and progress charts
- Custom workouts and your own weekly plan (Daylift picks, or you pick each day)
- Training with friends: share a workout or a whole plan, and each person gets sets, reps and weights for their own goal
- Friends' progress through share links, with no accounts and nothing uploaded
- In-app feedback form
- Offline use and backup files
- Light and dark themes

## Built with

React, TypeScript, Vite, GSAP, vite-plugin-pwa and Vitest. See [Architecture](docs/ARCHITECTURE.md) for why.

## Run it

```bash
npm install
npm run dev
```

More detail is in [Setup](docs/SETUP.md).

## Documents

[PRD](docs/PRD.md) · [Design](docs/DESIGN.md) · [Architecture](docs/ARCHITECTURE.md) · [Data model](docs/DATA-MODEL.md) · [Security](docs/SECURITY.md) · [Implementation](docs/IMPLEMENTATION.md) · [Testing](docs/TESTING.md) · [Debugging](docs/DEBUGGING.md) · [Setup and deploying](docs/SETUP.md) · [Feedback form](docs/FEEDBACK-FORM.md) · [Video review](docs/VIDEO-REVIEW.md) · [Contributing](CONTRIBUTING.md)

## Credits

Exercise images and base data come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db), released under the Unlicense. Form tips for the 83 checked exercises were rewritten for this project; the rest of the library keeps its original steps. Daylift gives general fitness guidance, not medical advice.

## Author

Built by **Abhishek Yadav**, a Computer Science student at the University of Greenwich.

- GitHub: [@Abijeason](https://github.com/Abijeason)
- LinkedIn: [abhishek-yv](https://www.linkedin.com/in/abhishek-yv/)

## Licence

[MIT](LICENSE)
