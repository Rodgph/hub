import { useEffect } from 'react'
import { useChatStore } from '@/store/modules/chat.store'
import { ChatCard } from '../../components/ChatCard/ChatCard'
import { HomeHeader } from './HomeHeader'
import { HomeFooter } from './HomeFooter'
import styles from './Home.module.css'

interface HomeScreenProps {
  onSelectConversation: () => void
}

export function HomeScreen({ onSelectConversation }: HomeScreenProps) {
  const { conversations, loadConversations, activeConversationId, setActiveConversation } = useChatStore()

  useEffect(() => {
    loadConversations()
  }, [])

  const handleSelect = (id: string) => {
    setActiveConversation(id)
    onSelectConversation()
  }

  return (
    <div className={styles.homeScreen}>
      <HomeHeader />
      
      <div className={styles.scrollArea}>
        {conversations.map(conv => (
          <ChatCard 
            key={conv.id} 
            conversation={conv}
            isActive={activeConversationId === conv.id}
            onClick={() => handleSelect(conv.id)} 
          />
        ))}
        {conversations.length === 0 && (
          <div className={styles.empty}>
             💬 Nenhuma conversa ainda
          </div>
        )}
      </div>

      <HomeFooter />
    </div>
  )
}
