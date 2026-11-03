import { KUMMELNAS_CENTER } from '../config'
import { useWeather } from '../hooks/useWeather'
import { describeWeather, formatWeather } from '../lib/weather'

/** Diskret väderruta i kartans övre högra hörn: ikon, temperatur, vind och nederbörd när det regnar. */
export function WeatherBadge() {
  const weather = useWeather(KUMMELNAS_CENTER)
  if (!weather) return null
  const { icon, label } = describeWeather(weather.code, weather.isDay)
  const parts = formatWeather(weather)
  return (
    <p className="weather" aria-label={`Vädret i Kummelnäs just nu: ${label}, ${parts.join(', ')}`}>
      <span className="weather-icon" aria-hidden>
        {icon}
      </span>
      <span aria-hidden>{parts.join(' · ')}</span>
    </p>
  )
}
