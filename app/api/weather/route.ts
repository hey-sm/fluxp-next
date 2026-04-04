import { NextResponse } from 'next/server'

import { fetchWeatherFromRequest } from '@/lib/weather'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const payload = await fetchWeatherFromRequest(request)
    return NextResponse.json(payload)
  } catch (error) {
    console.error('[weather] request failed', error)
    return NextResponse.json({ error: '天气服务暂时不可用' }, { status: 502 })
  }
}
