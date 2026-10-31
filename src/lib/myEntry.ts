import { useCallback, useState } from 'react'

/** Det som sparas i webbläsaren för att man ska kunna ändra/ta bort sin anmälan. */
export type MyEntryRef = { token: string; entryId: string }

const key = (eventId: string) => `kummelnaskartan:${eventId}`

function read(eventId: string): MyEntryRef | null {
  try {
    const raw = localStorage.getItem(key(eventId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' && parsed !== null &&
      'token' in parsed && typeof parsed.token === 'string' &&
      'entryId' in parsed && typeof parsed.entryId === 'string'
    ) {
      return { token: parsed.token, entryId: parsed.entryId }
    }
    return null
  } catch {
    return null
  }
}

function write(eventId: string, ref: MyEntryRef | null) {
  try {
    if (ref) localStorage.setItem(key(eventId), JSON.stringify(ref))
    else localStorage.removeItem(key(eventId))
  } catch {
    // Privat läge e.d. – anmälan fungerar ändå, men ändringslänken behövs.
  }
}

export function useMyEntryRef(eventId: string) {
  const [state, setState] = useState(() => ({ eventId, ref: read(eventId) }))
  // Byt eventId → läs om (justering under render i stället för effekt).
  const current = state.eventId === eventId ? state : { eventId, ref: read(eventId) }
  if (current !== state) setState(current)

  const setRef = useCallback(
    (ref: MyEntryRef | null) => {
      write(eventId, ref)
      setState({ eventId, ref })
    },
    [eventId],
  )

  return [current.ref, setRef] as const
}

export function editLink(eventId: string, token: string): string {
  const base = window.location.href.split('#')[0]
  return `${base}#/e/${eventId}/andra/${token}`
}
