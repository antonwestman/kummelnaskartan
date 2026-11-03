import { describeWeather, formatWeather } from './weather'

it('turns weather codes into a word and an icon', () => {
  expect(describeWeather(0, true)).toEqual({ icon: '☀️', label: 'klart' })
  expect(describeWeather(0, false).icon).toBe('🌙')
  expect(describeWeather(2, true).label).toBe('halvklart')
  expect(describeWeather(63, true).label).toBe('regn')
  expect(describeWeather(73, true).label).toBe('snö')
  expect(describeWeather(95, true).label).toBe('åska')
})

it('shows rain only when it rains', () => {
  const dry = { temperature: 5.6, wind: 3.6, precipitation: 0, code: 3, isDay: true }
  expect(formatWeather(dry)).toEqual(['6°', '4 m/s'])
  expect(formatWeather({ ...dry, precipitation: 0.4 })).toEqual(['6°', '4 m/s', '0,4 mm'])
  expect(formatWeather({ ...dry, temperature: -2.4 })[0]).toBe('-2°')
})
