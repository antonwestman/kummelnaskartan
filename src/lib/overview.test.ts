import type { KummelnasEvent, Place } from '../events'
import type { Entry } from './api'
import { todayOnMap, uniquePlaces } from './overview'

const entry = (id: string, fields: Partial<Entry> = {}): Entry => ({
  id,
  address: id,
  lat: 59.35,
  lng: 18.27,
  name: '',
  note: '',
  paused: false,
  openFrom: '',
  openUntil: '',
  date: '',
  dateTo: '',
  updatedAt: '',
  ...fields,
})

const place = (id: string, season?: Place['season']): Place => ({
  id,
  name: id,
  category: 'bad',
  lat: 59.35,
  lng: 18.27,
  ...(season ? { season } : {}),
})

const loppisar: KummelnasEvent = {
  id: 'loppisar',
  title: 'Loppisar',
  icon: '🏷️',
  startsAt: '2026-11-01T00:00:00+01:00',
  endsAt: '2028-01-01T00:00:00+01:00',
  periodLabel: '',
  summary: '',
  details: [],
  signup: {
    dates: { kind: 'own', defaultMode: 'day' },
    notePlaceholder: '',
    noun: { one: 'loppis', many: 'loppisar', the: 'loppisen', theMany: 'loppisarna', yours: 'din loppis' },
  },
  places: null,
}

const ute: KummelnasEvent = {
  ...loppisar,
  id: 'ute',
  signup: null,
  places: { heading: '', tipName: '', items: [place('sommarbad', 'summer'), place('lekplats')] },
}

const saturdayNoon = { date: '2026-11-14', minutes: 12 * 60 }

it('shows only lit houses, and counts the upcoming ones', () => {
  const [today] = todayOnMap(
    [loppisar],
    {
      loppisar: [
        entry('idag', { date: '2026-11-14' }),
        entry('nasta-vecka', { date: '2026-11-21' }),
        entry('slackt', { paused: true }),
      ],
    },
    saturdayNoon,
    11,
  )
  expect(today?.lit.map((e) => e.id)).toEqual(['idag'])
  expect(today?.laterCount).toBe(1)
})

it('shows places in season only', () => {
  const [today] = todayOnMap([ute], {}, saturdayNoon, 11)
  expect(today?.places.map((p) => p.id)).toEqual(['lekplats'])
})

it('shows a place shared by two maps once', () => {
  expect(uniquePlaces([place('a'), place('b'), place('a')]).map((p) => p.id)).toEqual(['a', 'b'])
})
