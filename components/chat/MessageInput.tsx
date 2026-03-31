'use client'

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowUp, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  onSend: (content: string) => void
  disabled?: boolean
  onStop?: () => void
  isStreaming?: boolean
}

export function MessageInput({ onSend, disabled, onStop, isStreaming }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState('')

  const canSend = value.trim().length > 0 && !disabled && !isStreaming

  function syncTextareaHeight(node: HTMLTextAreaElement) {
    node.style.height = '0px'
    node.style.height = `${Math.min(node.scrollHeight, 192)}px`
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setValue(event.target.value)
    syncTextareaHeight(event.target)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const nextValue = value.trim()
    if (!nextValue || disabled || isStreaming) return
    onSend(nextValue)
    setValue('')
    if (ref.current) {
      ref.current.style.height = '0px'
    }
  }

  return (
    <div className="px-3 pb-5 sm:px-4 sm:pb-6">
      <div className="relative mx-auto w-full max-w-[860px]">
        <div className="absolute inset-x-10 bottom-2 h-12 rounded-full bg-black/6 blur-3xl" />
        <div className="bg-background/95 relative flex min-h-14 items-end gap-2.5 rounded-[28px] border border-black/10 px-2.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_40px_-24px_rgba(15,23,42,0.24),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur transition-[border-color,box-shadow,transform] duration-200 ease-out focus-within:-translate-y-px focus-within:border-black/15 focus-within:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_24px_54px_-28px_rgba(15,23,42,0.3),inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-white/12 dark:bg-neutral-950/90 dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_22px_48px_-26px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.04)] dark:focus-within:border-white/18">
          <Textarea
            ref={ref}
            value={value}
            placeholder="有问题，尽管问"
            aria-label="输入消息"
            disabled={disabled || isStreaming}
            className="text-foreground placeholder:text-muted-foreground/80 disabled:text-muted-foreground max-h-48 min-h-9 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2 py-1.5 text-[15px] leading-6 shadow-none focus-visible:ring-0 disabled:bg-transparent"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          {isStreaming ? (
            <Button
              size="icon-lg"
              variant="outline"
              className="bg-background hover:bg-muted shrink-0 rounded-full border-black/10 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-neutral-900"
              onClick={onStop}
              aria-label="停止生成"
            >
              <Square className="size-4 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon-lg"
              className={cn(
                'shrink-0 rounded-full transition-all',
                'bg-foreground text-background hover:bg-foreground/92 border border-black/5 shadow-[0_14px_30px_-18px_rgba(15,23,42,0.75)]',
                'disabled:bg-muted disabled:text-muted-foreground disabled:border-black/0 disabled:shadow-none',
              )}
              onClick={submit}
              disabled={!canSend}
              aria-label="发送消息"
            >
              <ArrowUp className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
