import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminUser, getRequestUser } from '@/lib/server/admin-auth'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

// PUT /api/providers/[id]
export async function PUT(request: Request, { params }: Params) {
  const user = await getRequestUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdminUser(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
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