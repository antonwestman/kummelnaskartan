import { groupEvents, hasEnded, type KummelnasEvent } from './events'

const event = (
  id: string,
  startsAt: string,
  endsAt: string,
  duration: KummelnasEvent['duration'] = 'one-day',
): KummelnasEvent => ({
  id,
  duration,
  startsAt,
  endsAt,
  title: id,
  periodLabel: '',
  summary: '',
  details: [],
  notePlaceholder: '',
  places: null,
})

const halloween = event('halloween', '2026-10-31T17:00:00+01:00', '2026-11-01T00:00:00+01:00')

it('counts an event as ended from its end time', () => {
  expect(hasEnded(halloween, Date.parse('2026-10-31T23:59:00+01:00'))).toBe(false)
  expect(hasEnded(halloween, Date.parse('2026-11-01T00:00:00+01:00'))).toBe(true)
})

it('groups into upcoming (soonest first) and past (latest first)', () => {
  const events = [
    event('old', '2025-05-01T10:00:00+02:00', '2025-05-01T15:00:00+02:00'),
    event('later', '2026-12-01T10:00:00+01:00', '2026-12-01T15:00:00+01:00'),
    halloween,
    event('recent', '2026-05-01T10:00:00+02:00', '2026-05-01T15:00:00+02:00'),
  ]
  const { ongoing, upcoming, past } = groupEvents(events, Date.parse('2026-10-31T20:00:00+01:00'))
  expect(ongoing).toEqual([])
  expect(upcoming.map((e) => e.id)).toEqual(['halloween', 'later'])
  expect(past.map((e) => e.id)).toEqual(['recent', 'old'])
})

it('lists a season as ongoing only while it runs', () => {
  const winter = event('winter', '2026-12-01T00:00:00+01:00', '2027-04-01T00:00:00+02:00', 'season')
  const at = (iso: string) => groupEvents([winter], Date.parse(iso))

  expect(at('2026-11-15T12:00:00+01:00').upcoming.map((e) => e.id)).toEqual(['winter'])
  expect(at('2027-01-15T12:00:00+01:00').ongoing.map((e) => e.id)).toEqual(['winter'])
  expect(at('2027-04-02T12:00:00+02:00').past.map((e) => e.id)).toEqual(['winter'])
})

it('does not list a one-day event as ongoing while it happens', () => {
  const { ongoing, upcoming } = groupEvents([halloween], Date.parse('2026-10-31T18:00:00+01:00'))
  expect(ongoing).toEqual([])
  expect(upcoming.map((e) => e.id)).toEqual(['halloween'])
})
