'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProviderForm, type ProviderFormData } from '@/components/chat/ProviderForm'
import {
  loadProviderCatalog,
  type ProviderListItem,
  useProviderCatalog,
} from '@/lib/provider-client'
import { createClient, hasSupabaseBrowserEnv } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'
import { LogOut, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'

type EditableProvider = Partial<ProviderFormData> & { id: string }
type ProviderTab = 'claude' | 'openai'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getUserDisplayName(user: User | null) {
  if (!user) {
    return ''
  }

  if (typeof user.email === 'string' && user.email.trim().length > 0) {
    return user.email.trim()
  }

  const metadataCandidates = [
    user.user_metadata?.name,
    user.user_metadata?.full_name,
    user.user_metadata?.user_name,
  ]
  const metadataName = metadataCandidates.find(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  )

  if (metadataName) {
    return metadataName.trim()
  }

  return '用户'
}

function isAdminUser(user: User | null) {
  return user?.app_metadata?.role === 'admin'
}

async function getErrorMessage(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as unknown

  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    typeof payload.error === 'string'
  ) {
    return payload.error
  }

  return fallback
}

function toEditableProvider(provider: ProviderListItem): EditableProvider {
  return {
    ...provider,
    base_url: provider.base_url ?? '',
    api_key: '',
  }
}

