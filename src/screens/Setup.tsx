import { useState } from 'react'
import { SAFETY_NOTE } from '../data/copy'
import { PRESETS } from '../lib/planner'
import { allowedDays, EQUIPMENT_LABELS, EQUIPMENT_PHOTOS, GOALS, LEVELS } from '../lib/rules'
import { useScrollTop } from '../lib/motion'
import { EQUIPMENT } from '../types'
import type { Equipment, Goal, Level, Profile } from '../types'

const STEPS = 7

function Option({ title, note, onClick }: { title: string; note?: string; onClick(): void }) {
  return (
    <button className="option" onClick={onClick}>
      <strong>{title}</strong>
      {note && <span>{note}</span>}
    </button>
  )
}

// onChange takes an updater, so quick taps each build on the latest list instead of a stale one.
export function EquipmentPicker({ value, onChange }: { value: Equipment[]; onChange(update: (prev: Equipment[]) => Equipment[]): void }) {
  const toggle = (item: Equipment) =>
    onChange(prev => (prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]))
  return (
    <>
      <div className="preset-row">
        <button className="chip" onClick={() => onChange(() => PRESETS.full)}>Full gym</button>
        <button className="chip" onClick={() => onChange(() => PRESETS.basic)}>Basic gym</button>
        <button className="chip" onClick={() => onChange(() => PRESETS.dumbbells)}>Dumbbells only</button>
      </div>
      <div className="equipment-grid">
        {EQUIPMENT.map(item => (
          <button key={item} className="tile" aria-pressed={value.includes(item)} onClick={() => toggle(item)}>
            <img src={`${import.meta.env.BASE_URL}exercises/${EQUIPMENT_PHOTOS[item]}`} alt="" loading="lazy" />
            <span>{EQUIPMENT_LABELS[item]}</span>
          </button>
        ))}
      </div>
    </>
  )
}

export function Setup({ onDone }: { onDone(p: Profile): void }) {
  const [step, setStep] = useState(0)
  useScrollTop(step)
  const [goal, setGoal] = useState<Goal>('fitLean')
  const [level, setLevel] = useState<Level>('beginner')
  const [days, setDays] = useState(3)
  const [length, setLength] = useState<Profile['length']>('standard')
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [units, setUnits] = useState<Profile['units']>('kg')
  const next = () => setStep(s => s + 1)
  const [short, standard] = GOALS[goal].minutes

  return (
    <main className="setup">
      <div className="setup-bar" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS} aria-label="Setup progress">
        <span style={{ width: `${((step + 1) / STEPS) * 100}%` }} />
      </div>
      {step > 0 && <button className="link" onClick={() => setStep(s => s - 1)}>Back</button>}

      <div className="setup-step" key={step}>
        {step === 0 && (
          <>
            <p className="eyebrow">Welcome to Daylift</p>
            <h1>What's your goal?</h1>
            {(Object.keys(GOALS) as Goal[]).map(g => (
              <Option key={g} title={GOALS[g].label} note={GOALS[g].blurb} onClick={() => { setGoal(g); next() }} />
            ))}
            <Option title="Not sure yet" note="Start with Fit & Lean Muscle. You can change it any time." onClick={() => { setGoal('fitLean'); next() }} />
          </>
        )}
        {step === 1 && (
          <>
            <h1>How long have you been training?</h1>
            {(Object.keys(LEVELS) as Level[]).map(l => (
              <Option key={l} title={LEVELS[l].label} note={LEVELS[l].blurb} onClick={() => { setLevel(l); next() }} />
            ))}
          </>
        )}
        {step === 2 && (
          <>
            <h1>How many days a week?</h1>
            {allowedDays(goal, level).map(d => (
              <Option key={d} title={`${d} days a week`} onClick={() => { setDays(d); next() }} />
            ))}
          </>
        )}
        {step === 3 && (
          <>
            <h1>How long should workouts be?</h1>
            <Option title="Short" note={`About ${short} minutes`} onClick={() => { setLength('short'); next() }} />
            <Option title="Standard" note={`About ${standard} minutes`} onClick={() => { setLength('standard'); next() }} />
          </>
        )}
        {step === 4 && (
          <>
            <h1>Kilograms or pounds?</h1>
            <Option title="Kilograms" note="kg" onClick={() => { setUnits('kg'); next() }} />
            <Option title="Pounds" note="lb" onClick={() => { setUnits('lb'); next() }} />
          </>
        )}
        {step === 5 && (
          <>
            <h1>What does your gym have?</h1>
            <p className="muted">Tap what's there. Workouts only use what you pick.</p>
            <EquipmentPicker value={equipment} onChange={setEquipment} />
            <button className="primary" onClick={next}>Continue</button>
          </>
        )}
        {step === 6 && (
          <>
            <h1>Before you start</h1>
            <p>{SAFETY_NOTE}</p>
            <button className="primary" onClick={() => onDone({ goal, level, daysPerWeek: days, length, equipment, units })}>
              I understand
            </button>
          </>
        )}
      </div>
    </main>
  )
}
