import { useState } from 'react'
import { Link } from 'react-router'
import { SCRIPT_URL } from '../config'
import { EVENTS, groupEvents, type KummelnasEvent } from '../events'
import { useNow } from '../hooks/useNow'
import { useOverview } from '../hooks/useOverview'
import { stockholmDate } from '../lib/dates'
import { stockholmMinutes } from '../lib/hours'
import { todayOnMap, uniquePlaces, type TodayOnMap } from '../lib/overview'
import { stockholmMonth } from '../lib/season'
import { countLabel } from '../lib/text'
import { eventPath } from '../paths'
import { AboutData } from './AboutData'
import { EventMap, type PopupLink } from './EventMap'

const dayAndMonth = (iso: string) => {
  const date = new Date(iso)
  const part = (options: Intl.DateTimeFormatOptions) =>
    date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm', ...options })
  return { day: part({ day: 'numeric' }), month: part({ month: 'short' }).replace('.', '') }
}

const todayLabel = (now: number) =>
  new Date(now)
    .toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/\./g, '')

/**
 * Startsidan: en karta med allt som händer idag (hus som lyser i pågående event och platser i säsong),
 * filter per event, och listan med pågående, kommande och tidigare event.
 */
export function StartPage() {
  const now = useNow(60_000)
  const configured = SCRIPT_URL !== ''
  const overviewState = useOverview(configured)
  const overview = overviewState.status === 'ready' ? overviewState.overview : null
  const [filter, setFilter] = useState<string | null>(null)

  const { ongoing, upcoming, past } = groupEvents(EVENTS, now)
  const today = { date: stockholmDate(now), minutes: stockholmMinutes(now) }
  const onMap = todayOnMap(ongoing, overview?.entries ?? {}, today, stockholmMonth(now))
  const withSomething = onMap.filter((item) => item.lit.length > 0 || item.places.length > 0)
  const shown = withSomething.filter((item) => filter === null || item.event.id === filter)

  const entries = shown.flatMap((item) => item.lit)
  const places = uniquePlaces(shown.flatMap((item) => item.places))
  // Vilket event ett hus eller en plats hör till, för länken i popupen. Första eventet vinner för delade platser.
  const linkFor = (kind: 'entry' | 'place', id: string): PopupLink | null => {
    const item = shown.find((i) => (kind === 'entry' ? i.lit : i.places).some((x) => x.id === id))
    return item ? { label: `${item.event.title} ›`, to: eventPath(item.event.id) } : null
  }

  return (
    <div className="event-layout start-layout">
      <header className="topbar">
        <h1 className="topbar-home">Kummelnäskartan</h1>
        <span className="topbar-today">Idag i Kummelnäs · {todayLabel(now)}</span>
      </header>

      <section className="map-pane" aria-label="Karta över det som händer idag">
        <EventMap
          entries={entries}
          places={places.length > 0 ? { heading: '', tipName: '', items: places } : null}
          houseLabel={null}
          summary={null}
          loaded={!configured || overviewState.status !== 'loading'}
          myEntryId={null}
          userPosition={null}
          locating={false}
          radius={null}
          selection={null}
          onReport={null}
          linkFor={linkFor}
        />
      </section>

      <div className="side-pane">
        <section className="intro">
          <p>Grannarnas karta över det som händer i Kummelnäs och runt omkring.</p>
          {withSomething.length > 1 && (
            <div className="filter" role="group" aria-label="Visa på kartan">
              <button type="button" aria-pressed={filter === null} onClick={() => setFilter(null)}>
                Alla
              </button>
              {withSomething.map((item) => (
                <button
                  key={item.event.id}
                  type="button"
                  aria-pressed={filter === item.event.id}
                  onClick={() => setFilter(item.event.id)}
                >
                  <span className="chip-icon" aria-hidden>
                    {item.event.icon}
                  </span>{' '}
                  {item.event.title} ({item.lit.length + item.places.length})
                </button>
              ))}
            </div>
          )}
          {overviewState.status === 'error' && <p className="muted small">{overviewState.message}</p>}
        </section>

        {ongoing.length > 0 && (
          <EventSection title="På gång" events={ongoing} detail={(e) => ongoingDetail(onMap, e, overview !== null)} now />
        )}
        {upcoming.length > 0 && <EventSection title="Kommande" events={upcoming} detail={(e) => e.periodLabel} />}
        {past.length > 0 && (
          <EventSection
            title="Tidigare event"
            events={past}
            past
            detail={(e) => {
              const households = overview?.households[e.id]
              return households ? `${e.periodLabel} · ${households} hushåll var med` : e.periodLabel
            }}
          />
        )}

        <p className="muted small">
          För Kummelnäs, Riset, Vikingshill, Eriksvik, Insjön, Kil och resten av Saltsjö-Boo. Det du lägger in syns för
          alla som besöker sidan.
        </p>
        <AboutData />
      </div>
    </div>
  )
}

/** "2 loppisar idag, 3 senare", "14 platser", eller tiden innan husen har hämtats. */
function ongoingDetail(onMap: TodayOnMap[], event: KummelnasEvent, loaded: boolean): string {
  const item = onMap.find((i) => i.event.id === event.id)
  if (!item) return event.periodLabel
  const parts: string[] = []
  if (event.signup && loaded) {
    const counted = countLabel(item.lit, event.signup.noun)
    parts.push(item.laterCount > 0 ? `${counted} idag, ${item.laterCount} senare` : `${counted} idag`)
  }
  if (item.places.length > 0) parts.push(`${item.places.length} ${item.places.length === 1 ? 'plats' : 'platser'}`)
  return parts.length > 0 ? parts.join(' · ') : event.periodLabel
}

type SectionProps = {
  title: string
  events: KummelnasEvent[]
  detail: (event: KummelnasEvent) => string
  /** Pågående event visar "Nu" i stället för startdatum. */
  now?: boolean
  past?: boolean
}

function EventSection({ title, events, detail, now = false, past = false }: SectionProps) {
  return (
    <section>
      <h2 className="section-label">{title}</h2>
      <ul className="events">
        {events.map((event) => {
          const { day, month } = dayAndMonth(event.startsAt)
          return (
            <li key={event.id}>
              <Link to={eventPath(event.id)} className={`event-row${past ? ' past' : ''}`}>
                <span className="event-date" aria-hidden>
                  {now ? (
                    <span className="event-icon">{event.icon}</span>
                  ) : (
                    <>
                      <span className="event-day">{day}</span>
                      <span className="event-month">{month}</span>
                    </>
                  )}
                </span>
                <span className="event-text">
                  <span className="event-title">{event.title}</span>
                  <span className="muted">{detail(event)}</span>
                </span>
                <span className="chevron" aria-hidden>
                  ›
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
