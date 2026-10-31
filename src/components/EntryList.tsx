import type { Entry, Position } from '../lib/api'
import { distanceInMeters, formatDistance } from '../lib/geo'

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
      <h2 id="list-heading" className="section-label">
        {loading ? 'Hus' : `${entries.length} hus`}
        {userPosition && ' · närmast först'}
      </h2>
      {!loading && entries.length === 0 && <p className="muted">Inga hus än.</p>}
      <ul className="entries">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button type="button" className="entry" onClick={() => onShow(entry)}>
              <span className="entry-text">
                <span className="entry-address">
                  {entry.address}
                  {entry.id === myEntryId && <span className="muted"> (du)</span>}
                </span>
                {(entry.name || entry.note) && (
                  <span className="muted">{[entry.name, entry.note].filter(Boolean).join(' · ')}</span>
                )}
              </span>
              {userPosition && (
                <span className="entry-distance">{formatDistance(distanceInMeters(userPosition, entry))}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
