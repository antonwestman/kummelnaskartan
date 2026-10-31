import { matchesQuery, sortByAddress } from './search'

const entry = (address: string, name = '', note = '') => ({ address, name, note })

describe('sortByAddress', () => {
  it('sorts by street, then house number in natural order', () => {
    const sorted = sortByAddress([
      entry('Ormdalsvägen 3'),
      entry('Kummelnäsvägen 20'),
      entry('Kummelnäsvägen 4'),
      entry('kummelnäsvägen 12A'),
      entry('Kummelnäsvägen 12'),
    ])
    expect(sorted.map((e) => e.address)).toEqual([
      'Kummelnäsvägen 4',
      'Kummelnäsvägen 12',
      'kummelnäsvägen 12A',
      'Kummelnäsvägen 20',
      'Ormdalsvägen 3',
    ])
  })
})

describe('matchesQuery', () => {
  const berg = entry('Kummelnäsvägen 20', 'Familjen Berg', 'Öppet 17–19')

  it('matches address, name and note, ignoring case', () => {
    expect(matchesQuery(berg, 'kummelnäs')).toBe(true)
    expect(matchesQuery(berg, 'BERG')).toBe(true)
    expect(matchesQuery(berg, 'öppet')).toBe(true)
  })

  it('requires every word to match', () => {
    expect(matchesQuery(berg, 'berg 20')).toBe(true)
    expect(matchesQuery(berg, 'berg 21')).toBe(false)
  })

  it('matches everything for an empty query', () => {
    expect(matchesQuery(berg, '   ')).toBe(true)
  })
})
