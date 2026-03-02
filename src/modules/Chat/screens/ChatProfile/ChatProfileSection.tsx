import { ProfileStatus } from '@/components/profile/ProfileStatus/ProfileStatus'
import styles from './ChatProfile.module.css'

interface ChatProfileSectionProps {
  userId: string
}

export function ChatProfileSection({ userId }: ChatProfileSectionProps) {
  return (
    <div className={styles.section}>
      <div className={styles.statusBox}>
        <ProfileStatus userId={userId} />
      </div>

      <div className={styles.activities}>
        <h3 className={styles.sectionTitle}>Atividades Recentes</h3>
        
        {/* Cards de atividades (exemplo) */}
        <div className={styles.activityCard}>
          <div className={styles.activityBg} style={{ backgroundImage: 'url(https://placeholder.com/music-bg.jpg)' }} />
          <div className={styles.activityContent}>
             <span className={styles.activityType}>LISTENING</span>
             <span className={styles.activityName}>God's Plan - Drake</span>
          </div>
        </div>

        <div className={styles.activityCard}>
          <div className={styles.activityBg} style={{ backgroundImage: 'url(https://placeholder.com/game-bg.jpg)' }} />
          <div className={styles.activityContent}>
             <span className={styles.activityType}>PLAYING</span>
             <span className={styles.activityName}>EA FC 24</span>
             <span className={styles.activityDetail}>30 minutes ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}
