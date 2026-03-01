import React from 'react';
import { useOfflineStore } from '@/store/offline.store';

/**
 * Banner que aparece no topo do app quando a conexão é perdida.
 */
export function OfflineBanner() {
  const isOnline = useOfflineStore(state => state.isOnline);
  const queueCount = useOfflineStore(state => state.queue.length);

  if (isOnline) return null;

  return (
    <div style={{
      width: '100%',
      padding: '4px 12px',
      background: 'var(--status-dnd)',
      color: '#fff',
      fontSize: '11px',
      fontWeight: 600,
      textAlign: 'center',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      <span>⚠️ Modo Offline Ativado</span>
      {queueCount > 0 && (
        <span style={{ opacity: 0.8 }}>
          ({queueCount} ações aguardando sincronização)
        </span>
      )}
    </div>
  );
}
