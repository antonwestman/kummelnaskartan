/**
 * URL till Google Apps Script-webbappen (slutar på /exec).
 * Se README.md för hur du skapar den. Tom sträng = kartan visar en
 * "inte kopplad ännu"-ruta i stället för att hämta data.
 */
export const SCRIPT_URL: string =
  'https://script.google.com/macros/s/AKfycbzi5c1lEs0p7SBQbi_SxveU51Gtk8gX6_LxD-6qD3mVj2kIL40WC52b6DeW-LoipAau/exec'

/** Mittpunkt för kartan när inga anmälningar finns. */
export const KUMMELNAS_CENTER = { lat: 59.3545, lng: 18.2685 } as const
