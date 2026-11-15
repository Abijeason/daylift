// Turns free-exercise-db (public domain) into src/data/library.json: every exercise
// except the 83 curated ones and strongman events, in Daylift's format.
// Usage: node scripts/build-library.mjs path/to/free-exercise-db/dist/exercises.json
import { readFile, writeFile } from 'node:fs/promises'

const source = process.argv[2]
if (!source) throw new Error('Pass the path to free-exercise-db dist/exercises.json')
const all = JSON.parse(await readFile(source, 'utf8'))
const curated = new Set(JSON.parse(await readFile('src/data/exercises.json', 'utf8')).map(e => e.id))

const LOWER = ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors']
const GEAR = { 'medicine ball': 'Medicine ball', 'exercise ball': 'Exercise ball', 'foam roll': 'Foam roller', 'e-z curl bar': 'EZ curl bar', other: 'Other equipment' }
const CARDIO_MACHINE = /treadmill|bicycling|bike|elliptical|rowing, stationary|stair|climber|skiing|trail running/i

// Machines and cables become My Gym items where the name says which one, so gym checks work.
function equipment(e) {
  const name = e.name
  const needs = new Set()
  let gear
  switch (e.equipment) {
    case 'dumbbell': needs.add('dumbbells'); break
    case 'barbell': needs.add('barbellRack'); break
    case 'kettlebells': needs.add('kettlebells'); break
    case 'bands': needs.add('bands'); break
    case 'cable':
      if (/pulldown/i.test(name)) needs.add('latPulldown')
      else if (/seated cable row/i.test(name)) needs.add('seatedRow')
      else needs.add('cable')
      break
    case 'machine':
      if (CARDIO_MACHINE.test(name)) needs.add('cardioMachine')
      else if (/leg press/i.test(name)) needs.add('legPress')
      else if (/leg extension/i.test(name)) needs.add('legExtension')
      else if (/leg curl/i.test(name)) needs.add('legCurl')
      else if (/pulldown/i.test(name)) needs.add('latPulldown')
      else if (/chest press|bench press/i.test(name)) needs.add('chestPress')
      else if (/shoulder press|military press/i.test(name)) needs.add('shoulderPress')
      else if (/row/i.test(name)) needs.add('seatedRow')
      else gear = 'Machine'
      break
    default:
      if (GEAR[e.equipment]) gear = GEAR[e.equipment]
  }
  if (['dumbbell', 'barbell', 'e-z curl bar'].includes(e.equipment) && /bench|incline|decline|preacher/i.test(name)) needs.add('bench')
  if (/pull-?ups?\b|chin-?ups?\b|hanging/i.test(name)) needs.add('pullUpBar')
  return { needs: [...needs], gear }
}

const library = all
  .filter(e => !curated.has(e.id) && e.category !== 'strongman' && e.primaryMuscles.length && e.instructions.length)
  .map(e => {
    const muscle = e.primaryMuscles[0]
    const secondary = [...new Set([...e.primaryMuscles.slice(1), ...e.secondaryMuscles])].filter(m => m !== muscle)
    const { needs, gear } = equipment(e)
    const timed = ['stretching', 'cardio'].includes(e.category) || /plank|hold/i.test(e.name)
    return {
      id: e.id,
      name: e.name,
      muscle,
      secondary,
      level: e.level,
      needs,
      ...(gear && { gear }),
      region: LOWER.includes(muscle) ? 'lower' : 'upper',
      bodyweight: e.equipment === 'body only' || e.equipment === 'bands' || e.equipment === null || timed,
      ...(timed && { timed: true }),
      images: e.images,
      videoUrl: null,
      steps: e.instructions.map(s => s.trim()).filter(Boolean),
      mistakes: [],
      easierIds: [],
      library: true,
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

await writeFile('src/data/library.json', JSON.stringify(library))
console.log(`${library.length} library exercises written`)
