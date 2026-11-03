import { CONTACT_EMAIL, HIDE_AFTER_DAYS } from '../config'

/** Kort om vad som sparas, vem som ser det, hur länge och vem man kontaktar. */
export function AboutData() {
  return (
    <details className="about">
      <summary>Om kartan och dina uppgifter</summary>
      <p>Kummelnäskartan görs av grannar för grannar, utan annonser och utan spårning.</p>
      <p>
        Adressen, namnet, meddelandet och tiderna du lägger in syns för alla som besöker sidan. Skriv bara det du vill
        visa. Uppgifterna sparas i ett Google Sheet som bara den som sköter kartan kommer åt.
      </p>
      <p>
        Du kan ändra eller ta bort det du har lagt in när du vill, från samma telefon eller med din ändringslänk. {HIDE_AFTER_DAYS}{' '}
        dagar efter att ett event har slutat, eller efter husets sista dag, visas det inte längre och raderas.
        Efteråt sparas bara hur många som var med och ungefär var, i rutor på 250 meter med minst tre hus. Inga
        adresser.
      </p>
      <p>
        Tips och rapporter går till den som sköter kartan och visas inte för andra. Lämnar du kontaktuppgifter används
        de bara för att svara dig.
      </p>
      <p>
        Kartbilderna kommer från OpenStreetMap och vädret från{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Open-Meteo
        </a>
        . De hämtas direkt av din webbläsare, så de tjänsterna ser din IP-adress men inget du skriver.
      </p>
      <p>Besöksstatistiken räknar bara sidvisningar. Den använder inga cookies och får aldrig det du skriver.</p>
      <p>
        Är något fel, eller har någon lagt in din adress utan att fråga? Tryck på det på kartan och välj
        Rapportera, eller mejla{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </details>
  )
}
