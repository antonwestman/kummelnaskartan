import { BrowserRouter, Route, Routes } from 'react-router'
import { StartPage } from './components/StartPage'
import { EventPage } from './components/EventPage'
import { ClaimEditLink } from './components/ClaimEditLink'
import { NotFound } from './components/NotFound'

// Varje event har en egen sökväg (/halloween-2026/). Bygget skriver en färdig HTML-fil per event
// (scripts/prerender.ts) och 404.html fångar resten, t.ex. ändringslänkar.
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/:eventId" element={<EventPage />} />
        <Route path="/:eventId/andra/:token" element={<ClaimEditLink />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
