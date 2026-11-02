import L from 'leaflet'

/** place = fast plats som ingen äger, t.ex. en allmän pulkabacke. */
export type PinVariant = 'default' | 'mine' | 'off' | 'place'

const icons: Record<PinVariant, L.DivIcon> = {
  default: makeIcon('default'),
  mine: makeIcon('mine'),
  off: makeIcon('off'),
  place: makeIcon('place'),
}

function makeIcon(variant: PinVariant): L.DivIcon {
  return L.divIcon({
    className: `pin pin-${variant}`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  })
}

/** Enkla runda markörer i CSS – inga bildfiler som strular med bundlers. */
export function pinIcon(variant: PinVariant = 'default'): L.DivIcon {
  return icons[variant]
}

/** Markör-id:n för hus och platser får inte krocka. */
export const entryMarkerId = (entryId: string) => `entry:${entryId}`
export const placeMarkerId = (placeId: string) => `place:${placeId}`
