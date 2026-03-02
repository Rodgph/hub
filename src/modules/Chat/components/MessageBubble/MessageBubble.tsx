import { ProfileAvatar } from '@/components/profile/ProfileAvatar/ProfileAvatar'
import styles from './MessageBubble.module.css'

interface MessageBubbleProps {
  message: any
  isMine: boolean
  isFirstInGroup?: boolean
}

export function MessageBubble({ message, isMine, isFirstInGroup }: MessageBubbleProps) {
  const { content, created_at, status, is_edited } = message
  const time = new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`${styles.bubbleWrapper} ${isMine ? styles.mine : styles.other}`}>
      {!isMine && isFirstInGroup && (
        <div className={styles.avatar}>
          <ProfileAvatar userId={message.sender_id} variant="mini" />
        </div>
      )}
      
      <div className={`${styles.bubble} ${!isMine && !isFirstInGroup ? styles.noAvatar : ''}`}>
        <div className={styles.content}>
          {content}
        </div>
        
        <div className={styles.meta}>
          {is_edited && <span className={styles.edited}>editado</span>}
          <span className={styles.time}>{time}</span>
          {isMine && (
            <span className={styles.status}>
              {status === 'sending' && '🕐'}
              {status === 'sent' && '✓'}
              {status === 'read' && '✓✓'}
              {status === 'failed' && '⚠️'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
