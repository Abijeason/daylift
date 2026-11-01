# Debugging notes

Real problems found while building Daylift.

## Settings crashed after a reset

**Symptom:** a test failed with `Cannot read properties of null (reading 'goal')`.
**Cause:** Settings assumed a profile always exists, but Reset clears it before the screen is replaced.
**Fix:** Settings now renders nothing when there's no profile.

## A form video link had stopped working

**Symptom:** `check-videos.mjs` reported a 401 for one Short that had appeared in search results.
**Cause:** the video couldn't be embedded or looked up, so search results alone don't prove a link is usable.
**Fix:** swapped the video. Every link now goes through the checker.

## Exercise images were too large to cache

**Symptom:** the 166 images came to 11 MB, a heavy first download.
**Fix:** resized them to 480px with lower JPEG quality, which brought them down to 6 MB.

## Cardio machines appeared as leg exercises

**Symptom:** treadmill walking is labelled as a quadriceps exercise, so it could be picked for strength work.
**Fix:** the planner excludes cardio machines from strength slots, with a test to keep it that way.

## A bad backup could lock users out

**Symptom:** an independent review imported a backup with `history: [{}]`, and the app crashed on every launch, so Reset couldn't be reached.
**Cause:** backup checks only looked at the top level of the file.
**Fix:** saved data and backups now have every field checked, and an error boundary offers a way to start fresh.

## Swap could erase logged sets

**Symptom:** with the Swap list open, logging a set and then choosing a swap removed the set.
**Fix:** the list closes after a set, and only appears before the first set.

## Useful tips

- Offline behaviour only shows in `npm run build` then `npm run preview`.
- Saved data is under `daylift.v1` in the browser's localStorage.
