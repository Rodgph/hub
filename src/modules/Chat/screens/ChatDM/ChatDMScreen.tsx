import { useChatStore } from '@/store/modules/chat.store'
import { useAuthStore } from '@/store/auth.store'
import { ChatDMHeader } from './ChatDMHeader'
import { ChatDMSection } from './ChatDMSection'
import { ChatDMFooter } from './ChatDMFooter'
import styles from './ChatDM.module.css'

interface ChatDMScreenProps {
  onBack: () => void
  onOpenProfile: () => void
}

export function ChatDMScreen({ onBack, onOpenProfile }: ChatDMScreenProps) {
  const { activeConversationId, conversations, messages, sendMessage } = useChatStore()
  const user = useAuthStore(state => state.user)
  
  const conversation = conversations.find(c => c.id === activeConversationId)
  const conversationMessages = messages[activeConversationId || ''] || []

  if (!conversation) return null

  return (
    <div className={styles.container}>
      <ChatDMHeader 
        conversation={conversation} 
        onBack={onBack} 
        onOpenProfile={onOpenProfile} 
      />
      <ChatDMSection messages={conversationMessages} currentUserId={user?.id || ''} />
      <ChatDMFooter onSendMessage={(content) => sendMessage(conversation.id, content)} />
    </div>
  )
}
