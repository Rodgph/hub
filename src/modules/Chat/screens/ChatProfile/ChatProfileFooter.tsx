import styles from './ChatProfile.module.css'

export function ChatProfileFooter() {
  return (
    <footer className={styles.footer}>
      <button className={styles.actionBtn}>MESSAGE</button>
      <div className={styles.controls}>
        <button title="Show/Hide">👁️</button>
        <button title="Move">⤢</button>
        <button title="Settings">⚙️</button>
        <button title="Volume">🔊</button>
      </div>
    </footer>
  )
}
