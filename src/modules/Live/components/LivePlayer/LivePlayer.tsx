import React from 'react';
import type { Stream } from '@/store/modules/live.store';
import styles from './LivePlayer.module.css';

interface LivePlayerProps {
  stream: Stream;
}

export function LivePlayer({ stream }: LivePlayerProps) {
  return (
    <div className={styles.container}>
      <div className={styles.videoWrapper}>
        <img src={stream.thumbnail_url} alt={stream.title} className={styles.placeholder} />
        <div className={styles.controls}>
          <span className={styles.liveBadge}>LIVE</span>
          <span className={styles.viewers}>👁️ {stream.viewer_count}</span>
        </div>
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{stream.title}</h3>
        <p className={styles.user}>@{stream.user?.username}</p>
      </div>
    </div>
  );
}
