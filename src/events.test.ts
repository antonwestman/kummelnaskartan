import { sortEvents, type KummelnasEvent } from './events'

const event = (id: string, date: string): KummelnasEvent => ({
  id,
  date,
  title: id,
  dateLabel: date,
  summary: '',
  details: [],
  notePlaceholder: '',
})

it('lists upcoming events first, then past events newest first', () => {
  const events = [event('old', '2025-05-01'), event('later', '2026-12-01'), event('today', '2026-10-31'), event('recent', '2026-05-01')]
  expect(sortEvents(events, '2026-10-31').map((e) => e.id)).toEqual(['today', 'later', 'recent', 'old'])
})
