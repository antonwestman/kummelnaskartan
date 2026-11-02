import { useEffect, useMemo, useRef, type RefObject } from 'react'
import L from 'leaflet'
import { Circle, CircleMarker, MapContainer, Marker, Pane, Polygon, Popup, TileLayer, useMap } from 'react-leaflet'
import { FOCUS_AREA, KUMMELNAS_CENTER, MAP_TILES, PAN_LIMIT_FACTOR } from '../config'
import { PLACE_CATEGORIES, type PlaceLayer } from '../events'
import { displayAddress } from '../lib/address'
import type { Position, Summary } from '../lib/api'
import { formatEntryDates } from '../lib/dates'
import { formatHours } from '../lib/hours'
import { heatColor, heatOpacity, metersPerPixel } from '../lib/summary'
import { STATUS_LABEL, type ShownEntry } from '../lib/status'
import { circlePolygon, walkingDirectionsUrl } from '../lib/geo'
import { entryMarkerId, pinIcon, placeIcon, placeMarkerId } from './markerIcon'

/** Ett nytt objekt per val, så att samma hus kan väljas igen och ändå flyga dit. */
export type Selection = { markerId: string; position: Position }

type Props = {
  entries: ShownEntry[]
  /** Fasta platser, filtrerade på samma sätt som husen. */
  places: PlaceLayer | null
  /** Vad husen kallas när det också finns fasta platser, t.ex. "Granne som bjuder in". */
  houseLabel: string | null
  /** Sammanställning för ett event som passerat sin tid: rutor i stället för hus. */
  summary: Summary | null
  /** Husen är hämtade (eller gick inte att hämta): dags att zooma in på det som finns. */
  loaded: boolean
  myEntryId: string | null
  userPosition: Position | null
  locating: boolean
  /** Visa bara närområdet: radie i meter runt användaren. */
  radius: number | null
  selection: Selection | null
}

