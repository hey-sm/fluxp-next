'use client'

import SplitText from '@/components/ui/SplitText'
import { Badge } from '@/components/ui/badge'
import { UiDemoCard } from '@/components/ui-showcase/ui-demo-card'

const sampleLines = [
  '悟已往之不谏，知来者之可追。',
  '滚动进入视口时，字符会逐个拆分并完成动画。',
  '同一个组件可以承载标题、引言、标语或模块介绍。',
] as const

export function SplitTextShowcase() {
  return (
    <div className="space-y-6">
      <UiDemoCard
        title="基础拆分"
        description="适合用于页面标语、章节引导和需要滚动触发的文案展示。"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
          <div className="rounded-[1.5rem] bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 sm:p-8">
            <Badge variant="outline" className="mb-4">
              Scroll Text
            </Badge>
            <SplitText
              text="每一个字都有进入场景的节奏。"
              className="text-left text-[clamp(2rem,5vw,3.5rem)] leading-tight font-semibold tracking-[-0.05em] text-slate-900"
              splitType="chars"
              delay={45}
              duration={1}
              textAlign="left"
              from={{ opacity: 0, y: 32 }}
              to={{ opacity: 1, y: 0 }}
            />
          </div>

          <div className="grid gap-3 rounded-[1.5rem] bg-slate-950 p-5 text-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-200">推荐场景</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                首屏副标题、分区标题、长文案过渡、内容区模块引导。
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">默认感受</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                进入更柔和，不会像整段淡入那样僵硬，适合强调文字节奏。
              </p>
            </div>
          </div>
        </div>
      </UiDemoCard>

      <UiDemoCard
        title="多段文案"
        description="在一个展示页面里可以组合多个 SplitText 实例，统一作为同一子类效果展示。"
      >
        <div className="space-y-5">
          {sampleLines.map((line, index) => (
            <div
              key={line}
              className="rounded-[1.5rem] bg-gradient-to-r from-white via-slate-50 to-slate-100 p-5 ring-1 ring-slate-200/70"
            >
              <SplitText
                text={line}
                className="text-left text-lg leading-8 font-medium text-slate-800 sm:text-2xl"
                delay={index === 0 ? 36 : 28}
                duration={0.9}
                textAlign="left"
                from={{ opacity: 0, y: 24 }}
                to={{ opacity: 1, y: 0 }}
              />
            </div>
          ))}
        </div>
      </UiDemoCard>
    </div>
  )
}
