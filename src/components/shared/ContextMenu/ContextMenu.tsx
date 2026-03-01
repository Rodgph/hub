import React, { useEffect, useRef } from 'react';
import { useContextMenuStore } from '@/store/context-menu.store';
import { ContextMenuItem } from './ContextMenuItem';
import styles from './ContextMenu.module.css';

export function ContextMenu() {
  const { isOpen, position, items, close } = useContextMenuStore();
  const menuRef = useRef<HTMLDivElement>(null);

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

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
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
      style={{ top: position.y, left: position.x }}
    >
      {items.map((item) => (
        <ContextMenuItem key={item.id} item={item} />
      ))}
    </div>
  );
}
