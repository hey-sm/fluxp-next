'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useEffect, useRef, useState } from 'react'

type ProviderPublic = {
  id: string
  name: string
  type: string
  models: string[]
}

type Props = {
  model: string
  onChange: (model: string) => void
}

export function ModelSelector({ model, onChange }: Props) {
  const { activeProviderId } = useStore()
  const [providers, setProviders] = useState<ProviderPublic[]>([])
  const modelRef = useRef(model)
  const onChangeRef = useRef(onChange)
  modelRef.current = model
  onChangeRef.current = onChange

  useEffect(() => {
    fetch('/api/providers')
      .then((response) => response.json())
      .then((data: ProviderPublic[]) => {
        setProviders(data)

        if (!activeProviderId) return

        const provider = data.find((item) => item.id === activeProviderId)
        const currentModel = modelRef.current
        if (provider?.models?.length && (!currentModel || !provider.models.includes(currentModel))) {
          onChangeRef.current(provider.models[0])
        }
      })
  }, [activeProviderId])

  const activeProvider = providers.find((provider) => provider.id === activeProviderId)
  const models = activeProvider?.models ?? []
  const label = model || '选择模型'

  if (!activeProviderId) {
    return (
      <span className="text-xs text-muted-foreground">请先选择服务商</span>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md  px-3 py-1.5 text-xs font-medium hover:bg-accent">
        {label}
        <ChevronDown className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          {models.map((item) => (
            <DropdownMenuItem
              key={item}
              onClick={() => onChange(item)}
              className={`text-sm ${item === model ? 'font-medium' : ''}`}
            >
              {item}
            </DropdownMenuItem>
          ))}
          {models.length === 0 && (
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              暂无可用模型
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
