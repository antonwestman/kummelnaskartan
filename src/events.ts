/** En plats som ingen äger, t.ex. en allmän pulkabacke. Läggs in här i koden, inte via formuläret. */
export type Place = {
  /** Unikt inom eventet. */
  id: string
  name: string
  lat: number
  lng: number
  note?: string
  /** Brasklapp som syns tydligt i listan och på kartan, t.ex. för plogad naturis som ingen kontrollerar. */
  warning?: string
}

export type PlaceLayer = {
  /** Vad platserna kallas på kartan och i listan, t.ex. "Allmän backe". */
  label: string
  /** Rubrik för listan, t.ex. "Allmänna backar". */
  heading: string
  /** Vad grannarnas hus kallas bredvid platserna, t.ex. "Granne som bjuder in". */
  entryLabel: string
  items: Place[]
}

export type KummelnasEvent = {
  /** Måste vara exakt samma som fliknamnet i Google Sheet och nyckeln i EVENTS i apps-script/Code.gs. */
  id: string
  title: string
  /**
   * 'one-day': en dag eller kväll, listas med datum under "På gång".
   * 'season': pågår länge (t.ex. hela vintern), listas under "Just nu i området" medan det pågår.
   */
  duration: 'one-day' | 'season'
  /**
   * 'event': alla hus gäller eventets dag eller hela perioden (Halloween, pulkabackar).
   * 'own': varje hus väljer sitt eget datum inom perioden och lyser bara den dagen (loppisar).
   * Måste stämma med ownDates i EVENTS i apps-script/Code.gs.
   */
  entryDates: 'event' | 'own'
  /**
   * När eventet börjar och slutar, med tidszon (+01:00 vintertid, +02:00 sommartid).
   * Efter endsAt listas eventet under "Tidigare event". När man kan lägga in hus styrs
   * separat av EVENTS i apps-script/Code.gs.
   */
  startsAt: string
  endsAt: string
  /** "Lördag 31 oktober" eller "Vintern 2026/27". */
  periodLabel: string
  summary: string
  details: string[]
  notePlaceholder: string
  /** Fasta platser som visas bredvid grannarnas hus, eller null. */
  places: PlaceLayer | null
}

/** Brasklapp för plogad naturis. */
export const NATURAL_ICE_WARNING = 'Naturis som ingen kontrollerar. Kolla isen själv innan du går ut, och åk aldrig ensam.'

export const EVENTS: KummelnasEvent[] = [
  {
    id: 'halloween-2026',
    title: 'Trick or treat',
    duration: 'one-day',
    entryDates: 'event',
    startsAt: '2026-10-31T17:00:00+01:00',
    endsAt: '2026-11-01T00:00:00+01:00',
    periodLabel: 'Lördag 31 oktober',
    summary: 'Lyser det en pumpa vid dörren går det bra att knacka på. På kartan ser du vilka som öppnat upp för bus eller godis.',
    details: ['Glöm inte reflexer.'],
    notePlaceholder: 'Har nötfritt godis',
    places: null,
  },
  {
    id: 'loppisar',
    title: 'Loppisar',
    duration: 'season',
    entryDates: 'own',
    startsAt: '2026-11-01T00:00:00+01:00',
    endsAt: '2028-01-01T00:00:00+01:00',
    periodLabel: 'Året runt',
    summary: 'Har du loppis på uppfarten? Lägg in dagen, så lyser huset på kartan när det är dags.',
    details: ['Huset lyser bara den dag loppisen är. Kommande loppisar syns gråa med datum.'],
    notePlaceholder: 'Barnkläder, leksaker och böcker',
    places: null,
  },
  {
    id: 'pulkabackar-2026',
    title: 'Pulkabackar',
    duration: 'season',
    entryDates: 'event',
    startsAt: '2026-12-01T00:00:00+01:00',
    endsAt: '2027-04-01T00:00:00+02:00',
    periodLabel: 'Vintern 2026/27',
    summary:
      'Allmänna backar och trädgårdar där grannar bjuder in till pulkaåkning. Är en trädgård släckt passar det inte just idag.',
    details: ['Har du en backe på tomten som andra får åka i? Lägg till ditt hus.', 'Fråga gärna innan ni går in på någons tomt.'],
    notePlaceholder: 'Kom in via grinden, ring gärna på',
    places: {
      label: 'Allmän backe',
      heading: 'Allmänna backar',
      entryLabel: 'Granne som bjuder in',
      // Lägg till allmänna backar här, t.ex.:
      // { id: 'kummelbacken', name: 'Kummelbacken', lat: 59.33, lng: 18.27, note: 'Flack, bra för små barn' },
      items: [],
    },
  },
  {
    id: 'skridskor-2026',
    title: 'Skridskor',
    duration: 'season',
    entryDates: 'event',
    startsAt: '2026-12-01T00:00:00+01:00',
    endsAt: '2027-04-01T00:00:00+02:00',
    periodLabel: 'Vintern 2026/27',
    summary:
      'Isbanor i området och grannar som spolat en bana på tomten. Är en tomt släckt passar det inte just idag.',
    details: [
      'Ingen här kontrollerar isen. På sjöarna åker du på egen risk: kolla isläget själv, ha isdubbar och åk inte ensam.',
      'Fråga gärna innan ni går in på någons tomt.',
    ],
    notePlaceholder: 'Ta med egna skridskor',
    places: {
      label: 'Isbana',
      heading: 'Isbanor',
      entryLabel: 'Granne som bjuder in',
      // Lägg till isbanor här. Naturis får alltid en brasklapp, t.ex.:
      // { id: 'skolans-bana', name: 'Skolans isbana', lat: 59.33, lng: 18.27, note: 'Spolas när det är kallt' },
      items: [
        {
          id: 'karbosjon',
          name: 'Karbosjön',
          lat: 59.352057,
          lng: 18.285473,
          note: 'Brukar plogas när isen har lagt sig.',
          warning: NATURAL_ICE_WARNING,
        },
      ],
    },
  },
]

export function findEvent(id: string): KummelnasEvent | undefined {
  return EVENTS.find((event) => event.id === id)
}

export const hasEnded = (event: KummelnasEvent, now: number) => now >= Date.parse(event.endsAt)

const isOngoingSeason = (event: KummelnasEvent, now: number) =>
  event.duration === 'season' && now >= Date.parse(event.startsAt) && !hasEnded(event, now)

/**
 * Just nu: säsonger som pågår. På gång: allt annat som inte är slut, närmast först.
 * Tidigare: slut, senaste först.
 */
export function groupEvents(events: KummelnasEvent[], now: number) {
  const byStart = (a: KummelnasEvent, b: KummelnasEvent) => Date.parse(a.startsAt) - Date.parse(b.startsAt)
  const notEnded = events.filter((e) => !hasEnded(e, now)).sort(byStart)
  return {
    ongoing: notEnded.filter((e) => isOngoingSeason(e, now)),
    upcoming: notEnded.filter((e) => !isOngoingSeason(e, now)),
    past: events.filter((e) => hasEnded(e, now)).sort((a, b) => byStart(b, a)),
  }
}
