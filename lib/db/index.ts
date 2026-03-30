import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { StoredMessagePart } from '@/lib/message-content'

interface ChatDB extends DBSchema {
  conversations: {
    key: string
    value: {
      id: string
      title: string
      providerId: string
      model: string
      createdAt: number
      updatedAt: number
    }
    indexes: { 'by-updatedAt': number }
  }
  messages: {
    key: string
    value: {
      id: string
      conversationId: string
      role: 'user' | 'assistant'
      parts?: StoredMessagePart[]
      content: string
      createdAt: number
    }
    indexes: { 'by-conversationId': string }
  }
  conversationMemories: {
    key: string
    value: {
      conversationId: string
      summary: string
      coveredUntilMessageId: string
      sourceMessageCount: number
      updatedAt: number
    }
    indexes: { 'by-updatedAt': number }
  }
}

let dbPromise: Promise<IDBPDatabase<ChatDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ChatDB>('chat-db', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const convStore = db.createObjectStore('conversations', { keyPath: 'id' })
          convStore.createIndex('by-updatedAt', 'updatedAt')
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' })
          msgStore.createIndex('by-conversationId', 'conversationId')
        }

        if (oldVersion < 2) {
          const memoryStore = db.createObjectStore('conversationMemories', { keyPath: 'conversationId' })
          memoryStore.createIndex('by-updatedAt', 'updatedAt')
        }
      },
    })
  }
  return dbPromise
}
