import { UiShowcaseShell } from '@/components/ui-showcase/ui-showcase-shell'
import { getUiShowcaseNavigation } from '@/components/ui-showcase/registry'

export default function UiLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <UiShowcaseShell navigation={getUiShowcaseNavigation()}>{children}</UiShowcaseShell>
}
