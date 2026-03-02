import React from 'react';
import { PresenceStatus } from '@/types/status.types';
import styles from './profile.module.css';

interface ProfileAvatarProps {
  userId: string;
  url?: string;
  status?: PresenceStatus;
  variant?: 'mini' | 'medium' | 'full' | 'edit';
  hasStory?: boolean;
  storySeen?: boolean;
  hideStatus?: boolean;
}

export function ProfileAvatar({
  url,
  status = 'offline',
  variant = 'medium',
  hasStory = false,
  storySeen = false,
  hideStatus = false
}: ProfileAvatarProps) {
  const size = variant === 'mini' ? 32 : variant === 'medium' ? 48 : variant === 'edit' ? 250 : 80;

  // Converte caminhos locais para o protocolo asset do Tauri
  const getImageUrl = (originalUrl?: string) => {
    if (!originalUrl) return null;
    if (originalUrl.startsWith('http') || originalUrl.startsWith('data:')) return originalUrl;

    // Se for um caminho local (Windows/Linux/macOS), converte para asset
    // Tauri v2 usa http://asset.localhost/ para acesso a arquivos locais
    console.log('[ProfileAvatar] Convertendo caminho local:', originalUrl);

    // Normaliza o caminho para Windows (remove barras invertidas duplicadas)
    const normalizedPath = originalUrl.replace(/\\/g, '/');
    console.log('[ProfileAvatar] Caminho normalizado:', normalizedPath);

    const assetUrl = `http://asset.localhost/${normalizedPath}`;
    console.log('[ProfileAvatar] URL final:', assetUrl);

    return assetUrl;
  };

  const finalUrl = getImageUrl(url);

  // Debug: mostrar qual URL está sendo usada
  console.log('[ProfileAvatar] Debug:', {
    originalUrl: url,
    finalUrl,
    variant,
    hasUrl: !!url
  });

  // Temporário: forçar uma imagem de teste para verificar se o mecanismo funciona
  const testUrl = variant === 'edit' ? 'https://picsum.photos/250/250' : finalUrl;

  return (
    <div className={`${styles.avatarContainer} ${styles[variant]}`} style={{ width: size, height: size }}>
      {hasStory && (
        <div className={`${styles.storyRing} ${storySeen ? styles.seen : styles.unseen}`} />
      )}

      <div className={styles.imageWrapper}>
        {testUrl ? (
          <img
            src={testUrl}
            alt="Avatar"
            className={styles.avatarImage}
            onError={(e) => {
              console.error('[ProfileAvatar] Erro ao carregar imagem:', testUrl);
              // Fallback para placeholder se a imagem não carregar
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
            onLoad={() => {
              console.log('[ProfileAvatar] Imagem carregada com sucesso:', testUrl);
            }}
          />
        ) : null}
        <div className={styles.avatarPlaceholder} style={{ display: testUrl ? 'none' : 'flex' }}>👤</div>
      </div>

      {!hideStatus && <div className={`${styles.statusIndicator} ${styles[status]}`} />}
    </div>
  );
}
