import type { Entry, Position } from '../lib/api'
import { distanceInMeters, formatDistance, walkingDirectionsUrl } from '../lib/geo'

type Props = {
  entries: Entry[]
  myEntryId: string | null
  userPosition: Position | null
  loading: boolean
  onShow: (entry: Entry) => void
}

export function EntryList({ entries, myEntryId, userPosition, loading, onShow }: Props) {
  return (
    <section aria-labelledby="list-heading">
      <h2 id="list-heading">
        {loading ? 'Hus på kartan' : `${entries.length} hus på kartan`}
      </h2>
      {userPosition && <p className="muted">Sorterat efter avstånd från dig.</p>}
      {!loading && entries.length === 0 && <p className="muted">Inga anmälningar än. Bli först!</p>}
      <ul className="entry-list">
        {entries.map((entry) => (
          <li key={entry.id} className={`entry${entry.id === myEntryId ? ' mine' : ''}`}>
            <div className="entry-main">
              <span className="entry-address">
                {entry.address}
                {entry.id === myEntryId && <span className="badge">Du</span>}
              </span>
              {entry.name && <span className="entry-name">{entry.name}</span>}
              {entry.note && <span className="entry-note">{entry.note}</span>}
            </div>
            {userPosition && (
              <span className="entry-distance">{formatDistance(distanceInMeters(userPosition, entry))}</span>
            )}
            <div className="entry-actions">
              <button type="button" className="button secondary small" onClick={() => onShow(entry)}>
                Visa på kartan
              </button>
              <a className="button secondary small" href={walkingDirectionsUrl(entry)} target="_blank" rel="noreferrer">
                Gå hit
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
