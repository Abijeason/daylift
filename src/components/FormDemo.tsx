import type { Exercise } from '../types'

const url = (path: string) => `${import.meta.env.BASE_URL}exercises/${path}`

export function FormDemo({ exercise }: { exercise: Exercise }) {
  const [first, second] = exercise.images
  if (!first) return null
  return (
    <div className="form-demo" role="img" aria-label={`${exercise.name} start and end position`}>
      <img src={url(first)} alt="" loading="lazy" />
      {second && <img className="form-demo-end" src={url(second)} alt="" loading="lazy" />}
    </div>
  )
}
