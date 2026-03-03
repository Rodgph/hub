import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: any;
  isSequence?: boolean;
}

export function MessageBubble({ message, isSequence }: MessageBubbleProps) {
  const currentUser = useAuthStore(state => state.user);
  const isOwn = message.sender_id === currentUser?.id;
  const isLocked = message.has_password && !message.is_unlocked;
  const [passwordInput, setPasswordInput] = useState('');

  const handleUnlock = () => {
    // Lógica de desbloqueio será implementada no store/service
    console.log('Tentando desbloquear com:', passwordInput);
  };

  return (
    <div className={`${styles.wrapper} ${isOwn ? styles.own : styles.other} ${isSequence ? styles.sequence : ''}`}>
      {!isOwn && !isSequence && (
        <span className={styles.senderName}>{message.sender?.display_name || 'Usuário'}</span>
      )}
      
      <div className={`${styles.bubble} ${isLocked ? styles.locked : ''}`}>
        {isLocked ? (
          <div className={styles.lockedContent}>
            <span className={styles.lockIcon}>🔒</span>
            <p className={styles.lockedText}>Mensagem protegida</p>
            {!isOwn && (
              <div className={styles.unlockForm}>
                <input 
                  type="password" 
                  placeholder="Senha" 
                  className={styles.lockInput}
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                />
                <button onClick={handleUnlock} className={styles.unlockBtn}>OK</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <p className={styles.text}>{message.content}</p>
            <span className={styles.time}>
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {isOwn && message.status === 'sending' && ' 🕐'}
              {isOwn && message.status === 'sent' && ' ✓'}
              {isOwn && message.status === 'read' && ' ✓✓'}
              {isOwn && message.status === 'failed' && ' ⚠️'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
