import { useCallback, useEffect, useState } from 'react'
import { ApiError, fetchEntries, type Entry, type Signup } from '../lib/api'

type EntriesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; entries: Entry[]; signup: Signup }

const REFRESH_MS = 60_000

export function useEntries(eventId: string, enabled: boolean) {
  const [state, setState] = useState<EntriesState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const load = () =>
      fetchEntries(eventId).then(
        ({ entries, signup }) => !cancelled && setState({ status: 'ready', entries, signup }),
        (err: unknown) => {
          if (cancelled) return
          const message = err instanceof ApiError ? err.message : 'Kunde inte hämta kartan.'
          // Behåll redan hämtad data om en bakgrundsuppdatering misslyckas.
          setState((prev) => (prev.status === 'ready' ? prev : { status: 'error', message }))
        },
      )
    load()
    // Uppdatera då och då så att nya hus dyker upp medan man går runt.
    const interval = window.setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [eventId, enabled, reloadKey])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setReloadKey((k) => k + 1)
  }, [])

  const upsert = useCallback((entry: Entry) => {
    setState((prev) =>
      prev.status === 'ready'
        ? { ...prev, entries: [...prev.entries.filter((e) => e.id !== entry.id), entry] }
        : prev,
    )
  }, [])

  const remove = useCallback((id: string) => {
    setState((prev) =>
      prev.status === 'ready' ? { ...prev, entries: prev.entries.filter((e) => e.id !== id) } : prev,
    )
  }, [])

  return { state, reload, upsert, remove }
}
