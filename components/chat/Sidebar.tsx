'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ProviderSettingsSheet } from '@/components/chat/ProviderSettingsSheet'
import { PenSquare, Settings, MoreHorizontal, Trash2, ChevronLeft } from 'lucide-react'
import Image from 'next/image'
import { getConversations, deleteConversation, type Conversation } from '@/lib/db/conversations'

export function ChatSidebar() {
  const router = useRouter()
  const params = useParams()
  const currentId = params?.id as string | undefined
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === 'collapsed'

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)

  const loadConversations = useCallback(() => {
    return getConversations().then(setConversations)
  }, [])

  useEffect(() => {
    void loadConversations()

    function handleConversationsChanged() {
      void loadConversations()
    }

    window.addEventListener('conversations:changed', handleConversationsChanged)
    return () => window.removeEventListener('conversations:changed', handleConversationsChanged)
  }, [currentId, loadConversations])

  async function handleDeleteConv(id: string) {
    await deleteConversation(id)
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (currentId === id) router.push('/chat')
  }

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="group/header flex items-center justify-between px-2 py-1.5">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex min-w-0 items-center gap-2 overflow-hidden text-left"
            >
              <Image src="/favicon.svg" alt="logo" width={22} height={22} className="shrink-0" />
              {!collapsed && <span className="truncate text-sm font-semibold">fluxp</span>}
            </button>
            <button
              onClick={toggleSidebar}
              className={`hover:bg-muted rounded p-1 transition-opacity ${
                collapsed
                  ? 'opacity-0 group-hover/header:opacity-100'
                  : 'opacity-0 group-hover/header:opacity-100'
              }`}
              title={collapsed ? '展开' : '折叠'}
            >
              <ChevronLeft
                className={`size-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="新建对话" onClick={() => router.push('/chat')}>
                <PenSquare className="size-4" />
                <span>新建对话</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>历史对话</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {conversations.map((conv) => (
                  <SidebarMenuItem key={conv.id}>
                    <SidebarMenuButton
                      isActive={currentId === conv.id}
                      onClick={() => router.push(`/chat/${conv.id}`)}
                      tooltip={conv.title || '新对话'}
                    >
                      <span className="truncate">{conv.title || '新对话'}</span>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <SidebarMenuAction showOnHover>
                            <MoreHorizontal className="size-3" />
                          </SidebarMenuAction>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteConv(conv.id)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="设置" onClick={() => setSettingsOpen(true)}>
                <Settings className="size-4" />
                <span>设置</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <ProviderSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
