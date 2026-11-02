import { useState } from 'react'
import { Link } from 'react-router'
import { EVENTS, groupEvents, type KummelnasEvent } from '../events'
import { eventPath } from '../paths'

const dayAndMonth = (iso: string) => {
  const date = new Date(iso)
  const part = (options: Intl.DateTimeFormatOptions) =>
    date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm', ...options })
  return { day: part({ day: 'numeric' }), month: part({ month: 'short' }).replace('.', '') }
}

export function StartPage() {
  // Tiden läses en gång när sidan visas; det räcker för att dela upp eventen.
  const [now] = useState(() => Date.now())
  const { ongoing, upcoming, past } = groupEvents(EVENTS, now)

  return (
    <main className="start">
      <h1>Kummelnäskartan</h1>
      <p className="lead">
        Här kan vi grannar i Kummelnäs visa var det händer något. Delar du ut godis på Halloween, har loppis på
        uppfarten eller en pulkabacke på tomten? Sätt ut ditt hus på kartan.
      </p>

      {ongoing.length > 0 && <EventSection title="På gång" events={ongoing} ongoing />}
      {upcoming.length > 0 && <EventSection title="Kommande" events={upcoming} />}
      {past.length > 0 && <EventSection title="Tidigare event" events={past} past />}

      <p className="muted small">
        För Kummelnäs, Riset, Vikingshill, Eriksvik, Insjön, Kil och resten av Saltsjö-Boo. Det du lägger in syns för
        alla som besöker sidan.
      </p>
    </main>
  )
}

type SectionProps = {
  title: string
  events: KummelnasEvent[]
  /** Pågående event visar "Nu" i stället för startdatum. */
  ongoing?: boolean
  past?: boolean
}

function EventSection({ title, events, ongoing = false, past = false }: SectionProps) {
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
                  {ongoing ? (
                    <span className="event-now">Nu</span>
                  ) : (
                    <>
                      <span className="event-day">{day}</span>
                      <span className="event-month">{month}</span>
                    </>
                  )}
                </span>
                <span className="event-text">
                  <span className="event-title">{event.title}</span>
                  <span className="muted">{event.periodLabel}</span>
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
