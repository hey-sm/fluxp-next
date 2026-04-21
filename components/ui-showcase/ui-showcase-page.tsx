import { Badge } from '@/components/ui/badge'
import type { UiShowcaseItem } from '@/components/ui-showcase/registry'

type UiShowcasePageProps = {
  item: UiShowcaseItem
}

export function UiShowcasePage({ item }: UiShowcasePageProps) {
  const ShowcaseComponent = item.render

  return (
    <main className="relative min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),rgba(244,248,255,0.74)_38%,transparent_72%)]" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 pb-10">
        <section className="border-border/70 bg-background/72 overflow-hidden rounded-[2rem] border px-6 py-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-md sm:px-8 sm:py-8">
          <p className="text-xs font-medium tracking-[0.22em] text-sky-700 uppercase">
            {item.category}
          </p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-[clamp(2.2rem,4vw,4rem)] leading-none font-semibold tracking-[-0.06em] text-slate-950">
                {item.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {item.description}
              </p>
            </div>

            {item.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="bg-white/70">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <ShowcaseComponent />
      </div>
    </main>
  )
}
