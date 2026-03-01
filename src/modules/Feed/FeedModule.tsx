import React, { useEffect } from 'react';
import { useFeedStore, Post } from '@/store/feed.store';
import { useAuthStore } from '@/store/auth.store';
import { StoriesLine } from '@/components/shared/StoriesLine/StoriesLine';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar/ProfileAvatar';
import { supabase } from '@/config/supabase';
import styles from './Feed.module.css';

export function FeedModule() {
  const { posts, loadPosts, addPosts, isLoading } = useFeedStore();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    loadPosts();

    // Listener Real-time para novos posts
    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          // Busca dados do autor para o novo post
          const { data: author } = await supabase
            .from('users')
            .select('username, display_name, avatar_url')
            .eq('id', payload.new.author_id)
            .single();
          
          useFeedStore.getState().addPost({ ...payload.new, author });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadPosts]);

  return (
    <div className={styles.container}>
      <div className={styles.feedWrapper}>
        <div className={styles.header}>
          <StoriesLine stories={[]} currentUserAvatar={user?.avatar_url} />
        </div>

        <div className={styles.postsList}>
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
          {posts.length === 0 && !isLoading && (
            <div className={styles.empty}>Nenhuma postagem encontrada</div>
          )}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <div className={styles.postCard}>
      <div className={styles.postHeader}>
        <ProfileAvatar userId={post.author_id} url={post.author?.avatar_url} variant="mini" />
        <div className={styles.authorInfo}>
          <span className={styles.displayName}>{post.author?.display_name || 'Usuário'}</span>
          <span className={styles.username}>@{post.author?.username || 'user'}</span>
        </div>
      </div>

      <div className={styles.postContent}>
        <p>{post.content}</p>
        {post.media_url && post.media_type === 'image' && (
          <img src={post.media_url} alt="Post media" className={styles.postMedia} />
        )}
      </div>

      <div className={styles.postFooter}>
        <button className={styles.actionBtn}>❤️ {post.likes_count}</button>
        <button className={styles.actionBtn}>💬 {post.comments_count}</button>
      </div>
    </div>
  );
}
