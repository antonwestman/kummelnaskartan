import { useEffect, useState } from 'react'
import { ApiError, fetchOverview, type Overview } from '../lib/api'

type OverviewState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; overview: Overview }

const REFRESH_MS = 60_000

/** Allt som visas på startsidans karta, i ett anrop. Uppdateras då och då, som husen på eventsidorna. */
export function useOverview(enabled: boolean): OverviewState {
  const [state, setState] = useState<OverviewState>({ status: 'loading' })

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const load = () =>
      fetchOverview().then(
        (overview) => !cancelled && setState({ status: 'ready', overview }),
        (err: unknown) => {
          if (cancelled) return
          const message = err instanceof ApiError ? err.message : 'Kunde inte hämta kartan.'
          // Behåll det som redan visas om en bakgrundsuppdatering misslyckas.
          setState((prev) => (prev.status === 'ready' ? prev : { status: 'error', message }))
        },
      )
    load()
    const interval = window.setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [enabled])

  return state
}
