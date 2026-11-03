import { z } from 'zod'
import type { Position } from './api'

/**
 * Aktuellt väder från Open-Meteo (gratis, utan nyckel, CC BY 4.0). Hämtas direkt från webbläsaren, så
 * Open-Meteo ser besökarens IP-adress, precis som kartbilderna från OpenStreetMap. Se AboutData.
 */
const WeatherSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    wind_speed_10m: z.number(),
    precipitation: z.number(),
    weather_code: z.number(),
    is_day: z.number(),
  }),
})

export type Weather = {
  /** Grader Celsius. */
  temperature: number
  /** Meter per sekund. */
  wind: number
  /** Millimeter den senaste kvarten. */
  precipitation: number
  code: number
  isDay: boolean
}

export async function fetchWeather({ lat, lng }: Position): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'temperature_2m,wind_speed_10m,precipitation,weather_code,is_day',
    wind_speed_unit: 'ms',
    timezone: 'Europe/Stockholm',
  })
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!response.ok) throw new Error(`Open-Meteo svarade ${response.status}`)
  const { current } = WeatherSchema.parse(await response.json())
  return {
    temperature: current.temperature_2m,
    wind: current.wind_speed_10m,
    precipitation: current.precipitation,
    code: current.weather_code,
    isDay: current.is_day === 1,
  }
}

/** WMO-väderkoden som en ikon och ett ord, t.ex. "⛅ halvklart". */
export function describeWeather(code: number, isDay: boolean): { icon: string; label: string } {
  if (code === 0) return isDay ? { icon: '☀️', label: 'klart' } : { icon: '🌙', label: 'klart' }
  if (code <= 2) return { icon: '⛅', label: 'halvklart' }
  if (code === 3) return { icon: '☁️', label: 'mulet' }
  if (code === 45 || code === 48) return { icon: '🌫️', label: 'dimma' }
  if (code >= 51 && code <= 57) return { icon: '🌦️', label: 'duggregn' }
  if (code >= 61 && code <= 67) return { icon: '🌧️', label: 'regn' }
  if (code >= 71 && code <= 77) return { icon: '🌨️', label: 'snö' }
  if (code >= 80 && code <= 82) return { icon: '🌦️', label: 'regnskurar' }
  if (code === 85 || code === 86) return { icon: '🌨️', label: 'snöbyar' }
  if (code >= 95) return { icon: '⛈️', label: 'åska' }
  return { icon: '☁️', label: 'mulet' }
}

const decimal = (value: number) => value.toLocaleString('sv-SE', { maximumFractionDigits: 1 })

/** "6°", "4 m/s" och, bara när det regnar eller snöar, "0,4 mm". */
export function formatWeather({ temperature, wind, precipitation }: Weather): string[] {
  const parts = [`${Math.round(temperature)}°`, `${Math.round(wind)} m/s`]
  if (precipitation > 0) parts.push(`${decimal(precipitation)} mm`)
  return parts
}
