import { groupEvents, hasEnded, type KummelnasEvent } from './events'

const event = (id: string, startsAt: string, endsAt: string): KummelnasEvent => ({
  id,
  startsAt,
  endsAt,
  title: id,
  dateLabel: '',
  summary: '',
  details: [],
  notePlaceholder: '',
})

const halloween = event('halloween', '2026-10-31T17:00:00+01:00', '2026-11-01T00:00:00+01:00')

it('counts an event as ended from its end time', () => {
  expect(hasEnded(halloween, Date.parse('2026-10-31T23:59:00+01:00'))).toBe(false)
  expect(hasEnded(halloween, Date.parse('2026-11-01T00:00:00+01:00'))).toBe(true)
})

it('groups into current (soonest first) and past (latest first)', () => {
  const events = [
    event('old', '2025-05-01T10:00:00+02:00', '2025-05-01T15:00:00+02:00'),
    event('later', '2026-12-01T10:00:00+01:00', '2026-12-01T15:00:00+01:00'),
    halloween,
    event('recent', '2026-05-01T10:00:00+02:00', '2026-05-01T15:00:00+02:00'),
  ]
  const { current, past } = groupEvents(events, Date.parse('2026-10-31T20:00:00+01:00'))
  expect(current.map((e) => e.id)).toEqual(['halloween', 'later'])
  expect(past.map((e) => e.id)).toEqual(['recent', 'old'])
})
