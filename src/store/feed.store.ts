import { create } from 'zustand';
import { supabase } from '@/config/supabase';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls?: string[];
  media_types?: string[];
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
  stories: any[];
  isLoading: boolean;
  loadPosts: () => Promise<void>;
  loadStories: () => Promise<void>;
  addPost: (post: Post) => void;
  likePost: (postId: string, userId: string) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  stories: [],
  isLoading: false,

  loadPosts: async () => {
    set({ isLoading: true });
    const { data } = await supabase
      .from('posts')
      .select('*, author:users(username, display_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (data) set({ posts: data });
    set({ isLoading: false });
  },

  loadStories: async () => {
    const { data } = await supabase
      .from('stories')
      .select('*, author:users(username, avatar_url)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (data) {
      // Agrupa stories por usuário para exibir na StoriesLine
      const grouped = data.reduce((acc: any[], story: any) => {
        const existing = acc.find(a => a.userId === story.user_id);
        if (!existing) {
          acc.push({
            id: story.id,
            userId: story.user_id,
            username: story.author?.username || 'user',
            avatarUrl: story.author?.avatar_url,
            hasNewStory: true
          });
        }
        return acc;
      }, []);
      set({ stories: grouped });
    }
  },

  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),

  likePost: async (postId, userId) => {
    await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
    // O trigger no DB cuidará de aumentar o contador, o Realtime atualizará a UI
  }
}));
