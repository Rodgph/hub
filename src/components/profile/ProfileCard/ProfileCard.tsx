import { ProfileAvatar } from '../ProfileAvatar/ProfileAvatar'
import { ProfileStatus } from '../ProfileStatus/ProfileStatus'
import styles from './ProfileCard.module.css'

interface ProfileCardProps {
  userId: string
  variant?: 'mini' | 'medium' | 'full'
}

export function ProfileCard({ userId, variant = 'medium' }: ProfileCardProps) {
  return (
    <div className={`${styles.card} ${styles[variant]}`}>
      <ProfileAvatar userId={userId} variant={variant === 'mini' ? 'mini' : 'medium'} />
      <div className={styles.info}>
        <ProfileStatus userId={userId} showActivity={variant !== 'mini'} />
      </div>
    </div>
  )
}
