import L from 'leaflet'

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

/** Enkla runda markörer i CSS – inga bildfiler som strular med bundlers. */
export function pinIcon(variant: PinVariant = 'default'): L.DivIcon {
  return icons[variant]
}
