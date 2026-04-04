'use client'

import styles from './ChatThinkingLoader.module.css'

export function ChatThinkingLoader() {
  return (
    <div className="flex items-center py-1" role="status" aria-label="加载中">
      <div className={styles.threeBody} aria-hidden>
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={styles.dot} />
      </div>
      <span className="sr-only">加载中</span>
    </div>
  )
}
