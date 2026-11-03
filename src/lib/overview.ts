import type { KummelnasEvent, Place } from '../events'
import type { Entry } from './api'
import { isInSeason } from './season'
import { withStatus, type ShownEntry, type Today } from './status'

/** Det ett pågående event har på startsidans karta idag. */
export type TodayOnMap = {
  event: KummelnasEvent
  /** Hus som lyser just nu. Släckta, stängda, kommande och passerade visas bara på eventets egen sida. */
  lit: ShownEntry[]
  /** Hus med datum som inte har kommit än, för "2 idag, 3 senare". */
  laterCount: number
  /** Fasta platser i säsong. */
  places: Place[]
}

/** Vad varje pågående event visar på startsidan idag. */
export function todayOnMap(
  ongoing: KummelnasEvent[],
  entriesByEvent: Record<string, Entry[]>,
  today: Today,
  month: number,
): TodayOnMap[] {
  return ongoing.map((event) => {
    const shown = event.signup ? withStatus(entriesByEvent[event.id] ?? [], today) : []
    return {
      event,
      lit: shown.filter((entry) => entry.status === 'open'),
      laterCount: shown.filter((entry) => entry.status === 'later').length,
      places: (event.places?.items ?? []).filter((place) => isInSeason(place.season, month)),
    }
  })
}

/** Samma plats kan finnas i flera event (pulkabackar finns också i Ute i Kummelnäs): visa den en gång. */
export function uniquePlaces(places: Place[]): Place[] {
  const seen = new Set<string>()
  return places.filter((place) => (seen.has(place.id) ? false : (seen.add(place.id), true)))
}
