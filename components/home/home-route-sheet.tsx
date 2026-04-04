'use client'

import Link from 'next/link'
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  HouseIcon,
  MessageSquareIcon,
  PanelRightOpenIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const ROUTES = [
  {
    href: '/',
    label: '首页',
    description: '欢迎标题与天气信息',
    icon: HouseIcon,
  },
  {
    href: '/chat',
    label: '聊天',
    description: '进入对话与模型交互',
    icon: MessageSquareIcon,
  },
  {
    href: '/blog',
    label: '博客',
    description: '查看文章与知识沉淀',
    icon: BookOpenIcon,
  },
] as const

export function HomeRouteSheet() {
  return (
    <Sheet>
      <SheetTrigger
        aria-label="打开路由列表"
        render={<Button variant="outline" size="icon" className="rounded-full shadow-sm" />}
      >
        <PanelRightOpenIcon />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="border-border/60 bg-background/95 w-[min(88vw,22rem)] border-l p-0 backdrop-blur-xl"
      >
        <SheetHeader className="border-border/60 gap-2 border-b px-5 py-5">
          <SheetTitle>路由收纳</SheetTitle>
          <SheetDescription>这里先放常用入口，后续页面也可以继续往这里加。</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 py-4">
          {ROUTES.map((route) => {
            const Icon = route.icon

            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  'group border-border/70 bg-card/80 flex items-center gap-3 rounded-3xl border px-4 py-4 transition',
                  'hover:border-border hover:bg-card hover:-translate-y-0.5 hover:shadow-sm',
                )}
              >
                <span className="bg-secondary text-secondary-foreground inline-flex size-11 items-center justify-center rounded-2xl">
                  <Icon />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                  <span className="text-foreground truncate text-sm font-medium">
                    {route.label}
                  </span>
                  <span className="text-muted-foreground line-clamp-2 text-sm">
                    {route.description}
                  </span>
                </span>
                <ArrowUpRightIcon className="text-muted-foreground group-hover:text-foreground transition" />
              </Link>
            )
          })}
        </div>

        <SheetFooter className="border-border/60 border-t px-5 py-4">
          <p className="text-muted-foreground text-sm">
            现在先保留最核心的三个入口，首页下方区域我已经留空，方便你后面继续扩展。
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
