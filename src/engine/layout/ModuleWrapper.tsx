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
  const { insertNode, removeNode, draggedNodeId } = useLayoutStore();
  const { openContextMenu } = useContextMenu();

  const handleContextMenu = (e: React.MouseEvent) => {
    const menuItems: MenuItem[] = [
      { id: 'change-module', label: 'Mudar Módulo...', action: () => {}, icon: '🔄' }, 
      { id: 'clear-module', label: 'Limpar Módulo', action: () => insertNode(nodeId, ModuleId.Empty, 'center'), icon: '🧹' },
      { id: 'separator-1', isSeparator: true, label: '', action: () => {} },
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
    <div className={styles.moduleContainer} onContextMenu={handleContextMenu}>
      {!hideHandle && <DragHandle nodeId={nodeId} />}
      
      <div className={`${styles.moduleContent} ${draggedNodeId ? styles.isDragging : ''}`}>
        {children || (
          <div className={styles.placeholder}>
            {moduleId}
          </div>
        )}
      </div>

      <DragOverlay nodeId={nodeId} />
    </div>
  );
}
