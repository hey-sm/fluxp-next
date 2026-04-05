import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProviderApiMode, ProviderType } from '@/lib/provider-config'

type Provider = {
  id: string
  name: string
  type: ProviderType
  api_mode: ProviderApiMode
  models: string[]
  default_model: string
  enabled: boolean
}

type Store = {
  activeProviderId: string
  activeModel: string
  providers: Provider[]
  setActiveProviderId: (id: string) => void
  setActiveModel: (model: string) => void
  setProviders: (providers: Provider[]) => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      activeProviderId: '',
      activeModel: '',
      providers: [],
      setActiveProviderId: (id) => set({ activeProviderId: id }),
      setActiveModel: (model) => set({ activeModel: model }),
      setProviders: (providers) => set({ providers }),
    }),
    {
      name: 'app-store',
      partialize: (s) => ({ activeProviderId: s.activeProviderId, activeModel: s.activeModel }),
    },
  ),
)
