'use client'

import { use, useEffect, useEffectEvent, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { toast } from 'sonner'
import { ArrowDown } from 'lucide-react'
import { useStore } from '@/lib/store'
import { ModelSelector } from '@/components/chat/ModelSelector'
import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { UserMessageRail } from '@/components/chat/UserMessageRail'
import { Button } from '@/components/ui/button'
import { getConversation, updateConversation } from '@/lib/db/conversations'
import { getMessages, addMessage } from '@/lib/db/messages'
import { getConversationMemory, upsertConversationMemory } from '@/lib/db/conversation-memories'
import { createId } from '@/lib/id'
import {
  getSummaryCandidate,
  getMessagesAfterSummaryBoundary,
} from '@/lib/chat/conversation-memory'
import { createTextMessageParts, getMessageText } from '@/lib/message-content'
import { takePendingMessage } from '@/lib/pending-message'

const BOTTOM_OFFSET_PX = 80
const PROGRAMMATIC_SCROLL_MS = 500

export default function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { activeProviderId, setActiveModel, setActiveProviderId } = useStore()
  const [model, setModelState] = useState('')
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false)
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true)
  const [activeUserMessageId, setActiveUserMessageId] = useState<string>()
  const [pendingFirstMessage, setPendingFirstMessage] = useState<string | null>(null)
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const userMessageRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const isPinnedToBottomRef = useRef(true)
  const scrollIntentRef = useRef<'bottom' | 'message' | null>(null)
  const scrollIntentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const summaryInFlightRef = useRef(false)

  isPinnedToBottomRef.current = isPinnedToBottom

  function setModel(nextModel: string) {
    setModelState(nextModel)
    setActiveModel(nextModel)
  }

  function isNearBottom(element: HTMLDivElement) {
    return element.scrollHeight - element.scrollTop - element.clientHeight <= BOTTOM_OFFSET_PX
  }

  function clearScrollIntent() {
    if (scrollIntentTimeoutRef.current) {
      clearTimeout(scrollIntentTimeoutRef.current)
      scrollIntentTimeoutRef.current = null
    }
    scrollIntentRef.current = null
  }

  function beginProgrammaticScroll(intent: 'bottom' | 'message') {
    clearScrollIntent()
    scrollIntentRef.current = intent
    scrollIntentTimeoutRef.current = setTimeout(() => {
      scrollIntentRef.current = null
      scrollIntentTimeoutRef.current = null
      const viewport = scrollViewportRef.current
      if (!viewport) return
      const nextPinned = isNearBottom(viewport)
      isPinnedToBottomRef.current = nextPinned
      setIsPinnedToBottom(nextPinned)
    }, PROGRAMMATIC_SCROLL_MS)
  }

  function disengageStickToBottom() {
    clearScrollIntent()
    isPinnedToBottomRef.current = false
    setIsPinnedToBottom(false)
  }

  function scrollToBottom(behavior: ScrollBehavior) {
    const viewport = scrollViewportRef.current
    if (!viewport) return

    beginProgrammaticScroll('bottom')
    isPinnedToBottomRef.current = true
    setIsPinnedToBottom(true)
    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior,
    })
  }

  function autoScrollToBottom() {
    const viewport = scrollViewportRef.current
    if (!viewport || !isPinnedToBottomRef.current) return

    beginProgrammaticScroll('bottom')
    isPinnedToBottomRef.current = true
    setIsPinnedToBottom(true)
    viewport.scrollTop = viewport.scrollHeight
  }

  function syncToBottomSoon() {
    beginProgrammaticScroll('bottom')
    isPinnedToBottomRef.current = true
    setIsPinnedToBottom(true)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const viewport = scrollViewportRef.current
        if (!viewport) return
        viewport.scrollTop = viewport.scrollHeight
      })
    })
  }

  const activeProviderIdRef = useRef(activeProviderId)
  const modelRef = useRef(model)
  activeProviderIdRef.current = activeProviderId
  modelRef.current = model

  const refreshConversationMemory = useEffectEvent(
    async (providerId: string, nextModel: string) => {
      if (summaryInFlightRef.current || !providerId || !nextModel) {
        return
      }

      const [storedMessages, memory] = await Promise.all([
        getMessages(id),
        getConversationMemory(id),
      ])

      const candidate = getSummaryCandidate(storedMessages, memory)
      if (!candidate) {
        return
      }

      summaryInFlightRef.current = true

      try {
        const response = await fetch('/api/chat/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            model: nextModel,
            existingSummary: memory?.summary,
            messages: candidate.messages,
          }),
        })

        if (!response.ok) {
          throw new Error(await response.text())
        }

        const data = (await response.json()) as { summary?: string }
        if (!data.summary?.trim()) {
          return
        }

        await upsertConversationMemory({
          conversationId: id,
          summary: data.summary.trim(),
          coveredUntilMessageId: candidate.coveredUntilMessageId,
          sourceMessageCount: candidate.sourceMessageCount,
        })
      } catch (error) {
        console.error('[chat] summary refresh failed:', error)
      } finally {
        summaryInFlightRef.current = false
      }
    },
  )

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({ providerId: activeProviderIdRef.current, model: modelRef.current }),
      prepareSendMessagesRequest: async ({
        id: chatId,
        messages: outgoingMessages,
        body,
        trigger,
        messageId,
      }) => {
        const memory = await getConversationMemory(id)
        const nextMessages = getMessagesAfterSummaryBoundary(outgoingMessages, memory)

        return {
          body: {
            ...body,
            id: chatId,
            messages: nextMessages,
            trigger,
            messageId,
            summary: memory?.summary,
          },
        }
      },
    }),
    onFinish: async ({ message }) => {
      if (!Array.isArray(message.parts) || message.parts.length === 0) return

      const content = getMessageText(message)

      await addMessage({
        id: message.id,
        conversationId: id,
        role: 'assistant',
        parts: message.parts,
        content,
        createdAt: Date.now(),
      })
      await updateConversation(id, {})
      void refreshConversationMemory(activeProviderIdRef.current, modelRef.current)
    },
    onError: (error) => {
      toast.error(`请求失败: ${error.message}`)
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  async function persistAndSend(
    content: string,
    providerId = activeProviderIdRef.current,
    nextModel = modelRef.current,
  ) {
    if (!providerId || !nextModel) {
      toast.error('请先选择服务商和模型')
      return
    }

    activeProviderIdRef.current = providerId
    modelRef.current = nextModel
    scrollToBottom('auto')

    const userMessageId = createId({ prefix: 'msg' })
    const createdAt = Date.now()
    const parts = createTextMessageParts(content)

    sendMessage({ id: userMessageId, role: 'user', parts })

    void (async () => {
      try {
        await Promise.all([
          addMessage({
            id: userMessageId,
            conversationId: id,
            role: 'user',
            parts,
            content,
            createdAt,
          }),
          updateConversation(id, { providerId, model: nextModel }),
        ])
      } catch (error) {
        console.error('[chat] failed to persist user message:', error)
        toast.error('消息已发送，但本地保存失败')
      }
    })()
  }

  const applyConversationModel = useEffectEvent((nextModel: string) => {
    setModel(nextModel)
  })

  const sendPendingConversationMessage = useEffectEvent(
    async (content: string, providerId: string, nextModel: string) => {
      await persistAndSend(content, providerId, nextModel)
    },
  )

  useEffect(() => {
    setIsPinnedToBottom(true)

    async function loadConversation() {
      const pendingMessage = takePendingMessage(id)
      setPendingFirstMessage(pendingMessage)

      const [conversation, storedMessages] = await Promise.all([
        getConversation(id),
        getMessages(id),
      ])

      if (conversation) {
        setActiveProviderId(conversation.providerId)
        applyConversationModel(conversation.model)
        activeProviderIdRef.current = conversation.providerId
        modelRef.current = conversation.model
      }

      setMessages(
        storedMessages.map((message) => ({
          id: message.id,
          role: message.role as 'user' | 'assistant',
          parts: message.parts,
        })),
      )
      syncToBottomSoon()

      if (conversation) {
        void refreshConversationMemory(conversation.providerId, conversation.model)
      }

      if (pendingMessage && storedMessages.length === 0 && conversation) {
        await sendPendingConversationMessage(
          pendingMessage,
          conversation.providerId,
          conversation.model,
        )
      }
    }

    void loadConversation()
  }, [id, setActiveProviderId, setMessages])

  useEffect(() => {
    if (!pendingFirstMessage) {
      return
    }

    if (messages.some((message) => message.role === 'user')) {
      setPendingFirstMessage(null)
    }
  }, [messages, pendingFirstMessage])

  useEffect(() => {
    function handleScroll() {
      const viewport = scrollViewportRef.current
      if (!viewport) return

      const atBottom = isNearBottom(viewport)

      if (scrollIntentRef.current === 'bottom') {
        if (atBottom) {
          clearScrollIntent()
          isPinnedToBottomRef.current = true
          setIsPinnedToBottom(true)
        }
        return
      }

      if (scrollIntentRef.current === 'message') {
        return
      }

      isPinnedToBottomRef.current = atBottom
      setIsPinnedToBottom(atBottom)
    }

    function handleUserWheel(event: WheelEvent) {
      if (scrollIntentRef.current) return
      const viewport = scrollViewportRef.current
      if (!viewport) return

      const tryingToLeaveBottom = event.deltaY < 0 || !isNearBottom(viewport)
      if (tryingToLeaveBottom) {
        disengageStickToBottom()
      }
    }

    function handleTouchMove() {
      if (scrollIntentRef.current) return
      disengageStickToBottom()
    }

    handleScroll()
    const viewport = scrollViewportRef.current
    if (!viewport) return

    viewport.addEventListener('scroll', handleScroll, { passive: true })
    viewport.addEventListener('wheel', handleUserWheel, { passive: true })
    viewport.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      viewport.removeEventListener('scroll', handleScroll)
      viewport.removeEventListener('wheel', handleUserWheel)
      viewport.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  useEffect(() => {
    return () => clearScrollIntent()
  }, [])

  async function handleSend(content: string) {
    await persistAndSend(content)
  }

  async function handleModelChange(nextModel: string) {
    setModel(nextModel)
    await updateConversation(id, { providerId: activeProviderId, model: nextModel })
  }

  const displayMessages = [
    ...(pendingFirstMessage && messages.length === 0
      ? [
          {
            id: `pending-first-message:${id}`,
            conversationId: id,
            role: 'user' as const,
            parts: createTextMessageParts(pendingFirstMessage),
            content: pendingFirstMessage,
            createdAt: -1,
          },
        ]
      : []),
    ...messages.map((message: UIMessage, index) => ({
      id: message.id,
      conversationId: id,
      role: message.role as 'user' | 'assistant',
      parts: message.parts,
      content: getMessageText(message),
      createdAt: index,
    })),
  ]
  const userMessages = displayMessages.filter((message) => message.role === 'user')
  const userMessageLookup = `|${userMessages.map((message) => message.id).join('|')}|`
  const latestUserMessageId = userMessages[userMessages.length - 1]?.id

  const streamingMessage = isLoading ? messages[messages.length - 1] : undefined
  const streaming =
    streamingMessage?.role === 'assistant' ? getMessageText(streamingMessage) : undefined

  const activeUserMessageIdRef = useRef(activeUserMessageId)
  activeUserMessageIdRef.current = activeUserMessageId

  useEffect(() => {
    if (!latestUserMessageId) {
      setActiveUserMessageId(undefined)
      setIsNavigatorOpen(false)
      return
    }

    const current = activeUserMessageIdRef.current
    if (!current || !userMessageLookup.includes(`|${current}|`)) {
      setActiveUserMessageId(latestUserMessageId)
    }
  }, [latestUserMessageId, userMessageLookup])

  function registerUserMessage(messageId: string, node: HTMLDivElement | null) {
    if (node) {
      userMessageRefs.current[messageId] = node
      return
    }

    delete userMessageRefs.current[messageId]
  }

  function handleSelectUserMessage(messageId: string) {
    setActiveUserMessageId(messageId)
    const target = userMessageRefs.current[messageId]

    if (!target) return

    beginProgrammaticScroll('message')
    isPinnedToBottomRef.current = false
    setIsPinnedToBottom(false)
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    })
  }

  return (
    <div className="bg-background relative flex h-full min-h-0 flex-col">
      <div className="p-4">
        <ModelSelector model={model} onChange={handleModelChange} />
      </div>
      <div ref={scrollViewportRef} className="min-h-0 flex-1 overflow-y-auto">
        <MessageList
          messages={isLoading ? displayMessages.slice(0, -1) : displayMessages}
          streaming={isLoading ? streaming : undefined}
          stickToBottom={isPinnedToBottom}
          scrollViewportRef={scrollViewportRef}
          onAutoScrollToBottom={autoScrollToBottom}
          onRegisterUserMessage={registerUserMessage}
          onVisibleUserMessageChange={setActiveUserMessageId}
        />
      </div>
      <MessageInput
        onSend={handleSend}
        disabled={!activeProviderId || !model}
        isStreaming={isLoading}
        onStop={stop}
      />
      <UserMessageRail
        items={userMessages}
        activeId={activeUserMessageId}
        open={isNavigatorOpen}
        onOpenChange={setIsNavigatorOpen}
        onSelect={handleSelectUserMessage}
      />
      {!isPinnedToBottom && (
        <div className="absolute right-6 bottom-24 z-30">
          <Button
            size="icon-lg"
            className="rounded-full shadow-[0_18px_40px_-24px_rgba(15,23,42,0.7)]"
            onClick={() => scrollToBottom('smooth')}
            aria-label="回到底部"
          >
            <ArrowDown className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}