import { ChatProfileHeader } from './ChatProfileHeader'
import { ChatProfileSection } from './ChatProfileSection'
import { ChatProfileFooter } from './ChatProfileFooter'
import styles from './ChatProfile.module.css'

interface ChatProfileScreenProps {
  userId: string
  onBack: () => void
}

export function ChatProfileScreen({ userId, onBack }: ChatProfileScreenProps) {
  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={onBack}>←</button>
      <ChatProfileHeader userId={userId} />
      <div className={styles.scrollArea}>
        <ChatProfileSection userId={userId} />
      </div>
      <ChatProfileFooter />
    </div>
  )
}
