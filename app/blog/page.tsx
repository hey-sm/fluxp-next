import Link from 'next/link'
import { BlogContentLayout } from '@/components/blog/BlogContentLayout'
import { Badge } from '@/components/ui/badge'
import { getBlogHomeData } from '@/lib/blog/mdx'

export default function BlogPage() {
  const { sections } = getBlogHomeData()

  return (
    <BlogContentLayout>
      <main className="w-full">
        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title} className="border-border rounded-3xl border p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <Badge variant="secondary">{section.count}</Badge>
              </div>
              <div className="mt-4 space-y-2">
                {section.items.slice(0, 4).map((doc) => (
                  <Link
                    key={doc.href}
                    href={doc.href}
                    className="hover:bg-muted/60 flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors"
                  >
                    <span className="truncate">{doc.title}</span>
                    <span className="text-muted-foreground shrink-0 pl-3">{doc.date}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </BlogContentLayout>
  )
}
