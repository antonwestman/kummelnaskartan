import { displayAddress } from './address'

it.each([
  ['Regentvägen 1, 132 37 Saltsjö-Boo', 'Regentvägen 1'],
  ['Frövägen 8, 13237 Saltsjö-Boo', 'Frövägen 8'],
  ['7 Frövägen, 132 37 Stockholm, Sverige', 'Frövägen 7'],
  ['Kummelnäsvägen, 64', 'Kummelnäsvägen 64'],
  ['Åbroddsvägen 2A, 13237 Saltsjö-Boo', 'Åbroddsvägen 2A'],
  ['Risvägen 10, Saltsjö-Boo', 'Risvägen 10'],
  ['Åbroddsvägen 33 E', 'Åbroddsvägen 33 E'],
  ['Landbacken 6 d', 'Landbacken 6 d'],
  ['Frans Mobergs väg 7', 'Frans Mobergs väg 7'],
  ['Rensättra Allé 14', 'Rensättra Allé 14'],
])('%s → %s', (input, expected) => {
  expect(displayAddress(input)).toBe(expected)
})
