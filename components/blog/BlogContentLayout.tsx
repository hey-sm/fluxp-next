import type { BlogHeading } from '@/lib/blog/mdx'
import { TableOfContents } from '@/components/blog/TableOfContents'

type BlogContentLayoutProps = {
  headings?: BlogHeading[]
  children: React.ReactNode
}

export function BlogContentLayout({ headings = [], children }: BlogContentLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-[112rem] px-4 md:px-8 lg:h-[100dvh] lg:overflow-hidden xl:px-10">
      <div className="grid gap-8 py-6 lg:h-full lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-10 lg:py-0">
        <div className="scrollbar-hidden min-w-0 lg:h-[100dvh] lg:overflow-y-auto lg:py-6 lg:pr-6">
          <TableOfContents
            headings={headings}
            className="border-border bg-card mb-8 rounded-2xl border p-4 lg:hidden"
          />
          {children}
        </div>
        <aside className="hidden lg:block lg:h-[100dvh] lg:overflow-hidden lg:py-6">
          <TableOfContents
            headings={headings}
            className="sticky top-6 max-h-[calc(100dvh-3rem)] overflow-y-auto pr-2"
          />
        </aside>
      </div>
    </div>
  )
}
