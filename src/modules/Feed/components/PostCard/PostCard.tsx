import React from 'react';
import type { Post } from '@/store/modules/feed.store';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar/ProfileAvatar';
import styles from './PostCard.module.css';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user, content, media_urls, created_at } = post;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <ProfileAvatar userId={post.user_id} variant="mini" />
        <div className={styles.userInfo}>
          <span className={styles.displayName}>{user?.display_name || 'Usuário'}</span>
          <span className={styles.username}>@{user?.username || 'user'}</span>
        </div>
        <span className={styles.date}>{new Date(created_at).toLocaleDateString()}</span>
      </header>

      <main className={styles.content}>
        {content && <p className={styles.text}>{content}</p>}
        {media_urls.length > 0 && (
          <div className={styles.mediaGrid}>
            {media_urls.map((url, index) => (
              <img key={index} src={url} alt="Post media" className={styles.media} />
            ))}
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.actions}>
          <button className={styles.actionBtn}>❤️ Reagir</button>
          <button className={styles.actionBtn}>💬 Comentar</button>
          <button className={styles.actionBtn}>🔗 Compartilhar</button>
        </div>
      </footer>
    </div>
  );
}
