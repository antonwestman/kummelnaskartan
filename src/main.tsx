import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import { App } from './App'
import { pathFromLegacyHash } from './paths'
import { initAnalytics } from './lib/analytics'

const legacyPath = pathFromLegacyHash(window.location.hash)
if (legacyPath) window.history.replaceState(null, '', legacyPath)

initAnalytics()

const root = document.getElementById('root')
if (!root) throw new Error('#root saknas i index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
