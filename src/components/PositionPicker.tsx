import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { KUMMELNAS_CENTER, MAP_TILES } from '../config'
import type { Position } from '../lib/api'
import { pinIcon } from './markerIcon'

type Props = {
  value: Position | null
  onChange: (position: Position) => void
}

/** Liten karta där man trycker ut en plats: sitt hus när adressen inte gick att hitta, eller ett tips. */
export function PositionPicker({ value, onChange }: Props) {
  const center = value ?? KUMMELNAS_CENTER
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={value ? 17 : 15} className="picker-map">
      <TileLayer url={MAP_TILES.url} attribution={MAP_TILES.attribution} maxZoom={19} />
      <ClickHandler onChange={onChange} />
      {value && <Marker position={[value.lat, value.lng]} icon={pinIcon('mine')} />}
      {value && <KeepInView position={value} />}
    </MapContainer>
  )
}

/** Flytta kartan om värdet hamnar utanför, t.ex. när ens position hittas efter att kartan visats. */
function KeepInView({ position }: { position: Position }) {
  const map = useMap()
  useEffect(() => {
    if (!map.getBounds().contains([position.lat, position.lng])) map.setView([position.lat, position.lng], 17)
  }, [map, position])
  return null
}

function ClickHandler({ onChange }: { onChange: (position: Position) => void }) {
  useMapEvents({
    click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }),
  })
  return null
}
