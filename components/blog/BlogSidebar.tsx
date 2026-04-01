'use client'

import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, FileText, FolderOpen } from 'lucide-react'
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import type { BlogNavItem } from '@/lib/blog/mdx'
import { cn } from '@/lib/utils'

type BlogSidebarProps = {
  navigation: BlogNavItem[]
}

const activeItemClassName =
  'bg-sidebar-accent/95 text-sidebar-foreground ring-sidebar-border/80 shadow-sm ring-1'

const nestedToggleClassName =
  'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-left text-sm outline-hidden transition-colors group-data-[collapsible=icon]:hidden focus-visible:ring-2'

function hasActiveDescendant(item: BlogNavItem, pathname: string): boolean {
  if (item.href === pathname) {
    return true
  }

  return item.children.some((child) => hasActiveDescendant(child, pathname))
}

function buildInitialExpandedState(navigation: BlogNavItem[], pathname: string) {
  const nextState: Record<string, boolean> = {}

  function walk(items: BlogNavItem[]) {
    items.forEach((item) => {
      if (!item.isGroup) {
        return
      }

      nextState[item.href] = hasActiveDescendant(item, pathname)
      walk(item.children)
    })
  }

  walk(navigation)
  return nextState
}

function NestedNavigation({
  item,
  pathname,
  onNavigate,
  expandedGroups,
  onToggleGroup,
  nested = false,
}: {
  item: BlogNavItem
  pathname: string
  onNavigate: (href: string) => void
  expandedGroups: Record<string, boolean>
  onToggleGroup: (href: string) => void
  nested?: boolean
}) {
  const isActive = pathname === item.href

  if (!item.isGroup) {
    if (nested) {
      return (
        <SidebarMenuSubItem>
          <SidebarMenuSubButton
            isActive={isActive}
            className={cn(isActive && activeItemClassName)}
            onClick={() => onNavigate(item.href)}
          >
            <span>{item.title}</span>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      )
    }

    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          tooltip={item.title}
          className={cn(isActive && activeItemClassName)}
          onClick={() => onNavigate(item.href)}
        >
          <FileText className="size-4" />
          <span>{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  const isOpen = expandedGroups[item.href] ?? hasActiveDescendant(item, pathname)

  if (nested) {
    return (
      <SidebarMenuSubItem>
        <button
          type="button"
          className={nestedToggleClassName}
          onClick={() => onToggleGroup(item.href)}
          aria-expanded={isOpen}
        >
          <ChevronRight
            className={cn('size-4 shrink-0 transition-transform', isOpen && 'rotate-90')}
          />
          <FolderOpen className="size-4 shrink-0" />
          <span className="truncate">{item.title}</span>
        </button>
        {isOpen && (
          <SidebarMenuSub>
            {item.children.map((child) => (
              <NestedNavigation
                key={child.href}
                item={child}
                pathname={pathname}
                onNavigate={onNavigate}
                expandedGroups={expandedGroups}
                onToggleGroup={onToggleGroup}
                nested
              />
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuSubItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.title}
        onClick={() => onToggleGroup(item.href)}
        aria-expanded={isOpen}
      >
        <ChevronRight
          className={cn('size-4 shrink-0 transition-transform', isOpen && 'rotate-90')}
        />
        <FolderOpen className="size-4 shrink-0" />
        <span>{item.title}</span>
      </SidebarMenuButton>
      {isOpen && (
        <SidebarMenuSub>
          {item.children.map((child) => (
            <NestedNavigation
              key={child.href}
              item={child}
              pathname={pathname}
              onNavigate={onNavigate}
              expandedGroups={expandedGroups}
              onToggleGroup={onToggleGroup}
              nested
            />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
}

export function BlogSidebar({ navigation }: BlogSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === 'collapsed'
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    buildInitialExpandedState(navigation, pathname),
  )

  useEffect(() => {
    const nextState = buildInitialExpandedState(navigation, pathname)

    setExpandedGroups((previousState) => {
      const mergedState = { ...nextState, ...previousState }

      Object.entries(nextState).forEach(([href, isExpanded]) => {
        if (isExpanded) {
          mergedState[href] = true
        }
      })

      return mergedState
    })
  }, [navigation, pathname])

  function toggleGroup(href: string) {
    setExpandedGroups((previousState) => ({
      ...previousState,
      [href]: !(previousState[href] ?? false),
    }))
  }

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
            {!collapsed && <span className="truncate text-sm font-semibold">fluxp docs</span>}
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
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === '/blog'}
                  tooltip="首页"
                  className={cn(pathname === '/blog' && activeItemClassName)}
                  onClick={() => router.push('/blog')}
                >
                  <span>首页</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {navigation.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Documents</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <NestedNavigation
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onNavigate={(href) => router.push(href)}
                    expandedGroups={expandedGroups}
                    onToggleGroup={toggleGroup}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}

