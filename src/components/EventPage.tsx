import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { SCRIPT_URL } from '../config'
import { findEvent, type KummelnasEvent } from '../events'
import { useEntries } from '../hooks/useEntries'
import { useGeolocation } from '../hooks/useGeolocation'
import type { Entry } from '../lib/api'
import { sortByDistance } from '../lib/geo'
import { useMyEntryRef } from '../lib/myEntry'
import { EntryList } from './EntryList'
import { EventMap, type Selection } from './EventMap'
import { MySignup } from './MySignup'
import { NotFound } from './NotFound'

export function EventPage() {
  const { eventId = '' } = useParams()
  const event = findEvent(eventId)
  if (!event) return <NotFound />
  return <EventView key={event.id} event={event} />
}

function EventView({ event }: { event: KummelnasEvent }) {
  const configured = SCRIPT_URL !== ''
  const { state, reload, upsert, remove } = useEntries(event.id, configured)
  const [myRef, setMyRef] = useMyEntryRef(event.id)
  const [locating, setLocating] = useState(false)
  const geo = useGeolocation(locating)
  const [selection, setSelection] = useState<Selection | null>(null)
  const mapRef = useRef<HTMLElement>(null)
  const signupRef = useRef<HTMLElement>(null)

  const entries = state.status === 'ready' ? state.entries : []
  const myEntry = myRef ? entries.find((e) => e.id === myRef.entryId) : undefined
  const userPosition = geo.status === 'on' ? geo.position : null
  const sortedEntries = sortByDistance(entries, userPosition)

  const showOnMap = (entry: Entry) => {
    setSelection({ id: entry.id, position: entry })
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="event-layout">
      <header className="topbar">
        <Link to="/" className="topbar-back" aria-label="Till startsidan">
          ←
        </Link>
        <div className="topbar-title">
          <span className="topbar-event">
            {event.emoji} {event.title}
          </span>
          <span className="topbar-date">{event.dateLabel}</span>
        </div>
      </header>

      <section ref={mapRef} className="map-pane" aria-label="Karta">
        <EventMap
          entries={entries}
          emoji={event.emoji}
          myEntryId={myEntry?.id ?? null}
          userPosition={userPosition}
          locating={locating}
          selection={selection}
        />
        <div className="map-overlay">
          <button
            type="button"
            className={`map-button${locating ? ' active' : ''}`}
            onClick={() => setLocating((on) => !on)}
            aria-pressed={locating}
          >
            {locating ? '◉ Följer dig' : '◎ Min position'}
          </button>
          {state.status === 'loading' && configured && <span className="map-chip">Laddar…</span>}
        </div>
        {geo.status === 'error' && <p className="map-message">{geo.message}</p>}
      </section>

      <div className="side-pane">
        <section className="intro">
          <p className="lead">{event.summary}</p>
          <details>
            <summary>Bra att veta</summary>
            <ul>
              {event.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </details>
        </section>

        {!configured ? (
          <p className="notice">
            Kartan är inte kopplad till något Google Sheet än. Sätt <code>SCRIPT_URL</code> i{' '}
            <code>src/config.ts</code> (se README).
          </p>
        ) : state.status === 'error' ? (
          <div className="notice error" role="alert">
            <p>{state.message}</p>
            <button type="button" className="button secondary" onClick={reload}>
              Försök igen
            </button>
          </div>
        ) : (
          <>
            <section ref={signupRef} className="card" aria-labelledby="signup-heading">
              <MySignup
                event={event}
                myRef={myRef}
                myEntry={myEntry}
                entriesLoaded={state.status === 'ready'}
                onSaved={(entry, token) => {
                  upsert(entry)
                  setMyRef({ token, entryId: entry.id })
                  setSelection({ id: entry.id, position: entry })
                }}
                onDeleted={(id) => {
                  remove(id)
                  setMyRef(null)
                }}
                onForget={() => setMyRef(null)}
              />
            </section>

            <EntryList
              entries={sortedEntries}
              myEntryId={myEntry?.id ?? null}
              userPosition={userPosition}
              loading={state.status === 'loading'}
              onShow={showOnMap}
            />
          </>
        )}
      </div>

      {configured && state.status === 'ready' && !myEntry && (
        <button
          type="button"
          className="fab"
          onClick={() => signupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          {event.emoji} Anmäl ditt hus
        </button>
      )}
    </div>
  )
}
