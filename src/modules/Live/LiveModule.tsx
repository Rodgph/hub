import React, { useEffect } from 'react';
import { useLiveStore } from '@/store/modules/live.store';
import { LivePlayer } from './components/LivePlayer/LivePlayer';
import styles from './Live.module.css';

export function LiveModule() {
  const { featuredStreams, activeStream, loadStreams, watchStream } = useLiveStore();

  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Lives ao Vivo</h2>
      </header>

      <div className={styles.content}>
        {activeStream ? (
          <section className={styles.activeSection}>
            <LivePlayer stream={activeStream} />
            <button className={styles.backBtn} onClick={() => watchStream(null as any)}>
              ← Voltar para lista
            </button>
          </section>
        ) : (
          <div className={styles.grid}>
            {featuredStreams.map(stream => (
              <div 
                key={stream.id} 
                className={styles.streamCard}
                onClick={() => watchStream(stream)}
              >
                <img src={stream.thumbnail_url} alt={stream.title} className={styles.thumb} />
                <div className={styles.streamInfo}>
                  <span className={styles.streamTitle}>{stream.title}</span>
                  <span className={styles.streamUser}>@{stream.user?.username}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveModule;
