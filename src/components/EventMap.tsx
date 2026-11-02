import { useEffect, useRef, type RefObject } from 'react'
import L from 'leaflet'
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { KUMMELNAS_CENTER, MAP_TILES } from '../config'
import type { PlaceLayer } from '../events'
import { displayAddress } from '../lib/address'
import type { Position } from '../lib/api'
import { formatEntryDate } from '../lib/dates'
import { formatHours } from '../lib/hours'
import { STATUS_LABEL, type ShownEntry } from '../lib/status'
import { walkingDirectionsUrl } from '../lib/geo'
import { entryMarkerId, pinIcon, placeMarkerId } from './markerIcon'

/** Ett nytt objekt per val, så att samma hus kan väljas igen och ändå flyga dit. */
export type Selection = { markerId: string; position: Position }

type Props = {
  entries: ShownEntry[]
  /** Fasta platser, filtrerade på samma sätt som husen. */
  places: PlaceLayer | null
  /** Husen är hämtade (eller gick inte att hämta): dags att zooma in på det som finns. */
  loaded: boolean
  myEntryId: string | null
  userPosition: Position | null
  locating: boolean
  /** Visa bara närområdet: radie i meter runt användaren. */
  radius: number | null
  selection: Selection | null
}

export function EventMap({ entries, places, loaded, myEntryId, userPosition, locating, radius, selection }: Props) {
  const markers = useRef(new Map<string, L.Marker>())
  const keepMarker = (markerId: string) => (marker: L.Marker | null) => {
    if (marker) markers.current.set(markerId, marker)
    else markers.current.delete(markerId)
  }
  const placeItems = places?.items ?? []

  return (
    <MapContainer
      center={[KUMMELNAS_CENTER.lat, KUMMELNAS_CENTER.lng]}
      zoom={15}
      className="map"
      scrollWheelZoom
    >
      <TileLayer url={MAP_TILES.url} attribution={MAP_TILES.attribution} maxZoom={19} />
      {entries.map((entry) => {
        const statusLabel = STATUS_LABEL[entry.status]
        return (
          <Marker
            key={entry.id}
            position={[entry.lat, entry.lng]}
            icon={pinIcon(entry.status !== 'open' ? 'off' : entry.id === myEntryId ? 'mine' : 'default')}
            zIndexOffset={entry.status !== 'open' ? -1000 : 0}
            ref={keepMarker(entryMarkerId(entry.id))}
          >
            <Popup>
              <strong>{displayAddress(entry.address)}</strong>
              {places && <div className="muted">{places.entryLabel}</div>}
              {statusLabel && <div className="muted">{capitalize(statusLabel)}</div>}
              {entry.date && <div>{capitalize(formatEntryDate(entry.date))}</div>}
              {formatHours(entry) && <div>Öppet {formatHours(entry)}</div>}
              {entry.name && <div>{entry.name}</div>}
              {entry.note && <div className="muted">{entry.note}</div>}
              <a href={walkingDirectionsUrl(entry)} target="_blank" rel="noreferrer">
                Vägbeskrivning
              </a>
            </Popup>
          </Marker>
        )
      })}
      {places &&
        placeItems.map((place) => (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={pinIcon('place')}
            ref={keepMarker(placeMarkerId(place.id))}
          >
            <Popup>
              <strong>{place.name}</strong>
              <div className="muted">{places.label}</div>
              {place.note && <div>{place.note}</div>}
              {place.warning && <div className="place-warning">{place.warning}</div>}
              <a href={walkingDirectionsUrl(place)} target="_blank" rel="noreferrer">
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
      {loaded && <FitOnce points={[...entries, ...placeItems]} />}
      {locating && userPosition && !radius && <FlyToOnce position={userPosition} />}
      {userPosition && radius && <FitToRadiusOnce key={radius} center={userPosition} radius={radius} />}
      {selection && <FocusSelection selection={selection} markers={markers} />}
    </MapContainer>
  )
}

const capitalize = (text: string) => text.replace(/^./, (c) => c.toUpperCase())

/** Zooma så att alla hus och platser syns första gången husen laddats. */
function FitOnce({ points }: { points: Position[] }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current || points.length === 0) return
    done.current = true
    if (points.length === 1) {
      const [only] = points
      if (only) map.setView([only.lat, only.lng], 16)
      return
    }
    map.fitBounds(
      points.map((p): [number, number] => [p.lat, p.lng]),
      { padding: [40, 40], maxZoom: 17 },
    )
  }, [points, map])
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
    markers.current.get(selection.markerId)?.openPopup()
  }, [selection, map, markers])
  return null
}
