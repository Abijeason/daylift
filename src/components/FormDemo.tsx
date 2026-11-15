import { imageUrl } from '../data'
import type { Exercise } from '../types'

export function FormDemo({ exercise }: { exercise: Exercise }) {
  const [first, second] = exercise.images
  if (!first) return null
  return (
    <div className="form-demo" role="img" aria-label={`${exercise.name} start and end position`}>
      <img src={imageUrl(exercise, first)} alt="" loading="lazy" />
      {second && <img className="form-demo-end" src={imageUrl(exercise, second)} alt="" loading="lazy" />}
    </div>
  )
}
