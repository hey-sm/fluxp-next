import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeProviderApiMode, normalizeProviderModels, type ProviderType } from '@/lib/provider-config'
import { createLanguageModelFromProvider, type ProviderRecord } from '@/lib/server/provider-model'
import { isAdminUser, getRequestUser } from '@/lib/server/admin-auth'
import { NextResponse } from 'next/server'
import { generateText } from 'ai'

// POST /api/providers/test
// Body: { id?: string } | { type, base_url, api_key, models, api_mode }
export async function POST(request: Request) {
  const user = await getRequestUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdminUser(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()

  let type: ProviderRecord['type'], base_url: string, api_key: string, models: string[]
  let api_mode: ProviderRecord['api_mode']
  let providerId = 'temporary-provider'

  if (body.id) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('providers')
      .select('id, type, base_url, api_key, models, api_mode')
      .eq('id', body.id)
      .single()
    if (error || !data) return NextResponse.json({ error: '服务商不存在' }, { status: 404 })
    providerId = data.id
    type = data.type
    base_url = data.base_url
    api_key = data.api_key
    models = data.models
    api_mode = data.api_mode
  } else {
    type = body.type === 'claude' ? 'claude' : ('openai' as ProviderType)
    base_url = typeof body.base_url === 'string' ? body.base_url : ''
    api_key = typeof body.api_key === 'string' ? body.api_key : ''
    models = normalizeProviderModels(body.models)
    api_mode = normalizeProviderApiMode(type, body.api_mode)
  }

  const model = models[0]
  if (!model) return NextResponse.json({ error: '没有可用模型' }, { status: 400 })

  try {
    const { languageModel, apiMode } = createLanguageModelFromProvider(
      {
        id: providerId,
        type,
        base_url: base_url || null,
        api_key,
        api_mode,
      },
      model,
    )

    const { text } = await generateText({
      model: languageModel,
      prompt: 'Hi',
      maxOutputTokens: 16,
    })

    return NextResponse.json({ ok: true, reply: text, apiMode })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
