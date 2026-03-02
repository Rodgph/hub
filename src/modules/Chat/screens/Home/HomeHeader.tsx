import { useAuthStore } from '@/store/auth.store'
import { StoriesLine } from '@/components/shared/StoriesLine/StoriesLine'
import styles from './Home.module.css'

export function HomeHeader() {
  const user = useAuthStore(state => state.user)

  return (
    <header className={styles.header}>
      <StoriesLine currentUserAvatar={user?.avatar_url} />
      
      <div className={styles.searchBar}>
        <span className={styles.searchIcon}>⌕</span>
        <input 
          type="text" 
          placeholder="Buscar conversas..." 
          className={styles.searchInput} 
        />
      </div>

      <div className={styles.filters}>
        <button className={`${styles.pill} ${styles.active}`}>Todos</button>
        <button className={styles.pill}>Não lidas</button>
        <button className={styles.pill}>Grupos</button>
        <button className={styles.pill}>Favoritos</button>
      </div>
    </header>
  )
}
