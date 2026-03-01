import React from 'react';
import { PresenceStatus } from '@/types/status.types';
import styles from './profile.module.css';

interface ProfileAvatarProps {
  userId: string;
  url?: string;
  status?: PresenceStatus;
  variant?: 'mini' | 'medium' | 'full';
  hasStory?: boolean;
  storySeen?: boolean;
}

export function ProfileAvatar({ 
  url, 
  status = 'offline', 
  variant = 'medium',
  hasStory = false,
  storySeen = false 
}: ProfileAvatarProps) {
  const size = variant === 'mini' ? 32 : variant === 'medium' ? 48 : 80;

  return (
    <div className={`${styles.avatarContainer} ${styles[variant]}`} style={{ width: size, height: size }}>
      {hasStory && (
        <div className={`${styles.storyRing} ${storySeen ? styles.seen : styles.unseen}`} />
      )}
      
      <div className={styles.imageWrapper}>
        {url ? (
          <img src={url} alt="Avatar" className={styles.avatarImage} />
        ) : (
          <div className={styles.avatarPlaceholder}>👤</div>
        )}
      </div>

      <div className={`${styles.statusIndicator} ${styles[status]}`} />
    </div>
  );
}
