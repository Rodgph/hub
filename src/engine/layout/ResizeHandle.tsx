import React, { useCallback } from 'react';
import { useLayoutStore } from '@/store/layout.store';
import styles from './layout.module.css';
import { SplitDirection } from '@/types/layout.types';

interface ResizeHandleProps {
  nodeId: string;
  direction: SplitDirection;
}

export function ResizeHandle({ nodeId, direction }: ResizeHandleProps) {
  const updateRatio = useLayoutStore(state => state.updateRatio);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const parent = (e.target as HTMLDivElement).parentElement;
    if (!parent) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const parentRect = parent.getBoundingClientRect();
      const parentStart = direction === 'vertical' ? parentRect.left : parentRect.top;
      const parentSize = direction === 'vertical' ? parentRect.width : parentRect.height;
      const mousePos = direction === 'vertical' ? moveEvent.clientX : moveEvent.clientY;
      
      let newRatio = (mousePos - parentStart) / parentSize;

      // Clamp ratio between 0.15 and 0.85 as per PLAN.md
      newRatio = Math.max(0.15, Math.min(newRatio, 0.85));

      updateRatio(nodeId, newRatio);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [direction, nodeId, updateRatio]);

  const className = `${styles.resizeHandle} ${styles[direction]}`;

  return (
    <div
      className={className}
      onMouseDown={handleMouseDown}
    />
  );
}
