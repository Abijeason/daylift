const WIDTH = 300
const HEIGHT = 120
const PAD = 12

export function LineChart({ label, values }: { label: string; values: number[] }) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const x = (i: number) => (values.length === 1 ? WIDTH / 2 : PAD + (i / (values.length - 1)) * (WIDTH - PAD * 2))
  const y = (v: number) => HEIGHT - PAD - ((v - min) / span) * (HEIGHT - PAD * 2)
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  return (
    <svg className="chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${label}: from ${values[0]} to ${values[values.length - 1]}`}>
      <polyline points={points} />
      {values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="4" />)}
    </svg>
  )
}
