import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BlogContentLayout } from '@/components/blog/BlogContentLayout'
import { Badge } from '@/components/ui/badge'
import { getBlogHomeData } from '@/lib/blog/mdx'

export default function BlogPage() {
  const { featuredDocs, sections } = getBlogHomeData()

  return (
    <BlogContentLayout>
      <main className="w-full">
        <section className="border-border bg-card rounded-[2rem] border px-6 py-10 shadow-sm md:px-10">
          <p className="text-muted-foreground text-sm font-medium tracking-[0.18em] uppercase">
            fluxp docs
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">只保留阅读最需要的东西</h1>
          <p className="text-muted-foreground mt-4 text-base leading-7">
            左边是文档导航，右边是当前页面目录，中间只负责内容本身。这里会持续整理 Vue、React
            和日常学习记录。
          </p>
          {featuredDocs.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {featuredDocs.slice(0, 3).map((doc) => (
                <Link
                  key={doc.href}
                  href={doc.href}
                  className="border-border hover:bg-muted/60 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors"
                >
                  <span>{doc.title}</span>
                  <ArrowRight className="size-4" />
                </Link>
              ))}
            </div>
          )}
        </section>

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
