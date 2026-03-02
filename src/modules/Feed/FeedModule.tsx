import React, { useEffect } from 'react';
import { useFeedStore } from '@/store/modules/feed.store';
import { PostCard } from './components/PostCard/PostCard';
import { PostComposer } from './components/PostComposer/PostComposer';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import styles from './Feed.module.css';

export function FeedModule() {
  const { posts, isLoading, loadPosts } = useFeedStore();

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Feed Social</h2>
      </header>

      <div className={styles.content}>
        <PostComposer />

        {isLoading && posts.length === 0 ? (
          <div className={styles.loading}>
            {[1, 2, 3].map(i => (
              <div key={i} className={styles.skeletonWrapper}>
                <Skeleton width="100%" height="200px" borderRadius="20px" />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.postList}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📭</span>
            <p>Ainda não há posts por aqui. Seja o primeiro a postar!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Export default para o ModuleRegistry
export default FeedModule;
