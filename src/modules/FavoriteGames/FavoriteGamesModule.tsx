import React, { useEffect } from 'react';
import { useGamesStore } from '@/store/modules/games.store';
import { GameCard } from './components/GameCard/GameCard';
import styles from './FavoriteGames.module.css';

export function FavoriteGamesModule() {
  const { games, loadGames } = useGamesStore();

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Jogos e Apps</h2>
      </header>

      <div className={styles.content}>
        <div className={styles.grid}>
          {games.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
          <button className={styles.addBtn}>
            <span className={styles.addIcon}>+</span>
            <span>Fixar Novo</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default FavoriteGamesModule;
