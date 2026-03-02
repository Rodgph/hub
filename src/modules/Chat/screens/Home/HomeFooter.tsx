import { useState } from 'react'
import styles from './Home.module.css'

export function HomeFooter() {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { label: 'Editar Perfil', icon: '👤', title: 'Editar Perfil' },
    { label: 'Configurações', icon: '⚙️', title: 'Configurações' },
    { label: 'Favoritos', icon: '⭐', title: 'Favoritos' },
    { label: 'Servidor', icon: '🌐', title: 'Criar Servidor' },
    { label: 'Grupo', icon: '👥', title: 'Criar Grupo' },
    { label: 'Story', icon: '📸', title: 'Criar Story' },
  ]

  return (
    <div className={styles.fabContainer}>
      <div className={styles.fabWrapper}>
        {/* Dropdown Menu Expandido */}
        <div className={`${styles.fabMenu} ${isOpen ? styles.fabMenuVisible : ''}`}>
          {menuItems.map((item, index) => (
            <button 
              key={index} 
              className={styles.fabItem} 
              title={item.title}
              style={{ transitionDelay: `${(menuItems.length - 1 - index) * 40}ms` }}
            >
              <span className={styles.fabLabel}>{item.label}</span>
              <span className={styles.fabIcon}>{item.icon}</span>
            </button>
          ))}
        </div>

        {/* Botão FAB Principal */}
        <button 
          className={`${styles.fab} ${isOpen ? styles.fabActive : ''}`} 
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={styles.plusIcon}>+</span>
        </button>
      </div>
    </div>
  )
}
