import { Logo } from '../components/Logo'

export function Welcome({ onStart }: { onStart(): void }) {
  return (
    <main className="welcome">
      <div className="welcome-stage">
        <div className="logo-rings" aria-hidden="true"><i /><i /><i /></div>
        <Logo />
        <h1 className="welcome-word" aria-label="Daylift">
          {[...'Daylift'].map((letter, i) => (
            <span key={i} aria-hidden="true" style={{ '--i': i } as React.CSSProperties}>{letter}</span>
          ))}
        </h1>
      </div>
      <div className="welcome-body">
        <p className="welcome-line">Know exactly what to do at the gym today.</p>
        <button className="primary" onClick={onStart}>Get started</button>
        <p className="muted welcome-note">Free. No account needed.</p>
      </div>
    </main>
  )
}
