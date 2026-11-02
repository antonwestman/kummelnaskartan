/** Vad för slags plats: styr ikon, namn i listan och filtret. */
export type PlaceCategory =
  | 'pulkabacke'
  | 'lekplats'
  | 'bad'
  | 'isbana'
  | 'grillplats'
  | 'utsikt'
  | 'vindskydd'
  | 'fiske'
  | 'aktivitet'
  | 'batbrygga'

export const PLACE_CATEGORIES: Record<PlaceCategory, { label: string; plural: string; icon: string }> = {
  pulkabacke: { label: 'Allmän backe', plural: 'Allmänna backar', icon: '🛷' },
  lekplats: { label: 'Lekplats', plural: 'Lekplatser', icon: '🛝' },
  bad: { label: 'Badplats', plural: 'Badplatser', icon: '🏊' },
  isbana: { label: 'Is', plural: 'Is', icon: '⛸️' },
  grillplats: { label: 'Grillplats', plural: 'Grillplatser', icon: '🔥' },
  utsikt: { label: 'Utsikt', plural: 'Utsikter', icon: '🔭' },
  vindskydd: { label: 'Vindskydd', plural: 'Vindskydd', icon: '🛖' },
  fiske: { label: 'Fiske', plural: 'Fiske', icon: '🎣' },
  aktivitet: { label: 'Aktivitet', plural: 'Aktiviteter', icon: '🚴' },
  batbrygga: { label: 'Båtbrygga', plural: 'Båtbryggor', icon: '⛴️' },
}

/** När en plats är aktuell. Utan säsong visas den året runt. Se lib/season.ts. */
export type Season = 'summer' | 'winter'

/** En plats som ingen äger, t.ex. en allmän pulkabacke eller lekplats. Läggs in här i koden, inte via formuläret. */
export type Place = {
  /** Unikt inom eventet. */
  id: string
  name: string
  category: PlaceCategory
  lat: number
  lng: number
  note?: string
  /** Visas bara under säsongen, t.ex. badplatser på sommaren. */
  season?: Season
  /** Brasklapp som syns tydligt i listan och på kartan, t.ex. om något kräver extra försiktighet. */
  warning?: string
}

export type PlaceLayer = {
  /** Rubrik för listan, t.ex. "Allmänna backar". */
  heading: string
  items: Place[]
}

/** Hur ett hus anger när det är öppet: tills vidare, en dag eller en period. */
export type DateMode = 'ongoing' | 'day' | 'period'

/** Att grannar lägger in sina hus via formuläret. Kräver en flik i Sheetet och en rad i EVENTS i Code.gs. */
export type SignupConfig = {
  /**
   * 'event': alla hus gäller eventets kväll (Halloween).
   * 'own': varje hus väljer själv när det är öppet – tills vidare, en dag eller en period (loppisar,
   * pulkabackar). defaultMode är det som är förvalt i formuläret.
   * Måste stämma med ownDates i EVENTS i apps-script/Code.gs.
   */
  dates: { kind: 'event' } | { kind: 'own'; defaultMode: DateMode }
  notePlaceholder: string
  /** Vad husen kallas på kartan när det också finns fasta platser, t.ex. "Granne som bjuder in". */
  houseLabel?: string
}

export type KummelnasEvent = {
  /**
   * Blir adressen (kummelnaskartan.se/<id>/). Med anmälan måste det också vara exakt samma som
   * fliknamnet i Google Sheet och nyckeln i EVENTS i apps-script/Code.gs. Event som börjar om med en
   * tom karta får sin tid i id:t: år för en dag (halloween-2026), vinter för en säsong
   * (pulkabackar-2026-27). Det som pågår hela tiden har ingen (loppisar).
   */
  id: string
  title: string
  /**
   * När eventet börjar och slutar, med tidszon (+01:00 vintertid, +02:00 sommartid).
   * Styr var eventet listas på startsidan: "Kommande" före startsAt, "På gång" fram till endsAt,
   * sedan "Tidigare event". Ett event kan vara en kväll (Halloween) eller en hel vinter (pulkabackar).
   * När man kan lägga in hus styrs separat av EVENTS i apps-script/Code.gs.
   */
  startsAt: string
  endsAt: string
  /** "Lördag 31 oktober 2026" eller "Vintern 2026/27". Används också i sidtiteln för sökmotorer. */
  periodLabel: string
  summary: string
  details: string[]
  /** Grannar lägger in hus, eller null för en karta med bara fasta platser (Ute i Kummelnäs). */
  signup: SignupConfig | null
  /** Fasta platser, eller null. */
  places: PlaceLayer | null
}

