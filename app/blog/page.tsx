import Link from 'next/link'
import { getAllPosts } from '@/lib/blog/mdx'
import { Badge } from '@/components/ui/badge'

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Blog</h1>
      {posts.length === 0 && (
        <p className="text-muted-foreground">暂无文章。</p>
      )}
      <div className="flex flex-col gap-6">
        {posts.map(post => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col gap-1 rounded-lg border p-5 transition-colors hover:bg-muted/50">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold group-hover:underline">{post.title}</h2>
              <span className="shrink-0 text-xs text-muted-foreground">{post.date}</span>
            </div>
            {post.excerpt && <p className="text-sm text-muted-foreground">{post.excerpt}</p>}
            {post.tags && (
              <div className="flex flex-wrap gap-1 pt-1">
                {post.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
              </div>
            )}
          </Link>
        ))}
      </div>
    </main>
  )
}
