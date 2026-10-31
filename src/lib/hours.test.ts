import { formatHours, isClosedForTheDay, stockholmMinutes } from './hours'

describe('formatHours', () => {
  it.each([
    [{ openFrom: '17:00', openUntil: '20:00' }, '17–20'],
    [{ openFrom: '16:30', openUntil: '21:00' }, '16.30–21'],
    [{ openFrom: '09:00', openUntil: '' }, 'från 9'],
    [{ openFrom: '', openUntil: '20:30' }, 'till 20.30'],
    [{ openFrom: '', openUntil: '' }, ''],
  ])('%o → %s', (hours, expected) => {
    expect(formatHours(hours)).toBe(expected)
  })
})

describe('isClosedForTheDay', () => {
  const at = (h: number, m = 0) => h * 60 + m

  it('closes once the closing time has passed', () => {
    expect(isClosedForTheDay({ openFrom: '17:00', openUntil: '20:00' }, at(19, 59))).toBe(false)
    expect(isClosedForTheDay({ openFrom: '17:00', openUntil: '20:00' }, at(20))).toBe(true)
  })

  it('treats 00:00 as midnight and never closes overnight ranges early', () => {
    expect(isClosedForTheDay({ openFrom: '17:00', openUntil: '00:00' }, at(23, 59))).toBe(false)
    expect(isClosedForTheDay({ openFrom: '22:00', openUntil: '01:00' }, at(23))).toBe(false)
  })

  it('stays open without a closing time', () => {
    expect(isClosedForTheDay({ openFrom: '17:00', openUntil: '' }, at(23))).toBe(false)
  })
})

it('reads the time in Swedish time', () => {
  expect(stockholmMinutes(Date.parse('2026-10-31T20:15:00+01:00'))).toBe(20 * 60 + 15)
})
