'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FlaskConical } from 'lucide-react'

export type ProviderFormData = {
  name: string
  type: 'claude' | 'openai'
  base_url: string
  api_key: string
  models: string[]
  default_model: string
  enabled: boolean
}

type Props = {
  open: boolean
  initial?: Partial<ProviderFormData> & { id?: string }
  onClose: () => void
  onSave: (data: ProviderFormData, id?: string) => Promise<void>
}

const empty: ProviderFormData = {
  name: '',
  type: 'openai',
  base_url: '',
  api_key: '',
  models: [],
  default_model: '',
  enabled: true,
}

export function ProviderForm({ open, initial, onClose, onSave }: Props) {
  const [form, setForm] = useState<ProviderFormData>(empty)
  const [modelsInput, setModelsInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (open) {
      const data = { ...empty, ...initial }
      setForm({ ...data, api_key: '' })
      setModelsInput(data.models.join('\n'))
    }
  }, [open, initial])

  function set(key: keyof ProviderFormData, value: string | boolean | string[]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function buildPayload() {
    const models = modelsInput
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
    const payload = { ...form, models, default_model: models[0] ?? '' }
    if (!payload.api_key) delete (payload as any).api_key
    return payload
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(buildPayload(), initial?.id)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    try {
      const payload = buildPayload()
      const body: Record<string, unknown> = initial?.id
        ? { id: initial.id }
        : {
            type: payload.type,
            base_url: payload.base_url,
            api_key: payload.api_key,
            models: payload.models,
          }
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(`连接失败: ${json.error}`)
      } else {
        toast.success(`连接成功，回复: ${json.reply}`)
      }
    } catch {
      toast.error('请求异常')
    } finally {
      setTesting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial?.id ? '编辑服务商' : '新增服务商'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label>名称</Label>
            <Input
              placeholder="如：Claude Pro"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>类型</Label>
            <Select
              value={form.type}
              onValueChange={(v: string | null) => v && set('type', v as 'claude' | 'openai')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI 兼容</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Base URL</Label>
            <Input
              placeholder="https://api.example.com/v1"
              value={form.base_url}
              onChange={(e) => set('base_url', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>
              API Key <span className="text-muted-foreground text-xs">（编辑时留空则不修改）</span>
            </Label>
            <Input
              type="password"
              placeholder={initial?.id ? '不修改请留空' : 'sk-...'}
              value={form.api_key}
              onChange={(e) => set('api_key', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>
              模型列表 <span className="text-muted-foreground text-xs">（每行一个）</span>
            </Label>
            <textarea
              placeholder={`claude-opus-4-6\nclaude-sonnet-4-5`}
              value={modelsInput}
              onChange={(e) => setModelsInput(e.target.value)}
              rows={4}
              className="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 font-mono text-sm outline-none focus:ring-2"
            />
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button variant="outline" size="sm" onClick={handleTest} disabled={testing || saving}>
            <FlaskConical className={`mr-1 h-4 w-4 ${testing ? 'animate-pulse' : ''}`} />
            {testing ? '测试中...' : '测试连接'}
          </Button>
          <Button onClick={handleSave} disabled={saving || testing}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
