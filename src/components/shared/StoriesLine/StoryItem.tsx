import React from 'react';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar/ProfileAvatar';
import styles from '@/components/profile/ProfileAvatar/profile.module.css';

interface StoryItemProps {
  userId: string;
  username: string;
  avatarUrl?: string;
  hasNewStory?: boolean;
  isMe?: boolean;
}

export function StoryItem({ username, avatarUrl, hasNewStory = false, isMe = false }: StoryItemProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      cursor: 'pointer',
      flexShrink: 0,
      width: '64px'
    }}>
      <div style={{ position: 'relative' }}>
        <ProfileAvatar 
          userId="" 
          url={avatarUrl} 
          variant="medium" 
          hasStory={hasNewStory} 
          storySeen={!hasNewStory} 
        />
        {isMe && (
          <div style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '18px',
            height: '18px',
            background: 'var(--color-title)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--bg-module)',
            fontSize: '12px',
            color: 'var(--bg-base)',
            fontWeight: 'bold',
            zIndex: 10
          }}>+</div>
        )}
      </div>
      <span style={{ 
        fontSize: '10px', 
        fontWeight: 600, 
        color: hasNewStory ? 'var(--color-title)' : 'var(--color-subtitle)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%',
        textAlign: 'center'
      }}>
        {isMe ? 'Seu Story' : username}
      </span>
    </div>
  );
}
