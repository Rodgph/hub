import React, { useState } from 'react';
import { useFeedStore } from '@/store/modules/feed.store';
import { useAuthStore } from '@/store/auth.store';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar/ProfileAvatar';
import styles from './PostComposer.module.css';

export function PostComposer() {
  const [content, setContent] = useState('');
  const addPost = useFeedStore(state => state.addPost);
  const user = useAuthStore(state => state.user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await addPost({
      content,
      user_id: user?.id,
      visibility: 'all',
    });

    setContent('');
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
        />
        <div className={styles.footer}>
          <div className={styles.mediaButtons}>
            <button type="button" className={styles.mediaBtn}>🖼️ Imagem</button>
            <button type="button" className={styles.mediaBtn}>📹 Vídeo</button>
          </div>
          <button 
            type="submit" 
            className={styles.postBtn}
            disabled={!content.trim()}
          >
            Postar
          </button>
        </div>
      </form>
    </div>
  );
}
