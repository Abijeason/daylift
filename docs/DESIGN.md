# Design

## Principles

- **Readable mid-workout:** large text, high contrast and big tap targets.
- **One thing at a time:** the workout shows one exercise and one set.
- **Minimal, with a few moments of delight:** one red accent, with animation saved for moments that matter.

## Screens

Welcome, Setup, Home, Active workout, Exercises, Progress and Settings. The last four main areas use a bottom tab bar, and the tab bar hides during a workout.

## Theme

Sports editorial, like a training magazine. Headings use Barlow Condensed and body text uses Barlow, a pairing built for sports and fitness, with black, white and one red accent. Lines replace boxes wherever possible. Both fonts ship with the app, so they work offline.

Light and dark themes both exist. The app follows the phone by default, and Settings lets people choose. Colours are variables at the top of `src/styles/app.css`.

## Home

Home is a stacked deck: today's workout is a red card in front, with the next two workouts peeking out behind it. Below it are three stat tiles and the exercise list, and the tab bar floats as a rounded pill.


Home answers three questions: what do I do now, how is my week going, and what did I do last time. It has the workout title, a Monday to Sunday strip, lifetime stats, the full exercise list and the last workout.

## Logo and welcome page

The logo is a weight plate rising over a barbell like the sun, joining "day" and "lift". The welcome page sets DAYLIFT as giant type, with DAY in white and LIFT in red. The letters stamp up on arrival, a white line draws under them, and a small wave runs through LIFT every few seconds.

## Background

Two large outlined weight plates turn slowly behind everything, half off the screen edge, so the app always feels alive. They're clearly visible on the welcome page and very faint behind the other screens, so they never compete with content. They stop when reduced motion is turned on.

## Scrolling

Every new screen starts at the top: tabs, the plan and builder screens, exercise details, setup steps and each step of a workout.

## Motion

Motion runs on GSAP through one hook, `useScreenMotion` in `src/lib/motion.ts`. Screens opt in with data attributes:

| Attribute | Effect |
|---|---|
| `data-split` | Headline letters rise from behind a mask |
| `data-count` | A number counts up when it scrolls into view |
| `data-reveal` | The element fades up as it scrolls into view |
| `data-parallax` | The element drifts up a little as the page scrolls |

Screen content staggers in on arrival, and CSS handles small touches such as button presses, the tab marker, week squares and the rest timer. Everything uses transform and opacity. With reduced motion turned on, GSAP skips all of it and the final layout shows straight away.

## My workouts

People can build their own workouts alongside the automatic plan. The builder picks exercises and their order, and sets, reps, rest and suggested weights still come from each person's own goal, level and history. Doing a custom workout doesn't move the automatic plan forward.

A Share button creates a link that holds only the workout's name and exercise list. When a friend opens it, their app offers to add the workout. If an exercise isn't on their My Gym list or is above their level, it's flagged with a swap or skip option. Nothing syncs between phones, and each person's history stays on their own phone.

## Your plan

Home has a **Customise plan** button above the deck. The plan screen has two choices: *Daylift picks* shows the automatic rotation, and *I pick* lets people build each day themselves with **Create your own day** (name it and pick every exercise), or start from a template (Upper, Lower, Push, Pull, Legs, Full body) or one of their workouts. Each day can be edited (✎), reordered or removed, and **Reset plan** clears the days after a confirmation. A template becomes an editable custom workout. The workout builder's **Reset** puts a workout back the way it was when opened. **Share plan with friends** sends the whole week in one link.

## Friends

The Progress tab has a Friends section. People type the name friends will see and tap **Share my progress**. Each friend shows as a card with goal, date sent, streak, workouts that week, total workouts, last workout and three personal bests. The workout summary also offers **Send progress to friends** once a name is set.

## Workout screen

Logging comes first: the set count, the sets already done (each can be removed), last time's best set, the weight and reps boxes and Finish set all sit above the fold. Previous and next exercise links let people go back or skip a busy machine. The form photo, Watch form, Swap, muscles worked and form tips follow below. While resting, the screen says what comes next, and the summary lists every set.

## Muscles worked

Every exercise page and the live workout screen show a small body figure with the main muscle in red and helper muscles in a lighter red, plus the names of each. Helper muscles come from the exercise library.

## Body map

Tapping a muscle lights it up and shows its everyday name above the body, like Core or Biceps, with an exercise count. Named buttons below give the same choice, which also makes it work with a keyboard or screen reader.
