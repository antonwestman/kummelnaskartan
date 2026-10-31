import { useEffect, useState } from 'react'
import type { Position } from '../lib/api'

export type GeolocationState =
  | { status: 'off' }
  | { status: 'pending' }
  | { status: 'on'; position: Position; accuracy: number }
  | { status: 'error'; message: string }

/** Följer användarens position så länge `enabled` är true. */
export function useGeolocation(enabled: boolean): GeolocationState {
  const [state, setState] = useState<GeolocationState>({ status: 'pending' })

  useEffect(() => {
    if (!enabled || !('geolocation' in navigator)) return
    const id = navigator.geolocation.watchPosition(
      (pos) =>
        setState({
          status: 'on',
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracy: pos.coords.accuracy,
        }),
      (err) =>
        setState({
          status: 'error',
          message:
            err.code === err.PERMISSION_DENIED
              ? 'Du har inte gett sidan tillgång till din position.'
              : 'Kunde inte hitta din position.',
        }),
      { enableHighAccuracy: true, maximumAge: 10_000 },
    )
    return () => {
      navigator.geolocation.clearWatch(id)
      setState({ status: 'pending' })
    }
  }, [enabled])

  if (!enabled) return { status: 'off' }
  if (!('geolocation' in navigator)) return { status: 'error', message: 'Din webbläsare stöder inte positionering.' }
  return state
}
