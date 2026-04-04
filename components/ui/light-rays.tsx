import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import styles from './light-rays.module.css'

type LightRayConfig = {
  left: string
  width: string
  rotate: string
  delay: string
  durationScale: number
}

const LIGHT_RAY_CONFIGS: LightRayConfig[] = [
  { left: '8%', width: '16rem', rotate: '-18deg', delay: '-3s', durationScale: 0.92 },
  { left: '18%', width: '13rem', rotate: '-12deg', delay: '-8s', durationScale: 1.08 },
  { left: '31%', width: '18rem', rotate: '-5deg', delay: '-5s', durationScale: 0.96 },
  { left: '46%', width: '14rem', rotate: '2deg', delay: '-11s', durationScale: 1.04 },
  { left: '58%', width: '20rem', rotate: '9deg', delay: '-6s', durationScale: 0.9 },
  { left: '71%', width: '15rem', rotate: '14deg', delay: '-14s', durationScale: 1.1 },
  { left: '85%', width: '18rem', rotate: '19deg', delay: '-9s', durationScale: 0.94 },
]

type LightRaysProps = {
  count?: number
  color?: string
  blur?: number
  opacity?: number
  speed?: number
  length?: string | number
  className?: string
  style?: CSSProperties
}

export function LightRays({
  count = 7,
  color = 'rgba(160, 210, 255, 0.22)',
  blur = 36,
  opacity = 0.65,
  speed = 14,
  length = '72vh',
  className,
  style,
}: LightRaysProps) {
  const normalizedLength = typeof length === 'number' ? `${length}px` : length

  return (
    <div
      className={cn(styles.wrapper, className)}
      style={
        {
          '--light-rays-color': color,
          '--light-rays-blur': `${blur}px`,
          '--light-rays-opacity': opacity.toString(),
          '--light-rays-length': normalizedLength,
          ...style,
        } as CSSProperties
      }
      aria-hidden
    >
      <div className={styles.glow} />
      {LIGHT_RAY_CONFIGS.slice(0, count).map((ray, index) => (
        <span
          key={`${ray.left}-${index}`}
          className={styles.ray}
          style={
            {
              '--ray-left': ray.left,
              '--ray-width': ray.width,
              '--ray-rotate': ray.rotate,
              '--ray-delay': ray.delay,
              '--ray-duration': `${speed * ray.durationScale}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
