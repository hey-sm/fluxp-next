import type { ComponentType } from 'react'

import { PixelHeadingShowcase } from '@/components/ui-showcase/demos/pixel-heading-showcase'
import { SplitTextShowcase } from '@/components/ui-showcase/demos/split-text-showcase'

export type UiShowcaseRenderComponent = ComponentType

export type UiShowcaseItem = {
  slug: string
  title: string
  description: string
  category: string
  tags?: readonly string[]
  render: UiShowcaseRenderComponent
}

export type UiShowcaseCategory = {
  id: string
  title: string
  items: readonly UiShowcaseItem[]
}

export type UiShowcaseNavigationItem = Omit<UiShowcaseItem, 'render'>

export type UiShowcaseNavigationCategory = {
  id: string
  title: string
  items: readonly UiShowcaseNavigationItem[]
}

const uiShowcaseCategories = [
  {
    id: 'scroll-text',
    title: 'Scroll Text',
    items: [
      {
        slug: 'split-text',
        title: 'Split Text',
        description: '滚动触发的文字拆分动画展示，可用于标题、标语和段落引导。',
        category: 'Scroll Text',
        tags: ['GSAP', 'Text', 'Scroll'],
        render: SplitTextShowcase,
      },
    ],
  },
  {
    id: 'display-type',
    title: 'Display Type',
    items: [
      {
        slug: 'pixel-heading',
        title: 'Pixel Heading',
        description: '像素字形切换标题展示，适合首页、专题页和实验性视觉模块。',
        category: 'Display Type',
        tags: ['Typography', 'Hero', 'Motion'],
        render: PixelHeadingShowcase,
      },
    ],
  },
] as const satisfies readonly UiShowcaseCategory[]

const uiShowcaseItems: readonly UiShowcaseItem[] = (
  uiShowcaseCategories as readonly UiShowcaseCategory[]
).flatMap((category) => category.items)
const uiShowcaseItemsBySlug = new Map(uiShowcaseItems.map((item) => [item.slug, item]))

export function getUiShowcaseCategories(): readonly UiShowcaseCategory[] {
  return uiShowcaseCategories
}

export function getUiShowcaseNavigation(): readonly UiShowcaseNavigationCategory[] {
  return uiShowcaseCategories.map(({ id, title, items }) => ({
    id,
    title,
    items: items.map(({ render: _render, ...item }) => item),
  }))
}

export function getUiShowcaseItemBySlug(slug: string): UiShowcaseItem | undefined {
  return uiShowcaseItemsBySlug.get(slug)
}

export function getUiShowcaseItems(): readonly UiShowcaseItem[] {
  return uiShowcaseItems
}

export function getDefaultUiShowcaseSlug(): string {
  return uiShowcaseItems[0]?.slug ?? 'split-text'
}
