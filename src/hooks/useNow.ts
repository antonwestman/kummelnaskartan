import { useEffect, useState } from 'react'

/** Aktuell tid som uppdateras med jämna mellanrum (t.ex. för att stänga hus när tiden gått ut). */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
