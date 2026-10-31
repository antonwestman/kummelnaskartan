import { Link } from 'react-router'
import { EVENTS, sortEvents } from '../events'

const today = () => new Date().toLocaleDateString('sv-SE')

export function StartPage() {
  const events = sortEvents(EVENTS, today())

  return (
    <main className="page narrow">
      <header className="hero">
        <p className="eyebrow">Kummelnäs, Nacka</p>
        <h1>Kummelnäskartan</h1>
        <p className="lead">
          En gemensam karta för grannaktiviteter i Kummelnäs. Det kan vara Halloween, promenadloppisar eller annat
          där man går runt i området.
        </p>
        <p>
          Ska du vara med på ett event? Lägg in din adress, så ser andra var de kan gå. Det behövs inget konto.
        </p>
      </header>

      <section aria-labelledby="events-heading">
        <h2 id="events-heading">Event</h2>
        <ul className="event-list">
          {events.map((event) => {
            const isPast = event.date < today()
            return (
              <li key={event.id}>
                <Link to={`/e/${event.id}`} className={`event-card${isPast ? ' past' : ''}`}>
                  <span className="event-emoji" aria-hidden>
                    {event.emoji}
                  </span>
                  <span className="event-card-body">
                    <span className="event-date">
                      {event.dateLabel}
                      {isPast && ' · har varit'}
                    </span>
                    <span className="event-title">{event.title}</span>
                    <span className="event-summary">{event.summary}</span>
                    <span className="event-cta">Öppna kartan →</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="how">
        <h2>Så funkar det</h2>
        <ol>
          <li>Öppna kartan för eventet.</li>
          <li>Fyll i din adress under "Anmäl ditt hus". Huset dyker upp på kartan.</li>
          <li>Ändra eller ta bort anmälan när du vill, från samma telefon eller via din ändringslänk.</li>
        </ol>
        <p className="muted">Adresserna syns för alla som besöker kartan. Lägg bara in en adress du vill dela.</p>
      </section>
    </main>
  )
}
