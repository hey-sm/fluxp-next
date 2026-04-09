'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { ModelSelector } from '@/components/chat/ModelSelector'
import { ChatWelcomeCard } from '@/components/chat/ChatWelcomeCard'
import { MessageInput } from '@/components/chat/MessageInput'
import { createConversation } from '@/lib/db/conversations'
import { createId } from '@/lib/id'
import { setPendingMessage } from '@/lib/pending-message'
import { prefetchProviderCatalog } from '@/lib/provider-client'

export default function ChatPage() {
  const router = useRouter()
  const { activeProviderId, activeModel, setActiveModel } = useStore()
  const model = activeModel

  useEffect(() => {
    prefetchProviderCatalog(false)
  }, [])

  function handleSend(content: string) {
    if (!activeProviderId || !model) return

    const conversationId = createId({ prefix: 'conv' })
    const title = content.slice(0, 40)

    setPendingMessage(conversationId, {
      content,
      title,
      providerId: activeProviderId,
      model,
    })

    router.push(`/chat/${conversationId}`)

    void createConversation({
      id: conversationId,
      title,
      providerId: activeProviderId,
      model,
    })
  }

  return (
    <div className="bg-background flex h-full min-h-0 flex-col">
      <div className="p-4">
        <ModelSelector model={model} onChange={setActiveModel} />
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 md:px-10 lg:px-14 xl:px-20">
        <ChatWelcomeCard />
      </div>

      <MessageInput onSend={handleSend} disabled={!activeProviderId || !model} />
    </div>
  )
}
