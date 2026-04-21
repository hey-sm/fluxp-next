import { redirect } from 'next/navigation'

import { getDefaultUiShowcaseSlug } from '@/components/ui-showcase/registry'

export default function UiIndexPage() {
  redirect(`/ui/${getDefaultUiShowcaseSlug()}`)
}
