import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useEventsStore } from '@/store/events.store';
import { realtimeService } from '@/services/realtime.service';
import { CHANNELS } from './channels';

const RealtimeContext = createContext<null>(null);

/**
 * Provider que inicializa e gerencia as conexões em tempo real baseadas no usuário logado.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(state => state.user);
  const emit = useEventsStore(state => state.emit);

  useEffect(() => {
    if (!user?.id) return;

    // 1. Inscrição no canal de notificações
    const notificationChannel = realtimeService.subscribe(
      CHANNELS.notifications(user.id),
      'notifications',
      `user_id=eq.${user.id}`,
      (payload) => emit('message:new', payload.new) // TODO: Mudar para evento específico de notificação
    );

    // 2. Inscrição no canal de configurações (layout/tema)
    const settingsChannel = realtimeService.subscribe(
      CHANNELS.settings(user.id),
      'user_settings',
      `user_id=eq.${user.id}`,
      (payload) => emit('layout:change', payload.new)
    );

    return () => {
      realtimeService.unsubscribe(CHANNELS.notifications(user.id));
      realtimeService.unsubscribe(CHANNELS.settings(user.id));
    };
  }, [user?.id, emit]);

  return (
    <RealtimeContext.Provider value={null}>
      {children}
    </RealtimeContext.Provider>
  );
}
