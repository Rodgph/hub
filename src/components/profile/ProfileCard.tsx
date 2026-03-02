import React, { useState, useEffect, useRef } from 'react';
import { ProfileAvatar } from './ProfileAvatar/ProfileAvatar';
import { ProfileBanner } from './ProfileBanner/ProfileBanner';
import { User } from '@/types/user.types';
import styles from './ProfileAvatar/profile.module.css';

import { EditableText } from '../ui/EditableText/EditableText';
import { supabase } from '@/config/supabase';

interface ProfileCardProps {
  user: User;
  variant?: 'card' | 'chat' | 'profile';
  isEditable?: boolean;
  avatarVariant?: 'mini' | 'medium' | 'full' | 'edit';
}

/**
 * Componente unificado que exibe o card completo do usuário.
 */
export function ProfileCard({ user, variant = 'card', isEditable = false, avatarVariant }: ProfileCardProps) {
  const [isBannerMenuOpen, setIsBannerMenuOpen] = useState(false);
  const [bannerUrl, setBannerUrl] = useState(user.banner_url || '');
  const menuRef = useRef<HTMLDivElement>(null);

  const isFullProfile = variant === 'profile';

  const handleUpdate = async (field: string, value: string) => {
    if (!isEditable) return;
    await supabase.from('users').update({ [field]: value }).eq('id', user.id);
  };

  const updateBanner = async (type: string, url?: string) => {
    if (!isEditable) return;
    const finalUrl = url !== undefined ? url : bannerUrl;
    await supabase.from('users').update({ 
      banner_type: type,
      banner_url: finalUrl 
    }).eq('id', user.id);
    setIsBannerMenuOpen(false);
  };

  const handleImportMedia = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Mídia',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm']
        }]
      });

      if (selected && typeof selected === 'string') {
        // Detecta o tipo baseado na extensão
        const ext = selected.split('.').pop()?.toLowerCase();
        let type = 'image';
        if (ext === 'gif') type = 'gif';
        else if (ext === 'mp4' || ext === 'webm') type = 'video';

        // Converte o caminho local para uma URL de asset do Tauri
        const assetUrl = `https://asset.localhost/${selected}`; 
        
        // Atualiza no banco
        await updateBanner(type, selected); // Guardamos o path original
        setBannerUrl(selected);
      }
    } catch (err) {
      console.error('Erro ao abrir explorador:', err);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: isFullProfile ? '100%' : 'auto',
      borderRadius: isFullProfile ? '0' : 'var(--radius-module)',
      overflow: 'hidden',
      background: 'var(--bg-module)',
      border: isFullProfile ? 'none' : '1px solid rgba(255,255,255,0.05)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ position: 'relative', width: '100%' }}>
        <ProfileBanner userId={user.id} url={user.banner_url} type={user.banner_type as any} variant={variant} />
        
        {isEditable && (
          <>
            <div 
              className={styles.bannerEditOverlay} 
              onClick={() => setIsBannerMenuOpen(!isBannerMenuOpen)}
              title="Mudar banner"
            >
              <span>📷 Mudar Banner</span>
            </div>

            {isBannerMenuOpen && (
              <div className={styles.bannerDropdown} ref={menuRef}>
                <div className={styles.dropdownHeader}>Alterar Visual</div>
                
                <button 
                  className={styles.importBtn} 
                  onClick={handleImportMedia}
                >
                  📁 Importar Imagem / GIF / Vídeo
                </button>

                <div className={styles.separator} />
                <div className={styles.urlInputArea}>
                  <input 
                    type="text" 
                    placeholder="Ou cole uma URL..." 
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && updateBanner(user.banner_type || 'image')}
                  />
                  <button onClick={() => updateBanner(user.banner_type || 'image')}>OK</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      <div style={{ 
        padding: '24px', 
        marginTop: isFullProfile ? 'auto' : '-30px', 
        position: 'relative', 
        zIndex: 10,
        background: isFullProfile ? 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' : 'transparent'
      }}>
        <ProfileAvatar 
          url={user.avatar_url} 
          status={user.status} 
          variant={avatarVariant || (isFullProfile ? 'full' : 'medium')} 
        />
        
        <div style={{ marginTop: '8px' }}>
          {isEditable ? (
            <EditableText 
              value={user.display_name || user.username} 
              onSave={(val) => handleUpdate('display_name', val)}
              style={{ fontSize: '14px', fontWeight: 700 }}
            />
          ) : (
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>
              {user.display_name || user.username}
            </h3>
          )}
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-subtitle)' }}>@{user.username}</p>
        </div>

        {isEditable ? (
          <EditableText 
            value={user.bio || ''} 
            onSave={(val) => handleUpdate('bio', val)}
            isTextArea
            placeholder="Adicione uma bio..."
            style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-subtitle)', lineHeight: '1.4' }}
          />
        ) : user.bio && (
          <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-subtitle)', lineHeight: '1.4' }}>
            {user.bio}
          </p>
        )}
      </div>
    </div>
  );
}
