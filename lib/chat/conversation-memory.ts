import type { UIMessage } from 'ai'
import type { ConversationMemory } from '@/lib/db/conversation-memories'
import type { Message } from '@/lib/db/messages'

export const SUMMARY_TRIGGER_MESSAGE_COUNT = 20
export const SUMMARY_MIN_NEW_MESSAGES = 6
export const SUMMARY_KEEP_RECENT_MESSAGES = 8

export type SummaryCandidate = {
  coveredUntilMessageId: string
  sourceMessageCount: number
  messages: Pick<Message, 'id' | 'role' | 'content'>[]
}

export function getSummaryCandidate(
  messages: Message[],
  memory?: ConversationMemory
): SummaryCandidate | null {
  if (messages.length < SUMMARY_TRIGGER_MESSAGE_COUNT) {
    return null
  }

  const targetIndex = messages.length - SUMMARY_KEEP_RECENT_MESSAGES - 1
  if (targetIndex < 0) {
    return null
  }

  const coveredIndex = memory?.coveredUntilMessageId
    ? messages.findIndex((message) => message.id === memory.coveredUntilMessageId)
    : -1

  if (targetIndex <= coveredIndex) {
    return null
  }

  const candidateMessages = messages
    .slice(coveredIndex + 1, targetIndex + 1)
    .filter((message) => message.content.trim().length > 0)

  if (candidateMessages.length < SUMMARY_MIN_NEW_MESSAGES) {
    return null
  }

  return {
    coveredUntilMessageId: messages[targetIndex].id,
    sourceMessageCount: targetIndex + 1,
    messages: candidateMessages.map(({ id, role, content }) => ({ id, role, content })),
  }
}

export function getMessagesAfterSummaryBoundary(
  messages: UIMessage[],
  memory?: ConversationMemory
): UIMessage[] {
  if (!memory?.coveredUntilMessageId) {
    return messages
  }

  const coveredIndex = messages.findIndex((message) => message.id === memory.coveredUntilMessageId)
  if (coveredIndex === -1) {
    return messages
  }

  return messages.slice(coveredIndex + 1)
}
