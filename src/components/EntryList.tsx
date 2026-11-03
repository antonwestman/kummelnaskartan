import type { Noun } from '../events'
import { displayAddress } from '../lib/address'
import type { Entry, Position } from '../lib/api'
import { formatEntryDates } from '../lib/dates'
import { formatHours } from '../lib/hours'
import { STATUS_LABEL, type ShownEntry } from '../lib/status'
import { distanceInMeters, formatDistance } from '../lib/geo'
import { capitalize, countLabel } from '../lib/text'

type Props = {
  /** Vad grannarna lägger in: hus, backe, loppis. */
  noun: Noun
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
  noun,
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
        {loading ? capitalize(noun.many) : countLabel(entries, noun)}
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
            ? `Inga ${noun.many} matchar sökningen.`
            : radius
              ? `Inga ${noun.many} så nära. Prova ett större avstånd.`
              : ended
                ? `Eventet är slut och ${noun.theMany} visas inte längre.`
                : `Inga ${noun.many} än.`}
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

/** Datum · namn · öppettider · meddelande, det som finns. */
export function EntryDetails({
  entry,
}: {
  entry: Pick<Entry, 'date' | 'dateTo' | 'name' | 'note' | 'openFrom' | 'openUntil'>
}) {
  const parts = [formatEntryDates(entry), entry.name, formatHours(entry), entry.note].filter(Boolean)
  return parts.length > 0 ? <span className="muted">{parts.join(' · ')}</span> : null
}
