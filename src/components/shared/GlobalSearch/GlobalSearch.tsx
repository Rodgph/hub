import React, { useEffect } from 'react';
import { useSearchStore } from '@/store/search.store';
import { FollowButton } from './FollowButton';
import styles from './GlobalSearch.module.css';

interface GlobalSearchProps {
  inputRef: React.RefObject<HTMLInputElement>;
}

export function GlobalSearch({ inputRef }: GlobalSearchProps) {
  const { query, setQuery, results, selectedIndex, setSelectedIndex, executeSelected, isLoading } = useSearchStore();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((selectedIndex + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((selectedIndex - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      executeSelected();
    } else if (e.key === 'Escape') {
      import('@tauri-apps/api/webviewWindow').then(m => m.getCurrentWebviewWindow().hide());
    }
  };

  useEffect(() => {
    setQuery('');
  }, [setQuery]);

  return (
    <div className={styles.container}>
      <div className={styles.searchBox}>
        <span className={styles.searchIcon}>{isLoading ? '⏳' : '🔍'}</span>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="Pesquisar..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>

      {results.length > 0 && (
        <div className={styles.resultsList}>
          {results.map((result, index) => (
            <div
              key={result.id}
              className={`${styles.resultItem} ${index === selectedIndex ? styles.selected : ''}`}
              onClick={() => {
                setSelectedIndex(index);
                executeSelected();
              }}
            >
              <span className={styles.resultIcon}>{result.icon}</span>
              <div className={styles.resultContent}>
                <span className={styles.resultTitle}>{result.title}</span>
                <span className={styles.resultDescription}>{result.description}</span>
              </div>
              
              {result.category === 'user' && (
                <FollowButton targetUserId={result.id.replace('user-', '')} />
              )}

              <span className={styles.categoryBadge}>{result.category}</span>
              {index === selectedIndex && <span className={styles.enterHint}>↵</span>}
            </div>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.shortcuts}>
          <span><kbd>↑↓</kbd> Navegar</span>
          <span><kbd>↵</kbd> Selecionar</span>
          <span><kbd>ESC</kbd> Fechar</span>
        </div>
      </div>
    </div>
  );
}
