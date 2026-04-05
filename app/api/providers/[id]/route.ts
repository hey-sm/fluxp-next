import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeProviderApiMode, normalizeProviderModels, type ProviderType } from '@/lib/provider-config'
import { isAdminUser, getRequestUser } from '@/lib/server/admin-auth'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

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

// PUT /api/providers/[id]
export async function PUT(request: Request, { params }: Params) {
  const user = await getRequestUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdminUser(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = buildProviderPayload((await request.json()) as Record<string, unknown>)
  const admin = createAdminClient()
  const { data, error } = await admin.from('providers').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/providers/[id]
export async function DELETE(_: Request, { params }: Params) {
  const user = await getRequestUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdminUser(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.from('providers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
