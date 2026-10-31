import { useEffect, useRef, type RefObject } from 'react'
import L from 'leaflet'
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { KUMMELNAS_CENTER, MAP_TILES } from '../config'
import type { Entry, Position } from '../lib/api'
import { walkingDirectionsUrl } from '../lib/geo'
import { pinIcon } from './markerIcon'

/** Ett nytt objekt per val, så att samma hus kan väljas igen och ändå flyga dit. */
export type Selection = { id: string; position: Position }

type Props = {
  entries: Entry[]
  myEntryId: string | null
  userPosition: Position | null
  locating: boolean
  /** Visa bara närområdet: radie i meter runt användaren. */
  radius: number | null
  selection: Selection | null
}

export function EventMap({ entries, myEntryId, userPosition, locating, radius, selection }: Props) {
  const markers = useRef(new Map<string, L.Marker>())

  return (
    <MapContainer
      center={[KUMMELNAS_CENTER.lat, KUMMELNAS_CENTER.lng]}
      zoom={15}
      className="map"
      scrollWheelZoom
    >
      <TileLayer url={MAP_TILES.url} attribution={MAP_TILES.attribution} maxZoom={19} />
      {entries.map((entry) => (
        <Marker
          key={entry.id}
          position={[entry.lat, entry.lng]}
          icon={pinIcon(entry.id === myEntryId ? 'mine' : 'default')}
          ref={(marker) => {
            if (marker) markers.current.set(entry.id, marker)
            else markers.current.delete(entry.id)
          }}
        >
          <Popup>
            <strong>{entry.address}</strong>
            {entry.name && <div>{entry.name}</div>}
            {entry.note && <div className="muted">{entry.note}</div>}
            <a href={walkingDirectionsUrl(entry)} target="_blank" rel="noreferrer">
              Vägbeskrivning
            </a>
          </Popup>
        </Marker>
      ))}
      {userPosition && radius && (
        <Circle
          center={[userPosition.lat, userPosition.lng]}
          radius={radius}
          pathOptions={{ color: '#ff8a2a', weight: 1.5, dashArray: '4 6', fillColor: '#ff8a2a', fillOpacity: 0.06 }}
          interactive={false}
        />
      )}
      {userPosition && (
        <CircleMarker
          center={[userPosition.lat, userPosition.lng]}
          radius={8}
          pathOptions={{ color: '#fff', weight: 3, fillColor: '#2b6fd6', fillOpacity: 1 }}
        />
      )}
      <FitToEntriesOnce entries={entries} />
      {locating && userPosition && !radius && <FlyToOnce position={userPosition} />}
      {userPosition && radius && <FitToRadiusOnce key={radius} center={userPosition} radius={radius} />}
      {selection && <FocusSelection selection={selection} markers={markers} />}
    </MapContainer>
  )
}

/** Zooma så att alla hus syns första gången de laddats. */
function FitToEntriesOnce({ entries }: { entries: Entry[] }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current || entries.length === 0) return
    done.current = true
    if (entries.length === 1) {
      const [only] = entries
      if (only) map.setView([only.lat, only.lng], 16)
      return
    }
    map.fitBounds(
      entries.map((e): [number, number] => [e.lat, e.lng]),
      { padding: [40, 40], maxZoom: 17 },
    )
  }, [entries, map])
  return null
}

/** Flyg till användaren när positionen hittas (en gång per påslagning). */
function FlyToOnce({ position }: { position: Position }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 17))
  }, [position, map])
  return null
}

/** Zooma så att hela cirkeln syns – en gång per vald radie. */
function FitToRadiusOnce({ center, radius }: { center: Position; radius: number }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    map.flyToBounds(L.latLng(center.lat, center.lng).toBounds(radius * 2), { padding: [16, 16] })
  }, [center, radius, map])
  return null
}

function FocusSelection({
  selection,
  markers,
}: {
  selection: Selection
  markers: RefObject<Map<string, L.Marker>>
}) {
  const map = useMap()
  useEffect(() => {
    const { lat, lng } = selection.position
    map.flyTo([lat, lng], Math.max(map.getZoom(), 17))
    markers.current.get(selection.id)?.openPopup()
  }, [selection, map, markers])
  return null
}
