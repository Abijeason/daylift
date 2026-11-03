import { render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { countTo, useScreenMotion } from './motion'

function Screen() {
  const ref = useRef<HTMLElement>(null)
  useScreenMotion(ref)
  return (
    <main ref={ref}>
      <h1 data-split>Full Body A</h1>
      <strong data-count>1,440</strong>
      <p data-reveal>Row</p>
    </main>
  )
}

test('screens render their final content when motion cannot run', () => {
  render(<Screen />)
  expect(screen.getByRole('heading', { name: 'Full Body A' })).toBeInTheDocument()
  expect(screen.getByText('1,440')).toBeInTheDocument()
  expect(screen.getByText('Row')).toBeVisible()
})

test('countTo reads the target number from the text', () => {
  expect(countTo('1,440')).toBe(1440)
  expect(countTo('0')).toBe(0)
  expect(countTo('12')).toBe(12)
  expect(countTo('abc')).toBeNull()
})
