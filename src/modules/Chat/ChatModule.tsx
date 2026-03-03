import React, { useEffect } from 'react';
import { useChatStore } from '@/store/modules/chat.store';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/config/supabase';
import { HomeScreen } from './screens/Home/HomeScreen';
import { ChatDMScreen } from './screens/ChatDM/ChatDMScreen';
import styles from './Chat.module.css';

export function ChatModule() {
  const { activeConversationId, addMessageRealtime, loadConversations } = useChatStore();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (!user) return;

    // Escutar novas mensagens em tempo real
    const channel = supabase
      .channel('chat_global')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        },
        (payload) => {
          // Se a mensagem for para a conversa ativa, adiciona na lista
          if (payload.new.conversation_id === activeConversationId) {
            addMessageRealtime(payload.new.conversation_id, payload.new);
          }
          // Sempre atualiza a lista de conversas para mostrar o novo preview/badge
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeConversationId, addMessageRealtime, loadConversations]);

  return (
    <div className={styles.container}>
      {!activeConversationId ? (
        <HomeScreen />
      ) : (
        <ChatDMScreen />
      )}
    </div>
  );
}

export default ChatModule;
