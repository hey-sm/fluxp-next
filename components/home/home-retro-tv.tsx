'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import styles from './home-retro-tv.module.css'

type RetroTvSlide = {
  src: string
  label: string
}

const DEFAULT_SLIDES: RetroTvSlide[] = [
  { src: '/tech-icons/claudecode-logo.svg', label: 'Claude Code' },
  { src: '/tech-icons/next.svg', label: 'Next.js' },
  { src: '/tech-icons/openai-logo.svg', label: 'OpenAI' },
  { src: '/tech-icons/react.svg', label: 'React' },
  { src: '/tech-icons/shadcn.svg', label: 'shadcn/ui' },
  { src: '/tech-icons/tailwind.svg', label: 'Tailwind CSS' },
  { src: '/tech-icons/TypeScript.svg', label: 'TypeScript' },
  { src: '/tech-icons/vercel.svg', label: 'Vercel' },
  { src: '/tech-icons/Zustand.svg', label: 'Zustand' },
]

function RetroTvScreenLayer({
  slide,
  variant,
}: {
  slide: RetroTvSlide
  variant: 'enter' | 'exit'
}) {
  return (
    <div
      className={cn(
        styles.screen_layer,
        variant === 'enter' ? styles.screen_layer_enter : styles.screen_layer_exit,
      )}
    >
      <div className={styles.screen_content}>
        <div className={styles.screen_media}>
          <Image
            src={slide.src}
            alt={slide.label}
            fill
            sizes="(max-width: 640px) 88px, 104px"
            className={styles.screen_icon}
          />
        </div>
        <span className={styles.screen_label}>{slide.label}</span>
      </div>
    </div>
  )
}

export function HomeRetroTv({
  className,
  slides = DEFAULT_SLIDES,
}: {
  className?: string
  slides?: RetroTvSlide[]
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [previousIndex, setPreviousIndex] = useState<number | null>(null)

  useEffect(() => {
    if (slides.length <= 1) {
      return
    }

    const advanceTimer = window.setTimeout(() => {
      setPreviousIndex(currentIndex)
      setCurrentIndex((currentIndex + 1) % slides.length)
    }, 2400)

    return () => {
      window.clearTimeout(advanceTimer)
    }
  }, [currentIndex, slides.length])

  useEffect(() => {
    if (previousIndex === null) {
      return
    }

    const cleanupTimer = window.setTimeout(() => {
      setPreviousIndex(null)
    }, 420)

    return () => {
      window.clearTimeout(cleanupTimer)
    }
  }, [previousIndex])

  const currentSlide = slides[currentIndex] ?? null
  const previousSlide = previousIndex === null ? null : (slides[previousIndex] ?? null)

  const renderScreenContent = () => {
    if (!currentSlide) {
      return <span className={styles.notfound_text}>NO SIGNAL</span>
    }

    return (
      <>
        {previousSlide ? <RetroTvScreenLayer slide={previousSlide} variant="exit" /> : null}
        <RetroTvScreenLayer slide={currentSlide} variant="enter" />
      </>
    )
  }

  return (
    <div className={cn(styles.main_wrapper, className)} aria-hidden>
      <div className={styles.main}>
        <div className={styles.antenna}>
          <div className={styles.antenna_shadow} />
          <div className={styles.a1} />
          <div className={styles.a1d} />
          <div className={styles.a2} />
          <div className={styles.a2d} />
          <div className={styles.a_base} />
        </div>
        <div className={styles.tv}>
          <div className={styles.cruve}>
            <svg
              className={styles.curve_svg}
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 189.929 189.929"
              xmlSpace="preserve"
            >
              <path d="M70.343,70.343c-30.554,30.553-44.806,72.7-39.102,115.635l-29.738,3.951C-5.442,137.659,11.917,86.34,49.129,49.13C86.34,11.918,137.664-5.445,189.928,1.502l-3.95,29.738C143.041,25.54,100.895,39.789,70.343,70.343z" />
            </svg>
          </div>
          <div className={styles.display_div}>
            <div className={styles.screen_out}>
              <div className={styles.screen_out1}>
                <div className={styles.screen}>{renderScreenContent()}</div>
                <div className={styles.screenM}>{renderScreenContent()}</div>
              </div>
            </div>
          </div>
          <div className={styles.lines}>
            <div className={styles.line1} />
            <div className={styles.line2} />
            <div className={styles.line3} />
          </div>
          <div className={styles.buttons_div}>
            <div className={styles.b1}>
              <div />
            </div>
            <div className={styles.b2} />
            <div className={styles.speakers}>
              <div className={styles.g1}>
                <div className={styles.g11} />
                <div className={styles.g12} />
                <div className={styles.g13} />
              </div>
              <div className={styles.g} />
              <div className={styles.g} />
            </div>
          </div>
        </div>
        <div className={styles.bottom}>
          <div className={styles.base1} />
          <div className={styles.base2} />
          <div className={styles.base3} />
        </div>
      </div>
      <div className={styles.text_404}>
        <div className={styles.text_4041}>4</div>
        <div className={styles.text_4042}>0</div>
        <div className={styles.text_4043}>4</div>
      </div>
    </div>
  )
}
