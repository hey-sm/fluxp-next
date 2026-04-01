'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { BlogHeading } from '@/lib/blog/mdx'
import { cn } from '@/lib/utils'

type TableOfContentsProps = {
  headings: BlogHeading[]
  className?: string
}

export function TableOfContents({ headings, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? '')

  useEffect(() => {
    setActiveId(headings[0]?.id ?? '')
  }, [headings])

  useEffect(() => {
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element))

    if (elements.length === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const nextActive = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]?.target.id

        if (nextActive) {
          setActiveId(nextActive)
        }
      },
      {
        rootMargin: '0px 0px -70% 0px',
        threshold: [0, 1],
      },
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) {
    return null
  }

  return (
    <nav className={className}>
      <p className="text-sm font-semibold">On This Page</p>
      <div className="mt-4 flex flex-col gap-1">
        {headings.map((heading) => (
          <Link
            key={heading.id}
            href={`#${heading.id}`}
            className={cn(
              'text-muted-foreground hover:text-foreground rounded-md px-2 py-1 text-sm transition-colors',
              heading.level === 3 && 'pl-5',
              activeId === heading.id && 'bg-muted text-foreground font-medium',
            )}
          >
            {heading.text}
          </Link>
        ))}
      </div>
    </nav>
  )
}
