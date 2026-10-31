/**
 * GoatCounter (cookiefri statistik, se index.html). Skriptet laddas async och räknar inte
 * själv vid sidladdning (no_onload) – appen räknar varje sidbyte och några händelser här.
 * Inga adresser, namn, sökord eller tokens skickas.
 */
type CountVars = { path: string; title?: string; event?: boolean }

declare global {
  interface Window {
    goatcounter?: { count?: (vars: CountVars) => void }
  }
}

const queue: CountVars[] = []

function flush() {
  const count = window.goatcounter?.count
  if (!count) return
  for (const vars of queue.splice(0)) count(vars)
}

function send(vars: CountVars) {
  queue.push(vars)
  flush()
}

/** Anropas en gång vid start: skicka det som köats när skriptet har laddats. */
export function initAnalytics() {
  document.querySelector('script[data-goatcounter]')?.addEventListener('load', flush)
  flush()
}

/** Ändringslänkar innehåller en hemlig token – den får aldrig skickas vidare. */
export function sanitizePath(path: string): string {
  return path.replace(/\/andra\/[^/]+\/?$/, '/andra')
}

export function trackPageview(path: string) {
  send({ path: sanitizePath(path) })
}

export type AnalyticsEvent =
  | 'hus-tillagt'
  | 'hus-andrat'
  | 'hus-borttaget'
  | 'min-position'
  | 'avstand-300m'
  | 'avstand-500m'
  | 'avstand-1km'
  | 'sok'

export function trackEvent(event: AnalyticsEvent) {
  send({ path: event, event: true })
}
