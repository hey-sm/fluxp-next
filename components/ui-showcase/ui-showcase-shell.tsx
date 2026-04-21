'use client'

import { usePathname } from 'next/navigation'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { UiSidebar } from '@/components/ui-showcase/ui-sidebar'
import type { UiShowcaseNavigationCategory } from '@/components/ui-showcase/registry'

type UiShowcaseShellProps = {
  navigation: readonly UiShowcaseNavigationCategory[]
  children: React.ReactNode
}

function findCurrentItem(
  navigation: readonly UiShowcaseNavigationCategory[],
  pathname: string,
): { title: string; description: string } {
  const activeItem = navigation
    .flatMap((category) => category.items)
    .find((item) => `/ui/${item.slug}` === pathname)

  if (!activeItem) {
    return {
      title: 'UI Showcase',
      description: '组件展示中心',
    }
  }

  return {
    title: activeItem.title,
    description: activeItem.description,
  }
}

export function UiShowcaseShell({ navigation, children }: UiShowcaseShellProps) {
  const pathname = usePathname()
  const currentItem = findCurrentItem(navigation, pathname)

  return (
    <SidebarProvider>
      <UiSidebar navigation={navigation} />
      <SidebarInset className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f9fbff_0%,#f5f8ff_45%,#f8fbff_100%)]">
        <header className="bg-background/92 sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 backdrop-blur md:hidden">
          <SidebarTrigger />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">{currentItem.title}</p>
            <p className="truncate text-xs text-slate-500">{currentItem.description}</p>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
