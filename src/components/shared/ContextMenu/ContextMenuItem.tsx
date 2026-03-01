import React from 'react';
import { useContextMenuStore, MenuItem } from '@/store/context-menu.store';
import styles from './ContextMenu.module.css';

interface ContextMenuItemProps {
  item: MenuItem;
}

export function ContextMenuItem({ item }: ContextMenuItemProps) {
  const close = useContextMenuStore(state => state.close);

  if (item.isSeparator) {
    return <div className={styles.separator} />;
  }

  const handleClick = () => {
    item.action();
    close();
  };

  const className = `${styles.item} ${item.isDestructive ? styles.destructive : ''}`;

  return (
    <div className={className} onClick={handleClick}>
      {item.icon && <span className={styles.icon}>{item.icon}</span>}
      <span>{item.label}</span>
    </div>
  );
}
