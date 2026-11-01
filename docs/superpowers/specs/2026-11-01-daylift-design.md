# Daylift: Design Spec

**Date:** 2026-11-01
**Status:** Waiting for review
**Working name:** Daylift. Check the name again before any App Store or Play Store release, because an unrelated daily-challenge app called DayLift already exists.

## 1. Purpose

Daylift tells gym-goers exactly what to do today, and shows them how to do it safely. It is for all gym-goers, with a focus on beginners. A typical user started a month ago and wants to stay fit and build a bit of muscle.

**Success for version 1:**
- A new user finishes setup in about a minute and can start a workout straight away.
- Every workout only uses equipment the user's gym has.
- Real users can try it from a link, and their feedback decides what comes next.
- It costs nothing to run.

**What makes it different:** clear beginner guidance and a fun, simple experience. Equipment matching alone is not enough, because competitors such as Repwell already do it.

## 2. Constraints

- No paid services. Anything that needs money shows as Coming soon.
- Installable web app first. App Store and Play Store versions come after user feedback.
- Simple, minimal interface with a few well-made animations.
- No accounts and no server.

## 3. Screens

Bottom navigation has four tabs: Today, Exercises, Progress and Settings.

### Setup (first launch only)
1. Goal, including "Not sure yet"
2. Experience level
3. Days per week
4. Workout length: Short or Standard
5. My Gym equipment
6. Safety note, then the first workout plan

### Today (home)
- Shows the next workout, its muscles, estimated time and a Start button.
- Shows the weekly streak.
- On a recommended rest day, shows a rest message and a "Train anyway" button.
- Shows a tip to add the app to the home screen until it is installed.

### Active workout
1. Warm-up steps for that workout, with a Skip button.
2. One exercise at a time, showing target sets, reps and suggested weight.
3. The user enters weight and reps, then taps to finish the set. The rest timer starts automatically.
4. A Swap button replaces the exercise with another one for the same muscle that their equipment allows.
5. A summary shows time, total weight lifted, personal bests and streak.

An unfinished workout is saved after each set, so it can be resumed if the app closes.

### Exercises
- Front and back body map. Tapping a muscle lists its exercises.
- Search by name.
- Each exercise shows its images, short form steps, common mistakes, the equipment it needs and easier alternatives.

### Progress
- Workout history
- Personal best for each exercise
- A simple chart of weight over time for one exercise

### Settings
- Change goal, level, days, workout length and My Gym. History is kept.
- Choose kg or lb.
- Export and import a backup file.
- Reset all data, with a confirmation step.
- Feedback link. This is hidden until the Google Form address is added.
- Coming soon list: AI photo scan, AI coach, reminders when the app is closed, cloud backup and store apps.

## 4. Goals

| Goal | Days per week | Short / Standard (min) | Sets | Reps | Rest | Cardio finisher |
|---|---:|---:|---:|---:|---:|---:|
| Fit & Lean Muscle (default) | 3–4 | 45 / 60 | 3 | 8–12 | 75 sec | None |
| Build Muscle | 4–5 | 60 / 75 | 4 | 8–12 | 90 sec | None |
| Get Stronger | 3–4 | 60 / 75 | 4 | 4–6 | 150 sec | None |
| Lose Weight | 3–5 | 45 / 60 | 3 | 10–15 | 60 sec | 10 min |
| Tone Up | 3–4 | 40 / 50 | 3 | 12–15 | 60 sec | None |
| Build Stamina | 3–5 | 40 / 50 | 3 | 15–20 | 40 sec | 15 min |
| Stay Active | 2–3 | 30 / 40 | 2 | 10–15 | 60 sec | None |

"Not sure yet" uses Fit & Lean Muscle.

Build Stamina uses short-rest sets rather than true circuits in version 1, because the workout screen shows one exercise at a time.

There is no calorie or diet tracking. Build Muscle and Lose Weight show one short, general eating tip with no numbers.

## 5. Experience levels

| Level | Training history | Most days per week | Sets change | Exercises used |
|---|---|---:|---:|---|
| Brand new | Never trained in a gym | 3 | 1 fewer, minimum 2 | Beginner only |
| Beginner | Up to 6 months | 4 | None | Beginner only |
| Intermediate | 6 months to 2 years | 5 | None | Beginner and intermediate |
| Advanced | 2 years or more | 5 | 1 more | All |

**Days offered:** the goal's range, limited by the level's maximum. If the whole range is above the maximum, the only option is the maximum.

**Get Stronger:** Brand new uses 8–10 reps and Beginner uses 6–8 reps. Heavy weights are not safe until form is learned.

## 6. Workout rules

### Weekly split

| Days | Rotation |
|---:|---|
| 2 | Full Body A, Full Body B |
| 3 | Full Body A, B, C |
| 4 | Upper A, Lower A, Upper B, Lower B |
| 5 | Push, Pull, Legs, Upper, Lower |

The rotation follows order, not weekdays. A missed day moves nothing, and the next workout simply waits.

### Choosing exercises
1. Each workout type lists muscle slots in priority order, with big compound lifts first.
2. Each slot picks an allowed exercise for that muscle. It must suit the user's equipment and level.
3. If no exercise fits a slot, it tries a bodyweight, band or dumbbell version.
4. If there is still no match, the slot is skipped and the next muscle in the list is used.

The same inputs always give the same workout, so a plan stays stable from week to week until the user changes it.

### Number of exercises

```
time per exercise = sets × (0.75 min + rest) + 1 min
exercises = (workout minutes − warm-up − cardio) ÷ time per exercise
```

The warm-up counts as 8 minutes. The result is rounded down and kept between 3 and 8.

