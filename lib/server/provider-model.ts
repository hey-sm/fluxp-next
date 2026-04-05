import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeProviderApiMode, type ProviderApiMode, type ProviderType } from '@/lib/provider-config'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'

export type ProviderRecord = {
  id: string
  type: ProviderType
  base_url: string | null
  api_key: string
  api_mode?: ProviderApiMode | null
}

type ProviderLanguageModelResult = {
  provider: ProviderRecord
  languageModel: ReturnType<ReturnType<typeof createAnthropic>> | ReturnType<ReturnType<typeof createOpenAI>>
  apiMode: 'anthropic' | 'responses' | 'chat'
}

export async function getProviderRecord(providerId: string): Promise<ProviderRecord | null> {
  const admin = createAdminClient()
  const isUUID = /^[0-9a-f-]{36}$/.test(providerId)
  const query = admin
    .from('providers')
    .select('id, type, base_url, api_key, api_mode')
    .eq('enabled', true)
  const { data, error } = isUUID
    ? await query.eq('id', providerId).single()
    : await query.eq('type', providerId).limit(1).single()

  if (error || !data) {
    return null
  }

  return data as ProviderRecord
}

export function createLanguageModelFromProvider(
  provider: ProviderRecord,
  model: string,
): ProviderLanguageModelResult {
  if (provider.type === 'claude') {
    const languageModel = createAnthropic({
      apiKey: provider.api_key,
      baseURL: provider.base_url || undefined,
    })(model)

    return { provider, languageModel, apiMode: 'anthropic' }
  }

  const openaiProvider = createOpenAI({
    apiKey: provider.api_key,
    baseURL: provider.base_url || undefined,
  })
  const apiMode = normalizeProviderApiMode(provider.type, provider.api_mode)
  const languageModel = apiMode === 'chat' ? openaiProvider.chat(model) : openaiProvider(model)

  return { provider, languageModel, apiMode }
}

export async function createProviderLanguageModel(providerId: string, model: string) {
  const provider = await getProviderRecord(providerId)
  if (!provider) {
    return null
  }

  return createLanguageModelFromProvider(provider, model)
}
