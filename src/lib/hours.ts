/** Öppettider som "HH:MM" (eller tom sträng), tolkade i svensk tid. */
type Hours = { openFrom: string; openUntil: string }

const toMinutes = (time: string): number | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

/** "17:00" → "17", "17:30" → "17.30" */
const short = (time: string) => time.replace(/^0(\d)/, '$1').replace(/:00$/, '').replace(':', '.')

/** "17–20", "från 17", "till 20.30" eller '' */
export function formatHours({ openFrom, openUntil }: Hours): string {
  if (openFrom && openUntil) return `${short(openFrom)}–${short(openUntil)}`
  if (openFrom) return `från ${short(openFrom)}`
  if (openUntil) return `till ${short(openUntil)}`
  return ''
}

/** Minuter sedan midnatt i Sverige just nu. */
export function stockholmMinutes(now: number): number {
  const [hours = 0, minutes = 0] = new Date(now)
    .toLocaleTimeString('sv-SE', { timeZone: 'Europe/Stockholm', hour: '2-digit', minute: '2-digit' })
    .split(':')
    .map(Number)
  return hours * 60 + minutes
}

/**
 * Har "Öppet till" passerat? "00:00" räknas som midnatt (dagens slut).
 * Tider som går över midnatt (t.ex. 22–01) stängs aldrig automatiskt – hellre för länge än för tidigt.
 */
export function isClosedForTheDay({ openFrom, openUntil }: Hours, minutesNow: number): boolean {
  const until = toMinutes(openUntil)
  if (until === null) return false
  const end = until === 0 ? 24 * 60 : until
  const from = toMinutes(openFrom)
  if (from !== null && from >= end) return false
  return minutesNow >= end
}
