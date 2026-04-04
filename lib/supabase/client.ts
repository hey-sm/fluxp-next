import { createBrowserClient } from '@supabase/ssr'

function getSupabaseBrowserConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return null
  }

  return { url, anonKey }
}

export function hasSupabaseBrowserEnv() {
  return getSupabaseBrowserConfig() !== null
}

export function createClient() {
  const config = getSupabaseBrowserConfig()

  if (!config) {
    return null
  }

  return createBrowserClient(config.url, config.anonKey)
}
