'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpenIcon, MessageSquareIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const ROUTES = [
  {
    href: '/chat',
    label: '聊天',
    icon: MessageSquareIcon,
  },
  {
    href: '/blog',
    label: '博客',
    icon: BookOpenIcon,
  },
] as const

export function HomeTopNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <header className="relative z-20 w-full px-5 py-5 sm:px-8 sm:py-6">
      <div className="flex w-full items-start justify-between gap-6" ref={containerRef}>
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 overflow-hidden text-left"
          aria-label="返回首页"
        >
          <Image
            src="/favicon.svg"
            alt="logo"
            width={22}
            height={22}
            className="shrink-0"
            priority
          />
          <span className="truncate text-sm font-semibold">fluxp</span>
        </Link>

        <motion.div
          initial={false}
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  width: open ? 232 : 44,
                }
          }
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  duration: 0.32,
                }
          }
          className={cn(
            'border-border/70 bg-background/88 flex h-11 items-center justify-end overflow-hidden rounded-full border shadow-sm backdrop-blur-xl',
            open ? 'pl-2' : '',
          )}
          style={prefersReducedMotion ? { width: open ? '14.5rem' : '2.75rem' } : undefined}
        >
          <nav className="mr-1 flex min-w-0 items-center gap-1 overflow-hidden" aria-hidden={!open}>
            {ROUTES.map((route, index) => {
              const Icon = route.icon
              const active = pathname === route.href

              return (
                <motion.div
                  key={route.href}
                  initial={false}
                  animate={
                    open
                      ? {
                          opacity: 1,
                          x: 0,
                        }
                      : {
                          opacity: 0,
                          x: 10,
                        }
                  }
                  transition={{ duration: 0.24, delay: open ? 0.05 + index * 0.05 : 0 }}
                  className={cn(open ? 'pointer-events-auto' : 'pointer-events-none')}
                >
                  <Link
                    href={route.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm whitespace-nowrap transition duration-200',
                      active
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <span className="bg-muted text-muted-foreground inline-flex size-6 items-center justify-center rounded-full">
                      <Icon className="size-3.5" />
                    </span>
                    <span>{route.label}</span>
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          <button
            type="button"
            aria-label={open ? '关闭菜单' : '打开菜单'}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className={cn(
              'inline-flex size-11 shrink-0 items-center justify-center rounded-full transition',
              'focus-visible:ring-ring/40 hover:bg-white/65 focus-visible:ring-3 focus-visible:outline-none',
            )}
          >
            <span className="relative flex size-5 items-center justify-center">
              <motion.span
                initial={false}
                animate={open ? { y: 0, rotate: 45 } : { y: -6, rotate: 0 }}
                transition={{ duration: 0.24 }}
                className="absolute h-0.5 w-5 rounded-full bg-slate-800"
              />
              <motion.span
                initial={false}
                animate={open ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.18 }}
                className="absolute h-0.5 w-5 rounded-full bg-slate-800"
              />
              <motion.span
                initial={false}
                animate={open ? { y: 0, rotate: -45 } : { y: 6, rotate: 0 }}
                transition={{ duration: 0.24 }}
                className="absolute h-0.5 w-5 rounded-full bg-slate-800"
              />
            </span>
          </button>
        </motion.div>
      </div>
    </header>
  )
}
