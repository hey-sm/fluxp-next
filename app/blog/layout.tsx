import type { ReactNode } from 'react'
import './blog.css'
import { BlogShell } from '@/components/blog/BlogShell'
import { getBlogNavigation } from '@/lib/blog/mdx'

export default function BlogLayout({ children }: { children: ReactNode }) {
  const navigation = getBlogNavigation()

  return <BlogShell navigation={navigation}>{children}</BlogShell>
}
