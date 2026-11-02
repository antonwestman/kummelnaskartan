import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { SCRIPT_URL } from '../config'
import { findEvent, hasEnded, type KummelnasEvent, type Place } from '../events'
import { useEntries } from '../hooks/useEntries'
import { useGeolocation } from '../hooks/useGeolocation'
import type { Entry } from '../lib/api'
import { formatDistance, sortByDistance, withinRadius } from '../lib/geo'
import { matchesQuery, sortByAddress } from '../lib/search'
import { trackEvent, type AnalyticsEvent } from '../lib/analytics'
import { useMyEntryRef } from '../lib/myEntry'
import { useNow } from '../hooks/useNow'
import { stockholmDate } from '../lib/dates'
import { stockholmMinutes } from '../lib/hours'
import { sortForDisplay, withStatus } from '../lib/status'
import { eventSeo } from '../seo'
import { AboutData } from './AboutData'
import { EntryList } from './EntryList'
import { EventMap, type Selection } from './EventMap'
import { entryMarkerId, placeMarkerId } from './markerIcon'
import { MySignup } from './MySignup'
import { NotFound } from './NotFound'
import { PlaceList } from './PlaceList'

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

  const now = useNow(60_000)
  const rawEntries = state.status === 'ready' ? state.entries : []
  const today = { date: stockholmDate(now), minutes: stockholmMinutes(now) }
  // Status (tänd/släckt/stängd/kommande/har varit) räknas fram vid varje render – inget sparas.
  const allEntries = withStatus(rawEntries, today)
  // Ditt eget hus hittas även när dagen har varit, så att du kan ändra datum i stället för att lägga in det igen.
  const myEntry = myRef ? allEntries.find((e) => e.id === myRef.entryId) : undefined
  const entries = allEntries.filter((e) => e.status !== 'past')
  const userPosition = geo.status === 'on' ? geo.position : null
  // Radien gäller först när positionen är känd.
  const activeRadius = userPosition ? radius : null
  // Sökningen gäller både kartan och listan; avståndet bara listan (kartan visar cirkeln).
  const searchedEntries = entries.filter((entry) => matchesQuery(entry, query))
  const nearbyEntries =
    userPosition && activeRadius ? withinRadius(searchedEntries, userPosition, activeRadius) : searchedEntries
  const ordered = userPosition ? sortByDistance(nearbyEntries, userPosition) : sortByAddress(nearbyEntries)
  const sortedEntries = sortForDisplay(ordered)

  // Fasta platser filtreras och sorteras på samma sätt som husen.
  const allPlaces = event.places?.items ?? []
  const searchedPlaces = allPlaces.filter((place) =>
    matchesQuery({ address: '', name: place.name, note: place.note ?? '' }, query),
  )
  const nearbyPlaces =
    userPosition && activeRadius ? withinRadius(searchedPlaces, userPosition, activeRadius) : searchedPlaces
  const sortedPlaces = userPosition ? sortByDistance(nearbyPlaces, userPosition) : sortByName(nearbyPlaces)

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

  const showOnMap = (selection: Selection) => {
    setSelection(selection)
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const showEntry = (entry: Entry) => showOnMap({ markerId: entryMarkerId(entry.id), position: entry })
  const showPlace = (place: Place) => showOnMap({ markerId: placeMarkerId(place.id), position: place })

  const signupSection = (
    <section ref={signupRef} className="signup" aria-labelledby="signup-heading">
      <MySignup
        event={event}
        myRef={myRef}
        myEntry={myEntry}
        today={today.date}
        signup={state.status === 'ready' ? state.signup : null}
        onSaved={(entry, token) => {
          upsert(entry)
          setMyRef({ token, entryId: entry.id })
          setSelection({ markerId: entryMarkerId(entry.id), position: entry })
        }}
        onDeleted={(id) => {
          remove(id)
          setMyRef(null)
        }}
      />
    </section>
  )

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
          places={event.places && { ...event.places, items: searchedPlaces }}
          loaded={!configured || state.status !== 'loading'}
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
          <p className="muted">{event.periodLabel}</p>
          <p>{event.summary}</p>
          {event.details.map((d) => (
            <p key={d} className="muted small">
              {d}
            </p>
          ))}
          {event.places && allPlaces.length > 0 && (
            <ul className="legend">
              <li>
                <span className="legend-pin pin-place" aria-hidden />
                {event.places.label}
              </li>
              <li>
                <span className="legend-pin" aria-hidden />
                {event.places.entryLabel}
              </li>
            </ul>
          )}
          {configured && state.status === 'ready' && state.signup.status === 'open' && !myEntry && (
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
            {/* Har man redan ett hus ligger "Ditt hus" överst, så att Släck/Ändra inte hamnar under en lång lista. */}
            {myEntry && signupSection}
            <EntryList
              entries={sortedEntries}
              myEntryId={myEntry?.id ?? null}
              userPosition={userPosition}
              radius={activeRadius}
              query={query}
              onQueryChange={changeQuery}
              loading={state.status === 'loading'}
              ended={hasEnded(event, now)}
              onShow={showEntry}
            />
          </>
        )}

        {event.places && (
          <PlaceList
            heading={event.places.heading}
            places={sortedPlaces}
            total={allPlaces.length}
            userPosition={userPosition}
            onShow={showPlace}
          />
        )}

        {configured && state.status !== 'error' && !myEntry && signupSection}

        <AboutData />
      </div>
    </div>
  )
}

const sortByName = (places: Place[]) => [...places].sort((a, b) => a.name.localeCompare(b.name, 'sv'))

function LocateIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
    </svg>
  )
}
