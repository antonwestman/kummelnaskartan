export type KummelnasEvent = {
  /** Måste vara exakt samma som fliknamnet i Google Sheet och nyckeln i EVENTS i apps-script/Code.gs. */
  id: string
  title: string
  /**
   * När eventet börjar och slutar, med tidszon (+01:00 vintertid, +02:00 sommartid).
   * Efter endsAt listas eventet under "Tidigare event". När man kan lägga in hus styrs
   * separat av EVENTS i apps-script/Code.gs.
   */
  startsAt: string
  endsAt: string
  dateLabel: string
  summary: string
  details: string[]
  notePlaceholder: string
}

export const EVENTS: KummelnasEvent[] = [
  {
    id: 'halloween-2026',
    title: 'Trick or treat',
    startsAt: '2026-10-31T17:00:00+01:00',
    endsAt: '2026-11-01T00:00:00+01:00',
    dateLabel: 'Lördag 31 oktober',
    summary: 'Lyser det en pumpa vid dörren går det bra att knacka på. På kartan ser du vilka som öppnat upp för bus eller godis.',
    details: ['Glöm inte reflexer.'],
    notePlaceholder: 'Har nötfritt godis',
  },
]

export function findEvent(id: string): KummelnasEvent | undefined {
  return EVENTS.find((event) => event.id === id)
}

export const hasEnded = (event: KummelnasEvent, now: number) => now >= Date.parse(event.endsAt)

/** På gång: inte slut än, närmast först. Tidigare: slut, senaste först. */
export function groupEvents(events: KummelnasEvent[], now: number) {
  const byStart = (a: KummelnasEvent, b: KummelnasEvent) => Date.parse(a.startsAt) - Date.parse(b.startsAt)
  return {
    current: events.filter((e) => !hasEnded(e, now)).sort(byStart),
    past: events.filter((e) => hasEnded(e, now)).sort((a, b) => byStart(b, a)),
  }
}
