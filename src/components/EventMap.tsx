import { useEffect, useRef, type RefObject } from 'react'
import type L from 'leaflet'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { KUMMELNAS_CENTER } from '../config'
import type { Entry, Position } from '../lib/api'
import { walkingDirectionsUrl } from '../lib/geo'
import { emojiIcon } from './markerIcon'

/** Ett nytt objekt per val, så att samma hus kan väljas igen och ändå flyga dit. */
export type Selection = { id: string; position: Position }

type Props = {
  entries: Entry[]
  emoji: string
  myEntryId: string | null
  userPosition: Position | null
  locating: boolean
  selection: Selection | null
}

export function EventMap({ entries, emoji, myEntryId, userPosition, locating, selection }: Props) {
  const markers = useRef(new Map<string, L.Marker>())

  return (
    <MapContainer
      center={[KUMMELNAS_CENTER.lat, KUMMELNAS_CENTER.lng]}
      zoom={15}
      className="map"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {entries.map((entry) => (
        <Marker
          key={entry.id}
          position={[entry.lat, entry.lng]}
          icon={emojiIcon(emoji, entry.id === myEntryId ? 'mine' : 'default')}
          ref={(marker) => {
            if (marker) markers.current.set(entry.id, marker)
            else markers.current.delete(entry.id)
          }}
        >
          <Popup>
            <strong>{entry.address}</strong>
            {entry.name && <div>{entry.name}</div>}
            {entry.note && <div className="popup-note">{entry.note}</div>}
            <a href={walkingDirectionsUrl(entry)} target="_blank" rel="noreferrer">
              Vägbeskrivning
            </a>
          </Popup>
        </Marker>
      ))}
      {userPosition && (
        <CircleMarker
          center={[userPosition.lat, userPosition.lng]}
          radius={8}
          pathOptions={{ color: '#fff', weight: 3, fillColor: '#2f7cf6', fillOpacity: 1 }}
        />
      )}
      <FitToEntriesOnce entries={entries} />
      {locating && userPosition && <FlyToOnce position={userPosition} />}
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
