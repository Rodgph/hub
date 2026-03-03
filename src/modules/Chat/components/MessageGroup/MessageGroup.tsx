import React from 'react';
import styles from './MessageGroup.module.css';

interface MessageGroupProps {
  children: React.ReactNode;
}

export function MessageGroup({ children }: MessageGroupProps) {
  return (
    <div className={styles.group}>
      {children}
    </div>
  );
}
