import { MUSCLE_NAMES } from '../lib/rules'
import type { Exercise } from '../types'
import { BACK, BACK_OUTLINE, FRONT, FRONT_OUTLINE } from './bodyShapes'

// Shows the side of the body where the main muscle is drawn, with helper muscles in a lighter shade.
export function MusclesWorked({ exercise }: { exercise: Exercise }) {
  const onBack = !FRONT.some(r => r.muscle === exercise.muscle) && BACK.some(r => r.muscle === exercise.muscle)
  const regions = onBack ? BACK : FRONT
  const outline = onBack ? BACK_OUTLINE : FRONT_OUTLINE
  const shade = (m: string) => (m === exercise.muscle ? 'main' : exercise.secondary.includes(m as Exercise['muscle']) ? 'helper' : '')

  return (
    <section className="worked" aria-label="Muscles worked">
      <svg viewBox="0 0 100 200" aria-hidden="true">
        {outline.map(points => <polygon key={points} className="body-outline" points={points} />)}
        {regions.map(r => r.shapes.map(points => <polygon key={points} className={`worked-part ${shade(r.muscle)}`} points={points} />))}
      </svg>
      <div>
        <h2>Muscles worked</h2>
        <p><span className="worked-dot main" aria-hidden="true" />Main: <strong>{MUSCLE_NAMES[exercise.muscle]}</strong></p>
        {exercise.secondary.length > 0 && (
          <p><span className="worked-dot helper" aria-hidden="true" />Also: {exercise.secondary.map(m => MUSCLE_NAMES[m]).join(', ')}</p>
        )}
      </div>
    </section>
  )
}
