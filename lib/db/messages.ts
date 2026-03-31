import { getDB } from './index'
import {
  createTextMessageParts,
  getMessageText,
  type StoredMessagePart,
} from '@/lib/message-content'

export type Message = {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  parts: StoredMessagePart[]
  content: string
  createdAt: number
}

function normalizeMessage(
  message: Omit<Message, 'parts' | 'content'> & {
    parts?: StoredMessagePart[]
    content?: string
  },
): Message {
  const parts =
    Array.isArray(message.parts) && message.parts.length > 0
      ? message.parts
      : createTextMessageParts(message.content ?? '')

  return {
    ...message,
    parts,
    content: message.content ?? getMessageText(parts),
  }
}

export async function addMessage(msg: Message): Promise<Message> {
  const db = await getDB()
  const normalized = normalizeMessage(msg)
  await db.put('messages', normalized)
  return normalized
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const db = await getDB()
  const msgs = await db.getAllFromIndex('messages', 'by-conversationId', conversationId)
  return msgs.map((message) => normalizeMessage(message)).sort((a, b) => a.createdAt - b.createdAt)
}
