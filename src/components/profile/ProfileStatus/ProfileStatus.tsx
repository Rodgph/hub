import styles from './ProfileStatus.module.css'

interface ProfileStatusProps {
  userId: string
  showActivity?: boolean
}

export function ProfileStatus({ userId, showActivity = true }: ProfileStatusProps) {
  // Placeholder para lógica de tempo real (events.store)
  const status = 'online' // online | away | dnd | offline
  const activity = 'PLAYING — EA FC 24'

  return (
    <div className={styles.container}>
      <div className={`${styles.indicator} ${styles[status]}`} />
      <div className={styles.text}>
        <span className={styles.statusLabel}>{status.toUpperCase()}</span>
        {showActivity && <span className={styles.activityLabel}>{activity}</span>}
      </div>
    </div>
  )
}
