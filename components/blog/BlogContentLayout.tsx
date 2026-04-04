import type { BlogHeading } from '@/lib/blog/mdx'
import { TableOfContents } from '@/components/blog/TableOfContents'

type BlogContentLayoutProps = {
  headings?: BlogHeading[]
  children: React.ReactNode
}

export function BlogContentLayout({ headings = [], children }: BlogContentLayoutProps) {
  const hasHeadings = headings.length > 0

  return (
    <div className="w-full lg:h-[100dvh] lg:overflow-hidden">
      <div
        className={
          hasHeadings
            ? 'grid py-6 lg:h-full lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-0'
            : 'grid py-6 lg:h-full lg:grid-cols-[minmax(0,1fr)] lg:py-0'
        }
      >
        <div className="scrollbar-hidden min-w-0 px-4 md:px-5 lg:h-[100dvh] lg:overflow-y-auto lg:px-20 lg:py-20">
          <TableOfContents
            headings={headings}
            className="border-border bg-card mb-8 rounded-2xl border p-4 lg:hidden"
          />
          {children}
        </div>
        {hasHeadings ? (
          <aside className="hidden lg:block lg:h-[100dvh] lg:overflow-hidden">
            <TableOfContents
              headings={headings}
              className="scrollbar-thin fixed top-0 right-0 h-[100dvh] w-[22rem] overflow-y-auto py-6"
            />
          </aside>
        ) : null}
      </div>
    </div>
  )
}
