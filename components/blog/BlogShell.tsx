'use client'

import { usePathname } from 'next/navigation'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import type { BlogNavItem } from '@/lib/blog/mdx'
import { BlogSidebar } from '@/components/blog/BlogSidebar'

type BlogShellProps = {
  navigation: BlogNavItem[]
  children: React.ReactNode
}

function findCurrentTitle(navigation: BlogNavItem[], pathname: string): string {
  if (pathname === '/blog') {
    return '首页'
  }

  for (const item of navigation) {
    if (item.href === pathname) {
      return item.title
    }

    const nestedTitle = findCurrentTitle(item.children, pathname)
    if (nestedTitle && nestedTitle !== 'Blog') {
      return nestedTitle
    }
  }

  return 'Blog'
}

export function BlogShell({ navigation, children }: BlogShellProps) {
  const pathname = usePathname()
  const currentTitle = findCurrentTitle(navigation, pathname)

  return (
    <SidebarProvider>
      <BlogSidebar navigation={navigation} />
      <SidebarInset className="min-h-screen overflow-x-hidden">
        <header className="bg-background/95 sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 backdrop-blur md:hidden">
          <SidebarTrigger />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{currentTitle}</p>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
