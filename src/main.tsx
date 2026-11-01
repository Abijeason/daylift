import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AppDataProvider } from './state/useAppData'
import '@fontsource-variable/archivo/wdth.css'
import './styles/app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppDataProvider>
        <App />
      </AppDataProvider>
    </ErrorBoundary>
  </StrictMode>,
)
