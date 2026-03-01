import React from 'react';
import { useLayoutStore } from '@/store/layout.store';
import styles from './layout.module.css';

interface DragOverlayProps {
  nodeId: string;
}

export function DragOverlay({ nodeId }: DragOverlayProps) {
  const { draggedNodeId, dropTargetId, dropPosition } = useLayoutStore();
  
  if (!draggedNodeId || draggedNodeId === nodeId) return null;

  const isCurrentTarget = dropTargetId === nodeId;

  return (
    <div 
      className={`${styles.dragOverlay} ${isCurrentTarget ? styles.active : ''}`}
      data-drag-target="true"
      data-node-id={nodeId}
    >
      {isCurrentTarget && dropPosition && (
        <div className={`${styles.dropIndicator} ${styles[dropPosition]}`} />
      )}
    </div>
  );
}
