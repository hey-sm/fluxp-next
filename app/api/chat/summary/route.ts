import { createProviderLanguageModel } from '@/lib/server/provider-model'
import { generateText } from 'ai'

export const runtime = 'nodejs'
export const maxDuration = 60

type SummaryMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const SUMMARY_SYSTEM_PROMPT = [
  '你是对话记忆压缩助手。',
  '你的任务是为后续继续聊天生成一段高信息密度、低冗余的长期记忆摘要。',
  '请保留：用户目标、约束条件、已确认决策、关键事实、未完成事项、用户偏好。',
  '请删除：寒暄、重复表达、低价值铺垫。',
  '输出使用简洁中文，不要使用代码块，不要写“以下是摘要”。',
  '如果已有历史摘要，请在其基础上增量更新，而不是完全重写风格。',
].join('\n')

function formatSummaryPrompt(existingSummary: string | undefined, messages: SummaryMessage[]) {
  const transcript = messages
    .map((message) => `${message.role === 'user' ? '用户' : '助手'}: ${message.content}`)
    .join('\n')

  return [
    existingSummary?.trim() ? `已有摘要：\n${existingSummary.trim()}` : '已有摘要：\n无',
    '',
    '请基于下面这些新增对话更新摘要：',
    transcript,
  ].join('\n')
}

export async function POST(request: Request) {
  const { providerId, model, existingSummary, messages } = (await request.json()) as {
    providerId?: string
    model?: string
    existingSummary?: string
    messages?: SummaryMessage[]
  }

  if (!providerId || !model) {
    return new Response(JSON.stringify({ error: 'Missing provider or model' }), { status: 400 })
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Missing messages' }), { status: 400 })
  }

  const providerResult = await createProviderLanguageModel(providerId, model)
  if (!providerResult) {
    return new Response(JSON.stringify({ error: 'Provider not found' }), { status: 404 })
  }

  const { text } = await generateText({
    model: providerResult.languageModel,
    system: SUMMARY_SYSTEM_PROMPT,
    prompt: formatSummaryPrompt(existingSummary, messages),
  })

  return Response.json({
    summary: text.trim(),
  })
}
