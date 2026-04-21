'use client'

import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, Sparkles } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import type { UiShowcaseNavigationCategory } from '@/components/ui-showcase/registry'
import { cn } from '@/lib/utils'

type UiSidebarProps = {
  navigation: readonly UiShowcaseNavigationCategory[]
}

const activeItemClassName =
  'bg-sidebar-accent/95 text-sidebar-foreground ring-sidebar-border/80 shadow-sm ring-1'

export function UiSidebar({ navigation }: UiSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === 'collapsed'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="group/header flex items-center justify-between px-2 py-1.5">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex min-w-0 items-center gap-2 overflow-hidden text-left"
          >
            <Image
              src="/favicon.svg"
              alt="fluxp logo"
              width={22}
              height={22}
              className="shrink-0"
            />
            {!collapsed && <span className="truncate text-sm font-semibold">fluxp ui</span>}
          </button>
          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(
              'hover:bg-muted rounded p-1 transition-opacity',
              'opacity-0 group-hover/header:opacity-100',
            )}
            title={collapsed ? '展开' : '折叠'}
          >
            <ChevronLeft className={cn('size-4 transition-transform', collapsed && 'rotate-180')} />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((category) => (
          <SidebarGroup key={category.id}>
            <SidebarGroupLabel className="tracking-[0.16em] uppercase">
              {category.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {category.items.map((item) => {
                  const href = `/ui/${item.slug}`
                  const isActive = pathname === href

                  return (
                    <SidebarMenuItem key={item.slug}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(isActive && activeItemClassName)}
                        onClick={() => router.push(href)}
                      >
                        <Sparkles className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
