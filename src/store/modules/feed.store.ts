import { create } from 'zustand';
import { supabase } from '@/config/supabase';

export interface Post {
  id: string;
  user_id: string;
  content: string | null;
  media_urls: string[];
  media_types: string[];
  visibility: 'all' | 'followers';
  created_at: string;
  updated_at: string;
  user?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  reactions_count?: Record<string, number>;
  comments_count?: number;
}

interface FeedState {
  posts: Post[];
  isLoading: boolean;
  loadPosts: () => Promise<void>;
  addPost: (post: Partial<Post>) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  isLoading: false,

  loadPosts: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(username, display_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ posts: data as Post[] });
    } catch (error) {
      console.error('[FeedStore] Erro ao carregar posts:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addPost: async (postData) => {
    // Optimistic Update
    const newPost: Post = {
      id: crypto.randomUUID(),
      user_id: '', // será preenchido pelo banco
      content: postData.content || null,
      media_urls: postData.media_urls || [],
      media_types: postData.media_types || [],
      visibility: postData.visibility || 'all',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set(state => ({ posts: [newPost, ...state.posts] }));

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select(`
          *,
          user:users(username, display_name, avatar_url)
        `)
        .single();

      if (error) throw error;
      
      set(state => ({
        posts: state.posts.map(p => p.id === newPost.id ? (data as Post) : p)
      }));
    } catch (error) {
      console.error('[FeedStore] Erro ao criar post:', error);
      // Rollback
      set(state => ({ posts: state.posts.filter(p => p.id !== newPost.id) }));
    }
  },
}));
