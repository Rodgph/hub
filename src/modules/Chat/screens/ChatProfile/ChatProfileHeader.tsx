import { ProfileAvatar } from '@/components/profile/ProfileAvatar/ProfileAvatar'
import { ProfileBanner } from '@/components/profile/ProfileBanner/ProfileBanner'
import styles from './ChatProfile.module.css'

interface ChatProfileHeaderProps {
  userId: string
}

export function ChatProfileHeader({ userId }: ChatProfileHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.bannerContainer}>
        <ProfileBanner userId={userId} variant="profile" />
        <div className={styles.avatarOverlay}>
          <ProfileAvatar userId={userId} variant="full" />
        </div>
      </div>
      
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${styles.active}`}>POSTS</button>
        <button className={styles.tab}>FOLLOWERS</button>
        <button className={styles.tab}>FOLLOWING</button>
        <button className={styles.tab}>BIO</button>
      </div>
    </header>
  )
}