export const EVENTS: KummelnasEvent[] = [
  {
    id: 'halloween-2026',
    title: 'Trick or treat',
    startsAt: '2026-10-31T17:00:00+01:00',
    endsAt: '2026-11-01T00:00:00+01:00',
    periodLabel: 'Lördag 31 oktober 2026',
    summary: 'Lyser det en pumpa vid dörren går det bra att knacka på. På kartan ser du vilka som öppnat upp för bus eller godis.',
    details: ['Glöm inte reflexer.'],
    signup: { dates: { kind: 'event' }, notePlaceholder: 'Har nötfritt godis' },
    places: null,
  },
  {
    id: 'loppisar',
    title: 'Loppisar',
    startsAt: '2026-11-01T00:00:00+01:00',
    endsAt: '2028-01-01T00:00:00+01:00',
    periodLabel: 'Året runt',
    summary: 'Har du loppis på uppfarten? Lägg in när, så lyser huset på kartan när det är dags.',
    details: [
      'Välj en dag, en period eller tills vidare. Huset lyser när loppisen är öppen. Före och efter syns det grått med datum.',
    ],
    signup: { dates: { kind: 'own', defaultMode: 'day' }, notePlaceholder: 'Barnkläder, leksaker och böcker' },
    places: null,
  },
  {
    id: 'pulkabackar-2026-27',
    title: 'Pulkabackar',
    startsAt: '2026-12-01T00:00:00+01:00',
    endsAt: '2027-04-01T00:00:00+02:00',
    periodLabel: 'Vintern 2026/27',
    summary:
      'Allmänna backar och trädgårdar där grannar bjuder in till pulkaåkning. Är en trädgård släckt passar det inte just idag.',
    details: [
      'Har du en backe på tomten som andra får åka i? Lägg till ditt hus, tills vidare eller för en period när det är bra snö.',
      'Fråga gärna innan ni går in på någons tomt.',
    ],
    signup: {
      dates: { kind: 'own', defaultMode: 'ongoing' },
      notePlaceholder: 'Kom in via grinden, ring gärna på',
      houseLabel: 'Granne som bjuder in',
    },
    places: {
      heading: 'Allmänna backar',
      // Lägg till allmänna backar här, t.ex.:
      // { id: 'kummelbacken', name: 'Kummelbacken', category: 'pulkabacke', lat: 59.33, lng: 18.27, note: 'Flack' },
      items: [],
    },
  },
  {
    id: 'ute',
    title: 'Ute i Kummelnäs',
    startsAt: '2026-11-01T00:00:00+01:00',
    endsAt: '2030-01-01T00:00:00+01:00',
    periodLabel: 'Året runt',
    summary: 'Lekplatser, bad, grillplatser, utsikter och annat ute i närheten. Badplatser visas på sommaren och is på vintern.',
    details: [],
    signup: null,
    places: {
      heading: 'Platser',
      items: [
        { id: 'midsommarangen', name: 'Midsommarängens lekplats', category: 'lekplats', lat: 59.357537, lng: 18.287556 },
        { id: 'rudsjokroken', name: 'Rudsjökrokens lekplats', category: 'lekplats', lat: 59.348247, lng: 18.293235 },
        {
          id: 'karbosjon-is',
          name: 'Karbosjön',
          category: 'isbana',
          season: 'winter',
          lat: 59.352057,
          lng: 18.285487,
          note: 'Plogas ibland när isen har lagt sig.',
          warning: 'Naturis som ingen kontrollerar. Kolla isen själv innan du går ut, och åk aldrig ensam.',
        },
        { id: 'velamsund-bikepark', name: 'Velamsund Bikepark', category: 'aktivitet', lat: 59.349349, lng: 18.310575 },
        { id: 'velamsund-utegym', name: 'Utegym, Velamsund', category: 'aktivitet', lat: 59.346942, lng: 18.320038 },
        { id: 'velamsundsbadet', name: 'Velamsundsbadet', category: 'bad', season: 'summer', lat: 59.345329, lng: 18.326943 },
        { id: 'insjon-bad', name: 'Insjöns badplats', category: 'bad', season: 'summer', lat: 59.334217, lng: 18.333723 },
        { id: 'sagsjon-bad', name: 'Sågsjöns badplats', category: 'bad', season: 'summer', lat: 59.346006, lng: 18.280645 },
        { id: 'vittjarn', name: 'Vittjärns klippbad', category: 'bad', season: 'summer', lat: 59.340592, lng: 18.253152 },
        { id: 'abbortrasket-utsikt', name: 'Utkiksplats vid Abborträsket', category: 'utsikt', lat: 59.331385, lng: 18.288725 },
        { id: 'abbortrasket-grill', name: 'Grillplats vid Abborträsket', category: 'grillplats', lat: 59.331637, lng: 18.286643 },
        // Grillplats vid Karbosjön: lägg till med rätt position, t.ex.
        // { id: 'karbosjon-grill', name: 'Grillplats vid Karbosjön', category: 'grillplats', lat: …, lng: … },
        { id: 'riset-brygga', name: 'Riset', category: 'batbrygga', lat: 59.359993, lng: 18.285518, note: 'Hållplats för skärgårdsbåtar.' },
        {
          id: 'hasseludden-brygga',
          name: 'Hasseludden',
          category: 'batbrygga',
          lat: 59.349017,
          lng: 18.244442,
          note: 'Hållplats för skärgårdsbåtar.',
        },
      ],
    },
  },
]

export function findEvent(id: string): KummelnasEvent | undefined {
  return EVENTS.find((event) => event.id === id)
}

export const hasEnded = (event: KummelnasEvent, now: number) => now >= Date.parse(event.endsAt)

const hasStarted = (event: KummelnasEvent, now: number) => now >= Date.parse(event.startsAt)

/**
 * På gång: har börjat men inte slutat, det som slutar först överst (en kväll före en hel vinter).
 * Kommande: har inte börjat, närmast först. Tidigare: slut, senaste först.
 */
export function groupEvents(events: KummelnasEvent[], now: number) {
  const time = (iso: string) => Date.parse(iso)
  return {
    ongoing: events
      .filter((e) => hasStarted(e, now) && !hasEnded(e, now))
      .sort((a, b) => time(a.endsAt) - time(b.endsAt)),
    upcoming: events.filter((e) => !hasStarted(e, now)).sort((a, b) => time(a.startsAt) - time(b.startsAt)),
    past: events.filter((e) => hasEnded(e, now)).sort((a, b) => time(b.startsAt) - time(a.startsAt)),
  }
}
