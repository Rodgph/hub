import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar/ProfileAvatar';
import { supabase } from '@/config/supabase';
import styles from './Chat.module.css';

export function ChatModule() {
  const user = useAuthStore(state => state.user);
  const { 
    activeConversationId, 
    messages, 
    loadMessages, 
    sendMessage, 
    addMessage,
    setActiveConversation 
  } = useChatStore();
  
  const [inputValue, setInputValue] = useState('');
  const [width, setWidth] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Monitora a largura do módulo
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const isCompact = width <= 400;
  const showSidebar = !isCompact || !activeConversationId;
  const showContent = activeConversationId && (!isCompact || !showSidebar);

  // Mock de conversas para o layout lateral (depois virá do DB)
  const conversations = [
    { id: 'global', name: 'Canal Global', lastMsg: 'Bem-vindo ao Social OS', online: true }
  ];

  useEffect(() => {
    if (!activeConversationId) return;

    loadMessages(activeConversationId);

    // Inscrição Real-time para a conversa ativa
    const channel = supabase
      .channel(`chat:${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload: any) => {
          addMessage(activeConversationId, payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, loadMessages, addMessage]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user || !activeConversationId) return;
    
    const content = inputValue;
    setInputValue('');
    await sendMessage(activeConversationId, content, user.id);
  };

  const currentMessages = activeConversationId ? (messages[activeConversationId] || []) : [];

  return (
    <div ref={containerRef} className={styles.container}>
      {showSidebar && (
        <div className={styles.sidebar} style={{ width: isCompact ? '100%' : '300px' }}>
          <div className={styles.header}>
            <h2>Chats</h2>
          </div>
          <div className={styles.chatList}>
            {conversations.map(conv => (
              <div 
                key={conv.id} 
                className={`${styles.chatItem} ${activeConversationId === conv.id ? styles.active : ''}`}
                onClick={() => setActiveConversation(conv.id)}
              >
                <ProfileAvatar userId={conv.id} status="online" variant="medium" />
                <div className={styles.chatInfo}>
                  <span className={styles.name}>{conv.name}</span>
                  <p className={styles.lastMsg}>{conv.lastMsg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showContent && (
        <div className={styles.content}>
          <div className={styles.activeChat}>
            <div className={styles.chatHeader}>
              {isCompact && (
                <button 
                  className={styles.backBtn}
                  onClick={() => setActiveConversation(null)}
                >
                  ←
                </button>
              )}
              <span className={styles.activeTitle}>Canal Global</span>
            </div>
            <div className={styles.messagesArea}>
              {currentMessages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`${styles.messageWrapper} ${msg.author_id === user?.id ? styles.own : ''}`}
                >
                  <div className={styles.messageBubble}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <form className={styles.inputArea} onSubmit={handleSend}>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="Conversar..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </form>
          </div>
        </div>
      )}

      {!activeConversationId && !isCompact && (
        <div className={styles.emptyState}>Selecione um chat</div>
      )}
    </div>
  );
}
