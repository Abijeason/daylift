const WIDTH = 300
const HEIGHT = 130
const PAD_X = 16
const PAD_TOP = 26
const PAD_BOTTOM = 14

export function LineChart({ label, values, units }: { label: string; values: number[]; units: string }) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const last = values.length - 1
  const x = (i: number) => PAD_X + (i / last) * (WIDTH - PAD_X * 2)
  const y = (v: number) => HEIGHT - PAD_BOTTOM - ((v - min) / span) * (HEIGHT - PAD_TOP - PAD_BOTTOM)
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  return (
    <svg className="chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${label}: from ${values[0]} to ${values[last]} ${units}`}>
      <polyline points={points} />
      {values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="4" />)}
      <text x={x(0)} y={y(values[0]) - 10} textAnchor="start">{values[0]} {units}</text>
      <text x={x(last)} y={y(values[last]) - 10} textAnchor="end">{values[last]} {units}</text>
    </svg>
  )
}
