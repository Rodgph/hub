import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/store/modules/chat.store';
import { useAuthStore } from '@/store/auth.store';
import { MessageBubble } from '../../components/MessageBubble/MessageBubble';
import { MessageGroup } from '../../components/MessageGroup/MessageGroup';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar/ProfileAvatar';
import styles from './ChatDM.module.css';

export function ChatDMScreen() {
  const [text, setText] = useState('');
  const { activeConversationId, messages, sendMessage, setActiveConversation, conversations } = useChatStore();
  const currentUser = useAuthStore(state => state.user);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find(c => c.id === activeConversationId);
  const currentMessages = activeConversationId ? (messages[activeConversationId] || []) : [];

  const otherMember = conversation?.type === 'dm' 
    ? conversation.members?.find((m: any) => m.user_id !== currentUser?.id)
    : null;

  const displayName = conversation?.type === 'dm' 
    ? otherMember?.user?.display_name || 'Usuário'
    : conversation?.name;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeConversationId) return;
    sendMessage(activeConversationId, text);
    setText('');
  };

  // Lógica de agrupamento de mensagens por autor sequencial
  const groupMessages = () => {
    const groups: any[][] = [];
    currentMessages.forEach((msg, index) => {
      const prevMsg = currentMessages[index - 1];
      if (prevMsg && prevMsg.sender_id === msg.sender_id) {
        groups[groups.length - 1].push(msg);
      } else {
        groups.push([msg]);
      }
    });
    return groups;
  };

  const messageGroups = groupMessages();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => setActiveConversation(null)}>←</button>
        <ProfileAvatar 
          userId={conversation?.type === 'dm' ? otherMember?.user_id : activeConversationId!} 
          variant="mini" 
        />
        <div className={styles.headerInfo}>
          <span className={styles.name}>{displayName}</span>
          <span className={styles.status}>online</span>
        </div>
      </header>

      <div className={styles.messageList} ref={scrollRef}>
        {messageGroups.map((group, groupIndex) => (
          <MessageGroup key={group[0].id || groupIndex}>
            {group.map((msg, index) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isSequence={index > 0} 
              />
            ))}
          </MessageGroup>
        ))}
      </div>

      <form className={styles.footer} onSubmit={handleSend}>
        <button type="button" className={styles.attachBtn}>+</button>
        <input 
          type="text" 
          placeholder="Mensagem..." 
          className={styles.input} 
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button type="submit" className={styles.sendBtn} disabled={!text.trim()}>
          {text.trim() ? '➡️' : '🎙️'}
        </button>
      </form>
    </div>
  );
}
