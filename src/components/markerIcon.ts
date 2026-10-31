import L from 'leaflet'

const cache = new Map<string, L.DivIcon>()

/** Emoji-markör (undviker Leaflets bildfiler som strular med bundlers). */
export function emojiIcon(emoji: string, variant: 'default' | 'mine' | 'pick' = 'default'): L.DivIcon {
  const key = `${emoji}:${variant}`
  const cached = cache.get(key)
  if (cached) return cached
  const icon = L.divIcon({
    className: `emoji-marker ${variant}`,
    html: `<span>${emoji}</span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 36],
    popupAnchor: [0, -32],
  })
  cache.set(key, icon)
  return icon
}
