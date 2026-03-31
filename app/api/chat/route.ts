import { createProviderLanguageModel } from '@/lib/server/provider-model'
import {
  convertToModelMessages,
  streamText,
  smoothStream,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from 'ai'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const { providerId, model, messages: rawMessages, summary } = await request.json()

  if (!providerId) {
    return new Response(JSON.stringify({ error: '请先在设置中选择服务商' }), {
      status: 400,
    })
  }

  const providerResult = await createProviderLanguageModel(providerId, model)
  if (!providerResult) {
    console.error('[chat] provider not found:', { providerId })
    return new Response(JSON.stringify({ error: 'Provider not found' }), {
      status: 404,
    })
  }

  const { provider, languageModel } = providerResult
  const messages = await convertToModelMessages(rawMessages as UIMessage[])
  const zhSegmenter = new Intl.Segmenter('zh', { granularity: 'word' })
  const system =
    typeof summary === 'string' && summary.trim()
      ? [
          '以下是当前对话的历史摘要，可作为长期记忆使用。',
          '它是压缩后的上下文，最新显式消息优先级更高。',
          '如果摘要与最新消息冲突，请以最新消息为准。',
          '',
          '<conversation_summary>',
          summary.trim(),
          '</conversation_summary>',
        ].join('\n')
      : undefined

  console.log('[chat] using provider:', provider.id, provider.type, provider.base_url)

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: languageModel,
        messages,
        system,
        experimental_transform: smoothStream({
          chunking: zhSegmenter,
          delayInMs: 20,
        }),
        onError: (e) => console.error('[chat] stream error:', e),
      })
      writer.merge(result.toUIMessageStream())
    },
    onError: (e) => {
      console.error('[chat] uistream error:', e)
      return e instanceof Error ? e.message : String(e)
    },
  })

  return createUIMessageStreamResponse({ stream })
}
