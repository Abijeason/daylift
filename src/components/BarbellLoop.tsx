const SIDES = [
  { x: 112, y: 84, width: 18, height: 132, side: 'left', tone: 'red', delay: 0 },
  { x: 92, y: 100, width: 15, height: 100, side: 'left', tone: 'ink', delay: 120 },
  { x: 75, y: 116, width: 12, height: 68, side: 'left', tone: 'ink', delay: 240 },
  { x: 270, y: 84, width: 18, height: 132, side: 'right', tone: 'red', delay: 0 },
  { x: 293, y: 100, width: 15, height: 100, side: 'right', tone: 'ink', delay: 120 },
  { x: 313, y: 116, width: 12, height: 68, side: 'right', tone: 'ink', delay: 240 },
]

export function BarbellLoop() {
  return (
    <svg className="barbell-loop" viewBox="0 0 400 280" aria-hidden="true">
      <ellipse className="lift-shadow" cx="200" cy="232" rx="150" ry="6" />
      <line className="lift-floor" x1="0" y1="218" x2="400" y2="218" />
      <g className="lift-bar">
        <rect className="bar" x="24" y="146" width="352" height="8" rx="2" />
        <rect className="collar" x="132" y="141" width="8" height="18" rx="1" />
        <rect className="collar" x="260" y="141" width="8" height="18" rx="1" />
        {SIDES.map(p => (
          <rect
            key={`${p.side}${p.x}`} className={`plate ${p.side} ${p.tone}`}
            x={p.x} y={p.y} width={p.width} height={p.height} rx="3"
            style={{ animationDelay: `${p.delay}ms` }}
          />
        ))}
      </g>
    </svg>
  )
}