export function ProviderSettingsSheet({ open, onOpenChange }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [providerTab, setProviderTab] = useState<ProviderTab>('openai')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EditableProvider | undefined>(undefined)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const { activeProviderId, setActiveProviderId } = useStore()
  const authAvailable = hasSupabaseBrowserEnv()
  const isAdmin = isAdminUser(user)
  const { providers, loading: providersLoading } = useProviderCatalog(isAdmin)

  useEffect(() => {
    if (authAvailable) {
      return
    }

    setUser(null)
  }, [authAvailable])

  useEffect(() => {
    if (!authAvailable) {
      return
    }

    const supabase = createClient()
    if (!supabase) {
      return
    }

    let cancelled = false

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) {
        setUser(data.user)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (!cancelled) {
        setUser(session?.user ?? null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [authAvailable])

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()

    if (!authAvailable) {
      toast.error('未配置 Supabase 登录环境变量')
      return
    }

    const supabase = createClient()
    if (!supabase) {
      toast.error('未配置 Supabase 登录环境变量')
      return
    }

    setLoginLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (authError) {
        toast.error(authError.message)
        return
      }

      const nextUser = (await supabase.auth.getUser()).data.user
      setUser(nextUser)
      setLoginDialogOpen(false)
      setLoginPassword('')
      toast.success(isAdminUser(nextUser) ? '登录成功' : '已登录，但当前账号没有管理权限')
      void loadProviderCatalog(isAdminUser(nextUser), { force: true }).catch((loadError) => {
        console.error('[providers] load failed after login:', loadError)
      })
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    if (!supabase) {
      toast.error('未配置 Supabase 登录环境变量')
      return
    }

    await supabase.auth.signOut()
    setUser(null)
    void loadProviderCatalog(false, { force: true }).catch((error) => {
      console.error('[providers] load failed after logout:', error)
    })
    toast.success('已退出登录')
  }

  async function handleSaveProvider(data: ProviderFormData, id?: string) {
    if (!isAdmin) {
      toast.error('当前账号没有管理权限')
      return
    }

    try {
      if (id) {
        const response = await fetch(`/api/providers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!response.ok) {
          throw new Error(await getErrorMessage(response, '更新供应商失败'))
        }
      } else {
        const response = await fetch('/api/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!response.ok) {
          throw new Error(await getErrorMessage(response, '新增供应商失败'))
        }
      }

      await Promise.all([
        loadProviderCatalog(true, { force: true }),
        loadProviderCatalog(false, { force: true }),
      ])
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存供应商失败'
      toast.error(message)
      throw error
    }
  }

  async function handleDeleteProvider(id: string) {
    if (!isAdmin) {
      toast.error('当前账号没有管理权限')
      return
    }

    if (!confirm('确认删除此服务商？')) {
      return
    }

    try {
      const response = await fetch(`/api/providers/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, '删除供应商失败'))
      }

      await Promise.all([
        loadProviderCatalog(true, { force: true }),
        loadProviderCatalog(false, { force: true }),
      ])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除供应商失败')
    }
  }

  function handleProviderCardKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>,
    providerId: string,
  ) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    setActiveProviderId(providerId)
  }

  const visibleProviders = providers.filter((provider) => provider.type === providerTab)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="flex w-[420px] flex-col gap-0 p-0"
        >
          <SheetHeader className="border-b px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <SheetTitle>API 服务商</SheetTitle>
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="flex min-w-0 flex-col items-end">
                    <span className="text-muted-foreground max-w-44 truncate text-sm">
                      {getUserDisplayName(user)}
                    </span>
                    <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
                      <ShieldCheck className="size-3" />
                      {isAdmin ? '管理员' : '只读账号'}
                    </span>
                  </div>
                  <button
                    className="hover:bg-muted rounded p-1"
                    title="退出登录"
                    onClick={handleLogout}
                  >
                    <LogOut className="text-muted-foreground size-3.5" />
                  </button>
                </div>
              ) : authAvailable ? (
                <Button size="sm" variant="outline" onClick={() => setLoginDialogOpen(true)}>
                  管理
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  管理不可用
                </Button>
              )}
            </div>
            {!authAvailable && (
              <p className="text-muted-foreground mt-2 text-xs">
                未配置 Supabase 前端环境变量，聊天可正常使用，管理登录暂不可用。
              </p>
            )}
            {user && !isAdmin && (
              <p className="text-muted-foreground mt-2 text-xs">
                当前账号没有管理员权限，只能查看和选择已启用的服务商。
              </p>
            )}
          </SheetHeader>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b px-6">
              <div className="flex items-center">
                {(['claude', 'openai'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setProviderTab(tab)}
                    className={`-mb-px border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                      providerTab === tab
                        ? 'border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground border-transparent'
                    }`}
                  >
                    {tab === 'claude' ? 'Claude' : 'OpenAI'}
                  </button>
                ))}
              </div>

              {isAdmin ? (
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
              ) : null}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="flex flex-col gap-3">
                {providersLoading && providers.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center text-sm">加载供应商中...</p>
                ) : null}

                {visibleProviders.map((provider) => (
                  <div
                    key={provider.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveProviderId(provider.id)}
                    onKeyDown={(event) => handleProviderCardKeyDown(event, provider.id)}
                    className={`cursor-pointer rounded-lg border px-4 py-3 transition-colors ${
                      activeProviderId === provider.id
                        ? 'border-primary bg-accent'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-sm font-medium">{provider.name}</span>
                        <span className="text-muted-foreground truncate text-xs">
                          {provider.type}
                          {provider.type === 'openai' ? ` / ${provider.api_mode}` : ''}
                          {' · '}
                          {provider.models?.join(', ')}
                        </span>
                      </div>

                      {isAdmin ? (
                        <div className="flex gap-2">
                          <button
                            className="hover:bg-muted rounded p-1"
                            onClick={(event) => {
                              event.stopPropagation()
                              setEditing(toEditableProvider(provider))
                              setFormOpen(true)
                            }}
                          >
                            <Pencil className="text-muted-foreground size-3.5" />
                          </button>
                          <button
                            className="hover:bg-muted rounded p-1"
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleDeleteProvider(provider.id)
                            }}
                          >
                            <Trash2 className="text-destructive size-3.5" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}

                {visibleProviders.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    {isAdmin ? '当前分类下暂无服务商，点击右上角新增' : '当前分类下暂无可用服务商'}
                  </p>
                ) : null}
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
                onChange={(event) => setLoginEmail(event.target.value)}
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
                onChange={(event) => setLoginPassword(event.target.value)}
                required
              />
            </div>
            <DialogFooter className="border-0 bg-transparent sm:justify-end">
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
