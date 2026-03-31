'use client'

import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { ModelSelector } from '@/components/chat/ModelSelector'
import { MessageInput } from '@/components/chat/MessageInput'
import { createConversation } from '@/lib/db/conversations'
import { createId } from '@/lib/id'
import { setPendingMessage } from '@/lib/pending-message'

export default function ChatPage() {
  const router = useRouter()
  const { activeProviderId, activeModel, setActiveModel } = useStore()
  const model = activeModel

  async function handleSend(content: string) {
    if (!activeProviderId || !model) return
    const conv = await createConversation({
      id: createId({ prefix: 'conv' }),
      title: content.slice(0, 40),
      providerId: activeProviderId,
      model,
    })
    setPendingMessage(conv.id, content)
    router.push(`/chat/${conv.id}`)
  }

  return (
    <div className="bg-background flex h-full min-h-0 flex-col">
      <div className="p-4">
        <ModelSelector model={model} onChange={setActiveModel} />
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 md:px-10 lg:px-14 xl:px-20">
        <div className="w-full max-w-[760px] text-center">
          <p className="text-muted-foreground/80 text-sm font-medium tracking-[0.2em] uppercase">
            Chat
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            有什么可以帮你的？
          </h1>
          <p className="text-muted-foreground mt-3 text-sm leading-6 sm:text-base">
            {activeProviderId ? '选择模型后开始对话' : '请先在设置中选择服务商'}
          </p>
        </div>
      </div>

      <MessageInput onSend={handleSend} disabled={!activeProviderId || !model} />
    </div>
  )
}
