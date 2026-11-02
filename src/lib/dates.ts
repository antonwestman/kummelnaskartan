/** Dagens datum i Sverige som "YYYY-MM-DD". */
export function stockholmDate(now: number): string {
  // sv-SE skriver datum som 2026-11-14.
  return new Date(now).toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' })
}

/** När huset är öppet: '' (tills vidare), "lör 14 nov" eller "lör 14 nov – sön 15 nov". */
export function formatEntryDates({ date, dateTo }: { date: string; dateTo: string }): string {
  if (!date) return ''
  return dateTo && dateTo !== date ? `${formatEntryDate(date)} – ${formatEntryDate(dateTo)}` : formatEntryDate(date)
}

/** "2026-11-14" → "lör 14 nov" */
export function formatEntryDate(date: string): string {
  // Mitt på dagen i UTC, så att datumet blir samma i svensk tid.
  return new Date(`${date}T12:00:00Z`)
    .toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/\./g, '')
}
