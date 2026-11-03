import { countLabel } from './text'
import { HUS, type Noun } from '../events'
import type { ShownEntry } from './status'

const backe: Noun = { one: 'backe', many: 'backar', the: 'backen', theMany: 'backarna', yours: 'din backe' }

const shown = (status: ShownEntry['status']): ShownEntry => ({
  id: status + Math.random(),
  address: '',
  lat: 0,
  lng: 0,
  name: '',
  note: '',
  paused: false,
  openFrom: '',
  openUntil: '',
  date: '',
  dateTo: '',
  updatedAt: '',
  status,
})

it('counts with the word the event uses', () => {
  expect(countLabel([shown('open'), shown('open')], backe)).toBe('2 backar')
  expect(countLabel([shown('open')], backe)).toBe('1 backe')
  expect(countLabel([shown('open'), shown('later'), shown('later')], HUS)).toBe('1 hus idag, 2 senare')
})
