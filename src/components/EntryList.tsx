import type { Entry, Position } from '../lib/api'
import { distanceInMeters, formatDistance } from '../lib/geo'

type Props = {
  entries: Entry[]
  myEntryId: string | null
  userPosition: Position | null
  radius: number | null
  query: string
  onQueryChange: (query: string) => void
  loading: boolean
  onShow: (entry: Entry) => void
}

export function EntryList({ entries, myEntryId, userPosition, radius, query, onQueryChange, loading, onShow }: Props) {
  return (
    <section aria-labelledby="list-heading">
      <h2 id="list-heading" className="section-label">
        {loading ? 'Hus' : `${entries.length} hus`}
        {radius ? ` inom ${formatDistance(radius)}` : userPosition && ' · närmast först'}
      </h2>
      <input
        type="search"
        className="search"
        placeholder="Sök adress eller namn"
        aria-label="Sök adress eller namn"
        autoComplete="off"
        enterKeyHint="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      {!loading && entries.length === 0 && (
        <p className="muted">
          {query.trim()
            ? 'Inga hus matchar sökningen.'
            : radius
              ? 'Inga hus så nära. Prova ett större avstånd.'
              : 'Inga hus än.'}
        </p>
      )}
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
