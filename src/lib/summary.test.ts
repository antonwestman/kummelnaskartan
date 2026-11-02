import { cellBounds, cellOpacity } from './summary'

it('puts the cell centre in the middle of its bounds', () => {
  const [[south, west], [north, east]] = cellBounds({ lat: 59.35, lng: 18.28, count: 4 }, { lat: 0.002, lng: 0.004 })
  expect(south).toBeCloseTo(59.349)
  expect(north).toBeCloseTo(59.351)
  expect(west).toBeCloseTo(18.278)
  expect(east).toBeCloseTo(18.282)
})

it('makes busier cells stronger', () => {
  expect(cellOpacity(10, 10)).toBeCloseTo(0.7)
  expect(cellOpacity(5, 10)).toBeCloseTo(0.45)
  expect(cellOpacity(3, 10)).toBeLessThan(cellOpacity(4, 10))
})