### Warm-ups
Each workout type has a hand-written warm-up of 5–8 minutes. It has light cardio, then movements for that day's muscles. The first big lift also adds lighter warm-up sets, and these do not count toward progress.

### Suggested weight
- **First time on an exercise:** no number. The app says to choose a weight where the last reps feel hard but form stays clean.
- **All sets reach the top of the rep range:** suggest a small increase next time. Upper body adds 2.5 kg (5 lb) and lower body adds 5 kg (10 lb).
- **Otherwise:** suggest the same weight, even if the user falls short. Version 1 never lowers it automatically.

The suggestion is advice and the user can always enter a different weight.

### Rest days
A rest day is recommended when either rule applies:
- The weekly target has been reached.
- The user has trained on too many days in a row: 1 day for 2–3 day plans, 2 days for 4-day plans and 3 days for 5-day plans.

"Train anyway" is always available.

### Streak
The streak counts weeks in a row where the user completed their planned workouts. It is weekly so that rest days never break it.

## 7. My Gym

The user taps what their gym has. Presets fill in the list: Full gym, Basic gym and Dumbbells only.

**Items:** dumbbells, barbell and rack, adjustable bench, cable machine, lat pulldown, seated row, chest press, shoulder press, leg press, leg extension, leg curl, pull-up bar, kettlebells, resistance bands, and cardio machine.

Bodyweight exercises are always allowed. One gym is saved in version 1.

## 8. Exercise data

The source is [free-exercise-db](https://github.com/yuhonas/free-exercise-db), which is released under the Unlicense. It has 800+ exercises with fields for muscles, level, equipment, instructions and images.

Checked against its schema and one sample record:
- Its one `machine` equipment label covers every machine, which cannot tell a leg press from a chest press.
- It has no field for common mistakes.
- Some instructions are long, and the squat sample uses older advice about knees and toes.

So the dataset is a base, not the final content:
- A hand-picked list of about 90 exercises goes in `exercises.json`, and only those images are bundled.
- Each one gets a My Gym requirement, an upper or lower body tag, short form steps and common mistakes.
- Animations flip between an exercise's two images where it has both.

A build-time check fails if any exercise has a missing image, an unknown equipment item or an unknown muscle. A planner test confirms that every preset and level produces full workouts.

## 9. Look and feel

- Dark, clean style with one bold accent colour and large text that is easy to read mid-workout.
- Large tap targets for sweaty hands.
- Animated rest timer ring.
- Set-complete tick with vibration where supported.
- Short celebration for a new personal best.
- Animated workout summary.
- Interactive body map.

All animations use CSS or the browser's built-in animation tools. They turn off or simplify for users with reduced motion enabled.

## 10. Technical design

**Stack:** React, TypeScript and Vite, with vite-plugin-pwa for offline use and Vitest for tests. Charts are simple hand-written SVG. There is no router or state library.

**Hosting:** GitHub Pages. Deployment needs the owner's GitHub account, so it happens only after the owner approves it.

| Unit | Job |
|---|---|
| `data/exercises.json` | The curated exercise list |
| `data/warmups.ts` | Warm-ups for each workout type |
| `lib/planner.ts` | Turns a profile and equipment into workouts. Has no UI code |
| `lib/progress.ts` | Suggested weights, personal bests, streak and rest days |
| `lib/storage.ts` | The only code that reads or writes saved data |
| `screens/` | One folder per screen |
| `components/` | Shared pieces such as the timer ring and body map |

**Saved data:** one versioned JSON record in localStorage, holding the profile, My Gym, workout history and any workout in progress.

### Preventing data loss
- Browsers can clear saved data, and iPhone Safari can do so after a period of no use. The app asks for persistent storage and encourages adding it to the home screen.
- Settings has Export and Import backup. Import checks the file before replacing anything.
- If saved data is damaged, the app keeps a copy of it, offers a reset and does not crash.
- If saving fails, the user sees a warning rather than silently losing a set.

### Rest timer
- The timer saves its end time, so it is correct after the phone is locked or the app is reopened.
- The app asks to keep the screen awake during a workout, where supported.
- Timer end plays a sound and vibrates, where supported. A locked phone may not alert the user, and the app must say so once.

## 11. Safety

- Setup shows a note: this is general guidance rather than medical advice, and users with an injury, a health condition or pregnancy should ask a doctor first.
- Exercise pages say to stop if something hurts and to ask a gym trainer about heavy lifts.
- Suggested weight increases stay small.
- There are no calorie targets, weight-loss promises or body-comparison features.

## 12. Testing

- **Automated:** planner, suggested weights, rest days, streak, storage recovery and backup import.
- **Data check:** every preset, goal, level and day count gives valid workouts.
- **Browser test at phone size:** full journey from setup through a logged workout to Progress, including resuming after a reload and working offline.
- **Accessibility check:** contrast, labels, keyboard use and reduced motion.
- **Real phones:** the owner should test on an iPhone and an Android phone, because vibration, install prompts and timer behaviour differ from a desktop browser.

## 13. Not in version 1

- AI photo scan and AI coach
- Accounts and cloud backup. Optional free login is the first upgrade to consider if testers ask for it
- Social features
- Calorie or nutrition tracking
- Custom workout builder
- True circuits
- Body weight and measurement tracking
- Several saved gyms
- Reminders when the app is closed
- App Store and Play Store apps

## 14. Before launch

- The owner creates the free Google Form for feedback and provides its link.
- The owner approves publishing to GitHub Pages.
- The hand-written exercise and warm-up content gets a final read-through. Review by a qualified trainer is recommended if possible.
