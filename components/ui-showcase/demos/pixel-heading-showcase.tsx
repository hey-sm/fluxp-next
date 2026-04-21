'use client'

import { Badge } from '@/components/ui/badge'
import { PixelHeading } from '@/components/ui/pixel-heading-character'
import { UiDemoCard } from '@/components/ui-showcase/ui-demo-card'

const headingModes = [
  {
    title: 'Multi',
    description: '更适合首屏标题或品牌感较强的展示区。',
    node: (
      <PixelHeading
        autoPlay
        mode="multi"
        staggerDelay={24}
        cycleInterval={260}
        className="text-[clamp(2.25rem,6vw,4.5rem)] leading-none tracking-[-0.08em] text-slate-950"
      >
        Flux playground
      </PixelHeading>
    ),
  },
  {
    title: 'Wave',
    description: '强调连续流动感，适合标题或短句型展示。',
    node: (
      <PixelHeading
        autoPlay
        mode="wave"
        staggerDelay={34}
        cycleInterval={180}
        className="text-[clamp(2rem,5vw,4rem)] leading-none tracking-[-0.07em] text-slate-900"
      >
        Wave typography
      </PixelHeading>
    ),
  },
  {
    title: 'Random',
    description: '更适合做实验性视觉演示或强调动态感的模块。',
    node: (
      <PixelHeading
        autoPlay
        mode="random"
        staggerDelay={22}
        cycleInterval={160}
        className="text-[clamp(1.9rem,4vw,3.5rem)] leading-none tracking-[-0.07em] text-slate-900"
      >
        Motion glyphs
      </PixelHeading>
    ),
  },
] as const

export function PixelHeadingShowcase() {
  return (
    <div className="space-y-6">
      <UiDemoCard
        title="像素标题模式"
        description="同一个标题组件支持多种字体分布模式，适合做品牌感更强的展示页头部。"
      >
        <div className="grid gap-4 xl:grid-cols-3">
          {headingModes.map((mode) => (
            <article
              key={mode.title}
              className="rounded-[1.5rem] bg-gradient-to-br from-white via-sky-50/70 to-indigo-50 p-5 ring-1 ring-slate-200/80"
            >
              <Badge variant="outline" className="mb-5">
                {mode.title}
              </Badge>
              <div className="min-h-32">{mode.node}</div>
              <p className="mt-6 text-sm leading-6 text-slate-600">{mode.description}</p>
            </article>
          ))}
        </div>
      </UiDemoCard>

      <UiDemoCard
        title="标题与说明组合"
        description="你后续可以把组件说明、参数面板、配色版本一起塞进同一个 render 组件中。"
      >
        <div className="rounded-[1.75rem] bg-slate-950 px-6 py-7 text-white">
          <PixelHeading
            autoPlay
            prefix="UI"
            prefixFont="grid"
            mode="multi"
            staggerDelay={18}
            cycleInterval={220}
            className="text-[clamp(2.3rem,7vw,5rem)] leading-none tracking-[-0.08em]"
          >
            showcase shell
          </PixelHeading>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            这个区域就是一个完整的页面组件。你可以继续往下拼接组件矩阵、状态切换、代码示例和参数说明，不需要受固定
            slot 结构限制。
          </p>
        </div>
      </UiDemoCard>
    </div>
  )
}
