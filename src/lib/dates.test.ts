import { formatEntryDate, stockholmDate } from './dates'

it('uses the Swedish date, also just after midnight', () => {
  expect(stockholmDate(Date.parse('2026-11-14T23:30:00Z'))).toBe('2026-11-15')
  expect(stockholmDate(Date.parse('2026-11-14T12:00:00+01:00'))).toBe('2026-11-14')
})

it('formats a date short, with weekday', () => {
  expect(formatEntryDate('2026-11-14')).toBe('lör 14 nov')
})
