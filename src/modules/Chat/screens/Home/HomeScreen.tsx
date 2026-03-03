import React, { useEffect } from 'react';
import { useChatStore } from '@/store/modules/chat.store';
import { ChatCard } from '../../components/ChatCard/ChatCard';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import styles from './Home.module.css';

export function HomeScreen() {
  const { conversations, loadConversations, isLoading, setActiveConversation, activeConversationId } = useChatStore();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Mensagens</h2>
        <button className={styles.newChatBtn}>+</button>
      </header>

      <div className={styles.searchBox}>
        <input type="text" placeholder="Buscar conversas..." className={styles.searchInput} />
      </div>

      <div className={styles.list}>
        {isLoading && conversations.length === 0 ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} style={{ padding: '1rem' }}>
              <Skeleton width="100%" height="60px" borderRadius="12px" />
            </div>
          ))
        ) : (
          conversations.map(conv => (
            <ChatCard 
              key={conv.id} 
              conversation={conv} 
              isActive={activeConversationId === conv.id}
              onClick={() => setActiveConversation(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
