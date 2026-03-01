import React from 'react';
import { ProfileAvatar } from './ProfileAvatar/ProfileAvatar';
import { ProfileBanner } from './ProfileBanner/ProfileBanner';
import { User } from '@/types/user.types';
import styles from './ProfileAvatar/profile.module.css';

interface ProfileCardProps {
  user: User;
  variant?: 'card' | 'chat' | 'profile';
}

/**
 * Componente unificado que exibe o card completo do usuário.
 */
export function ProfileCard({ user, variant = 'card' }: ProfileCardProps) {
  return (
    <div style={{
      width: '100%',
      borderRadius: 'var(--radius-module)',
      overflow: 'hidden',
      background: 'var(--bg-module)',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <ProfileBanner userId={user.id} url={user.banner_url} type={user.banner_type} variant={variant} />
      
      <div style={{ padding: '12px', marginTop: '-30px', position: 'relative', zIndex: 10 }}>
        <ProfileAvatar url={user.avatar_url} status={user.status} variant="medium" />
        
        <div style={{ marginTop: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{user.full_name || user.username}</h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-subtitle)' }}>@{user.username}</p>
        </div>

        {user.bio && (
          <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-subtitle)', lineHeight: '1.4' }}>
            {user.bio}
          </p>
        )}
      </div>
    </div>
  );
}
