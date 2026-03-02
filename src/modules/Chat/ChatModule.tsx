import { useState } from 'react'
import { useChatStore } from '@/store/modules/chat.store'
import { HomeScreen } from './screens/Home/HomeScreen'
import { ChatDMScreen } from './screens/ChatDM/ChatDMScreen'
import { ChatProfileScreen } from './screens/ChatProfile/ChatProfileScreen'
import styles from './Chat.module.css'

export function ChatModule() {
  const [currentFlow, setCurrentFlow] = useState<'home' | 'dm' | 'profile'>('home')
  const { activeConversationId, conversations } = useChatStore()

  // Helpers de navegação
  const goToHome = () => setCurrentFlow('home')
  const goToDM = () => setCurrentFlow('dm')
  const goToProfile = () => setCurrentFlow('profile')

  const activeConv = conversations.find(c => c.id === activeConversationId)
  const otherMemberId = activeConv?.members?.[0]?.user?.id

  return (
    <div className={styles.moduleContainer}>
      {currentFlow === 'home' && (
        <HomeScreen onSelectConversation={() => setCurrentFlow('dm')} />
      )}
      
      {currentFlow === 'dm' && (
        <ChatDMScreen 
          onBack={goToHome} 
          onOpenProfile={goToProfile} 
        />
      )}

      {currentFlow === 'profile' && otherMemberId && (
        <ChatProfileScreen 
          userId={otherMemberId} 
          onBack={goToDM} 
        />
      )}
    </div>
  )
}
