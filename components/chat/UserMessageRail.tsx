'use client'

import { cn } from '@/lib/utils'

type UserMessageItem = {
  id: string
  content: string
}

type Props = {
  items: UserMessageItem[]
  activeId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (id: string) => void
}

function getPreview(content: string) {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 42) return normalized
  return `${normalized.slice(0, 42)}...`
}

export function UserMessageRail({ items, activeId, open, onOpenChange, onSelect }: Props) {
  if (items.length === 0) return null

  return (
    <div className="pointer-events-none fixed top-1/2 right-5 z-30 hidden -translate-y-1/2 md:block">
      <div className="pointer-events-auto flex items-center gap-3">
        {open && (
          <div className="border-border/70 bg-background/96 w-72 overflow-hidden rounded-[24px] border p-2 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.4)] backdrop-blur">
            <div className="max-h-[26rem] overflow-y-auto">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item.id)
                    onOpenChange(false)
                  }}
                  className={cn(
                    'flex w-full items-start rounded-[20px] px-3 py-3 text-left transition-colors',
                    item.id === activeId
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  <span className="line-clamp-2 text-sm leading-5">{getPreview(item.content)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          className="flex max-h-[38vh] flex-col items-end gap-1.5 rounded-full px-1 py-2"
          aria-label={open ? '收起消息列表' : '展开消息列表'}
        >
          {items.map((item, index) => (
            <span
              key={item.id}
              className={cn(
                'block h-[3px] rounded-full transition-all',
                item.id === activeId ? 'bg-foreground w-7' : 'bg-border w-7',
              )}
              aria-hidden="true"
              title={`第 ${index + 1} 条用户消息`}
            />
          ))}
        </button>
      </div>
    </div>
  )
}
