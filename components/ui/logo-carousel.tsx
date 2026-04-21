'use client'

import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'

type LogoItem = {
  id: number
  name: string
  src: string
}

const DEFAULT_LOGOS: LogoItem[] = [
  { id: 1, name: 'Claude Code', src: '/tech-icons/claudecode-logo.svg' },
  { id: 2, name: 'Next.js', src: '/tech-icons/next.svg' },
  { id: 3, name: 'OpenAI', src: '/tech-icons/openai-logo.svg' },
  { id: 4, name: 'React', src: '/tech-icons/react.svg' },
  { id: 5, name: 'shadcn/ui', src: '/tech-icons/shadcn.svg' },
  { id: 6, name: 'Supabase', src: '/tech-icons/supabase.svg' },
  { id: 7, name: 'Tailwind CSS', src: '/tech-icons/tailwind.svg' },
  { id: 8, name: 'TypeScript', src: '/tech-icons/TypeScript.svg' },
  { id: 9, name: 'Vercel', src: '/tech-icons/vercel.svg' },
  { id: 10, name: 'Zustand', src: '/tech-icons/Zustand.svg' },
]

function shuffleArray<T>(array: T[]) {
  const shuffled = [...array]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  return shuffled
}

function distributeLogos(allLogos: LogoItem[], columnCount: number) {
  const shuffled = shuffleArray(allLogos)
  const columns = Array.from({ length: Math.max(1, columnCount) }, () => [] as LogoItem[])

  shuffled.forEach((logo, index) => {
    columns[index % columns.length].push(logo)
  })

  const maxLength = Math.max(...columns.map((column) => column.length))

  columns.forEach((column) => {
    while (column.length < maxLength) {
      column.push(shuffled[Math.floor(Math.random() * shuffled.length)])
    }
  })

  return columns
}

function getGridClass(columnCount: number) {
  if (columnCount <= 2) return 'grid-cols-2'
  if (columnCount === 3) return 'grid-cols-3'
  if (columnCount === 4) return 'grid-cols-2 sm:grid-cols-4'

  return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
}

const LogoColumn = memo(function LogoColumn({
  currentTime,
  index,
  logos,
  prefersReducedMotion,
}: {
  currentTime: number
  index: number
  logos: LogoItem[]
  prefersReducedMotion: boolean
}) {
  const cycleInterval = 2000
  const columnDelay = index * 200
  const adjustedTime = (currentTime + columnDelay) % (cycleInterval * logos.length)
  const currentIndex = Math.floor(adjustedTime / cycleInterval)
  const currentLogo = useMemo(() => logos[currentIndex], [currentIndex, logos])

  if (!currentLogo) {
    return null
  }

  return (
    <motion.div
      className="relative h-16 overflow-hidden md:h-24"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: 'easeOut',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentLogo.id}-${currentIndex}`}
          className="absolute inset-0 flex items-center justify-center"
          initial={
            prefersReducedMotion ? { opacity: 1 } : { y: '10%', opacity: 0, filter: 'blur(8px)' }
          }
          animate={
            prefersReducedMotion
              ? { opacity: 1 }
              : {
                  y: '0%',
                  opacity: 1,
                  filter: 'blur(0px)',
                  transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    mass: 1,
                    bounce: 0.2,
                    duration: 0.5,
                  },
                }
          }
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : {
                  y: '-20%',
                  opacity: 0,
                  filter: 'blur(6px)',
                  transition: {
                    type: 'tween',
                    ease: 'easeIn',
                    duration: 0.3,
                  },
                }
          }
        >
          <Image
            src={currentLogo.src}
            alt={currentLogo.name}
            width={128}
            height={128}
            className="h-14 w-auto max-w-[80%] object-contain md:h-24"
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
})

export function LogoCarousel({
  columnCount = 3,
  logos = DEFAULT_LOGOS,
  className = '',
}: {
  className?: string
  columnCount?: number
  logos?: LogoItem[]
}) {
  const prefersReducedMotion = useReducedMotion()
  const [logoSets, setLogoSets] = useState<LogoItem[][]>([])
  const [currentTime, setCurrentTime] = useState(0)

  const stableLogos = useMemo(() => logos, [logos])

  useEffect(() => {
    setLogoSets(distributeLogos(stableLogos, columnCount))
  }, [columnCount, stableLogos])

  const updateTime = useCallback(() => {
    if (!prefersReducedMotion) {
      setCurrentTime((previousTime) => previousTime + 100)
    }
  }, [prefersReducedMotion])

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    const intervalId = window.setInterval(updateTime, 150)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [prefersReducedMotion, updateTime])

  return (
    <div className={`w-full ${className}`} aria-label="Technology logo carousel">
      <div className={`grid items-center gap-x-6 gap-y-6 ${getGridClass(columnCount)}`}>
        {logoSets.map((logoColumn, index) => (
          <LogoColumn
            key={`logo-column-${index}`}
            logos={logoColumn}
            index={index}
            currentTime={currentTime}
            prefersReducedMotion={Boolean(prefersReducedMotion)}
          />
        ))}
      </div>
    </div>
  )
}
