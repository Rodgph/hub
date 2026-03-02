import React from 'react';
import { useMusicStore } from '@/store/modules/music.store';
import styles from './MiniPlayer.module.css';

export function MiniPlayer() {
  const { currentTrack, isPlaying, pause, resume, next } = useMusicStore();

  if (!currentTrack) return null;

  return (
    <div className={styles.container}>
      <img src={currentTrack.cover_url} alt={currentTrack.title} className={styles.cover} />
      <div className={styles.info}>
        <span className={styles.title}>{currentTrack.title}</span>
        <span className={styles.artist}>{currentTrack.artist}</span>
      </div>
      <div className={styles.controls}>
        <button className={styles.btn} onClick={isPlaying ? pause : resume}>
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <button className={styles.btn} onClick={next}>⏭️</button>
      </div>
    </div>
  );
}
