import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiArrowRight, FiRotateCw, FiSearch } from 'react-icons/fi';
import styles from './BrowserBar.module.css';

interface BrowserBarProps {
  url: string;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

export const BrowserBar: React.FC<BrowserBarProps> = ({
  url,
  onNavigate,
  onBack,
  onForward,
  onRefresh,
  canGoBack,
  canGoForward
}) => {
  const [inputValue, setInputValue] = useState(url);

  useEffect(() => {
    setInputValue(url);
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate(inputValue);
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button 
          onClick={onBack} 
          disabled={!canGoBack}
          className={styles.button}
          title="Back"
        >
          <FiArrowLeft />
        </button>
        <button 
          onClick={onForward} 
          disabled={!canGoForward}
          className={styles.button}
          title="Forward"
        >
          <FiArrowRight />
        </button>
        <button 
          onClick={onRefresh}
          className={styles.button}
          title="Refresh"
        >
          <FiRotateCw />
        </button>
      </div>

      <form className={styles.addressBar} onSubmit={handleSubmit}>
        <div className={styles.inputWrapper}>
          <FiSearch className={styles.searchIcon} />
          <input 
            type="text" 
            className={styles.input}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search or enter address"
          />
        </div>
      </form>
    </div>
  );
};
