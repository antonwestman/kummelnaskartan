import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import { App } from './App'

const root = document.getElementById('root')
if (!root) throw new Error('#root saknas i index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
