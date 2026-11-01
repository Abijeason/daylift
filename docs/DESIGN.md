# Design

## Principles

- **Readable mid-workout:** large text, high contrast and big tap targets.
- **One thing at a time:** the workout shows one exercise and one set.
- **Minimal, with a few moments of delight:** one accent colour, with animation saved for moments that matter.

## Screens

Setup, Today, Active workout, Exercises, Progress and Settings. The last four main areas use a bottom tab bar, and the tab bar hides during a workout.

## Theme

A gym poster at night. Headings use Anton, a tall condensed poster font, and body text uses Archivo. Both ship with the app, so they work offline. The base is deep ink blue, with electric lime for actions, coral for energy and streaks, and cyan for small labels.

## Signature details

- **Weekly barbell:** Today shows a barbell that loads a plate for each workout finished this week.
- **Moving gym backdrop:** dumbbells, plates and kettlebells drift slowly behind every screen.
- **Plate timer:** a spinning weight plate sits inside the rest timer, which pulses for the last 5 seconds.

## Motion

- Content rises in with a short stagger.
- Buttons press down, and the main button has a light sheen.
- Form images loop between the start and end positions.
- The workout summary drops a shower of small plates.

All movement uses transform and opacity to stay smooth, and turns off when reduced motion is enabled.

## Body map

Tapping a muscle lights it up and shows its everyday name above the body, like Core or Biceps, with an exercise count. Named buttons below give the same choice, which also makes it work with a keyboard or screen reader.
