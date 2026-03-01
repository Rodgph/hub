/**
 * Definição de todos os canais Realtime do sistema.
 * Centraliza as strings de tópicos para evitar erros de digitação.
 */
export const CHANNELS = {
  // Canal global para configurações do usuário (layout, tema, etc)
  settings: (userId: string) => `settings:${userId}`,
  
  // Canais de conversas e mensagens
  conversation: (id: string) => `conversation:${id}`,
  
  // Canal global de presença e status
  presence: () => 'global_presence',
  
  // Canal do feed de postagens
  feed: () => 'global_feed',
  
  // Canal de notificações do usuário
  notifications: (userId: string) => `notifications:${userId}`,
};
