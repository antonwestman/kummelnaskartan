import { HashRouter, Route, Routes } from 'react-router'
import { StartPage } from './components/StartPage'
import { EventPage } from './components/EventPage'
import { ClaimEditLink } from './components/ClaimEditLink'
import { NotFound } from './components/NotFound'

// HashRouter: GitHub Pages kan inte skriva om URL:er, så vi använder #/-adresser.
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/e/:eventId" element={<EventPage />} />
        <Route path="/e/:eventId/andra/:token" element={<ClaimEditLink />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  )
}
