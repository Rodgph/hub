import React, { useState, useMemo } from 'react';
import { useLayoutStore } from '@/store/layout.store';
import { findNode } from '@/utils/layout-tree';
import styles from './layout.module.css';

interface DragHandleProps {
  nodeId: string;
}

export function DragHandle({ nodeId }: DragHandleProps) {
  const { tree, setDragState, moveNode } = useLayoutStore();
  const [isDraggingLocal, setIsDraggingLocal] = useState(false);

  // Busca informações sobre o nó e se ele pertence a um conjunto de abas
  const info = useMemo(() => {
    const node = findNode(tree, nodeId);
    if (!node || node.type !== 'module') return null;

    let parentTabs = null;
    if (node.parentId) {
      const parent = findNode(tree, node.parentId);
      if (parent && parent.type === 'tabs') {
        parentTabs = parent;
      }
    }

    return {
      moduleId: node.moduleId,
      tabCount: parentTabs ? parentTabs.children.length : 1,
      activeIndex: parentTabs ? parentTabs.activeIndex : 0,
    };
  }, [tree, nodeId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const threshold = 8;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (!isDraggingLocal && Math.hypot(dx, dy) > threshold) {
        setIsDraggingLocal(true);
        setDragState(nodeId);
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }

      if (isDraggingLocal || Math.hypot(dx, dy) > threshold) {
        const element = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
        const overlay = element?.closest('[data-drag-target]');
        
        if (overlay) {
          const targetId = overlay.getAttribute('data-node-id');
          if (targetId && targetId !== nodeId) {
            const rect = overlay.getBoundingClientRect();
            const x = moveEvent.clientX - rect.left;
            const y = moveEvent.clientY - rect.top;
            const w = rect.width;
            const h = rect.height;
            const edgeSize = 0.25;

            let position: 'top' | 'bottom' | 'left' | 'right' | 'center' = 'center';
            if (x < w * edgeSize) position = 'left';
            else if (x > w * (1 - edgeSize)) position = 'right';
            else if (y < h * edgeSize) position = 'top';
            else if (y > h * (1 - edgeSize)) position = 'bottom';

            setDragState(nodeId, targetId, position);
          }
        } else {
          setDragState(nodeId, null, null);
        }
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      const { draggedNodeId, dropTargetId, dropPosition } = useLayoutStore.getState();
      
      if (draggedNodeId && dropTargetId && dropPosition) {
        moveNode(draggedNodeId, dropTargetId, dropPosition, upEvent.altKey);
      }
      
      setIsDraggingLocal(false);
      setDragState(null);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!info) return null;

  return (
    <div 
      className={styles.dragHandle} 
      onMouseDown={handleMouseDown}
      onDragStart={(e) => e.preventDefault()}
      draggable="false"
    >
      <div className={styles.dragInfo}>
        <div className={styles.tabDots}>
          {Array.from({ length: info.tabCount }).map((_, i) => (
            <div 
              key={i} 
              className={`${styles.dot} ${i === info.activeIndex ? styles.dotActive : ''}`} 
            />
          ))}
        </div>
      </div>
      <div className={styles.dragIcon}>⠿</div>
    </div>
  );
}
