export const SITE_URL = 'https://kummelnaskartan.se'

export const eventPath = (eventId: string) => `/${eventId}/`

export const editPath = (eventId: string, token: string) => `/${eventId}/andra/${token}`

/**
 * Tidigare låg sidorna bakom # (t.ex. /#/e/halloween-2026/andra/<token>).
 * Översätter sådana länkar till nya sökvägar så att gamla delade länkar fortsätter fungera.
 */
export function pathFromLegacyHash(hash: string): string | null {
  if (!hash.startsWith('#/')) return null
  const path = hash.slice(1)
  return path.startsWith('/e/') ? path.slice('/e'.length) : path
}
