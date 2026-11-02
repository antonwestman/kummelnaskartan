import { heatColor, heatOpacity, metersPerPixel } from './summary'

it('glows stronger and brighter where more took part', () => {
  expect(heatOpacity(10, 10)).toBeCloseTo(0.85)
  expect(heatOpacity(3, 10)).toBeLessThan(heatOpacity(4, 10))
  expect([heatColor(3, 10), heatColor(6, 10), heatColor(10, 10)]).toEqual(['#c4651c', '#ff8a2a', '#ffd27a'])
})

it('halves the meters per pixel for each zoom level', () => {
  expect(metersPerPixel(15, 59.35)).toBeCloseTo(2.44, 1)
  expect(metersPerPixel(16, 59.35)).toBeCloseTo(metersPerPixel(15, 59.35) / 2)
})
