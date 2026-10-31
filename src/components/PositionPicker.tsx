import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { KUMMELNAS_CENTER } from '../config'
import type { Position } from '../lib/api'
import { emojiIcon } from './markerIcon'

type Props = {
  emoji: string
  value: Position | null
  onChange: (position: Position) => void
}

/** Liten karta där man trycker på sitt hus när adressen inte gick att hitta. */
export function PositionPicker({ emoji, value, onChange }: Props) {
  const center = value ?? KUMMELNAS_CENTER
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={value ? 17 : 15} className="picker-map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ClickHandler onChange={onChange} />
      {value && <Marker position={[value.lat, value.lng]} icon={emojiIcon(emoji, 'pick')} />}
    </MapContainer>
  )
}

function ClickHandler({ onChange }: { onChange: (position: Position) => void }) {
  useMapEvents({
    click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }),
  })
  return null
}
