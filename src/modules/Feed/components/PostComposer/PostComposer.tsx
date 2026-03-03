import React, { useState, useRef } from 'react';
import { useFeedStore } from '@/store/modules/feed.store';
import { useAuthStore } from '@/store/auth.store';
import { useStorage } from '@/hooks/useStorage';
import { buildR2Path } from '@/utils/r2-paths';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar/ProfileAvatar';
import styles from './PostComposer.module.css';

export function PostComposer() {
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const addPost = useFeedStore(state => state.addPost);
  const user = useAuthStore(state => state.user);
  const { upload, isUploading } = useStorage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setSelectedFiles(prev => [...prev, ...files]);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedFiles.length === 0) return;
    if (!user) return;

    const postId = crypto.randomUUID();
    const mediaUrls: string[] = [];
    const mediaTypes: string[] = [];

    try {
      // 1. Fazer upload de cada arquivo
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const ext = file.type.split('/')[1] as any;
        const path = buildR2Path({
          type: 'post-media',
          userId: user.id,
          postId,
          index: i,
          ext
        });

        const url = await upload(path, file);
        mediaUrls.push(url);
        mediaTypes.push(file.type.startsWith('video') ? 'video' : 'image');
      }

      // 2. Criar o post no banco
      await addPost({
        id: postId,
        content,
        user_id: user.id,
        media_urls: mediaUrls,
        media_types: mediaTypes,
        visibility: 'all',
      });

      // 3. Limpar estado
      setContent('');
      setSelectedFiles([]);
      previews.forEach(url => URL.revokeObjectURL(url));
      setPreviews([]);
    } catch (error) {
      console.error('[PostComposer] Erro ao postar:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <ProfileAvatar userId={user?.id || ''} variant="mini" />
        <span className={styles.title}>O que está acontecendo?</span>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <textarea
          className={styles.textarea}
          placeholder="Compartilhe algo com seus seguidores..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isUploading}
        />

        {previews.length > 0 && (
          <div className={styles.previewGrid}>
            {previews.map((url, index) => (
              <div key={url} className={styles.previewItem}>
                <img src={url} alt="Preview" />
                <button 
                  type="button" 
                  className={styles.removeBtn}
                  onClick={() => removeFile(index)}
                >✕</button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.mediaButtons}>
            <input 
              type="file" 
              multiple 
              accept="image/*,video/*" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button 
              type="button" 
              className={styles.mediaBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              🖼️ Mídia
            </button>
          </div>
          <button 
            type="submit" 
            className={styles.postBtn}
            disabled={(!content.trim() && selectedFiles.length === 0) || isUploading}
          >
            {isUploading ? 'Enviando...' : 'Postar'}
          </button>
        </div>
      </form>
    </div>
  );
}
