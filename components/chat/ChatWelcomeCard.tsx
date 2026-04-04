import styles from './ChatWelcomeCard.module.css'

export function ChatWelcomeCard() {
  return (
    <div className={styles.wrapper} aria-hidden>
      <div className={styles.shadow} />
      <div className={styles.container}>
        <input
          className={styles.input}
          placeholder="选择一个模型，开始你的对话之旅！"
          disabled
          readOnly
          tabIndex={-1}
        />
      </div>
    </div>
  )
}
