import React, { useEffect, useState } from 'react';
import { supabase } from '@/config/supabase';
import { User } from '@/types/user.types';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { useAuthStore } from '@/store/auth.store';

interface ProfileModuleProps {
  userId?: string; 
}

/**
 * Módulo de Perfil simplificado.
 * Toda a edição é feita inline diretamente no ProfileCard.
 */
export function ProfileModule({ userId }: ProfileModuleProps) {
  const currentUser = useAuthStore(state => state.user);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser?.id === (userId || targetUser?.id);

  useEffect(() => {
    const idToFetch = userId || currentUser?.id;
    if (!idToFetch) return;

    const fetchUser = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', idToFetch)
        .single();
      
      if (data) setTargetUser(data as User);
      setLoading(false);
    };

    fetchUser();

    // Listener Real-time para atualizações de perfil
    const channel = supabase
      .channel(`profile:${idToFetch}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${idToFetch}` }, 
      (payload) => {
        setTargetUser(current => ({ ...current!, ...payload.new }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, currentUser]);

  if (loading) return <div style={{ height: '100%' }}><Skeleton height="100%" /></div>;
  if (!targetUser) return <div style={{ padding: '20px', textAlign: 'center' }}>Usuário não encontrado</div>;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <ProfileCard 
        user={targetUser} 
        variant="profile" 
        isEditable={isOwnProfile} 
      />
    </div>
  );
}
