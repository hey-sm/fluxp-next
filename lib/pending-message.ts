const PENDING_MESSAGE_PREFIX = 'pending-first-message:'

function getPendingMessageKey(conversationId: string) {
  return `${PENDING_MESSAGE_PREFIX}${conversationId}`
}

export function setPendingMessage(conversationId: string, content: string) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(getPendingMessageKey(conversationId), content)
}

export function takePendingMessage(conversationId: string) {
  if (typeof window === 'undefined') return null

  const key = getPendingMessageKey(conversationId)
  const content = window.sessionStorage.getItem(key)

  if (content !== null) {
    window.sessionStorage.removeItem(key)
  }

  return content
}
