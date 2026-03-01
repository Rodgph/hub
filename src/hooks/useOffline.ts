import { useEffect } from 'react';
import { useOfflineStore } from '@/store/offline.store';

/**
 * Hook para detectar o status da conexão e gerenciar a fila de ações offline.
 */
export function useOffline() {
  const { setOnline, isOnline } = useOfflineStore();

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Teste real de conexão (ping no Google/Cloudflare se necessário no futuro)
    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  return { isOnline };
}
