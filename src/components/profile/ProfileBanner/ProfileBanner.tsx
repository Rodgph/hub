import React from 'react';
import styles from './profile.module.css';

interface ProfileBannerProps {
  userId: string;
  url?: string;
  type?: 'image' | 'video' | 'color' | 'gradient';
  variant?: 'card' | 'chat' | 'profile';
}

export function ProfileBanner({ 
  url, 
  type = 'color', 
  variant = 'card' 
}: ProfileBannerProps) {
  const renderContent = () => {
    switch (type) {
      case 'video':
        return <video src={url} autoPlay muted loop className={styles.bannerMedia} />;
      case 'image':
        return <img src={url} alt="Banner" className={styles.bannerMedia} />;
      case 'gradient':
        return <div className={styles.bannerGradient} style={{ background: url }} />;
      default:
        return <div className={styles.bannerColor} style={{ backgroundColor: url || '#1a1a1a' }} />;
    }
  };

  return (
    <div className={`${styles.bannerContainer} ${styles[variant]}`}>
      {renderContent()}
      <div className={styles.bannerOverlay} />
    </div>
  );
}
