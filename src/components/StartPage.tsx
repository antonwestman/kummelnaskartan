import { Link } from 'react-router'
import { EVENTS, sortEvents } from '../events'
import { eventPath } from '../paths'
import { Footer } from './Footer'

const today = () => new Date().toLocaleDateString('sv-SE')

const dayAndMonth = (isoDate: string) => {
  const date = new Date(`${isoDate}T12:00:00`)
  return {
    day: date.getDate(),
    month: date.toLocaleDateString('sv-SE', { month: 'short' }).replace('.', ''),
  }
}

export function StartPage() {
  const events = sortEvents(EVENTS, today())

  return (
    <main className="start">
      <h1>Kummelnäskartan</h1>
      <p className="lead">
        Här kan vi grannar i Kummelnäs visa var det händer något. Delar du ut godis på Halloween eller har loppis på
        uppfarten? Sätt ut ditt hus på kartan.
      </p>

      <h2 className="section-label">På gång</h2>
      <ul className="events">
        {events.map((event) => {
          const { day, month } = dayAndMonth(event.date)
          return (
            <li key={event.id}>
              <Link to={eventPath(event.id)} className={`event-row${event.date < today() ? ' past' : ''}`}>
                <span className="event-date" aria-hidden>
                  <span className="event-day">{day}</span>
                  <span className="event-month">{month}</span>
                </span>
                <span className="event-text">
                  <span className="event-title">{event.title}</span>
                  <span className="muted">{event.dateLabel}</span>
                </span>
                <span className="chevron" aria-hidden>
                  ›
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      <p className="muted small">
        För Kummelnäs, Riset, Vikingshill, Eriksvik, Insjön, Kil och resten av Saltsjö-Boo. Det du lägger in syns för
        alla som besöker sidan.
      </p>
      <Footer />
    </main>
  )
}
