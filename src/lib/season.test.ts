import { isInSeason, stockholmMonth } from './season'

it('shows summer places in summer and winter places in winter', () => {
  expect(isInSeason('summer', 7)).toBe(true)
  expect(isInSeason('summer', 11)).toBe(false)
  expect(isInSeason('winter', 1)).toBe(true)
  expect(isInSeason('winter', 6)).toBe(false)
  expect(isInSeason(undefined, 11)).toBe(true)
})

it('uses the Swedish month around midnight', () => {
  expect(stockholmMonth(Date.parse('2026-11-30T23:30:00Z'))).toBe(12)
})
