import { ProfileCard } from '@/components/profile/ProfileCard/ProfileCard'
import { StoriesLine } from '@/components/shared/StoriesLine/StoriesLine'
import styles from './ChatDM.module.css'

interface ChatDMHeaderProps {
  conversation: any
  onBack: () => void
  onOpenProfile: () => void
}

export function ChatDMHeader({ conversation, onBack, onOpenProfile }: ChatDMHeaderProps) {
  const otherMember = conversation.members?.[0]?.user
  
  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.profileContainer} onClick={onOpenProfile} style={{ cursor: 'pointer' }}>
           <ProfileCard userId={otherMember?.id} />
        </div>
        <div className={styles.actions}>
          <button title="Call">📞</button>
          <button title="Video">📹</button>
          <button title="More">⋮</button>
        </div>
      </div>
      
      <div className={styles.storiesRow}>
        <StoriesLine />
      </div>
    </header>
  )
}
