import { getDB } from './index'

export type ConversationMemory = {
  conversationId: string
  summary: string
  coveredUntilMessageId: string
  sourceMessageCount: number
  updatedAt: number
}

export async function getConversationMemory(conversationId: string): Promise<ConversationMemory | undefined> {
  const db = await getDB()
  return db.get('conversationMemories', conversationId)
}

export async function upsertConversationMemory(
  memory: Omit<ConversationMemory, 'updatedAt'>
): Promise<ConversationMemory> {
  const db = await getDB()
  const nextMemory: ConversationMemory = {
    ...memory,
    updatedAt: Date.now(),
  }

  await db.put('conversationMemories', nextMemory)
  return nextMemory
}

export async function deleteConversationMemory(conversationId: string) {
  const db = await getDB()
  await db.delete('conversationMemories', conversationId)
}
