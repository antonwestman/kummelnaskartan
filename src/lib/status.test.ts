import type { Entry } from './api'
import { sortForDisplay, withStatus, type Today } from './status'

const entry = (id: string, fields: Partial<Entry> = {}): Entry => ({
  id,
  address: id,
  lat: 59.33,
  lng: 18.27,
  name: '',
  note: '',
  paused: false,
  openFrom: '',
  openUntil: '',
  date: '',
  updatedAt: '',
  ...fields,
})

const saturdayNoon: Today = { date: '2026-11-14', minutes: 12 * 60 }

it('lights a house on its own date only', () => {
  const [before, on, after] = withStatus(
    [entry('a', { date: '2026-11-13' }), entry('b', { date: '2026-11-14' }), entry('c', { date: '2026-11-21' })],
    saturdayNoon,
  )
  expect([before?.status, on?.status, after?.status]).toEqual(['past', 'open', 'later'])
})

it('applies opening hours and pausing on the day itself', () => {
  const [closed, paused] = withStatus(
    [entry('a', { date: '2026-11-14', openUntil: '11:00' }), entry('b', { date: '2026-11-14', paused: true })],
    saturdayNoon,
  )
  expect([closed?.status, paused?.status]).toEqual(['closed', 'paused'])
})

it('ignores dates for events where everyone shares the day', () => {
  const [shared] = withStatus([entry('a')], saturdayNoon)
  expect(shared?.status).toBe('open')
})

it('lists open first, then upcoming by date, then switched off', () => {
  const shown = withStatus(
    [
      entry('paused', { date: '2026-11-14', paused: true }),
      entry('in-two-weeks', { date: '2026-11-28' }),
      entry('today', { date: '2026-11-14' }),
      entry('next-week', { date: '2026-11-21' }),
    ],
    saturdayNoon,
  )
  expect(sortForDisplay(shown).map((e) => e.id)).toEqual(['today', 'next-week', 'in-two-weeks', 'paused'])
})
