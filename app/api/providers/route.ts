import { createAdminClient } from '@/lib/supabase/admin'
import {
  normalizeProviderApiMode,
  normalizeProviderModels,
  type ProviderType,
} from '@/lib/provider-config'
import { isAdminUser, getRequestUser } from '@/lib/server/admin-auth'
import { NextResponse } from 'next/server'

function buildProviderPayload(body: Record<string, unknown>) {
  const type: ProviderType = body.type === 'claude' ? 'claude' : 'openai'
  const models = normalizeProviderModels(body.models)

  const payload: Record<string, unknown> = {
    name: typeof body.name === 'string' ? body.name.trim() : '',
    type,
    base_url:
      typeof body.base_url === 'string' && body.base_url.trim().length > 0
        ? body.base_url.trim()
        : null,
    models,
    default_model:
      typeof body.default_model === 'string' && body.default_model.trim().length > 0
        ? body.default_model.trim()
        : (models[0] ?? ''),
    enabled: typeof body.enabled === 'boolean' ? body.enabled : true,
    api_mode: normalizeProviderApiMode(
      type,
      typeof body.api_mode === 'string' ? body.api_mode : undefined,
    ),
  }

  if (typeof body.api_key === 'string' && body.api_key.trim().length > 0) {
    payload.api_key = body.api_key.trim()
  }

  return payload
}

// GET /api/providers — public returns enabled providers, admin can request all via ?all=1
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const all = searchParams.get('all') === '1'

  if (all) {
    const user = await getRequestUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const admin = createAdminClient()
  let query = admin
    .from('providers')
    .select('id, name, type, models, default_model, enabled, base_url, api_mode')

  if (!all) {
    query = query.eq('enabled', true)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/providers — admin only
export async function POST(request: Request) {
  const user = await getRequestUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdminUser(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = buildProviderPayload((await request.json()) as Record<string, unknown>)
  const admin = createAdminClient()
  const { data, error } = await admin.from('providers').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
