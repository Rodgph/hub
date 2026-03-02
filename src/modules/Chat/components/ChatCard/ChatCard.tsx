import { ProfileAvatar } from '@/components/profile/ProfileAvatar/ProfileAvatar'
import { ProfileBanner } from '@/components/profile/ProfileBanner/ProfileBanner'
import styles from './ChatCard.module.css'

interface ChatCardProps {
  conversation: any
  isActive?: boolean
  onClick: () => void
}

export function ChatCard({ conversation, isActive, onClick }: ChatCardProps) {
  const { last_message, members, is_pinned } = conversation
  const otherMember = members?.[0]?.user
  
  return (
    <div 
      className={`${styles.card} ${isActive ? styles.active : ''}`}
      onClick={onClick}
    >
      <div className={styles.bannerWrapper}>
        <ProfileBanner userId={otherMember?.id} variant="card" />
      </div>

      <div className={styles.content}>
        <ProfileAvatar userId={otherMember?.id} variant="medium" />
        
        <div className={styles.info}>
          <div className={styles.header}>
            <span className={styles.username}>@{otherMember?.username || 'user'}</span>
            <span className={styles.time}>
              {last_message?.[0] ? new Date(last_message[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
          
          <div className={styles.footer}>
            <p className={styles.preview}>
              {last_message?.[0]?.content || 'Nenhuma mensagem ainda...'}
            </p>
            {is_pinned && <span className={styles.pin}>📌</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
