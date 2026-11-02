import { circlePolygon, distanceInMeters, formatDistance, sortByDistance, withinRadius } from './geo'

describe('geo', () => {
  const near = { id: 'near', lat: 59.3546, lng: 18.2686 }
  const far = { id: 'far', lat: 59.36, lng: 18.29 }
  const me = { lat: 59.3545, lng: 18.2685 }

  it('sorts closest first when a position is known', () => {
    expect(sortByDistance([far, near], me).map((p) => p.id)).toEqual(['near', 'far'])
  })

  it('keeps the original order without a position', () => {
    expect(sortByDistance([far, near], null).map((p) => p.id)).toEqual(['far', 'near'])
  })

  it('keeps only places within the radius', () => {
    expect(withinRadius([near, far], me, 500).map((p) => p.id)).toEqual(['near'])
    expect(withinRadius([near, far], me, 5000).map((p) => p.id)).toEqual(['near', 'far'])
  })

  it('computes and formats realistic distances', () => {
    const meters = distanceInMeters(me, far)
    expect(meters).toBeGreaterThan(1000)
    expect(meters).toBeLessThan(2000)
    expect(formatDistance(340)).toBe('340 m')
    expect(formatDistance(1260)).toBe('1,3 km')
    expect(formatDistance(1000)).toBe('1 km')
  })
})

it('draws a circle whose corners all lie at the radius', () => {
  const center = { lat: 59.3545, lng: 18.2685 }
  const corners = circlePolygon(center, 1500, 16)
  expect(corners).toHaveLength(16)
  for (const [lat, lng] of corners) expect(distanceInMeters(center, { lat, lng })).toBeCloseTo(1500, -1)
})
