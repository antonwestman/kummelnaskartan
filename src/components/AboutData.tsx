import { CONTACT_EMAIL, HIDE_AFTER_DAYS } from '../config'

/** Kort om vad som sparas, vem som ser det, hur länge och vem man kontaktar. */
export function AboutData() {
  return (
    <details className="about">
      <summary>Om kartan och dina uppgifter</summary>
      <p>Kummelnäskartan görs av grannar för grannar, utan reklam och utan cookies.</p>
      <p>
        Adressen, namnet, meddelandet och tiderna du lägger in syns för alla som besöker sidan. Skriv bara det du vill
        visa. Uppgifterna sparas i ett Google Sheet som bara den som sköter kartan kommer åt.
      </p>
      <p>
        Du kan ändra eller ta bort ditt hus när du vill, från samma telefon eller med din ändringslänk. {HIDE_AFTER_DAYS}{' '}
        dagar efter att ett event har slutat, eller efter husets sista dag, visas husen inte längre och raderas.
        Efteråt sparas bara hur många som var med och ungefär var, i rutor på 250 meter med minst tre hus. Inga
        adresser.
      </p>
      <p>Besöksstatistiken räknar bara sidvisningar. Den använder inga cookies och får aldrig det du skriver.</p>
      <p>
        Frågor, eller har någon lagt in ditt hus utan att fråga? Mejla{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </details>
  )
}
