import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/config/supabase';

/**
 * Hook para gerenciar o status de presença (online/offline) do usuário.
 */
export function usePresence() {
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (!user?.id) return;

    const updateStatus = async (status: 'online' | 'offline') => {
      await supabase
        .from('user_status')
        .upsert({ 
          user_id: user.id, 
          status, 
          last_seen_at: new Date().toISOString() 
        });
    };

    // Marca como online ao entrar
    updateStatus('online');

    // Tenta marcar como offline ao fechar/sair
    const handleUnload = () => {
      // Usar sendBeacon para garantir que a requisição ocorra no fechamento
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_status`;
      const body = JSON.stringify({ user_id: user.id, status: 'offline' });
      const headers = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${supabase.auth.getSession()}`
      };
      
      // Nota: Em Tauri, o gerenciamento de ciclo de vida pode ser feito via backend Rust no futuro
      updateStatus('offline');
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      updateStatus('offline');
    };
  }, [user?.id]);
}
