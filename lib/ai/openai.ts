import OpenAI from 'openai'

export async function streamOpenAI({
  baseURL,
  apiKey,
  model,
  messages,
  onChunk,
}: {
  baseURL: string
  apiKey: string
  model: string
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
  onChunk: (text: string) => void
}) {
  const client = new OpenAI({ apiKey, baseURL })
  const stream = await client.chat.completions.create({
    model,
    messages,
    stream: true,
  })
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? ''
    if (text) onChunk(text)
  }
}
