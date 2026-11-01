// Confirms each form video still exists and writes the list for a human to review.
import { readFile, writeFile } from 'node:fs/promises'

const exercises = JSON.parse(await readFile('src/data/exercises.json', 'utf8'))
const rows = []
let broken = 0

for (const e of exercises.filter(x => x.videoUrl)) {
  const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(e.videoUrl)}`)
  if (res.ok) {
    const { title, author_name: channel } = await res.json()
    rows.push(`| ${e.name} | [${title.replaceAll('|', '-')}](${e.videoUrl}) | ${channel} | ☐ |`)
  } else {
    broken++
    rows.push(`| ${e.name} | ${e.videoUrl} | BROKEN (${res.status}) | ☐ |`)
  }
}

const total = exercises.length
await writeFile('docs/VIDEO-REVIEW.md', `# Form video review

An automatic check confirms that each link works. It cannot confirm the form shown is correct, so a person needs to watch each one.

${rows.length} of ${total} exercises have a hand-picked video. The others open a YouTube search.

| Exercise | Video | Channel | Form checked |
|---|---|---|---|
${rows.join('\n')}

Regenerate this file with \`node scripts/check-videos.mjs\`.
`)
console.log(`${rows.length} checked, ${broken} broken`)
process.exit(broken ? 1 : 0)
