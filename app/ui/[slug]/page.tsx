import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getUiShowcaseItemBySlug, getUiShowcaseItems } from '@/components/ui-showcase/registry'
import { UiShowcasePage } from '@/components/ui-showcase/ui-showcase-page'

type UiShowcaseDetailPageProps = {
  params: Promise<{
    slug: string
  }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return getUiShowcaseItems().map((item) => ({
    slug: item.slug,
  }))
}

export async function generateMetadata({ params }: UiShowcaseDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const item = getUiShowcaseItemBySlug(slug)

  if (!item) {
    return {
      title: 'UI Showcase',
    }
  }

  return {
    title: `${item.title} | fluxp UI`,
    description: item.description,
  }
}

export default async function UiShowcaseDetailPage({ params }: UiShowcaseDetailPageProps) {
  const { slug } = await params
  const item = getUiShowcaseItemBySlug(slug)

  if (!item) {
    notFound()
  }

  return <UiShowcasePage item={item} />
}
