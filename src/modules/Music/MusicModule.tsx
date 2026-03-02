import React from 'react';
import { useMusicStore, Track } from '@/store/modules/music.store';
import { TrackCard } from './components/TrackCard/TrackCard';
import styles from './Music.module.css';

const MOCK_TRACKS: Track[] = [
  { id: '1', title: 'Midnight City', artist: 'M83', duration_ms: 243000, audio_url: '', cover_url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop' },
  { id: '2', title: 'Starboy', artist: 'The Weeknd', duration_ms: 230000, audio_url: '', cover_url: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=300&h=300&fit=crop' },
  { id: '3', title: 'Blinding Lights', artist: 'The Weeknd', duration_ms: 200000, audio_url: '', cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop' },
];

export function MusicModule() {
  const { currentTrack } = useMusicStore();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Música</h2>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h3>Sua Biblioteca</h3>
          <div className={styles.trackList}>
            {MOCK_TRACKS.map(track => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </section>

        {currentTrack && (
          <div className={styles.nowPlaying}>
            <img src={currentTrack.cover_url} alt={currentTrack.title} className={styles.fullCover} />
            <div className={styles.fullInfo}>
              <h4>{currentTrack.title}</h4>
              <p>{currentTrack.artist}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MusicModule;
