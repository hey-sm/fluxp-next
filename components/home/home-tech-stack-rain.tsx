'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

type TechCard = {
  id: string
  label: string
  detail: string
  tone: string
}

type CardLayout = {
  width: number
  startX: number
  startY: number
  endX: number
  endY: number
  rotateX: number
  rotateY: number
  rotateZ: number
  delay: number
  duration: number
  zIndex: number
  bounce: number
}

const TECH_CARDS: TechCard[] = [
  {
    id: 'next',
    label: 'Next.js',
    detail: 'App Router',
    tone: 'from-slate-900/10 via-slate-900/4 to-transparent',
  },
  {
    id: 'react',
    label: 'React 19',
    detail: 'Server + Client',
    tone: 'from-sky-500/12 via-sky-400/5 to-transparent',
  },
  {
    id: 'tailwind',
    label: 'Tailwind CSS',
    detail: 'Design Tokens',
    tone: 'from-cyan-500/12 via-cyan-400/5 to-transparent',
  },
  {
    id: 'motion',
    label: 'Framer Motion',
    detail: '3D Drop',
    tone: 'from-fuchsia-500/12 via-fuchsia-400/5 to-transparent',
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    detail: 'Strict Types',
    tone: 'from-blue-500/12 via-blue-400/5 to-transparent',
  },
  {
    id: 'supabase',
    label: 'Supabase',
    detail: 'Data Layer',
    tone: 'from-emerald-500/12 via-emerald-400/5 to-transparent',
  },
  {
    id: 'ai-sdk',
    label: 'AI SDK',
    detail: 'Streaming',
    tone: 'from-violet-500/12 via-violet-400/5 to-transparent',
  },
  {
    id: 'mdx',
    label: 'MDX',
    detail: 'Content Flow',
    tone: 'from-amber-500/12 via-amber-400/5 to-transparent',
  },
  {
    id: 'zustand',
    label: 'Zustand',
    detail: 'State Store',
    tone: 'from-orange-500/12 via-orange-400/5 to-transparent',
  },
]

function createSeededRandom(seed: number) {
  let value = seed % 2147483647
  if (value <= 0) {
    value += 2147483646
  }

  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function buildLayouts(count: number, width: number, height: number) {
  const random = createSeededRandom(width * 19 + height * 13 + count * 29)
  const layouts: CardLayout[] = []
  const clusterWidth = Math.min(width * 0.62, 420)

  for (let index = 0; index < count; index += 1) {
    const cardWidth = 148 + Math.round(random() * 26)
    const maxX = Math.max(12, width - cardWidth - 12)
    const endX = clamp(width / 2 - cardWidth / 2 + (random() - 0.5) * clusterWidth, 8, maxX)
    const endY = 30 + random() * Math.max(130, height - 170)

    layouts.push({
      width: cardWidth,
      startX: width / 2 - cardWidth / 2 + (random() - 0.5) * 56,
      startY: -220 - random() * 120,
      endX,
      endY,
      rotateX: -18 - random() * 22,
      rotateY: -20 + random() * 40,
      rotateZ: -22 + random() * 44,
      delay: 0.08 + index * 0.07 + random() * 0.16,
      duration: 1.15 + random() * 0.4,
      zIndex: 10 + index,
      bounce: 10 + random() * 18,
    })
  }

  return layouts.sort((a, b) => a.endY - b.endY)
}

export function HomeTechStackRain({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }

      const nextWidth = Math.round(entry.contentRect.width)
      const nextHeight = Math.round(entry.contentRect.height)

      setSize((current) => {
        if (current.width === nextWidth && current.height === nextHeight) {
          return current
        }

        return { width: nextWidth, height: nextHeight }
      })
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const layouts = useMemo(() => {
    if (!size.width || !size.height) {
      return []
    }

    return buildLayouts(TECH_CARDS.length, size.width, size.height)
  }, [size.height, size.width])

  return (
    <section className={cn('relative mt-14 w-full sm:mt-18', className)}>
      <div className="mx-auto w-full max-w-6xl">
        <div
          ref={containerRef}
          className="relative h-[340px] overflow-hidden sm:h-[420px]"
          style={{ perspective: '1400px' }}
        >
          <div className="absolute inset-x-[8%] bottom-3 h-24 rounded-full bg-[radial-gradient(circle,rgba(148,163,184,0.18),transparent_70%)] blur-2xl" />

          {layouts.map((layout, index) => {
            const tech = TECH_CARDS[index]

            return (
              <motion.article
                key={tech.id}
                className="absolute top-0 left-0"
                style={{
                  zIndex: layout.zIndex,
                  width: layout.width,
                  transformStyle: 'preserve-3d',
                }}
                initial={
                  prefersReducedMotion
                    ? {
                        opacity: 1,
                        x: layout.endX,
                        y: layout.endY,
                        rotateX: 0,
                        rotateY: 0,
                        rotateZ: layout.rotateZ,
                        scale: 1,
                      }
                    : {
                        opacity: 0,
                        x: layout.startX,
                        y: layout.startY,
                        rotateX: layout.rotateX,
                        rotateY: layout.rotateY,
                        rotateZ: layout.rotateZ * 1.25,
                        scale: 0.88,
                      }
                }
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        opacity: [0, 1, 1, 1],
                        x: [layout.startX, layout.endX + 8, layout.endX - 4, layout.endX],
                        y: [
                          layout.startY,
                          layout.endY + layout.bounce,
                          layout.endY - layout.bounce * 0.35,
                          layout.endY,
                        ],
                        rotateX: [layout.rotateX, 8, -5, 0],
                        rotateY: [layout.rotateY, -8, 4, 0],
                        rotateZ: [
                          layout.rotateZ * 1.25,
                          layout.rotateZ + 6,
                          layout.rotateZ - 3,
                          layout.rotateZ,
                        ],
                        scale: [0.88, 1.02, 0.985, 1],
                      }
                }
                transition={
                  prefersReducedMotion
                    ? undefined
                    : {
                        duration: layout.duration,
                        delay: layout.delay,
                        ease: [0.2, 0.9, 0.2, 1],
                        times: [0, 0.72, 0.9, 1],
                      }
                }
                whileHover={{
                  y: layout.endY - 12,
                  rotateZ: layout.rotateZ * 0.75,
                  scale: 1.02,
                  transition: { duration: 0.18 },
                }}
              >
                <div className="relative rounded-[1.6rem] bg-white/84 px-5 py-4 shadow-[0_24px_44px_rgba(15,23,42,0.16)] backdrop-blur-xl">
                  <div
                    className={cn('absolute inset-0 rounded-[1.6rem] bg-gradient-to-br', tech.tone)}
                  />
                  <div className="relative flex flex-col gap-10">
                    <span className="text-[0.62rem] font-semibold tracking-[0.28em] text-slate-400 uppercase">
                      {tech.detail}
                    </span>
                    <p className="text-xl font-semibold tracking-tight text-slate-900">
                      {tech.label}
                    </p>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
