import { useEffect, useState } from 'react'
import type { Position } from '../lib/api'
import { fetchWeather, type Weather } from '../lib/weather'

const REFRESH_MS = 15 * 60_000

/** Aktuellt väder, uppdaterat var 15:e minut. null tills det har hämtats, eller om det inte gick. */
export function useWeather(position: Position): Weather | null {
  const [weather, setWeather] = useState<Weather | null>(null)
  const { lat, lng } = position

  useEffect(() => {
    let cancelled = false
    const load = () =>
      fetchWeather({ lat, lng }).then(
        (w) => !cancelled && setWeather(w),
        // Vädret är en bonus: går det inte att hämta visas det bara inte.
        () => undefined,
      )
    load()
    const interval = window.setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [lat, lng])

  return weather
}
