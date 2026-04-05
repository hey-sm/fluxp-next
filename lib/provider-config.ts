export const providerTypes = ['claude', 'openai'] as const
export type ProviderType = (typeof providerTypes)[number]

export const providerApiModes = ['responses', 'chat'] as const
export type ProviderApiMode = (typeof providerApiModes)[number]

export function normalizeProviderApiMode(
  type: ProviderType,
  apiMode: string | null | undefined,
): ProviderApiMode {
  if (type !== 'openai') {
    return 'responses'
  }

  return apiMode === 'chat' ? 'chat' : 'responses'
}

export function normalizeProviderModels(models: unknown): string[] {
  if (!Array.isArray(models)) {
    return []
  }

  return models
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}
