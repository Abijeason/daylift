// Copies images for the curated exercises from free-exercise-db (public domain).
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const base = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'
const exercises = JSON.parse(await readFile('src/data/exercises.json', 'utf8'))

for (const path of exercises.flatMap(e => e.images)) {
  const res = await fetch(base + path)
  if (!res.ok) throw new Error(`${res.status} for ${path}`)
  const target = `public/exercises/${path}`
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, Buffer.from(await res.arrayBuffer()))
}
console.log('done')
