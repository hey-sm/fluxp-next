import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const ADMIN_ROLE = 'admin'

export async function getRequestUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export function isAdminUser(user: Pick<User, 'app_metadata'> | null | undefined) {
  return user?.app_metadata?.role === ADMIN_ROLE
}