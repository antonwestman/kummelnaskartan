import type { Entry } from './api'
import { isClosedForTheDay } from './hours'

/** open = lyser; paused = släckt av ägaren; closed = "Öppet till" har passerat. */
export type EntryStatus = 'open' | 'paused' | 'closed'

export type ShownEntry = Entry & { status: EntryStatus }

export function withStatus(entries: Entry[], minutesNow: number): ShownEntry[] {
  return entries.map((entry) => ({
    ...entry,
    status: entry.paused ? 'paused' : isClosedForTheDay(entry, minutesNow) ? 'closed' : 'open',
  }))
}

export const STATUS_LABEL: Record<Exclude<EntryStatus, 'open'>, string> = {
  paused: 'släckt',
  closed: 'stängt',
}
