import { groupEvents, hasEnded, type KummelnasEvent } from './events'

const event = (id: string, startsAt: string, endsAt: string): KummelnasEvent => ({
  id,
  startsAt,
  endsAt,
  title: id,
  periodLabel: '',
  summary: '',
  details: [],
  signup: null,
  places: null,
})

const halloween = event('halloween', '2026-10-31T17:00:00+01:00', '2026-11-01T00:00:00+01:00')
const winter = event('winter', '2026-12-01T00:00:00+01:00', '2027-04-01T00:00:00+02:00')

const ids = (events: KummelnasEvent[]) => events.map((e) => e.id)

it('counts an event as ended from its end time', () => {
  expect(hasEnded(halloween, Date.parse('2026-10-31T23:59:00+01:00'))).toBe(false)
  expect(hasEnded(halloween, Date.parse('2026-11-01T00:00:00+01:00'))).toBe(true)
})

it('groups into upcoming (soonest first), ongoing and past (latest first)', () => {
  const events = [
    event('old', '2025-05-01T10:00:00+02:00', '2025-05-01T15:00:00+02:00'),
    winter,
    halloween,
    event('recent', '2026-05-01T10:00:00+02:00', '2026-05-01T15:00:00+02:00'),
    event('later', '2026-11-20T10:00:00+01:00', '2026-11-20T15:00:00+01:00'),
  ]
  const { ongoing, upcoming, past } = groupEvents(events, Date.parse('2026-10-31T20:00:00+01:00'))
  expect(ids(ongoing)).toEqual(['halloween'])
  expect(ids(upcoming)).toEqual(['later', 'winter'])
  expect(ids(past)).toEqual(['recent', 'old'])
})

it('moves a long event from upcoming to ongoing to past', () => {
  const at = (iso: string) => groupEvents([winter], Date.parse(iso))
  expect(ids(at('2026-11-15T12:00:00+01:00').upcoming)).toEqual(['winter'])
  expect(ids(at('2027-01-15T12:00:00+01:00').ongoing)).toEqual(['winter'])
  expect(ids(at('2027-04-02T12:00:00+02:00').past)).toEqual(['winter'])
})

it('lists what ends first at the top of ongoing', () => {
  const evening = event('evening', '2027-01-15T17:00:00+01:00', '2027-01-15T21:00:00+01:00')
  const { ongoing } = groupEvents([winter, evening], Date.parse('2027-01-15T18:00:00+01:00'))
  expect(ids(ongoing)).toEqual(['evening', 'winter'])
})
