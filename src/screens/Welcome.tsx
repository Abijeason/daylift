import { Backdrop } from '../components/Backdrop'
import { Logo } from '../components/Logo'

// Each letter is its own element so it can stamp up on its own beat.
const letters = (word: string, offset: number) =>
  [...word].map((c, i) => <i key={i} style={{ '--i': offset + i } as React.CSSProperties}>{c}</i>)

export function Welcome({ onStart }: { onStart(): void }) {
  return (
    <main className="welcome">
      <Backdrop strong />
      <header className="welcome-top">
        <Logo />
        <span>Est. 2026</span>
      </header>
      <h1 className="welcome-word" aria-label="Daylift">
        <span aria-hidden="true">{letters('Day', 0)}</span>
        <span aria-hidden="true" className="welcome-lift">{letters('lift', 3)}</span>
      </h1>
      <div className="welcome-rule" aria-hidden="true" />
      <p className="welcome-steps"><span>Goal</span><span>Gym</span><span>Workout</span></p>
      <p className="welcome-line">Know exactly what to do at the gym today.</p>
      <div className="welcome-cta">
        <button className="welcome-start" onClick={onStart}>Get started <span aria-hidden="true">→</span></button>
        <p className="muted welcome-note">Free. No account needed.</p>
      </div>
    </main>
  )
}
