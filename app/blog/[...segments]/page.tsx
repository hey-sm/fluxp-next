import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'
import prettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { BlogContentLayout } from '@/components/blog/BlogContentLayout'
import { blogMdxComponents } from '@/components/blog/MdxComponents'
import { getAdjacentBlogDocs, getBlogDocBySegments, getBlogStaticParams } from '@/lib/blog/mdx'

export async function generateStaticParams() {
  return getBlogStaticParams()
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ segments: string[] }>
}) {
  const { segments } = await params
  const doc = getBlogDocBySegments(segments)

  if (!doc) {
    notFound()
  }

  const { previous, next } = getAdjacentBlogDocs(segments)

  return (
    <BlogContentLayout headings={doc.headings}>
      <main className="mx-auto w-full max-w-[min(100%,72rem)]">
        <header className="border-border mb-10 border-b pb-8">
          {doc.date && <p className="text-muted-foreground text-sm">{doc.date}</p>}
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{doc.title}</h1>
          {doc.excerpt && (
            <p className="text-muted-foreground mt-4 text-base leading-7">{doc.excerpt}</p>
          )}
          {doc.tags && doc.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {doc.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <article className="blog-prose">
          <MDXRemote
            source={doc.content}
            components={blogMdxComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [
                  rehypeSlug,
                  [
                    prettyCode,
                    {
                      theme: {
                        light: 'github-light',
                        dark: 'github-dark',
                      },
                      keepBackground: false,
                    },
                  ],
                ],
              },
            }}
          />
        </article>

        {(previous || next) && (
          <nav
            className="border-border mt-14 grid gap-4 border-t pt-8 md:grid-cols-2"
            aria-label="章节导航"
          >
            {previous ? (
              <Link
                href={previous.href}
                className="border-border bg-card hover:border-foreground/25 hover:bg-muted/30 flex min-h-28 flex-col justify-between rounded-2xl border p-5 text-left transition-colors"
              >
                <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
                  <ChevronLeft className="size-4" />
                  上一章
                </span>
                <span className="mt-4 text-base leading-6 font-medium">{previous.title}</span>
              </Link>
            ) : (
              <div className="hidden md:block" />
            )}

            {next ? (
              <Link
                href={next.href}
                className="border-border bg-card hover:border-foreground/25 hover:bg-muted/30 flex min-h-28 flex-col justify-between rounded-2xl border p-5 text-left transition-colors md:items-end md:text-right"
              >
                <span className="text-muted-foreground inline-flex items-center gap-2 text-sm md:flex-row-reverse">
                  <ChevronRight className="size-4" />
                  下一章
                </span>
                <span className="mt-4 text-base leading-6 font-medium">{next.title}</span>
              </Link>
            ) : (
              <div className="hidden md:block" />
            )}
          </nav>
        )}
      </main>
    </BlogContentLayout>
  )
}
