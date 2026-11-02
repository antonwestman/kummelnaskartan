import type { Season } from '../events'

/** Juni–augusti för sommar, december–mars för vinter, räknat i svensk tid. */
const SEASON_MONTHS: Record<Season, number[]> = {
  summer: [6, 7, 8],
  winter: [12, 1, 2, 3],
}

export function stockholmMonth(now: number): number {
  return Number(new Date(now).toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm', month: 'numeric' }))
}

/** Utan säsong gäller platsen året runt. */
export function isInSeason(season: Season | undefined, month: number): boolean {
  return season === undefined || SEASON_MONTHS[season].includes(month)
}
