import { displayAddress } from './address'

type Searchable = { address: string; name: string; note: string }

const collator = new Intl.Collator('sv', { numeric: true, sensitivity: 'base' })

/** Gata och husnummer i naturlig ordning: Kummelnäsvägen 4, 12, 12A, 20, sedan Ormdalsvägen … */
export function sortByAddress<T extends { address: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => collator.compare(displayAddress(a.address), displayAddress(b.address)))
}

/** Alla ord i sökningen måste finnas någonstans i adress, namn eller meddelande. */
export function matchesQuery(item: Searchable, query: string): boolean {
  const words = query.toLocaleLowerCase('sv').split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = `${item.address} ${item.name} ${item.note}`.toLocaleLowerCase('sv')
  return words.every((word) => haystack.includes(word))
}
