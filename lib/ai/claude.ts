import Anthropic from '@anthropic-ai/sdk'

export async function streamClaude({
  baseURL,
  apiKey,
  model,
  messages,
  onChunk,
}: {
  baseURL: string
  apiKey: string
  model: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  onChunk: (text: string) => void
}) {
  const client = new Anthropic({ apiKey, baseURL })
  const stream = await client.messages.stream({
    model,
    max_tokens: 4096,
    messages,
  })
  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      onChunk(chunk.delta.text)
    }
  }
}
