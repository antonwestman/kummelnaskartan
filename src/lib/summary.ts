import type { Summary } from './api'

type Cell = Summary['cells'][number]

/** Rutans hörn för kartan: [[syd, väst], [nord, öst]]. */
export function cellBounds(cell: Cell, size: Summary['cellSize']): [[number, number], [number, number]] {
  return [
    [cell.lat - size.lat / 2, cell.lng - size.lng / 2],
    [cell.lat + size.lat / 2, cell.lng + size.lng / 2],
  ]
}

/** Starkare färg där fler var med: 0.2 för den glesaste rutan, 0.7 för den tätaste. */
export function cellOpacity(count: number, maxCount: number): number {
  return maxCount <= 0 ? 0.2 : 0.2 + 0.5 * (count / maxCount)
}
