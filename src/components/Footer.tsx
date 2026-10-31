// Adressen sätts ihop här i stället för att stå i HTML:en, så att robotar som samlar
// e-postadresser ur färdig HTML (se scripts/prerender.ts) inte hittar den.
const CONTACT_USER = 'hej'
const CONTACT_DOMAIN = 'kummelnaskartan.se'

export function Footer() {
  const email = `${CONTACT_USER}@${CONTACT_DOMAIN}`
  return (
    <footer className="footer muted small">
      Frågor eller fel på kartan? <a href={`mailto:${email}`}>{email}</a>
    </footer>
  )
}
