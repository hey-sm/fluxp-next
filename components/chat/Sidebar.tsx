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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProviderForm, type ProviderFormData } from '@/components/settings/ProviderForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PenSquare, Settings, MoreHorizontal, Trash2, Plus, Pencil, LogOut, ChevronLeft } from 'lucide-react'
import Image from 'next/image'
import { getConversations, deleteConversation, type Conversation } from '@/lib/db/conversations'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'
import { useStore } from '@/lib/store'

type Provider = ProviderFormData & { id: string }
type ProviderTab = 'claude' | 'openai'

export function ChatSidebar() {
  const router = useRouter()
  const params = useParams()
  const currentId = params?.id as string | undefined
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === 'collapsed'

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [providerTab, setProviderTab] = useState<ProviderTab>('openai')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Provider | undefined>(undefined)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const { activeProviderId, setActiveProviderId } = useStore()

  const loadConversations = useCallback(() => {
    return getConversations().then(setConversations)
  }, [])

  const loadProviders = useCallback(async () => {
    const res = await fetch('/api/providers?all=1')
    setProviders(await res.json())
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    void loadConversations()

    function handleConversationsChanged() {
      void loadConversations()
    }

    window.addEventListener('conversations:changed', handleConversationsChanged)
    return () => window.removeEventListener('conversations:changed', handleConversationsChanged)
  }, [currentId, loadConversations])

  useEffect(() => {
    void loadProviders()
  }, [loadProviders, user])

  async function handleDeleteConv(id: string) {
    await deleteConversation(id)
    setConversations(prev => prev.filter(c => c.id !== id))
    if (currentId === id) router.push('/chat')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('登录成功')
      setUser((await supabase.auth.getUser()).data.user)
      setLoginDialogOpen(false)
      setLoginPassword('')
      void loadProviders()
    }
    setLoginLoading(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    void loadProviders()
    toast.success('已退出登录')
  }

  async function handleSaveProvider(data: ProviderFormData, id?: string) {
    if (id) {
      await fetch(`/api/providers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } else {
      await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    }
    loadProviders()
  }

  async function handleDeleteProvider(id: string) {
    if (!confirm('确认删除此服务商？')) return
    await fetch(`/api/providers/${id}`, { method: 'DELETE' })
    loadProviders()
  }

  function handleSettingsOpenChange(nextOpen: boolean) {
    setSettingsOpen(nextOpen)
  }

  function getUserDisplayName(currentUser: User | null) {
    if (!currentUser) return ''

    const metadataCandidates = [
      currentUser.user_metadata?.name,
      currentUser.user_metadata?.full_name,
      currentUser.user_metadata?.user_name,
    ]
    const metadataName = metadataCandidates.find(
      (value): value is string => typeof value === 'string' && value.trim().length > 0
    )

    if (metadataName) {
      return metadataName.trim()
    }

    const email = currentUser.email ?? ''
    return email.split('@')[0] || '用户'
  }

  const visibleProviders = providers.filter((provider) => provider.type === providerTab)

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="group/header flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2 overflow-hidden">
              <Image src="/favicon.svg" alt="logo" width={22} height={22} className="shrink-0" />
              {!collapsed && <span className="font-semibold text-sm truncate">fluxp</span>}
            </div>
            <button
              onClick={toggleSidebar}
              className={`rounded p-1 hover:bg-muted transition-opacity ${
                collapsed
                  ? 'opacity-0 group-hover/header:opacity-100'
                  : 'opacity-0 group-hover/header:opacity-100'
              }`}
              title={collapsed ? '展开' : '折叠'}
            >
              <ChevronLeft className={`size-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="新建对话"
                onClick={() => router.push('/chat')}
              >
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
                {conversations.map(conv => (
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
                          <Trash2 className="mr-2 size-4" />删除
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
              <SidebarMenuButton
                tooltip="设置"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="size-4" />
                <span>设置</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Settings Sheet */}
      <Sheet open={settingsOpen} onOpenChange={handleSettingsOpenChange}>
        <SheetContent side="left" showCloseButton={false} className="w-[420px] flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between gap-4">
              <SheetTitle>API 服务商</SheetTitle>
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="max-w-36 truncate text-sm text-muted-foreground">
                    {getUserDisplayName(user)}
                  </span>
                  <button
                    className="rounded p-1 hover:bg-muted"
                    title="退出登录"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-3.5 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setLoginDialogOpen(true)}>
                  管理
                </Button>
              )}
            </div>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-0 overflow-hidden">
            <div className="flex items-center justify-between border-b px-6">
              <div className="flex items-center">
                {(['claude', 'openai'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setProviderTab(tab)}
                    className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                      providerTab === tab
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab === 'claude' ? 'Claude' : 'OpenAI'}
                  </button>
                ))}
              </div>

              {user && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2.5"
                  onClick={() => {
                    setEditing(undefined)
                    setFormOpen(true)
                  }}
                >
                  <Plus className="mr-1 size-4" />
                  新增供应商
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {!user && (
                <p className="mb-4 text-xs text-muted-foreground">登录后可新增、编辑和删除服务商</p>
              )}

              <div className="flex flex-col gap-3">
                {visibleProviders.map((provider) => (
                  <div
                    key={provider.id}
                    onClick={() => setActiveProviderId(provider.id)}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                      activeProviderId === provider.id ? 'bg-accent border-primary' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{provider.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {provider.type} · {provider.models?.join(', ')}
                      </span>
                    </div>

                    {user && (
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="rounded p-1 hover:bg-muted"
                          onClick={() => {
                            setEditing(provider)
                            setFormOpen(true)
                          }}
                        >
                          <Pencil className="size-3.5 text-muted-foreground" />
                        </button>
                        <button
                          className="rounded p-1 hover:bg-muted"
                          onClick={() => handleDeleteProvider(provider.id)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {visibleProviders.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {user ? '当前分类下暂无服务商，点击右上角新增' : '当前分类下暂无可用服务商'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>登录</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sidebar-login-email">邮箱</Label>
              <Input
                id="sidebar-login-email"
                type="email"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sidebar-login-password">密码</Label>
              <Input
                id="sidebar-login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="sm:justify-end border-0 bg-transparent">
              <Button type="submit" disabled={loginLoading}>
                {loginLoading ? '登录中...' : '登录'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ProviderForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveProvider}
      />
    </>
  )
}
