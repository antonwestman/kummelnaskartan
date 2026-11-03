import L from 'leaflet'

/** Hus: tänt, ditt eget, eller släckt/stängt. Fasta platser har egna ikoner, se placeIcon. */
export type PinVariant = 'default' | 'mine' | 'off'

const icons: Record<PinVariant, L.DivIcon> = {
  default: makeIcon('default'),
  mine: makeIcon('mine'),
  off: makeIcon('off'),
}

function makeIcon(variant: PinVariant): L.DivIcon {
  return L.divIcon({
    className: `pin pin-${variant}`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  })
}

const placeIcons = new Map<string, L.DivIcon>()

/** Fast plats: liten mörk ruta med kategorins ikon i grått, så att den inte konkurrerar med det som lyser. */
export function placeIcon(icon: string): L.DivIcon {
  const cached = placeIcons.get(icon)
  if (cached) return cached
  const created = L.divIcon({
    className: 'pin pin-place',
    html: `<span aria-hidden="true">${icon}</span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  })
  placeIcons.set(icon, created)
  return created
}

/** Enkla runda markörer i CSS – inga bildfiler som strular med bundlers. */
export function pinIcon(variant: PinVariant = 'default'): L.DivIcon {
  return icons[variant]
}

/** Markör-id:n för hus och platser får inte krocka. */
export const entryMarkerId = (entryId: string) => `entry:${entryId}`
export const placeMarkerId = (placeId: string) => `place:${placeId}`