export function EventMap({
  entries,
  places,
  houseLabel,
  summary,
  loaded,
  myEntryId,
  userPosition,
  locating,
  radius,
  selection,
}: Props) {
  const markers = useRef(new Map<string, L.Marker>())
  const keepMarker = (markerId: string) => (marker: L.Marker | null) => {
    if (marker) markers.current.set(markerId, marker)
    else markers.current.delete(markerId)
  }
  const placeItems = places?.items ?? []
  const cells = summary?.cells ?? []
  const maxCount = Math.max(0, ...cells.map((cell) => cell.count))

  return (
    <MapContainer
      center={[KUMMELNAS_CENTER.lat, KUMMELNAS_CENTER.lng]}
      zoom={15}
      className="map"
      scrollWheelZoom
      maxBounds={PAN_LIMIT}
      maxBoundsViscosity={1}
    >
      <LimitZoomOut />
      <TileLayer url={MAP_TILES.url} attribution={MAP_TILES.attribution} maxZoom={19} />
      <FocusFog />
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
              {houseLabel && placeItems.length > 0 && <div className="muted">{houseLabel}</div>}
              {statusLabel && <div className="muted">{capitalize(statusLabel)}</div>}
              {entry.date && <div>{capitalize(formatEntryDates(entry))}</div>}
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
      {summary && (
        // Värmekarta: en mjuk glöd per ruta. Bygger bara på rutorna (minst några hus per ruta), aldrig på enskilda hus.
        <Pane name={HEAT_PANE} style={{ zIndex: 350 }}>
          <BlurWithZoom pane={HEAT_PANE} blurMeters={summary.cellMeters * 0.35} />
          {cells.map((cell) => (
            <Circle
              key={`${cell.lat}:${cell.lng}`}
              center={[cell.lat, cell.lng]}
              radius={summary.cellMeters * 0.6}
              pathOptions={{
                stroke: false,
                fillColor: heatColor(cell.count, maxCount),
                fillOpacity: heatOpacity(cell.count, maxCount),
              }}
            >
              <Popup>{cell.count} hus</Popup>
            </Circle>
          ))}
        </Pane>
      )}
      {places &&
        placeItems.map((place) => (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={placeIcon(PLACE_CATEGORIES[place.category].icon)}
            ref={keepMarker(placeMarkerId(place.id))}
          >
            <Popup>
              <strong>{place.name}</strong>
              <div className="muted">{PLACE_CATEGORIES[place.category].label}</div>
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
      {/* Värmekartan är grov: zooma inte närmare än att man ser området. */}
      {loaded && <FitOnce points={[...entries, ...placeItems, ...cells]} maxZoom={summary ? 15 : 17} />}
      {locating && userPosition && !radius && <FlyToOnce position={userPosition} />}
      {userPosition && radius && <FitToRadiusOnce key={radius} center={userPosition} radius={radius} />}
      {selection && <FocusSelection selection={selection} markers={markers} />}
    </MapContainer>
  )
}

const HEAT_PANE = 'heat'
const FOG_PANE = 'fog'

/** Hela världen med ett hål där fokusområdet är. Räknas ut en gång. */
const FOG_RINGS: [number, number][][] = [
  [
    [85, -180],
    [85, 180],
    [-85, 180],
    [-85, -180],
  ],
  circlePolygon(FOCUS_AREA.center, FOCUS_AREA.radiusMeters),
]

/**
 * Mörk dimma utanför fokusområdet, med mjuk kant. Ligger direkt ovanpå kartbilderna, under allt annat,
 * så att hus och platser utanför området syns som vanligt.
 */
function FocusFog() {
  // Eget SVG-lager som sträcker sig en hel skärm utanför kanten, så att suddet inte ljusnar vid skärmkanten.
  const renderer = useMemo(() => L.svg({ padding: 1, pane: FOG_PANE }), [])
  return (
    <Pane name={FOG_PANE} style={{ zIndex: 250, pointerEvents: 'none' }}>
      <BlurWithZoom pane={FOG_PANE} blurMeters={250} />
      <Polygon
        positions={FOG_RINGS}
        interactive={false}
        renderer={renderer}
        pathOptions={{ stroke: false, fillColor: '#100f0d', fillOpacity: 0.7 }}
      />
    </Pane>
  )
}

/** Suddar ut ett kartlager lika mycket i meter oavsett zoom, så att det ser likadant ut när man zoomar. */
function BlurWithZoom({ pane, blurMeters }: { pane: string; blurMeters: number }) {
  const map = useMap()
  useEffect(() => {
    const apply = () => {
      const element = map.getPane(pane)
      if (!element) return
      const pixels = blurMeters / metersPerPixel(map.getZoom(), map.getCenter().lat)
      // Taket håller suddet billigt när man zoomar in långt.
      element.style.filter = `blur(${Math.min(60, Math.round(pixels))}px)`
    }
    apply()
    map.on('zoomend', apply)
    return () => {
      map.off('zoomend', apply)
    }
  }, [map, pane, blurMeters])
  return null
}

const capitalize = (text: string) => text.replace(/^./, (c) => c.toUpperCase())

/** Zooma så att alla hus och platser syns första gången husen laddats. */
function FitOnce({ points, maxZoom }: { points: Position[]; maxZoom: number }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current || points.length === 0) return
    done.current = true
    if (points.length === 1) {
      const [only] = points
      if (only) map.setView([only.lat, only.lng], Math.min(16, maxZoom))
      return
    }
    map.fitBounds(
      points.map((p): [number, number] => [p.lat, p.lng]),
      { padding: [40, 40], maxZoom },
    )
  }, [points, map, maxZoom])
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

/** Rutan man kan röra sig inom: PAN_LIMIT_FACTOR gånger fokusområdets diameter, runt dess mitt. */
const PAN_LIMIT = L.latLng(FOCUS_AREA.center.lat, FOCUS_AREA.center.lng).toBounds(
  FOCUS_AREA.radiusMeters * 2 * PAN_LIMIT_FACTOR,
)

/**
 * maxBounds stoppar bara panorering. Det här stoppar också utzoomning, så att man aldrig ser mer än rutan.
 * Räknas om när kartan byter storlek (t.ex. när telefonen vänds).
 */
function LimitZoomOut() {
  const map = useMap()
  useEffect(() => {
    const apply = () => map.setMinZoom(map.getBoundsZoom(PAN_LIMIT, true))
    apply()
    map.on('resize', apply)
    return () => {
      map.off('resize', apply)
    }
  }, [map])
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
