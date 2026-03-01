import React, { useEffect } from 'react';
import { LayoutEngine } from '@/engine/layout/LayoutEngine';
import { BottomBar } from './BottomBar/BottomBar';
import { ContextMenu } from '@/components/shared/ContextMenu/ContextMenu';
import { useLayoutStore } from '@/store/layout.store';
import { useAuthStore } from '@/store/auth.store';
import { layoutRealtimeService } from '@/services/layout-realtime.service';

import { OfflineBanner } from '@/components/shared/OfflineBanner/OfflineBanner';

export function AppLayout() {
  const loadLayout = useLayoutStore(state => state.loadLayout);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  useEffect(() => {
    if (user?.id) {
      return layoutRealtimeService.subscribe(user.id);
    }
  }, [user?.id]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'var(--bg-base, #000000)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <OfflineBanner />
      <main style={{ flex: 1, overflow: 'hidden' }}>
        <LayoutEngine />
      </main>
      <BottomBar />
      <ContextMenu />
    </div>
  )
}