import { create } from 'zustand';
import { supabase } from '@/config/supabase';

export interface Post {
  id: string;
  author_id: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'gif';
  likes_count: number;
  comments_count: number;
  created_at: string;
  author?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface FeedState {
  posts: Post[];
  isLoading: boolean;
  loadPosts: () => Promise<void>;
  addPost: (post: Post) => void;
  likePost: (postId: string, userId: string) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  isLoading: false,

  loadPosts: async () => {
    set({ isLoading: true });
    // Busca posts com dados do autor via join
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:users(username, display_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (data) set({ posts: data });
    set({ isLoading: false });
  },

  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),

  likePost: async (postId, userId) => {
    await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
    // O trigger no DB cuidará de aumentar o contador, o Realtime atualizará a UI
  }
}));
