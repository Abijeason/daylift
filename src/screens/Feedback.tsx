import { useState } from 'react'
import { hasAnswer, sendFeedback } from '../lib/feedback'
import type { FeedbackAnswers } from '../lib/feedback'

const CHOICES: { key: keyof FeedbackAnswers; label: string; options: string[] }[] = [
  { key: 'experience', label: 'How long have you been going to the gym?', options: ['Brand new', 'Under 6 months', '6 months to 2 years', '2+ years'] },
  { key: 'together', label: 'Do you train alone or with friends?', options: ['Mostly alone', 'Mostly with friends', 'Both'] },
  { key: 'clarity', label: 'How easy was it to know what to do at the gym? 1 is very confusing, 5 is very clear.', options: ['1', '2', '3', '4', '5'] },
]
const PARTS = ["Today's workout", 'My workouts', 'Custom plan', 'Friends', 'Exercises and body map', 'Progress chart', 'Form videos']
const TEXTS: { key: keyof FeedbackAnswers; label: string }[] = [
  { key: 'best', label: 'What does Daylift do best?' },
  { key: 'missing', label: "What's missing or annoying?" },
  { key: 'broken', label: 'Did anything break or look wrong? What phone were you on?' },
]

function Chips({ label, options, value, onPick }: { label: string; options: string[]; value?: string; onPick(v: string): void }) {
  return (
    <fieldset className="feedback-q">
      <legend>{label}</legend>
      <div className="chip-row">
        {options.map(o => <button key={o} type="button" className="chip" aria-pressed={value === o} onClick={() => onPick(o)}>{o}</button>)}
      </div>
    </fieldset>
  )
}

export function Feedback() {
  const [open, setOpen] = useState(false)
  const [a, setA] = useState<FeedbackAnswers>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed' | 'empty'>('idle')
  const set = (key: keyof FeedbackAnswers, value: string) => setA(prev => ({ ...prev, [key]: value }))
  const used = a.used ? a.used.split(', ') : []
  const toggle = (part: string) => set('used', (used.includes(part) ? used.filter(p => p !== part) : [...used, part]).join(', '))

  const submit = async () => {
    if (!hasAnswer(a)) return setStatus('empty')
    setStatus('sending')
    if (await sendFeedback(a)) { setA({}); setStatus('sent') } else setStatus('failed')
  }

  if (status === 'sent') return <p className="card" role="status">Thanks! Your feedback was sent.</p>
  if (!open) return <button className="secondary" onClick={() => setOpen(true)}>Give feedback</button>

  return (
    <form className="feedback" onSubmit={e => { e.preventDefault(); submit() }}>
      <p className="muted">Takes about 2 minutes. Answer as much as you like. It's anonymous unless you write your name, so please leave out health details.</p>
      {CHOICES.map(q => <Chips key={q.key} label={q.label} options={q.options} value={a[q.key]} onPick={v => set(q.key, v)} />)}
      <fieldset className="feedback-q">
        <legend>Which parts did you use?</legend>
        <div className="chip-row">
          {PARTS.map(p => <button key={p} type="button" className="chip" aria-pressed={used.includes(p)} onClick={() => toggle(p)}>{p}</button>)}
        </div>
      </fieldset>
      {TEXTS.map(q => (
        <label className="field" key={q.key}>{q.label}
          <textarea className="search" rows={3} maxLength={2000} value={a[q.key] ?? ''} onChange={e => set(q.key, e.target.value)} />
        </label>
      ))}
      <Chips label="How likely are you to keep using Daylift? 1 is not at all, 5 is every workout." options={['1', '2', '3', '4', '5']} value={a.keepUsing} onPick={v => set('keepUsing', v)} />
      <label className="field">Anything else?
        <input className="search" maxLength={2000} value={a.other ?? ''} onChange={e => set('other', e.target.value)} />
      </label>
      {status === 'empty' && <p className="error" role="alert">Answer at least one question first.</p>}
      {status === 'failed' && <p className="error" role="alert">Couldn't send. Check your internet and try again. Your answers are still here.</p>}
      <button className="primary" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send feedback'}</button>
    </form>
  )
}
