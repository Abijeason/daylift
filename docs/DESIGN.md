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

Home answers three questions: what do I do now, how is my week going, and what did I do last time. It has the workout title, a Monday to Sunday strip, lifetime stats, the full exercise list and the last workout.

## Logo

A weight plate rises over a barbell like the sun, joining "day" and "lift" in one mark. On the welcome page the bar draws in, the plate rises and spins, rings pulse outward and the giant letters stamp up, then a wave runs through them every few seconds. There are no photos or videos on the welcome page or at the top of Home.

## Motion

Motion runs on GSAP through one hook, `useScreenMotion` in `src/lib/motion.ts`. Screens opt in with data attributes:

| Attribute | Effect |
|---|---|
| `data-split` | Headline letters rise from behind a mask |
| `data-count` | A number counts up when it scrolls into view |
| `data-reveal` | The element fades up as it scrolls into view |
| `data-parallax` | The element drifts up and fades as the page scrolls |
| `data-sticky` | The element gains a solid background once the page scrolls |

Screen content staggers in on arrival, and CSS handles small touches such as button presses, the tab marker, week squares and the rest timer. Everything uses transform and opacity. With reduced motion turned on, GSAP skips all of it and the final layout shows straight away.

## Body map

Tapping a muscle lights it up and shows its everyday name above the body, like Core or Biceps, with an exercise count. Named buttons below give the same choice, which also makes it work with a keyboard or screen reader.
