import React from 'react';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar/ProfileAvatar';
import { useAuthStore } from '@/store/auth.store';
import styles from './ChatCard.module.css';

interface ChatCardProps {
  conversation: any;
  isActive: boolean;
  onClick: () => void;
}

export function ChatCard({ conversation, isActive, onClick }: ChatCardProps) {
  const currentUser = useAuthStore(state => state.user);
  
  // Encontrar o outro participante (para DMs)
  const otherMember = conversation.type === 'dm' 
    ? conversation.members?.find((m: any) => m.user_id !== currentUser?.id)
    : null;

  const displayName = conversation.type === 'dm' 
    ? otherMember?.user?.display_name || 'Usuário'
    : conversation.name;

  const lastMsg = conversation.last_message?.[0];

  return (
    <div 
      className={`${styles.container} ${isActive ? styles.active : ''}`}
      onClick={onClick}
    >
      <div className={styles.avatarWrapper}>
        <ProfileAvatar 
          userId={conversation.type === 'dm' ? otherMember?.user_id : conversation.id} 
          variant="medium" 
        />
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.name}>{displayName}</span>
          {lastMsg && (
            <span className={styles.time}>
              {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className={styles.footer}>
          <p className={styles.preview}>
            {lastMsg ? lastMsg.content : 'Nenhuma mensagem ainda'}
          </p>
          {conversation.unread_count > 0 && (
            <span className={styles.badge}>{conversation.unread_count}</span>
          )}
        </div>
      </div>
    </div>
  );
}
