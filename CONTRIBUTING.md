# Contributing

## Adding a feature

1. Check that it belongs in the [PRD](docs/PRD.md). Anything that costs money goes on the Coming soon list.
2. Put logic in `src/lib` as plain functions, away from React.
3. Write a failing test first, then the code.
4. Run `npm test` and `npm run build`.
5. Check the feature at phone width.
6. Update the relevant document.

## Rules

- Only `src/lib/storage.ts` touches localStorage.
- Tap targets are at least 44px.
- Animations must respect reduced motion.
- No calorie targets, weight-loss promises or body comparison.

## Changing exercises

Edit `src/data/exercises.json`, then run `node scripts/fetch-images.mjs` for any new exercise. If you change a video, run `node scripts/check-videos.mjs` and watch the video yourself.
