import { notFound } from 'next/navigation'
import { getPost, getPostSlugs } from '@/lib/blog/mdx'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'

export async function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }))
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <p className="text-muted-foreground text-sm">{post.date}</p>
        <h1 className="mt-1 text-3xl font-bold">{post.title}</h1>
      </div>
      <article className="[&_code]:bg-muted [&_pre]:bg-muted [&_blockquote]:border-border [&_blockquote]:text-muted-foreground [&_a]:text-primary [&_hr]:border-border max-w-none [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-4 [&_ul]:list-disc [&_ul]:pl-6">
        <MDXRemote
          source={post.content}
          options={{
            mdxOptions: {
              rehypePlugins: [rehypeHighlight, rehypeSlug],
            },
          }}
        />
      </article>
    </main>
  )
}
