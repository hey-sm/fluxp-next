const PENDING_MESSAGE_PREFIX = 'pending-first-message:'
const pendingMessageCache = new Map<string, PendingConversationMessage>()

export type PendingConversationMessage = {
  content: string
  title: string
  providerId: string
  model: string
}

function getPendingMessageKey(conversationId: string) {
  return `${PENDING_MESSAGE_PREFIX}${conversationId}`
}

function parsePendingMessage(rawValue: string | null): PendingConversationMessage | null {
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PendingConversationMessage>
    if (
      typeof parsed.content === 'string' &&
      typeof parsed.title === 'string' &&
      typeof parsed.providerId === 'string' &&
      typeof parsed.model === 'string'
    ) {
      return {
        content: parsed.content,
        title: parsed.title,
        providerId: parsed.providerId,
        model: parsed.model,
      }
    }
  } catch {
    return {
      content: rawValue,
      title: rawValue.slice(0, 40),
      providerId: '',
      model: '',
    }
  }

  return null
}

export function setPendingMessage(
  conversationId: string,
  pendingMessage: PendingConversationMessage,
) {
  pendingMessageCache.set(conversationId, pendingMessage)

  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(
    getPendingMessageKey(conversationId),
    JSON.stringify(pendingMessage),
  )
}

export function getPendingMessage(conversationId: string): PendingConversationMessage | null {
  const cached = pendingMessageCache.get(conversationId)
  if (cached) {
    return cached
  }

  if (typeof window === 'undefined') return null

  const key = getPendingMessageKey(conversationId)
  const pendingMessage = parsePendingMessage(window.sessionStorage.getItem(key))

  if (pendingMessage) {
    pendingMessageCache.set(conversationId, pendingMessage)
  }

  return pendingMessage
}

export function clearPendingMessage(conversationId: string) {
  pendingMessageCache.delete(conversationId)

  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(getPendingMessageKey(conversationId))
}
