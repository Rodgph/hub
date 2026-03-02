import React from 'react';
import { useLayoutStore } from '@/store/layout.store';
import { ModuleId } from '@/types/module.types';
import styles from './layout.module.css';

interface DragOverlayProps {
  nodeId: string;
  moduleId: ModuleId;
}

export function DragOverlay({ nodeId, moduleId }: DragOverlayProps) {
  const { draggedNodeId, dropTargetId, dropPosition } = useLayoutStore();
  
  if (!draggedNodeId || draggedNodeId === nodeId) return null;

  const isCurrentTarget = dropTargetId === nodeId;
  const isNav = moduleId === ModuleId.Nav;

  return (
    <div 
      className={`${styles.dragOverlay} ${isCurrentTarget ? styles.active : ''} ${isNav ? styles.isNav : ''}`}
      data-drag-target="true"
      data-node-id={nodeId}
    >
      {isCurrentTarget && dropPosition && (
        <div className={`${styles.dropIndicator} ${styles[dropPosition]} ${isNav ? styles.dockIndicator : ''}`}>
          {isNav && <span className={styles.dockText}>ENCAIXAR NA GAVETA</span>}
        </div>
      )}
    </div>
  );
}
