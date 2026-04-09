'use client'

import { useCallback, useEffect } from 'react'
import { create } from 'zustand'
import type { ProviderApiMode, ProviderType } from '@/lib/provider-config'

export type ProviderListItem = {
  id: string
  name: string
  type: ProviderType
  api_mode: ProviderApiMode
  models: string[]
  default_model: string
  enabled: boolean
  base_url?: string | null
}

type ProviderCacheKey = 'public' | 'all'

type ProviderCatalogStore = {
  publicProviders: ProviderListItem[]
  allProviders: ProviderListItem[]
  publicLoaded: boolean
  allLoaded: boolean
  publicLoading: boolean
  allLoading: boolean
}

const useProviderCatalogStore = create<ProviderCatalogStore>(() => ({
  publicProviders: [],
  allProviders: [],
  publicLoaded: false,
  allLoaded: false,
  publicLoading: false,
  allLoading: false,
}))

const inflightRequests = new Map<ProviderCacheKey, Promise<ProviderListItem[]>>()

function getCacheKey(includeAll: boolean): ProviderCacheKey {
  return includeAll ? 'all' : 'public'
}

function getEndpoint(includeAll: boolean) {
  return includeAll ? '/api/providers?all=1' : '/api/providers'
}

function setLoadingState(includeAll: boolean, loading: boolean) {
  if (includeAll) {
    useProviderCatalogStore.setState({ allLoading: loading })
    return
  }

  useProviderCatalogStore.setState({ publicLoading: loading })
}

function setProviderState(includeAll: boolean, providers: ProviderListItem[]) {
  if (includeAll) {
    useProviderCatalogStore.setState({
      allProviders: providers,
      allLoaded: true,
      allLoading: false,
    })
    return
  }

  useProviderCatalogStore.setState({
    publicProviders: providers,
    publicLoaded: true,
    publicLoading: false,
  })
}

function markProviderStateStale() {
  useProviderCatalogStore.setState({
    publicLoaded: false,
    allLoaded: false,
  })
  inflightRequests.clear()
}

async function readProviderResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : '加载供应商失败'

    throw new Error(message)
  }

  return Array.isArray(payload) ? (payload as ProviderListItem[]) : []
}

export async function loadProviderCatalog(
  includeAll = false,
  options?: { force?: boolean },
) {
  const force = options?.force ?? false
  const cacheKey = getCacheKey(includeAll)
  const state = useProviderCatalogStore.getState()
  const loaded = includeAll ? state.allLoaded : state.publicLoaded
  const cachedProviders = includeAll ? state.allProviders : state.publicProviders

  if (!force && loaded) {
    return cachedProviders
  }

  if (!force) {
    const inflight = inflightRequests.get(cacheKey)
    if (inflight) {
      return inflight
    }
  }

  setLoadingState(includeAll, true)

  const request = fetch(getEndpoint(includeAll), { credentials: 'include' })
    .then(readProviderResponse)
    .then((providers) => {
      setProviderState(includeAll, providers)
      return providers
    })
    .catch((error) => {
      setLoadingState(includeAll, false)
      throw error
    })
    .finally(() => {
      inflightRequests.delete(cacheKey)
    })

  inflightRequests.set(cacheKey, request)
  return request
}

export function invalidateProviderCatalog() {
  markProviderStateStale()
}

export function prefetchProviderCatalog(includeAll = false) {
  void loadProviderCatalog(includeAll).catch(() => {})
}

export function useProviderCatalog(includeAll = false) {
  const providers = useProviderCatalogStore((state) =>
    includeAll ? state.allProviders : state.publicProviders,
  )
  const loading = useProviderCatalogStore((state) =>
    includeAll ? state.allLoading : state.publicLoading,
  )
  const loaded = useProviderCatalogStore((state) =>
    includeAll ? state.allLoaded : state.publicLoaded,
  )

  useEffect(() => {
    if (loaded) {
      return
    }

    void loadProviderCatalog(includeAll)
  }, [includeAll, loaded])

  const refresh = useCallback(
    (options?: { force?: boolean }) => loadProviderCatalog(includeAll, options),
    [includeAll],
  )

  return { providers, loading, loaded, refresh }
}
