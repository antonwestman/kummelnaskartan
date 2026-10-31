import type { Position } from './api'

/** Avstånd i meter (haversine). */
export function distanceInMeters(a: Position, b: Position): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`
  return `${(meters / 1000).toFixed(1).replace('.0', '').replace('.', ',')} km`
}

export function sortByDistance<T extends Position>(items: T[], from: Position | null): T[] {
  if (!from) return items
  return [...items].sort((a, b) => distanceInMeters(from, a) - distanceInMeters(from, b))
}

export function withinRadius<T extends Position>(items: T[], from: Position, meters: number): T[] {
  return items.filter((item) => distanceInMeters(from, item) <= meters)
}

export function walkingDirectionsUrl(to: Position): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}&travelmode=walking`
}
