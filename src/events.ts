export type KummelnasEvent = {
  /** Måste vara exakt samma som fliknamnet i Google Sheet. */
  id: string
  title: string
  /** ISO-datum, används för att sortera och avgöra om eventet passerat. */
  date: string
  dateLabel: string
  emoji: string
  summary: string
  details: string[]
  notePlaceholder: string
}

export const EVENTS: KummelnasEvent[] = [
  {
    id: 'halloween-2026',
    title: 'Trick or treat – Kummelnäs',
    date: '2026-10-31',
    dateLabel: 'Lördag 31 oktober',
    emoji: '🎃',
    summary:
      'Lyser det en pumpa utanför är det öppet att knacka på. Kartan gör det lättare att planera rundan.',
    details: [
      'Har du en tänd pumpa utanför dörren är det fritt fram att knacka på – även om du inte står på kartan.',
      'Lägg in din adress om du delar ut godis, så hittar barnen dit lättare.',
      'Tänk på reflexer och ficklampa – det är mörkt i Kummelnäs.',
    ],
    notePlaceholder: 't.ex. "Öppet 17–19" eller "Har nötfritt godis"',
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
