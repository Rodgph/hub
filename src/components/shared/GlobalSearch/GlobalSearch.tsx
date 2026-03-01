import { RefObject, useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import styles from './GlobalSearch.module.css'

interface GlobalSearchProps {
  inputRef: RefObject<HTMLInputElement>
}

export function GlobalSearch({ inputRef }: GlobalSearchProps) {
  const [query, setQuery] = useState('')

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('')
      try {
        await getCurrentWindow().hide()
      } catch {
        // fora do Tauri (browser dev) — ignorar
      }
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <span className={styles.icon}>⌕</span>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Buscar pessoas, mensagens, músicas..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button className={styles.clear} onClick={() => setQuery('')}>
            ✕
          </button>
        )}
      </div>

      {query.length > 0 && (
        <div className={styles.results}>
          <p className={styles.resultsPlaceholder}>
            Buscando por "{query}"…
          </p>
        </div>
      )}

      <div className={styles.hints}>
        <span><kbd>↑↓</kbd> navegar</span>
        <span><kbd>Enter</kbd> abrir</span>
        <span><kbd>Esc</kbd> fechar</span>
      </div>
    </div>
  )
}