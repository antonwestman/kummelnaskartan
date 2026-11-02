import { displayAddress } from '../lib/address'
import type { Entry, Position } from '../lib/api'
import { formatEntryDate } from '../lib/dates'
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
  /** Eventet är slut: en tom lista betyder då att husen inte visas längre, inte att ingen är med. */
  ended: boolean
  onShow: (entry: ShownEntry) => void
}

export function EntryList({
  entries,
  myEntryId,
  userPosition,
  radius,
  query,
  onQueryChange,
  loading,
  ended,
  onShow,
}: Props) {
  return (
    <section aria-labelledby="list-heading">
      <h2 id="list-heading" className="section-label">
        {loading ? 'Hus' : countLabel(entries)}
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
              : ended
                ? 'Eventet är slut och husen visas inte längre.'
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
                  {STATUS_LABEL[entry.status] && <span className="muted"> · {STATUS_LABEL[entry.status]}</span>}
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

/** "3 hus", eller "1 hus idag, 4 senare" när det finns kommande hus (event där varje hus har eget datum). */
function countLabel(entries: ShownEntry[]): string {
  const open = entries.filter((e) => e.status === 'open').length
  const later = entries.filter((e) => e.status === 'later').length
  return later > 0 ? `${open} hus idag, ${later} senare` : `${open} hus`
}

/** Datum · namn · öppettider · meddelande, det som finns. */
export function EntryDetails({ entry }: { entry: Pick<Entry, 'date' | 'name' | 'note' | 'openFrom' | 'openUntil'> }) {
  const parts = [entry.date && formatEntryDate(entry.date), entry.name, formatHours(entry), entry.note].filter(Boolean)
  return parts.length > 0 ? <span className="muted">{parts.join(' · ')}</span> : null
}
