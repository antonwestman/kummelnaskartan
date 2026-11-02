import { CONTACT_EMAIL } from '../config'
import { PLACE_CATEGORIES, type Place, type PlaceCategory } from '../events'
import type { Position } from '../lib/api'
import { distanceInMeters, formatDistance } from '../lib/geo'

type Props = {
  heading: string
  /** Används i ämnesraden när någon tipsar om en plats. */
  eventTitle: string
  /** Redan filtrerade och sorterade. */
  places: Place[]
  /** Antal platser i säsong innan filter, sökning och avstånd, för att kunna säga varför listan är tom. */
  total: number
  /** Kategorierna som finns bland platserna i säsong. Filtret visas när de är fler än en. */
  categories: PlaceCategory[]
  /** Vald kategori, eller null för alla. */
  category: PlaceCategory | null
  onCategoryChange: (category: PlaceCategory | null) => void
  userPosition: Position | null
  onShow: (place: Place) => void
}

/** Fasta platser som ingen äger, t.ex. lekplatser och allmänna pulkabackar. */
export function PlaceList({
  heading,
  eventTitle,
  places,
  total,
  categories,
  category,
  onCategoryChange,
  userPosition,
  onShow,
}: Props) {
  return (
    <section aria-labelledby="places-heading">
      <h2 id="places-heading" className="section-label">
        {heading}
      </h2>

      {categories.length > 1 && (
        <div className="filter" role="group" aria-label="Visa">
          {[null, ...categories].map((c) => (
            <button key={c ?? 'all'} type="button" aria-pressed={category === c} onClick={() => onCategoryChange(c)}>
              {c ? `${PLACE_CATEGORIES[c].icon} ${PLACE_CATEGORIES[c].plural}` : 'Alla'}
            </button>
          ))}
        </div>
      )}

      {total > 0 && places.length === 0 && <p className="muted">Inga {heading.toLocaleLowerCase('sv')} matchar.</p>}
      <ul className="entries">
        {places.map((place) => (
          <li key={place.id}>
            <button type="button" className="entry place" onClick={() => onShow(place)}>
              <span className="place-icon" aria-hidden>
                {PLACE_CATEGORIES[place.category].icon}
              </span>
              <span className="entry-text">
                <span className="entry-address">{place.name}</span>
                <span className="muted">
                  {[PLACE_CATEGORIES[place.category].label, place.note].filter(Boolean).join(' · ')}
                </span>
                {place.warning && <span className="place-warning">{place.warning}</span>}
              </span>
              {userPosition && (
                <span className="entry-distance">{formatDistance(distanceInMeters(userPosition, place))}</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <p className="muted small">
        Vet du en plats som borde vara med?{' '}
        <a href={tipLink(eventTitle)}>Tipsa på {CONTACT_EMAIL}</a>
      </p>
    </section>
  )
}

/** Mejl med ämne och en mall att fylla i. Den som sköter kartan lägger in platsen i src/events.ts. */
function tipLink(eventTitle: string): string {
  const subject = `Tips till ${eventTitle}`
  const body = 'Vad är det?\n\nVar ligger det? (adress, eller högerklicka i Google Maps och kopiera koordinaterna)\n\nNågot mer som är bra att veta?\n'
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
