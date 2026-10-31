import { displayAddress } from '../lib/address'
import type { Entry, Position } from '../lib/api'
import { formatHours } from '../lib/hours'
import { STATUS_LABEL, type ShownEntry } from '../lib/status'
import { distanceInMeters, formatDistance } from '../lib/geo'

type Props = {
  entries: ShownEntry[]
  myEntryId: string | null
  userPosition: Position | null
  radius: number | null
  query: string
  onQueryChange: (query: string) => void
  loading: boolean
  onShow: (entry: ShownEntry) => void
}

export function EntryList({ entries, myEntryId, userPosition, radius, query, onQueryChange, loading, onShow }: Props) {
  return (
    <section aria-labelledby="list-heading">
      <h2 id="list-heading" className="section-label">
        {loading ? 'Hus' : `${entries.filter((e) => e.status === 'open').length} hus`}
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
            <button type="button" className={`entry${entry.status !== 'open' ? ' off' : ''}`} onClick={() => onShow(entry)}>
              <span className="entry-text">
                <span className="entry-address">
                  {displayAddress(entry.address)}
                  {entry.id === myEntryId && <span className="muted"> (du)</span>}
                  {entry.status !== 'open' && <span className="muted"> · {STATUS_LABEL[entry.status]}</span>}
                </span>
                <EntryDetails entry={entry} />
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

/** Namn · öppettider · meddelande, det som finns. */
export function EntryDetails({ entry }: { entry: Pick<Entry, 'name' | 'note' | 'openFrom' | 'openUntil'> }) {
  const parts = [entry.name, formatHours(entry), entry.note].filter(Boolean)
  return parts.length > 0 ? <span className="muted">{parts.join(' · ')}</span> : null
}
