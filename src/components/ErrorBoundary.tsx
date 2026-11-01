import { Component } from 'react'
import type { ReactNode } from 'react'
import { clearSaved } from '../lib/storage'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="screen">
        <h1>Something went wrong</h1>
        <p>Try closing and reopening Daylift. If this keeps happening, you can start fresh, which clears the data on this phone.</p>
        <button className="primary" onClick={() => { clearSaved(); location.reload() }}>Start fresh</button>
      </main>
    )
  }
}
