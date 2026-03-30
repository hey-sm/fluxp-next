'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ProviderForm, type ProviderFormData } from '@/components/settings/ProviderForm'
import { FlaskConical, Plus, Pencil, Trash2 } from 'lucide-react'

type Provider = ProviderFormData & { id: string }
type Tab = 'all' | 'claude' | 'openai'

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<(Partial<ProviderFormData> & { id?: string }) | undefined>(undefined)
  const [tab, setTab] = useState<Tab>('all')
  const [testingId, setTestingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/providers?all=1')
    const json = await res.json()
    if (!res.ok) {
      toast.error(`加载失败: ${json.error}`)
      return
    }
    setProviders(json)
    setActiveId(prev => prev ?? json[0]?.id ?? null)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = providers.filter(p =>
    tab === 'all' ? true : p.type === tab
  )

  async function handleSave(data: ProviderFormData, id?: string) {
    if (id) {
      const res = await fetch(`/api/providers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(`保存失败: ${json.error}`); return }
      toast.success('已更新')
    } else {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(`新增失败: ${json.error}`); return }
      toast.success('已新增')
    }
    await load()
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/providers/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { toast.error(`删除失败: ${json.error}`); return }
    toast.success('已删除')
    if (activeId === id) setActiveId(null)
    await load()
  }

  async function handleTest(p: Provider) {
    setTestingId(p.id)
    try {
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(`[${p.name}] 连接失败: ${json.error}`)
      } else {
        toast.success(`[${p.name}] 连接成功`)
      }
    } catch {
      toast.error(`[${p.name}] 请求异常`)
    } finally {
      setTestingId(null)
    }
  }

  function openAdd() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(p: Provider) {
    setEditing(p)
    setFormOpen(true)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'claude', label: 'Claude' },
    { key: 'openai', label: 'OpenAI' },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold">API 服务商设置</h1>
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1" />新增服务商
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-6 py-6 flex gap-6">
        {/* Left: tab + list */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-2">
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg border p-1 mb-2">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 rounded-md py-1 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* List */}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">暂无服务商</p>
          )}
          {filtered.map(p => (
            <div
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={`group flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                activeId === p.id ? 'bg-muted border-primary' : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.type}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  title="测试"
                  onClick={e => { e.stopPropagation(); handleTest(p) }}
                  disabled={testingId === p.id}
                  className="p-1 rounded hover:bg-accent"
                >
                  <FlaskConical className={`w-3.5 h-3.5 ${testingId === p.id ? 'animate-pulse text-primary' : ''}`} />
                </button>
                <button
                  title="编辑"
                  onClick={e => { e.stopPropagation(); openEdit(p) }}
                  className="p-1 rounded hover:bg-accent"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  title="删除"
                  onClick={e => { e.stopPropagation(); handleDelete(p.id) }}
                  className="p-1 rounded hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right: detail */}
        <div className="flex-1">
          {(() => {
            const p = providers.find(x => x.id === activeId)
            if (!p) return <p className="text-muted-foreground text-sm">请选择左侧服务商查看详情</p>
            return (
              <div className="rounded-lg border p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">{p.name}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    p.enabled ? 'border-green-500 text-green-600' : 'border-muted text-muted-foreground'
                  }`}>{p.enabled ? '启用' : '停用'}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-muted-foreground">类型</span><span>{p.type}</span>
                  <span className="text-muted-foreground">默认模型</span><span>{p.default_model || '—'}</span>
                  <span className="text-muted-foreground">模型列表</span>
                  <span className="break-all">{p.models?.join(', ') || '—'}</span>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      <ProviderForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
