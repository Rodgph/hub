import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useContextMenuStore } from '@/store/context-menu.store';
import { ContextMenuItem } from './ContextMenuItem';
import styles from './ContextMenu.module.css';

export function ContextMenu() {
  const { isOpen, position, items, close } = useContextMenuStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (isOpen && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      // Ajuste horizontal
      if (x + menuRect.width > viewportWidth) {
        x = viewportWidth - menuRect.width - 10; // 10px de margem
      }

      // Ajuste vertical
      if (y + menuRect.height > viewportHeight) {
        y = viewportHeight - menuRect.height - 10;
      }

      // Garantir que não fique negativo (caso o menu seja maior que a tela, improvável mas seguro)
      x = Math.max(10, x);
      y = Math.max(10, y);

      setAdjustedPosition({ x, y });
    }
  }, [isOpen, position, items]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };

    const timeout = setTimeout(() => {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, close]);

  if (!isOpen || items.length === 0) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className={styles.container}
      style={{ 
        top: adjustedPosition.y, 
        left: adjustedPosition.x,
        visibility: adjustedPosition.x === 0 ? 'hidden' : 'visible' // Evita flash na posição original
      }}
    >
      {items.map((item) => (
        <ContextMenuItem key={item.id} item={item} />
      ))}
    </div>
  );
}
