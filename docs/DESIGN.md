# Design

## Principles

- **Readable mid-workout:** large text, high contrast and big tap targets.
- **One thing at a time:** the workout shows one exercise and one set.
- **Minimal, with a few moments of delight:** one red accent, with animation saved for moments that matter.

## Screens

Welcome, Setup, Home, Active workout, Exercises, Progress and Settings. The last four main areas use a bottom tab bar, and the tab bar hides during a workout.

## Theme

Sports editorial, like a training magazine. Headings use Barlow Condensed and body text uses Barlow, a pairing built for sports and fitness, with black, white and one red accent. Lines replace boxes wherever possible. Both fonts ship with the app, so they work offline.

Red has two jobs. Bright `--red` draws lines, rules and accents. `--red-fill` (#d42a1f) sits behind white text, such as the Home card, Delete and danger buttons, so small white type stays above 4.5:1 in both themes.

Light and dark themes both exist. The app follows the phone by default, and Settings lets people choose. Colours are variables at the top of `src/styles/app.css`.

Light mode has its own, darker values for the body maps (`--body-outline`, `--muscle`, `--helper`), the cards and grey text, because the dark theme's subtle greys almost disappear on white.

## Home

Home is a stacked deck: today's workout is a red card in front, with the next two workouts peeking out behind it. Below it are three stat tiles and the exercise list, and the tab bar floats as a rounded pill.


Home answers three questions: what do I do now, how is my week going, and what did I do last time. It has the workout title, a Monday to Sunday strip, lifetime stats, the full exercise list and the last workout.

## Logo and welcome page

The logo is a weight plate rising over a barbell like the sun, joining "day" and "lift". The welcome page sets DAYLIFT as giant type, with DAY in white and LIFT in red. The letters stamp up on arrival, a white line draws under them, and a small wave runs through LIFT every few seconds.

## Background

Two large outlined weight plates turn slowly behind everything, half off the screen edge, so the app always feels alive. They're clearly visible on the welcome page and very faint behind the other screens, so they never compete with content. They stop when reduced motion is turned on.

## Scrolling

Every new screen starts at the top: tabs, the plan and builder screens, exercise details, setup steps and each step of a workout.

## Tabs

Tapping the tab you're already on starts it fresh: it closes anything open inside it, clears searches and scrolls to the top, like most phone apps. It doesn't reload the page.

## Exercise lists

Lists show the common, checked exercises first. The open library follows under a **More exercises** label, 12 at a time; the next batch loads as the end of the list scrolls into view, with a **Show more** button as a fallback. This keeps a muscle like biceps (53 exercises) from feeling overwhelming.

## Back button

The phone's back gesture, Android's back button and the browser's back button close the open screen, one step at a time: the builder, then the plan screen, an exercise, a setup question, the workout (which stays saved to resume), and any tab other than Home. `src/lib/back.ts` adds a history entry while a screen is open and removes it quietly when an in-app button closes the screen, so the two never get out of step.

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


My workouts holds only extra sessions people make with **+ Create workout**. Plan days live in the plan and never appear here. **Delete** sits at the top right of the edit screen and asks first.

## Your plan

Home has a **Customise plan** button above the deck. The plan screen has two choices. *Daylift picks* is the default: an automatic rotation for the person's goal, done on whichever days they go. *I pick* is a Monday to Sunday week. Each day is **Rest** or a workout: one already in the plan, **+ Create your own** (name it and pick every exercise), a template (Upper, Lower, Push, Pull, Legs, Full body) or a copy of one of their own workouts. Copies are separate, so changing a plan day never changes the original. Each workout day can be edited (✎), and **Reset plan** sets every day back to Rest after a confirmation. Home then follows the calendar: today's workout, or a rest day with the next workout and its day. Once a workout is logged today, the card says **Done for today** with **Train again**, in either plan mode. On a rest day, **Train anyway** lists every workout in the week (soonest first, with its exercise count and usual day) so any of them can be trained. The weekly goal becomes the number of training days. The workout builder's **Reset** puts a workout back the way it was when opened. **Share plan with friends** sends the whole week in one link.

## Friends

The Progress tab has a Friends section. People type the name friends will see and tap **Share my progress**. Each friend shows as a card with goal, date sent, streak, workouts that week, total workouts, last workout and three personal bests. The workout summary also offers **Send progress to friends** once a name is set.

## Workout screen

Logging comes first, built for one hand between sets:
- **Set 2 of 3** in the display type, with the target reps beneath and a red rule that fills one segment per set done.
- One options row: **Watch form**, **Change exercise** and, on cable exercises, the **Attachment** menu.
- Weight and reps are big condensed numbers with **−/+** steppers (2.5 kg or 5 lb, 1 rep or 5 seconds). They start filled in: this workout's last set, otherwise the suggested weight and last time's reps, otherwise the bottom of the target range. A repeat set is one tap.
- **Finish set** is pinned to the bottom of the screen, within thumb reach.
- Removing a logged set shows **Removed set 2 · Undo** for 5 seconds.
- **How to do it** folds away the form photo, muscles worked, steps and common mistakes. It starts open for people who chose "Brand new".

Previous and next exercise links let people go back or skip a busy machine. While resting, the screen says what comes next, and the summary lists every set.

Real gym sessions don't go to plan, so the workout bends:
- **Each arm separately** logs left and right weight and reps for one-arm work. It's offered on dumbbell, kettlebell, cable and band exercises, where each arm can be loaded on its own, not on barbells or machines. The set counts as the weaker arm for bests and charts, both arms count towards total weight, and the choice is remembered per exercise.
- **Attachment** (straight bar, rope, V-bar, EZ bar, single handle, wide lat bar, ankle strap) appears on cable exercises, is saved with the exercise and defaults to last time's.
- **All exercises** lists every exercise with its sets done: tap one to go straight to it, × to remove it, or **+ Add an exercise** to search the whole library.
- **Change exercise** replaces the current one with any exercise, with same-muscle suggestions first. If sets are already logged it says they'll be removed.
- **Ended by mistake? Resume workout** on the summary takes the workout out of history and carries on.
- In **Progress → History**, **Edit** makes a finished workout fully editable: add, remove or drag (☰) exercises into the order they were done, switch any exercise to each arm separately, set cable attachments, and change, add or remove sets, or delete the workout. Bests and charts update to match.
- In History, **swipe a workout left** to show a red **Delete** button. Deleting shows an **Undo** bar for 5 seconds that puts it back in the same place. An up-and-down scroll never opens Delete, and keyboard users can delete through Edit.

In the workout builder and the History editor, each exercise has a **☰** handle. Press and drag: the exercise lifts slightly and follows the finger, the others slide out of its way (200ms, strong ease-out), and on release it glides into its slot. Holding near the top or bottom edge scrolls the page. With reduced motion the slide is instant. Keyboard users focus the handle and use the arrow keys.

## Muscles worked

Every exercise page and the live workout screen show a small body figure with the main muscle in red and helper muscles in a lighter red, plus the names of each. Helper muscles come from the exercise library.

## Body map

Tapping a muscle lights it up and shows its everyday name above the body, like Core or Biceps, with an exercise count. Named buttons below give the same choice, which also makes it work with a keyboard or screen reader.
