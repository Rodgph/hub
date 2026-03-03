import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/layout.store';
import { LayoutNode } from '@/types/layout.types';
import { ModuleId } from '@/types/module.types';
import { SplitPane } from './SplitPane';
import { EmptyPane } from './EmptyPane';
import { ModuleWrapper } from './ModuleWrapper';
import { TabPane } from './TabPane';
import styles from './layout.module.css';

import { ModuleRegistry } from '@/modules';

export function LayoutEngine() {
  const tree = useLayoutStore(state => state.tree);

  const renderNode = (node: LayoutNode): React.ReactNode => {
    if (!node) {
      console.warn('[LayoutEngine] Tentativa de renderizar nó nulo');
      return null;
    }

    if (node.type === 'split') {
      if (!node.firstChild || !node.secondChild) {
        console.error('[LayoutEngine] Split node sem filhos:', node);
        return null;
      }
      return <SplitPane key={node.id} node={node} renderNode={renderNode} />;
    }

    if (node.type === 'tabs') {
      return <TabPane key={node.id} node={node} renderNode={renderNode} />;
    }
    
    // Fallback para string se o enum falhar na comparação direta
    const moduleIdStr = String(node.moduleId);
    const RealComponent = ModuleRegistry[moduleIdStr] || ModuleRegistry[node.moduleId];

    return (
        <ModuleWrapper 
          key={node.id}
          nodeId={node.id} 
          moduleId={node.moduleId}
          hideHandle={node.moduleId === ModuleId.Empty}
        >
            {node.moduleId === ModuleId.Empty ? (
                <EmptyPane nodeId={node.id} />
            ) : RealComponent ? (
                <RealComponent nodeId={node.id} />
            ) : (
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#777',
                  background: '#111',
                  gap: '8px'
                }}>
                    <span style={{ fontSize: '24px' }}>🧩</span>
                    <span>Módulo "{moduleIdStr}" não encontrado</span>
                </div>
            )}
        </ModuleWrapper>
    );
  };

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupListeners = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        unlisten = await listen<{ moduleId: ModuleId }>('layout:dock-module', (event) => {
          const { moduleId } = event.payload;
          const layout = useLayoutStore.getState();
          
          // Função local para achar a Nav
          const findNavId = (node: any): string | null => {
            if (node.type === 'module' && node.moduleId === ModuleId.Nav) return node.id;
            if (node.type === 'split') return findNavId(node.firstChild) || findNavId(node.secondChild);
            if (node.type === 'tabs') {
              for (const child of node.children) {
                const id = findNavId(child);
                if (id) return id;
              }
            }
            return null;
          };

          const navId = findNavId(layout.tree);
          if (navId) {
            layout.dockModule(navId, moduleId);
          }
        });
      } catch (e) {
        console.warn('[LayoutEngine] Fora do Tauri, ignorando listeners de eventos');
      }
    };

    setupListeners();
    return () => { if (unlisten) unlisten(); };
  }, []);

  useEffect(() => {
    console.log('[LayoutEngine] Árvore atual:', tree);
  }, [tree]);

  if (!tree) return <div style={{ color: 'white' }}>Carregando layout...</div>;

  return (
    <div className={styles.container}>
      {renderNode(tree)}
    </div>
  );
}
