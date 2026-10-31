import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { ApiError, lookupEntry } from '../lib/api'
import { useMyEntryRef } from '../lib/myEntry'

type ClaimState = { status: 'pending' } | { status: 'done' } | { status: 'error'; message: string }

/** Öppnas via ändringslänken: sparar token i den här webbläsaren och går till kartan. */
export function ClaimEditLink() {
  const { eventId = '', token = '' } = useParams()
  const [, setRef] = useMyEntryRef(eventId)
  const [state, setState] = useState<ClaimState>({ status: 'pending' })

  useEffect(() => {
    let cancelled = false
    lookupEntry(eventId, token).then(
      (entry) => {
        if (cancelled) return
        setRef({ token, entryId: entry.id })
        setState({ status: 'done' })
      },
      (err: unknown) => {
        if (cancelled) return
        setState({ status: 'error', message: err instanceof ApiError ? err.message : 'Länken fungerar inte.' })
      },
    )
    return () => {
      cancelled = true
    }
  }, [eventId, token, setRef])

  if (state.status === 'done') return <Navigate to={`/e/${eventId}`} replace />

  return (
    <main className="page narrow">
      {state.status === 'pending' ? (
        <p>Hämtar din anmälan…</p>
      ) : (
        <>
          <h1>Länken fungerar inte</h1>
          <p>{state.message}</p>
          <Link to={`/e/${eventId}`}>Till kartan</Link>
        </>
      )}
    </main>
  )
}
