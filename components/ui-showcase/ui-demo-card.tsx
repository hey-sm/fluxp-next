import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type UiDemoCardProps = {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function UiDemoCard({ title, description, children, className }: UiDemoCardProps) {
  return (
    <section
      className={cn(
        'border-border/70 bg-background/80 overflow-hidden rounded-[1.75rem] border shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm',
        className,
      )}
    >
      <div className="border-border/60 flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="px-5 py-6 sm:px-6">{children}</div>
    </section>
  )
}
