const BASE = `${import.meta.env.BASE_URL}exercises/Barbell_Squat`

export function Welcome({ onStart }: { onStart(): void }) {
  return (
    <main className="welcome">
      <div className="welcome-photo" aria-hidden="true">
        <img src={`${BASE}/0.jpg`} alt="" />
        <img className="form-demo-end" src={`${BASE}/1.jpg`} alt="" />
      </div>
      <div className="welcome-body">
        <h1><span>Daylift</span></h1>
        <div className="rule" aria-hidden="true" />
        <p className="welcome-line">Know exactly what to do at the gym today.</p>
        <ol className="welcome-steps">
          <li><strong>01</strong> Set your goal</li>
          <li><strong>02</strong> Tap what your gym has</li>
          <li><strong>03</strong> Follow today's workout</li>
        </ol>
        <button className="primary" onClick={onStart}>Get started</button>
        <p className="muted welcome-note">Free. No account needed.</p>
      </div>
    </main>
  )
}
