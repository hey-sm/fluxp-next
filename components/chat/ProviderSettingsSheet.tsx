'use client'

import { useCallback, useEffect, useState } from 'react'
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
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'
import { LogOut, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'

type Provider = ProviderFormData & { id: string }
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

export function ProviderSettingsSheet({ open, onOpenChange }: Props) {
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

  const loadProviders = useCallback(async () => {
    const res = await fetch('/api/providers?all=1')
    setProviders(await res.json())
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    void loadProviders()
  }, [loadProviders, user])

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    setLoginLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('登录成功')
      setUser((await supabase.auth.getUser()).data.user)
      setLoginDialogOpen(false)
      setLoginPassword('')
      void loadProviders()
    } finally {
      setLoginLoading(false)
    }
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

    void loadProviders()
  }

  async function handleDeleteProvider(id: string) {
    if (!confirm('确认删除此服务商？')) {
      return
    }

    await fetch(`/api/providers/${id}`, { method: 'DELETE' })
    void loadProviders()
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
                  <span className="text-muted-foreground max-w-36 truncate text-sm">
                    {getUserDisplayName(user)}
                  </span>
                  <button
                    className="hover:bg-muted rounded p-1"
                    title="退出登录"
                    onClick={handleLogout}
                  >
                    <LogOut className="text-muted-foreground size-3.5" />
                  </button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setLoginDialogOpen(true)}>
                  管理
                </Button>
              )}
            </div>
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

              {user ? (
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
                          {provider.type} · {provider.models?.join(', ')}
                        </span>
                      </div>

                      {user ? (
                        <div className="flex gap-2">
                          <button
                            className="hover:bg-muted rounded p-1"
                            onClick={(event) => {
                              event.stopPropagation()
                              setEditing(provider)
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
                    {user ? '当前分类下暂无服务商，点击右上角新增' : '当前分类下暂无可用服务商'}
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
