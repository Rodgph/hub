import React from 'react';
import styles from '../ProfileAvatar/profile.module.css';

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
  const getMediaUrl = (originalUrl?: string) => {
    if (!originalUrl) return null;
    if (originalUrl.startsWith('http') || originalUrl.startsWith('data:')) return originalUrl;
    return `https://asset.localhost/${originalUrl}`;
  };

  const finalUrl = getMediaUrl(url);

  const renderContent = () => {
    if (!finalUrl && type !== 'color' && type !== 'gradient') return null;

    switch (type) {
      case 'video':
        return <video src={finalUrl!} autoPlay muted loop className={styles.bannerMedia} />;
      case 'image':
      case 'gif':
        return <img src={finalUrl!} alt="Banner" className={styles.bannerMedia} />;
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
