import React from 'react';
import type { Game } from '@/store/modules/games.store';
import styles from './GameCard.module.css';

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <div className={`${styles.container} ${game.is_active ? styles.active : ''}`}>
      <div className={styles.coverWrapper}>
        <img src={game.cover_url} alt={game.name} className={styles.cover} />
        {game.is_active && (
          <div className={styles.activeOverlay}>
            <span className={styles.statusBadge}>JOGANDO</span>
            <span className={styles.cpuUsage}>{game.cpu_usage}% CPU</span>
          </div>
        )}
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{game.name}</span>
        <span className={styles.playtime}>{game.play_time_hours}h jogadas</span>
      </div>
    </div>
  );
}
