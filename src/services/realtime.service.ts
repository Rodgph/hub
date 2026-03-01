import { supabase } from '@/config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeHandler = (payload: any) => void;

const activeChannels = new Map<string, RealtimeChannel>();

/**
 * Serviço para gerenciar subscrições em tempo real do Supabase.
 */
export const realtimeService = {
  /**
   * Se inscreve em um canal específico e define um handler para mudanças no Postgres.
   */
  subscribe: (channelName: string, table: string, filter: string, handler: RealtimeHandler) => {
    if (activeChannels.has(channelName)) {
      return activeChannels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter,
        },
        (payload) => handler(payload)
      )
      .subscribe();

    activeChannels.set(channelName, channel);
    return channel;
  },

  /**
   * Remove a subscrição de um canal.
   */
  unsubscribe: (channelName: string) => {
    const channel = activeChannels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      activeChannels.delete(channelName);
    }
  }
};
