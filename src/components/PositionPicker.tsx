import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { KUMMELNAS_CENTER, MAP_TILES } from '../config'
import type { Position } from '../lib/api'
import { pinIcon } from './markerIcon'

type Props = {
  value: Position | null
  onChange: (position: Position) => void
}

/** Liten karta där man trycker på sitt hus när adressen inte gick att hitta. */
export function PositionPicker({ value, onChange }: Props) {
  const center = value ?? KUMMELNAS_CENTER
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={value ? 17 : 15} className="picker-map">
      <TileLayer url={MAP_TILES.url} attribution={MAP_TILES.attribution} maxZoom={19} />
      <ClickHandler onChange={onChange} />
      {value && <Marker position={[value.lat, value.lng]} icon={pinIcon('mine')} />}
    </MapContainer>
  )
}

function ClickHandler({ onChange }: { onChange: (position: Position) => void }) {
  useMapEvents({
    click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }),
  })
  return null
}
