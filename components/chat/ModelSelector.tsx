'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useEffect } from 'react'
import { useProviderCatalog } from '@/lib/provider-client'

type Props = {
  model: string
  onChange: (model: string) => void
}

export function ModelSelector({ model, onChange }: Props) {
  const { activeProviderId } = useStore()
  const { providers, loading } = useProviderCatalog(false)

  useEffect(() => {
    if (!activeProviderId) {
      return
    }

    const provider = providers.find((item) => item.id === activeProviderId)
    if (!provider?.models?.length) {
      return
    }

    if (!model || !provider.models.includes(model)) {
      onChange(provider.models[0])
    }
  }, [activeProviderId, model, onChange, providers])

  const activeProvider = providers.find((provider) => provider.id === activeProviderId)
  const models = activeProvider?.models ?? []
  const label = model || '选择模型'

  if (!activeProviderId) {
    return <span className="text-muted-foreground text-xs">请先选择服务商</span>
  }

  if (loading && providers.length === 0) {
    return <span className="text-muted-foreground text-xs">加载模型中...</span>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-accent inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium">
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
            <DropdownMenuItem disabled className="text-muted-foreground text-xs">
              暂无可用模型
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
