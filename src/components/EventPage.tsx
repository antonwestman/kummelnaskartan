import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { SCRIPT_URL } from '../config'
import { findEvent, type KummelnasEvent } from '../events'
import { useEntries } from '../hooks/useEntries'
import { useGeolocation } from '../hooks/useGeolocation'
import type { Entry } from '../lib/api'
import { formatDistance, sortByDistance, withinRadius } from '../lib/geo'
import { matchesQuery, sortByAddress } from '../lib/search'
import { trackEvent, type AnalyticsEvent } from '../lib/analytics'
import { useMyEntryRef } from '../lib/myEntry'
import { eventSeo } from '../seo'
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

const RADII = [300, 500, 1000] as const

const RADIUS_EVENTS: Record<(typeof RADII)[number], AnalyticsEvent> = {
  300: 'avstand-300m',
  500: 'avstand-500m',
  1000: 'avstand-1km',
}

function EventView({ event }: { event: KummelnasEvent }) {
  const configured = SCRIPT_URL !== ''

  useEffect(() => {
    const previous = document.title
    document.title = eventSeo(event).title
    return () => {
      document.title = previous
    }
  }, [event])
  const { state, reload, upsert, remove } = useEntries(event.id, configured)
  const [myRef, setMyRef] = useMyEntryRef(event.id)
  const [locating, setLocating] = useState(false)
  const [locateAttempt, setLocateAttempt] = useState(0)
  const geo = useGeolocation(locating, locateAttempt)
  const geoFailed = geo.status === 'error'
  const [radius, setRadius] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [selection, setSelection] = useState<Selection | null>(null)
  const mapRef = useRef<HTMLElement>(null)
  const signupRef = useRef<HTMLElement>(null)

  const entries = state.status === 'ready' ? state.entries : []
  const myEntry = myRef ? entries.find((e) => e.id === myRef.entryId) : undefined
  const userPosition = geo.status === 'on' ? geo.position : null
  // Radien gäller först när positionen är känd.
  const activeRadius = userPosition ? radius : null
  // Sökningen gäller både kartan och listan; avståndet bara listan (kartan visar cirkeln).
  const searchedEntries = entries.filter((entry) => matchesQuery(entry, query))
  const nearbyEntries =
    userPosition && activeRadius ? withinRadius(searchedEntries, userPosition, activeRadius) : searchedEntries
  const sortedEntries = userPosition ? sortByDistance(nearbyEntries, userPosition) : sortByAddress(nearbyEntries)

  // Nekad eller misslyckad position: visa "Alla" och en släckt knapp i stället för ett filter som inte gäller.
  const shownRadius = geoFailed ? null : radius
  const locateActive = locating && !geoFailed

  const startLocating = () => {
    setLocating(true)
    setLocateAttempt((n) => n + 1)
  }

  const chooseRadius = (value: (typeof RADII)[number] | null) => {
    if (value) trackEvent(RADIUS_EVENTS[value])
    setRadius(value)
    if (value && !locateActive) startLocating()
  }

  const toggleLocating = () => {
    if (locateActive) {
      setLocating(false)
      setRadius(null)
    } else {
      trackEvent('min-position')
      startLocating()
    }
  }

  // Räkna bara att någon söker, en gång per besök – aldrig vad de skriver.
  const searchTracked = useRef(false)
  const changeQuery = (value: string) => {
    if (!searchTracked.current && value.trim()) {
      searchTracked.current = true
      trackEvent('sok')
    }
    setQuery(value)
  }

  const showOnMap = (entry: Entry) => {
    setSelection({ id: entry.id, position: entry })
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToSignup = () => signupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="event-layout">
      <header className="topbar">
        <Link to="/" className="topbar-home">
          Kummelnäskartan
        </Link>
        <span className="topbar-event">{event.title}</span>
      </header>

      <section ref={mapRef} className="map-pane" aria-label="Karta">
        <EventMap
          entries={searchedEntries}
          myEntryId={myEntry?.id ?? null}
          userPosition={userPosition}
          locating={locating}
          radius={activeRadius}
          selection={selection}
        />
        <div className="radius" role="group" aria-label="Visa hus inom">
          {[null, ...RADII].map((value) => (
            <button
              key={value ?? 'all'}
              type="button"
              aria-pressed={shownRadius === value}
              onClick={() => chooseRadius(value)}
            >
              {value ? formatDistance(value) : 'Alla'}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`locate${locateActive ? ' active' : ''}`}
          onClick={toggleLocating}
          aria-pressed={locateActive}
          aria-label={locateActive ? 'Sluta visa min position' : 'Visa min position'}
          title="Min position"
        >
          <LocateIcon />
        </button>
        {geo.status === 'error' && <p className="map-message">{geo.message}</p>}
        {radius && geo.status === 'pending' && <p className="map-message">Letar efter din position…</p>}
      </section>

      <div className="side-pane">
        <section className="intro">
          <h1>{event.title}</h1>
          <p className="muted">{event.dateLabel}</p>
          <p>{event.summary}</p>
          {event.details.map((d) => (
            <p key={d} className="muted small">
              {d}
            </p>
          ))}
          {configured && state.status === 'ready' && !myEntry && (
            <button type="button" className="button primary" onClick={scrollToSignup}>
              Lägg till ditt hus
            </button>
          )}
        </section>

        {!configured ? (
          <p className="notice">
            Kartan är inte kopplad till något Google Sheet än. Sätt <code>SCRIPT_URL</code> i{' '}
            <code>src/config.ts</code> (se README).
          </p>
        ) : state.status === 'error' ? (
          <div className="notice" role="alert">
            <p>{state.message}</p>
            <button type="button" className="button" onClick={reload}>
              Försök igen
            </button>
          </div>
        ) : (
          <>
            <EntryList
              entries={sortedEntries}
              myEntryId={myEntry?.id ?? null}
              userPosition={userPosition}
              radius={activeRadius}
              query={query}
              onQueryChange={changeQuery}
              loading={state.status === 'loading'}
              onShow={showOnMap}
            />

            <section ref={signupRef} className="signup" aria-labelledby="signup-heading">
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
              />
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function LocateIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
    </svg>
  )
}
