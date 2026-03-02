import React from 'react';
import type { Track } from '@/store/modules/music.store';
import { useMusicStore } from '@/store/modules/music.store';
import styles from './TrackCard.module.css';

interface TrackCardProps {
  track: Track;
}

export function TrackCard({ track }: TrackCardProps) {
  const { playTrack, currentTrack, isPlaying } = useMusicStore();
  const isActive = currentTrack?.id === track.id;

  return (
    <div 
      className={`${styles.container} ${isActive ? styles.active : ''}`}
      onClick={() => playTrack(track)}
    >
      <div className={styles.coverWrapper}>
        <img src={track.cover_url || 'https://via.placeholder.com/150'} alt={track.title} className={styles.cover} />
        {isActive && isPlaying && <div className={styles.playingIndicator}>🎵</div>}
      </div>
      <div className={styles.info}>
        <span className={styles.title}>{track.title}</span>
        <span className={styles.artist}>{track.artist}</span>
      </div>
      <span className={styles.duration}>
        {Math.floor(track.duration_ms / 60000)}:
        {Math.floor((track.duration_ms % 60000) / 1000).toString().padStart(2, '0')}
      </span>
    </div>
  );
}
