import React, { useEffect } from 'react';
import { LayoutEngine } from '@/engine/layout/LayoutEngine';
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

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setup = async () => {
      const { listen } = await import('@tauri-apps/api/event');
      const { findFirstEmptyNode, getLeafNodes } = await import('@/utils/layout-tree');

      unlisten = await listen('layout:insert-module', (event: any) => {
        const { moduleId } = event.payload;
        const layout = useLayoutStore.getState();

        // 1. Verifica se o módulo já está aberto em algum lugar
        const leafNodes = getLeafNodes(layout.tree);
        const existingNode = leafNodes.find(node => node.moduleId === moduleId);

        if (existingNode) {
          // Se já existe, apenas foca nele e não cria outro
          layout.setActiveNode(existingNode.id);
          return;
        }

        // 2. Se for novo, tenta preencher vazio ou criar split
        const emptyNodeId = findFirstEmptyNode(layout.tree);

        if (emptyNodeId) {
          layout.insertNode(emptyNodeId, moduleId, 'center');
        } else {
          const targetId = layout.activeNodeId || (leafNodes.length > 0 ? leafNodes[0].id : 'root');
          layout.insertNode(targetId, moduleId, 'right');
        }
      });
    };

    setup();
    return () => { if (unlisten) unlisten(); };
  }, []);

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
      <ContextMenu />
    </div>
  )
}