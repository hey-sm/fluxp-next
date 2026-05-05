import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { BlogContentLayout } from '@/components/blog/BlogContentLayout'
import { blogMdxComponents } from '@/components/blog/MdxComponents'
import { buttonVariants } from '@/components/ui/button-variants'
import { getAdjacentBlogDocs, getBlogDocBySegments, getBlogStaticParams } from '@/lib/blog/mdx'
import { cn } from '@/lib/utils'

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
      <main className="w-full">
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
                format: doc.format,
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug, rehypeHighlight],
              },
            }}
          />
        </article>

        {(previous || next) && (
          <nav className="border-border mt-14 border-t pt-8" aria-label="章节导航">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {previous ? (
                <Link
                  href={previous.href}
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'lg' }),
                    'max-w-full min-w-0 rounded-2xl px-5 text-base shadow-none sm:max-w-[45%]',
                  )}
                >
                  <ChevronLeft data-icon="inline-start" />
                  <span className="truncate">{previous.title}</span>
                </Link>
              ) : null}

              {next ? (
                <Link
                  href={next.href}
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'lg' }),
                    'max-w-full min-w-0 rounded-2xl px-5 text-base shadow-none sm:max-w-[45%]',
                    !previous && 'ml-auto',
                  )}
                >
                  <span className="truncate">{next.title}</span>
                  <ChevronRight data-icon="inline-end" />
                </Link>
              ) : null}
            </div>
          </nav>
        )}
      </main>
    </BlogContentLayout>
  )
}
