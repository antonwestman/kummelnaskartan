import type { Noun } from '../events'
import type { ShownEntry } from './status'

/** "din backe" → "Din backe" */
export const capitalize = (text: string) => text.replace(/^./, (c) => c.toUpperCase())

/** "3 backar", eller "1 loppis idag, 4 senare" när det finns kommande (hus med egna datum). */
export function countLabel(entries: ShownEntry[], noun: Noun): string {
  const open = entries.filter((e) => e.status === 'open').length
  const later = entries.filter((e) => e.status === 'later').length
  const counted = `${open} ${open === 1 ? noun.one : noun.many}`
  return later > 0 ? `${counted} idag, ${later} senare` : counted
}
