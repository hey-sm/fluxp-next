export type LocationDetails = {
  city: string | null
  region: string | null
  country: string | null
}

export type WeatherPayload = LocationDetails & {
  temperature: number
  summary: string
  emoji: string
  source: 'geolocation' | 'ip'
}

const WEATHER_BASE_URL = 'https://api.open-meteo.com/v1/forecast'
const REVERSE_GEOCODE_URL = 'https://nominatim.openstreetmap.org/reverse'
const IP_GEOLOCATION_URL = 'https://ipapi.co/json/'

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function toText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function getWeatherSummary(code: number, isDay: number) {
  if (code === 0) {
    return { summary: isDay ? '晴朗' : '晴夜', emoji: isDay ? '☀️' : '🌙' }
  }

  if ([1, 2].includes(code)) {
    return { summary: '晴间多云', emoji: '🌤️' }
  }

  if (code === 3) {
    return { summary: '多云', emoji: '☁️' }
  }

  if ([45, 48].includes(code)) {
    return { summary: '有雾', emoji: '🌫️' }
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return { summary: '毛毛雨', emoji: '🌦️' }
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { summary: '下雨', emoji: '🌧️' }
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { summary: '下雪', emoji: '🌨️' }
  }

  if ([95, 96, 99].includes(code)) {
    return { summary: '雷暴', emoji: '⛈️' }
  }

  return { summary: '天气稳定', emoji: '🌤️' }
}

function mergeLocation(primary: LocationDetails, fallback: LocationDetails): LocationDetails {
  return {
    city: primary.city ?? fallback.city,
    region: primary.region ?? fallback.region,
    country: primary.country ?? fallback.country,
  }
}

async function reverseGeocode(latitude: number, longitude: number): Promise<LocationDetails> {
  const url =
    `${REVERSE_GEOCODE_URL}?lat=${latitude}&lon=${longitude}` +
    '&format=jsonv2&addressdetails=1&accept-language=zh-CN'
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'User-Agent': 'fluxp-next/1.0',
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    return { city: null, region: null, country: null }
  }

  const data = (await response.json()) as {
    address?: {
      city?: string
      town?: string
      village?: string
      municipality?: string
      county?: string
      state?: string
      state_district?: string
      city_district?: string
      suburb?: string
      province?: string
      country?: string
    }
  }

  const address = data.address

  return {
    city:
      toText(address?.city) ??
      toText(address?.town) ??
      toText(address?.village) ??
      toText(address?.municipality) ??
      toText(address?.county) ??
      toText(address?.state_district),
    region:
      toText(address?.city_district) ??
      toText(address?.suburb) ??
      toText(address?.county) ??
      toText(address?.state_district) ??
      toText(address?.state) ??
      toText(address?.province),
    country: toText(address?.country),
  }
}

async function fetchWeatherByCoordinates(
  latitude: number,
  longitude: number,
  source: 'geolocation' | 'ip',
  hintedLocation: LocationDetails = { city: null, region: null, country: null },
): Promise<WeatherPayload> {
  const weatherUrl =
    `${WEATHER_BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
    '&current=temperature_2m,weather_code,is_day&timezone=auto'

  const [weatherResponse, reverseLocation] = await Promise.all([
    fetch(weatherUrl, { cache: 'no-store' }),
    reverseGeocode(latitude, longitude),
  ])

  if (!weatherResponse.ok) {
    throw new Error('weather-fetch-failed')
  }

  const weatherData = (await weatherResponse.json()) as {
    current?: {
      temperature_2m?: number
      weather_code?: number
      is_day?: number
    }
  }

  if (
    weatherData.current?.temperature_2m === undefined ||
    weatherData.current.weather_code === undefined ||
    weatherData.current.is_day === undefined
  ) {
    throw new Error('weather-payload-invalid')
  }

  const location = mergeLocation(reverseLocation, hintedLocation)
  const { summary, emoji } = getWeatherSummary(
    weatherData.current.weather_code,
    weatherData.current.is_day,
  )

  return {
    city: location.city,
    region: location.region,
    country: location.country,
    temperature: Math.round(weatherData.current.temperature_2m),
    summary,
    emoji,
    source,
  }
}

async function resolveIpCoordinates() {
  const ipResponse = await fetch(IP_GEOLOCATION_URL, { cache: 'no-store' })
  if (!ipResponse.ok) {
    throw new Error('ip-geolocation-failed')
  }

  const ipData = (await ipResponse.json()) as {
    city?: string
    region?: string
    country_name?: string
    latitude?: number | string
    longitude?: number | string
  }

  const latitude = toNumber(ipData.latitude)
  const longitude = toNumber(ipData.longitude)

  if (latitude === null || longitude === null) {
    throw new Error('ip-geolocation-invalid')
  }

  return {
    latitude,
    longitude,
    location: {
      city: toText(ipData.city),
      region: toText(ipData.region),
      country: toText(ipData.country_name),
    },
  }
}

export async function fetchWeatherFromIp() {
  const resolved = await resolveIpCoordinates()
  return fetchWeatherByCoordinates(resolved.latitude, resolved.longitude, 'ip', resolved.location)
}

export async function fetchWeatherFromCoordinates(latitude: number, longitude: number) {
  return fetchWeatherByCoordinates(latitude, longitude, 'geolocation')
}

export async function fetchWeatherFromRequest(request: Request) {
  const { searchParams } = new URL(request.url)
  const latitude = toNumber(searchParams.get('latitude'))
  const longitude = toNumber(searchParams.get('longitude'))

  if (latitude !== null && longitude !== null) {
    return fetchWeatherFromCoordinates(latitude, longitude)
  }

  return fetchWeatherFromIp()
}
