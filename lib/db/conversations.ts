import { getDB } from './index'
import { deleteConversationMemory } from './conversation-memories'

export type Conversation = {
  id: string
  title: string
  providerId: string
  model: string
  createdAt: number
  updatedAt: number
}

function notifyConversationsChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('conversations:changed'))
}

export async function createConversation(data: Pick<Conversation, 'id' | 'title' | 'providerId' | 'model'>): Promise<Conversation> {
  const db = await getDB()
  const now = Date.now()
  const conv: Conversation = { ...data, createdAt: now, updatedAt: now }
  await db.put('conversations', conv)
  notifyConversationsChanged()
  return conv
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const db = await getDB()
  return db.get('conversations', id)
}

export async function getConversations(): Promise<Conversation[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('conversations', 'by-updatedAt')
  return all.reverse()
}

export async function updateConversation(id: string, data: Partial<Conversation>) {
  const db = await getDB()
  const conv = await db.get('conversations', id)
  if (!conv) return
  await db.put('conversations', { ...conv, ...data, updatedAt: Date.now() })
  notifyConversationsChanged()
}

export async function deleteConversation(id: string) {
  const db = await getDB()
  await db.delete('conversations', id)
  const msgs = await db.getAllFromIndex('messages', 'by-conversationId', id)
  const tx = db.transaction('messages', 'readwrite')
  await Promise.all(msgs.map(m => tx.store.delete(m.id)))
  await tx.done
  await deleteConversationMemory(id)
  notifyConversationsChanged()
}
