/**
 * URL till Google Apps Script-webbappen (slutar på /exec).
 * Se README.md för hur du skapar den. Tom sträng = kartan visar en
 * "inte kopplad ännu"-ruta i stället för att hämta data.
 */
export const SCRIPT_URL: string =
  'https://script.google.com/macros/s/AKfycbzi5c1lEs0p7SBQbi_SxveU51Gtk8gX6_LxD-6qD3mVj2kIL40WC52b6DeW-LoipAau/exec'

/** Mittpunkt för kartan när inga anmälningar finns. */
export const KUMMELNAS_CENTER = { lat: 59.3545, lng: 18.2685 } as const

/**
 * Området kartan handlar om. Utanför det ligger en mörk dimma över kartan, så att Kummelnäs syns tydligt.
 * Hus och platser utanför syns ändå (Code.gs tar emot adresser i hela Boo), bara bakgrunden mörknar.
 * En cirkel är en förenkling: justera mitt och radie tills den täcker det ni räknar som Kummelnäs.
 */
export const FOCUS_AREA = { center: KUMMELNAS_CENTER, radiusMeters: 2500 } as const

/**
 * Hur långt bort man kan panorera och zooma ut: en ruta med sidan 2 × diametern runt fokusområdet,
 * alltså ungefär dubbla radien åt varje håll. Kartan går inte att dra eller zooma ut förbi den.
 */
export const PAN_LIMIT_FACTOR = 2

/**
 * OpenStreetMaps vanliga kartbilder (kräver ingen API-nyckel).
 * De görs mörka med ett CSS-filter, se `.leaflet-tile-pane` i index.css.
 */
export const MAP_TILES = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
} as const

/** Kontaktadress som visas på sidan (vidarebefordras via ImprovMX). */
export const CONTACT_EMAIL = 'hej@kummelnaskartan.se'

/** Så länge efter att ett event (eller en loppisdag) är slut som husen visas. Samma som HIDE_AFTER_DAYS i Code.gs. */
export const HIDE_AFTER_DAYS = 7
