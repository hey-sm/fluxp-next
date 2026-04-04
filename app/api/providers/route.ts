import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminUser, getRequestUser } from '@/lib/server/admin-auth'
import { NextResponse } from 'next/server'

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
    .select('id, name, type, models, default_model, enabled, base_url')

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

  const body = await request.json()
  const admin = createAdminClient()
  const { data, error } = await admin.from('providers').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
