import type { UIMessage } from 'ai'

export type StoredMessagePart = UIMessage['parts'][number]

type TextLikePart = Pick<StoredMessagePart, 'type'> & {
  text?: string
}

type MessageLike = {
  content?: string
  parts?: TextLikePart[]
}

export function createTextMessageParts(content: string): StoredMessagePart[] {
  return [{ type: 'text', text: content }]
}

export function getMessageText(message: MessageLike | TextLikePart[]) {
  const parts = Array.isArray(message) ? message : message.parts

  if (Array.isArray(parts)) {
    return parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text ?? '')
      .join('')
  }

  return Array.isArray(message) ? '' : (message.content ?? '')
}
