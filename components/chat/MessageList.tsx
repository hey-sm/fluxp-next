'use client'

import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { Streamdown } from 'streamdown'
import { createCodePlugin } from '@streamdown/code'
import { math } from '@streamdown/math'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/db/messages'
import { ChatThinkingLoader } from '@/components/chat/ChatThinkingLoader'
import 'katex/dist/katex.min.css'

type Props = {
  messages: Message[]
  streaming?: string
  stickToBottom?: boolean
  scrollViewportRef?: RefObject<HTMLDivElement | null>
  onAutoScrollToBottom?: () => void
  onRegisterUserMessage?: (id: string, node: HTMLDivElement | null) => void
  onVisibleUserMessageChange?: (id: string) => void
}

const code = createCodePlugin({
  themes: ['github-light', 'github-light'],
})

const STREAMDOWN_PLUGINS = {
  code,
  math,
} as const

function AssistantLoading() {
  return <ChatThinkingLoader />
}

function MarkdownContent({
  content,
  messageId,
  streaming = false,
}: {
  content: string
  messageId: string
  streaming?: boolean
}) {
  if (!content) {
    return streaming ? <AssistantLoading /> : null
  }

  return (
    <Streamdown
      key={`${messageId}:${streaming ? 'streaming' : 'final'}`}
      mode={streaming ? 'streaming' : 'static'}
      plugins={STREAMDOWN_PLUGINS}
      shikiTheme={['github-light', 'github-light']}
      controls={{
        code: {
          copy: true,
          download: false,
        },
        table: false,
        mermaid: false,
      }}
      lineNumbers={false}
      className="text-foreground text-[15px] leading-7"
    >
      {content}
    </Streamdown>
  )
}

export function MessageList({
  messages,
  streaming,
  stickToBottom = true,
  scrollViewportRef,
  onAutoScrollToBottom,
  onRegisterUserMessage,
  onVisibleUserMessageChange,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  const userMessageNodesRef = useRef(new Map<string, HTMLDivElement>())
  const animationFrameRef = useRef<number | null>(null)

  function cancelScheduledScroll() {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  const scheduleScrollToBottom = useCallback(() => {
    cancelScheduledScroll()

    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = requestAnimationFrame(() => {
        animationFrameRef.current = null
        if (onAutoScrollToBottom) {
          onAutoScrollToBottom()
          return
        }

        const viewport = scrollViewportRef?.current
        if (!viewport) return
        viewport.scrollTop = viewport.scrollHeight
      })
    })
  }, [onAutoScrollToBottom, scrollViewportRef])

  useLayoutEffect(() => {
    if (!stickToBottom) return
    scheduleScrollToBottom()
  }, [messages.length, scheduleScrollToBottom, stickToBottom, streaming])

  useEffect(() => {
    if (!stickToBottom) {
      cancelScheduledScroll()
    }
  }, [stickToBottom])

  useEffect(() => {
    const viewport = scrollViewportRef?.current
    const content = contentRef.current
    if (!viewport || !content || !stickToBottom) return

    const resizeObserver = new ResizeObserver(() => {
      scheduleScrollToBottom()
    })

    resizeObserver.observe(content)

    const mutationObserver = new MutationObserver(() => {
      scheduleScrollToBottom()
    })

    mutationObserver.observe(content, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [messages.length, scheduleScrollToBottom, scrollViewportRef, stickToBottom, streaming])

  useEffect(() => {
    return () => cancelScheduledScroll()
  }, [])

  useEffect(() => {
    if (!onVisibleUserMessageChange || userMessageNodesRef.current.size === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        const nextId = visibleEntries[0]?.target.getAttribute('data-user-message-id')
        if (nextId) onVisibleUserMessageChange(nextId)
      },
      {
        root: scrollViewportRef?.current ?? null,
        threshold: [0.25, 0.5, 0.75],
        rootMargin: '-12% 0px -55% 0px',
      },
    )

    userMessageNodesRef.current.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [messages, onVisibleUserMessageChange, scrollViewportRef])

  function setUserMessageNode(id: string, node: HTMLDivElement | null) {
    if (node) {
      userMessageNodesRef.current.set(id, node)
    } else {
      userMessageNodesRef.current.delete(id)
    }

    onRegisterUserMessage?.(id, node)
  }

  return (
    <div
      ref={contentRef}
      className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-5 py-8 sm:px-8 md:px-10 lg:px-14 xl:px-20"
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn('w-full', msg.role === 'user' ? 'justify-end' : 'justify-start')}
        >
          {msg.role === 'user' ? (
            <div className="flex justify-end">
              <div
                ref={(node) => setUserMessageNode(msg.id, node)}
                data-user-message-id={msg.id}
                className="border-border/60 bg-muted/70 text-foreground max-w-[min(38rem,78%)] rounded-[28px] border px-5 py-3 text-[15px] leading-6 whitespace-pre-wrap shadow-[0_16px_40px_-30px_rgba(15,23,42,0.45)]"
              >
                {msg.content}
              </div>
            </div>
          ) : (
            <div className="text-foreground mx-auto w-full max-w-[820px] text-[15px] leading-7">
              <MarkdownContent content={msg.content} messageId={msg.id} />
            </div>
          )}
        </div>
      ))}
      {streaming !== undefined && (
        <div className="text-foreground mx-auto flex w-full max-w-[820px] justify-start text-[15px] leading-7">
          <MarkdownContent content={streaming} messageId="streaming-assistant" streaming />
        </div>
      )}
    </div>
  )
}
