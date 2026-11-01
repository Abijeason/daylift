# Design

## Principles

- **Readable mid-workout:** large text, high contrast and big tap targets.
- **One thing at a time:** the workout shows one exercise and one set.
- **Minimal, with a few moments of delight:** one accent colour, with animation saved for moments that matter.

## Screens

Setup, Today, Active workout, Exercises, Progress and Settings. The last four main areas use a bottom tab bar, and the tab bar hides during a workout.

## Colour

A dark background with one sunrise-orange accent, which ties to the name. Colours are defined as variables at the top of `src/styles/app.css`.

## Motion

- Screens rise in gently.
- Buttons scale down slightly when pressed.
- The rest timer ring counts down.
- Form images loop between the start and end positions.
- The workout summary has a short burst animation.

All of this turns off or simplifies when reduced motion is enabled.
