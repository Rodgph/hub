import React, { useState, useCallback } from 'react';
import { BrowserBar } from './components/BrowserBar/BrowserBar';
import { BrowserView } from './components/BrowserView/BrowserView';
import styles from './Browser.module.css';

interface BrowserModuleProps {
  nodeId: string;
}

export const BrowserModule: React.FC<BrowserModuleProps> = ({ nodeId }) => {
  const [url, setUrl] = useState('https://www.google.com');
  const [history, setHistory] = useState<string[]>(['https://www.google.com']);
  const [currentIndex, setCurrentIndex] = useState(0);

  const navigateTo = useCallback((newUrl: string) => {
    let formattedUrl = newUrl;
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      formattedUrl = `https://${newUrl}`;
    }
    
    setUrl(formattedUrl);
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(formattedUrl);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  }, [history, currentIndex]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setUrl(history[prevIndex]);
    }
  }, [currentIndex, history]);

  const goForward = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setUrl(history[nextIndex]);
    }
  }, [currentIndex, history]);

  const refresh = useCallback(() => {
    // Para um iframe, apenas resetar a URL ou forçar re-render
    const currentUrl = url;
    setUrl('');
    setTimeout(() => setUrl(currentUrl), 10);
  }, [url]);

  return (
    <div className={styles.container}>
      <BrowserBar 
        url={url} 
        onNavigate={navigateTo}
        onBack={goBack}
        onForward={goForward}
        onRefresh={refresh}
        canGoBack={currentIndex > 0}
        canGoForward={currentIndex < history.length - 1}
      />
      <BrowserView url={url} nodeId={nodeId} />
    </div>
  );
};


export default BrowserModule;
