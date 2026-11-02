/** Starkare där fler var med: 0.35 för den glesaste rutan, 0.85 för den tätaste. */
export function heatOpacity(count: number, maxCount: number): number {
  return maxCount <= 0 ? 0.35 : 0.35 + 0.5 * (count / maxCount)
}

/** Från mörkt orange (få) via orange till ljust gult (flest), som glöd. */
export function heatColor(count: number, maxCount: number): string {
  const share = maxCount <= 0 ? 0 : count / maxCount
  if (share > 0.75) return '#ffd27a'
  if (share > 0.4) return '#ff8a2a'
  return '#c4651c'
}

/** Meter per skärmpixel vid en viss zoomnivå och breddgrad (vanliga webbkartor). */
export function metersPerPixel(zoom: number, lat: number): number {
  return (40_075_016.686 * Math.cos((lat * Math.PI) / 180)) / 2 ** (zoom + 8)
}
