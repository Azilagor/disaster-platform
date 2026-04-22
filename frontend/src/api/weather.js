const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast'

const DEFAULT_FORECAST_DAYS = 5
const CACHE_TTL_MS = 10 * 60 * 1000

/** @type {Map<string, { at: number, data: any }>} */
const cache = new Map()

function cacheKey(lat, lon, locale) {
  return `${Number(lat).toFixed(5)}:${Number(lon).toFixed(5)}:${locale || 'en'}`
}

function withTimeout(ms, signal) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(new Error('timeout')), ms)

  const onAbort = () => controller.abort(signal?.reason || new Error('aborted'))
  if (signal) {
    if (signal.aborted) onAbort()
    else signal.addEventListener('abort', onAbort, { once: true })
  }

  return {
    signal: controller.signal,
    dispose() {
      clearTimeout(timeoutId)
      if (signal) signal.removeEventListener('abort', onAbort)
    },
  }
}

export function weatherGroupFromWmoCode(code) {
  const c = Number(code)
  if (Number.isNaN(c)) return 'unknown'
  if (c === 0) return 'clear'
  if (c === 1) return 'mainly_clear'
  if (c === 2) return 'partly_cloudy'
  if (c === 3) return 'overcast'
  if (c === 45 || c === 48) return 'fog'
  if (c === 51 || c === 53 || c === 55) return 'drizzle'
  if (c === 56 || c === 57) return 'freezing_drizzle'
  if (c === 61 || c === 63 || c === 65) return 'rain'
  if (c === 66 || c === 67) return 'freezing_rain'
  if (c === 71 || c === 73 || c === 75) return 'snow'
  if (c === 77) return 'snow_grains'
  if (c === 80 || c === 81 || c === 82) return 'rain_showers'
  if (c === 85 || c === 86) return 'snow_showers'
  if (c === 95) return 'thunderstorm'
  if (c === 96 || c === 99) return 'thunderstorm_hail'
  return 'unknown'
}

/**
 * Получить прогноз погоды (current + daily) по координатам.
 * Использует Open-Meteo (без API-ключа).
 *
 * @param {Object} args
 * @param {number} args.latitude
 * @param {number} args.longitude
 * @param {string} [args.locale] - 'ru' | 'en' | 'kk' (используется только для языка описаний/формата времени на стороне Open-Meteo)
 * @param {AbortSignal} [args.signal]
 */
export async function getWeatherForecast({ latitude, longitude, locale = 'en', signal } = {}) {
  const lat = Number(latitude)
  const lon = Number(longitude)
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new Error('weather.invalidCoordinates')
  }

  const key = cacheKey(lat, lon, locale)
  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data

  const t = withTimeout(8000, signal)
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      timezone: 'auto',
      forecast_days: String(DEFAULT_FORECAST_DAYS),
      current: 'temperature_2m,weather_code,wind_speed_10m',
      daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max',
      wind_speed_unit: 'kmh',
      temperature_unit: 'celsius',
    })

    // Open-Meteo supports a "language" parameter for some endpoints/fields. If unsupported, it will be ignored.
    if (locale) params.set('language', locale)

    const res = await fetch(`${OPEN_METEO_URL}?${params.toString()}`, { signal: t.signal })
    if (!res.ok) throw new Error('weather.fetchFailed')
    const data = await res.json()

    cache.set(key, { at: Date.now(), data })
    return data
  } finally {
    t.dispose()
  }
}

