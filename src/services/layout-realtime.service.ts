import { supabase } from '@/config/supabase';
import { useLayoutStore } from '@/store/layout.store';

/**
 * Serviço para lidar com sincronização em tempo real do layout via Supabase.
 */
export const layoutRealtimeService = {
  subscribe: (userId: string) => {
    const channel = supabase
      .channel(`layout:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).saved_layouts) {
            useLayoutStore.getState().loadLayout();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
