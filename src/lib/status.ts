import type { Entry } from './api'
import { isClosedForTheDay } from './hours'

/**
 * open = lyser; paused = släckt av ägaren; closed = "Öppet till" har passerat idag.
 * later/past: bara för event där varje hus har eget datum (t.ex. loppisar) – dagen är inte idag än, eller har varit.
 */
export type EntryStatus = 'open' | 'paused' | 'closed' | 'later' | 'past'

export type ShownEntry = Entry & { status: EntryStatus }

/** Nuet i svensk tid: dagens datum ("YYYY-MM-DD") och minuter sedan midnatt. */
export type Today = { date: string; minutes: number }

function statusOf(entry: Entry, today: Today): EntryStatus {
  if (entry.date && entry.date > today.date) return 'later'
  if (entry.date && entry.date < today.date) return 'past'
  if (entry.paused) return 'paused'
  return isClosedForTheDay(entry, today.minutes) ? 'closed' : 'open'
}

export function withStatus(entries: Entry[], today: Today): ShownEntry[] {
  return entries.map((entry) => ({ ...entry, status: statusOf(entry, today) }))
}

/** Kort text efter adressen. Kommande hus visar i stället sitt datum bland detaljerna. */
export const STATUS_LABEL: Record<EntryStatus, string | null> = {
  open: null,
  later: null,
  paused: 'släckt',
  closed: 'stängt',
  past: 'har varit',
}

const RANK: Record<EntryStatus, number> = { open: 0, later: 1, paused: 2, closed: 2, past: 3 }

/**
 * Tända hus först, sedan kommande (närmast datum först), sist släckta och stängda.
 * Inom varje grupp behålls ordningen (adress eller avstånd).
 */
export function sortForDisplay(entries: ShownEntry[]): ShownEntry[] {
  return [...entries].sort(
    (a, b) => RANK[a.status] - RANK[b.status] || (a.status === 'later' ? a.date.localeCompare(b.date) : 0),
  )
}
