import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// POST /api/providers/test
// Body: { id?: string } | { type, base_url, api_key, models }
export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  let type: string, base_url: string, api_key: string, models: string[]

  if (body.id) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('providers')
      .select('type, base_url, api_key, models')
      .eq('id', body.id)
      .single()
    if (error || !data) return NextResponse.json({ error: '服务商不存在' }, { status: 404 })
    type = data.type
    base_url = data.base_url
    api_key = data.api_key
    models = data.models
  } else {
    type = body.type
    base_url = body.base_url
    api_key = body.api_key
    models = body.models ?? []
  }

  const model = models[0]
  if (!model) return NextResponse.json({ error: '没有可用模型' }, { status: 400 })

  try {
    if (type === 'claude') {
      const client = new Anthropic({ apiKey: api_key, baseURL: base_url || undefined })
      const resp = await client.messages.create({
        model,
        max_tokens: 16,
        messages: [{ role: 'user', content: 'Hi' }],
      })
      const text = resp.content[0]?.type === 'text' ? resp.content[0].text : ''
      return NextResponse.json({ ok: true, reply: text })
    } else {
      const client = new OpenAI({ apiKey: api_key, baseURL: base_url || undefined })
      const resp = await client.chat.completions.create({
        model,
        max_tokens: 16,
        messages: [{ role: 'user', content: 'Hi' }],
      })
      const text = resp.choices[0]?.message?.content ?? ''
      return NextResponse.json({ ok: true, reply: text })
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
