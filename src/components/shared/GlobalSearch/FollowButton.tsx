import React, { useState, useEffect } from 'react';
import { followService } from '@/services/follow.service';
import { useAuthStore } from '@/store/auth.store';

interface FollowButtonProps {
  targetUserId: string;
}

export function FollowButton({ targetUserId }: FollowButtonProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { supabase } = await import('@/config/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user || session.user.id === targetUserId) {
        setIsLoading(false);
        return;
      }

      setCurrentUser(session.user);

      const isFollowingResult = await followService.isFollowing(session.user.id, targetUserId);
      setIsFollowing(isFollowingResult);
      setIsLoading(false);
    };

    init();
  }, [targetUserId]);

  const toggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || isLoading) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollow(currentUser.id, targetUserId);
        setIsFollowing(false);
      } else {
        await followService.follow(currentUser.id, targetUserId);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Erro ao seguir/unfollow:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <span style={{ fontSize: '10px', opacity: 0.5 }}>...</span>;
  if (!currentUser) return null;

  return (
    <button 
      onClick={toggleFollow}
      disabled={isLoading}
      style={{
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 700,
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.2s ease',
        background: isFollowing ? 'rgba(255,255,255,0.1)' : 'var(--color-title)',
        color: isFollowing ? 'var(--color-title)' : 'var(--bg-base)',
        opacity: isLoading ? 0.5 : 1
      }}
    >
      {isLoading ? '...' : isFollowing ? 'Seguindo' : 'Seguir'}
    </button>
  );
}
