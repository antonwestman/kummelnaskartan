import type { Place } from '../events'
import type { Position } from '../lib/api'
import { distanceInMeters, formatDistance } from '../lib/geo'

type Props = {
  heading: string
  /** Redan filtrerade och sorterade. */
  places: Place[]
  /** Antal platser innan sökning och avstånd, för att kunna säga varför listan är tom. */
  total: number
  userPosition: Position | null
  onShow: (place: Place) => void
}

/** Fasta platser som ingen äger, t.ex. allmänna pulkabackar. */
export function PlaceList({ heading, places, total, userPosition, onShow }: Props) {
  if (total === 0) return null
  return (
    <section aria-labelledby="places-heading">
      <h2 id="places-heading" className="section-label">
        {heading}
      </h2>
      {places.length === 0 && <p className="muted">Inga {heading.toLocaleLowerCase('sv')} matchar.</p>}
      <ul className="entries">
        {places.map((place) => (
          <li key={place.id}>
            <button type="button" className="entry place" onClick={() => onShow(place)}>
              <span className="entry-text">
                <span className="entry-address">{place.name}</span>
                {place.note && <span className="muted">{place.note}</span>}
              </span>
              {userPosition && (
                <span className="entry-distance">{formatDistance(distanceInMeters(userPosition, place))}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
