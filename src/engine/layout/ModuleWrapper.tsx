import React from 'react';
import { ModuleId } from '@/types/module.types';
import { useLayoutStore } from '@/store/layout.store';
import { useAuthStore } from '@/store/auth.store';
import { useContextMenu } from '@/hooks/useContextMenu';
import { MenuItem } from '@/store/context-menu.store';
import { DragHandle } from './DragHandle';
import { DragOverlay } from './DragOverlay';
import styles from './layout.module.css';

interface ModuleWrapperProps {
  nodeId: string;
  moduleId: ModuleId;
  children?: React.ReactNode;
  hideHandle?: boolean;
}

/**
 * Wrapper para módulos no layout.
 * Fornece funcionalidades comuns como menu de contexto e gerenciamento de estado.
 */
export function ModuleWrapper({ nodeId, moduleId, children, hideHandle }: ModuleWrapperProps) {
  const { insertNode, removeNode, draggedNodeId, activeNodeId, setActiveNode } = useLayoutStore();
  const { openContextMenu } = useContextMenu();

  const isActive = activeNodeId === nodeId;

  const handleContextMenu = (e: React.MouseEvent) => {
    setActiveNode(nodeId); // Ativa o nó ao clicar com o botão direito também
    const menuItems: MenuItem[] = [
      { 
        id: 'change-module', 
        label: 'Mudar Módulo...', 
        icon: '🔄',
        children: [
            { id: 'change-nav', label: 'Navegação (Barra)', action: () => insertNode(nodeId, ModuleId.Nav, 'center'), icon: '🧭' },
            { id: 'sep-change-1', type: 'separator' } as any,
            { id: 'change-chat', label: 'Chat DM', action: () => insertNode(nodeId, ModuleId.Chat, 'center'), icon: '💬' },
            { id: 'change-feed', label: 'Feed Social', action: () => insertNode(nodeId, ModuleId.Feed, 'center'), icon: '📰' },
            { id: 'change-music', label: 'Música & Player', action: () => insertNode(nodeId, ModuleId.Music, 'center'), icon: '🎵' },
            { id: 'change-games', label: 'Jogos & Apps', action: () => insertNode(nodeId, ModuleId.FavoriteGames, 'center'), icon: '🎮' },
            { id: 'change-live', label: 'Lives ao Vivo', action: () => insertNode(nodeId, ModuleId.Live, 'center'), icon: '📺' },
            { id: 'change-browser', label: 'Navegador Web', action: () => insertNode(nodeId, ModuleId.Browser, 'center'), icon: '🌐' },
            { id: 'sep-change-2', type: 'separator' } as any,
            { id: 'change-settings', label: 'Configurações', action: () => insertNode(nodeId, ModuleId.Settings, 'center'), icon: '⚙️' },
        ]
      }, 
      { id: 'clear-module', label: 'Limpar Módulo', action: () => insertNode(nodeId, ModuleId.Empty, 'center'), icon: '🧹' },
      { id: 'separator-1', type: 'separator' } as any,
      { id: 'split-vertical', label: 'Dividir na Vertical', action: () => insertNode(nodeId, ModuleId.Empty, 'right'), icon: '↔️' },
      { id: 'split-horizontal', label: 'Dividir na Horizontal', action: () => insertNode(nodeId, ModuleId.Empty, 'bottom'), icon: '↕️' },
      { id: 'separator-2', isSeparator: true, label: '', action: () => {} },
      { id: 'remove-pane', label: 'Remover Painel', action: () => removeNode(nodeId), isDestructive: true, icon: '🗑️' },
      { id: 'separator-3', isSeparator: true, label: '', action: () => {} },
      { 
        id: 'logoff', 
        label: 'Sair do Sistema', 
        action: () => {
            useAuthStore.getState().signOut();
        }, 
        icon: '🚪',
        isDestructive: true 
      },
    ];
    openContextMenu(e, menuItems);
  };

  return (
    <div 
      className={`${styles.moduleContainer} ${isActive ? styles.active : ''}`} 
      onContextMenu={handleContextMenu}
      onClick={() => setActiveNode(nodeId)}
      data-module-id={moduleId}
    >
      {!hideHandle && <DragHandle nodeId={nodeId} />}
      
      <div className={`
        ${styles.moduleContent} 
        ${draggedNodeId ? styles.isDragging : ''} 
        ${moduleId === ModuleId.Nav ? styles.navContent : ''}
      `}>
        {children || (
          <div className={styles.placeholder}>
            {moduleId}
          </div>
        )}
      </div>

      <DragOverlay nodeId={nodeId} moduleId={moduleId} />
    </div>
  );
}
