'use client'

import { useEffect, useMemo, useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { LocationDetails, WeatherPayload } from '@/lib/weather'

type WeatherState =
  | {
      status: 'loading'
    }
  | ({
      status: 'ready'
    } & WeatherPayload)
  | {
      status: 'error'
      message: string
    }

type ReverseGeocodeClientResponse = {
  countryName?: string
  principalSubdivision?: string
  city?: string
  locality?: string
  lookupSource?: 'reverseGeocoding' | 'ipGeolocation'
}

function mergeLocation(base: WeatherPayload, location: LocationDetails | null): WeatherPayload {
  if (!location) {
    return base
  }

  return {
    ...base,
    city: location.city ?? base.city,
    region: location.region ?? base.region,
    country: location.country ?? base.country,
  }
}

function normalizeClientLocation(payload: ReverseGeocodeClientResponse): LocationDetails | null {
  const city = payload.city?.trim() || payload.locality?.trim() || null
  const region = payload.principalSubdivision?.trim() || null
  const country = payload.countryName?.trim() || null

  if (!city && !region && !country) {
    return null
  }

  return { city, region, country }
}

async function getGeolocationPermissionState() {
  if (!('permissions' in navigator) || !navigator.permissions?.query) {
    return null
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
    return result.state
  } catch {
    return null
  }
}

async function getCurrentPosition() {
  if (!('geolocation' in navigator)) {
    throw new Error('geolocation-unavailable')
  }

  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 7000,
      maximumAge: 10 * 60 * 1000,
    })
  })
}

async function fetchWeather(options?: { latitude: number; longitude: number }) {
  const params = new URLSearchParams()

  if (options) {
    params.set('latitude', String(options.latitude))
    params.set('longitude', String(options.longitude))
  }

  const query = params.toString()
  const response = await fetch(query ? `/api/weather?${query}` : '/api/weather', {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('weather-route-failed')
  }

  return (await response.json()) as WeatherPayload
}

async function fetchClientLocation(options?: { latitude: number; longitude: number }) {
  const params = new URLSearchParams({ localityLanguage: 'zh' })

  if (options) {
    params.set('latitude', String(options.latitude))
    params.set('longitude', String(options.longitude))
  }

  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`,
    { cache: 'no-store' },
  )

  if (!response.ok) {
    throw new Error('client-location-failed')
  }

  return normalizeClientLocation((await response.json()) as ReverseGeocodeClientResponse)
}

export function HomeWeatherStatus({
  className,
  initialWeather,
}: {
  className?: string
  initialWeather?: WeatherPayload | null
}) {
  const [weather, setWeather] = useState<WeatherState>(
    initialWeather ? { status: 'ready', ...initialWeather } : { status: 'loading' },
  )

  useEffect(() => {
    let cancelled = false

    async function applyIpFallback() {
      try {
        const [payload, location] = await Promise.all([
          initialWeather ? Promise.resolve(initialWeather) : fetchWeather(),
          fetchClientLocation(),
        ])

        if (!cancelled) {
          setWeather({ status: 'ready', ...mergeLocation(payload, location) })
        }
      } catch {
        if (!cancelled && !initialWeather) {
          setWeather({ status: 'error', message: '天气暂时不可用' })
        }
      }
    }

    async function requestGeolocationWeather() {
      const permissionState = await getGeolocationPermissionState()

      if (permissionState === 'denied') {
        await applyIpFallback()
        return
      }

      try {
        const position = await getCurrentPosition()
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        const [payload, location] = await Promise.all([
          fetchWeather(coords),
          fetchClientLocation(coords),
        ])

        if (!cancelled) {
          setWeather({ status: 'ready', ...mergeLocation(payload, location) })
        }
      } catch {
        await applyIpFallback()
      }
    }

    void requestGeolocationWeather()

    return () => {
      cancelled = true
    }
  }, [initialWeather])

  const locationLabel = useMemo(() => {
    if (weather.status !== 'ready') {
      return null
    }

    return weather.city ?? weather.region ?? null
  }, [weather])

  if (weather.status === 'loading') {
    return <Skeleton className={cn('h-10 w-56 rounded-full', className)} />
  }

  if (weather.status === 'error') {
    return (
      <div
        className={cn(
          'text-muted-foreground border-border/70 inline-flex items-center rounded-full border bg-white/75 px-4 py-2 text-sm shadow-sm backdrop-blur',
          className,
        )}
      >
        {weather.message}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'border-border/70 inline-flex items-center gap-2 rounded-full border bg-white/75 px-4 py-2 text-sm text-slate-600 shadow-sm backdrop-blur',
        className,
      )}
    >
      {locationLabel ? (
        <>
          <span aria-hidden>{locationLabel}</span>
          <span className="text-slate-300">·</span>
        </>
      ) : null}
      <span aria-hidden>{weather.summary}</span>
      <span aria-hidden>{weather.emoji}</span>
      <span className="text-slate-300">·</span>
      <span aria-label={`${weather.temperature} 摄氏度`}>{weather.temperature}°C</span>
    </div>
  )
}
