export type KummelnasEvent = {
  /** Måste vara exakt samma som fliknamnet i Google Sheet. */
  id: string
  title: string
  /** ISO-datum, används för att sortera och avgöra om eventet passerat. */
  date: string
  dateLabel: string
  summary: string
  details: string[]
  notePlaceholder: string
}

export const EVENTS: KummelnasEvent[] = [
  {
    id: 'halloween-2026',
    title: 'Trick or treat',
    date: '2026-10-31',
    dateLabel: 'Lördag 31 oktober',
    summary: 'Lyser det en pumpa vid dörren går det bra att knacka på. På kartan ser du vilka som delar ut godis.',
    details: ['Glöm inte reflexer.'],
    notePlaceholder: 'Öppet 17–19',
  },
]

export function findEvent(id: string): KummelnasEvent | undefined {
  return EVENTS.find((event) => event.id === id)
}

/** Kommande först (närmast i tid), därefter passerade (senaste först). */
export function sortEvents(events: KummelnasEvent[], today: string): KummelnasEvent[] {
  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const past = events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date))
  return [...upcoming, ...past]
}
