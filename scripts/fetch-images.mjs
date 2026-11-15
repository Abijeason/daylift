// Copies exercise images from free-exercise-db (public domain).
// Curated images go to public/exercises (installed for offline use);
// library images go to public/library (saved on first view). Files already present are skipped.
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const base = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'
const sets = [
  ['src/data/exercises.json', 'public/exercises/'],
  ['src/data/library.json', 'public/library/'],
]

const exists = path => access(path).then(() => true, () => false)
let fetched = 0

for (const [data, folder] of sets) {
  const paths = JSON.parse(await readFile(data, 'utf8')).flatMap(e => e.images)
  // A few at a time keeps it quick without hammering the source.
  for (let i = 0; i < paths.length; i += 8) {
    await Promise.all(paths.slice(i, i + 8).map(async path => {
      const target = folder + path
      if (await exists(target)) return
      const res = await fetch(base + path)
      if (!res.ok) throw new Error(`${res.status} for ${path}`)
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, Buffer.from(await res.arrayBuffer()))
      fetched++
    }))
  }
}
console.log(`done, ${fetched} new images`)
