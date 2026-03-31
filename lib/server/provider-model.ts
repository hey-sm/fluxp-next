import { createAdminClient } from '@/lib/supabase/admin'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'

type ProviderRecord = {
  id: string
  type: 'claude' | 'openai'
  base_url: string | null
  api_key: string
}

export async function getProviderRecord(providerId: string): Promise<ProviderRecord | null> {
  const admin = createAdminClient()
  const isUUID = /^[0-9a-f-]{36}$/.test(providerId)
  const query = admin.from('providers').select('id, type, base_url, api_key').eq('enabled', true)
  const { data, error } = isUUID
    ? await query.eq('id', providerId).single()
    : await query.eq('type', providerId).limit(1).single()

  if (error || !data) {
    return null
  }

  return data as ProviderRecord
}

export async function createProviderLanguageModel(providerId: string, model: string) {
  const provider = await getProviderRecord(providerId)
  if (!provider) {
    return null
  }

  const languageModel =
    provider.type === 'claude'
      ? createAnthropic({
          apiKey: provider.api_key,
          baseURL: provider.base_url || undefined,
        })(model)
      : createOpenAI({
          apiKey: provider.api_key,
          baseURL: provider.base_url || undefined,
        })(model)

  return { provider, languageModel }
}
