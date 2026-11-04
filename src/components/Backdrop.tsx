// Two outlined weight plates turning slowly behind the content.
function Ring() {
  return (
    <svg viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="98" />
      <circle cx="100" cy="100" r="74" />
      <circle cx="100" cy="100" r="18" />
      {Array.from({ length: 24 }, (_, i) => (
        <line key={i} x1="100" y1="6" x2="100" y2={i % 6 === 0 ? 22 : 14} transform={`rotate(${i * 15} 100 100)`} />
      ))}
    </svg>
  )
}

export function Backdrop({ strong = false }: { strong?: boolean }) {
  return (
    <div className={strong ? 'backdrop strong' : 'backdrop'} aria-hidden="true">
      <div className="backdrop-ring one"><Ring /></div>
      <div className="backdrop-ring two"><Ring /></div>
    </div>
  )
}
