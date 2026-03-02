import { create } from 'zustand';

export interface Stream {
  id: string;
  user_id: string;
  title: string;
  thumbnail_url: string;
  viewer_count: number;
  is_live: boolean;
  user?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

interface LiveState {
  activeStream: Stream | null;
  featuredStreams: Stream[];
  loadStreams: () => Promise<void>;
  watchStream: (stream: Stream) => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  activeStream: null,
  featuredStreams: [],

  loadStreams: async () => {
    const mockStreams: Stream[] = [
      { 
        id: '1', 
        user_id: 'u1', 
        title: 'GRINDANDO NO ELDEN RING', 
        thumbnail_url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&h=340&fit=crop', 
        viewer_count: 1250, 
        is_live: true,
        user: { username: 'gamer_pro', display_name: 'Gamer Pro', avatar_url: '' }
      },
      { 
        id: '2', 
        user_id: 'u2', 
        title: 'Coding SocialOS - Live de Domingo', 
        thumbnail_url: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=600&h=340&fit=crop', 
        viewer_count: 450, 
        is_live: true,
        user: { username: 'dev_ninja', display_name: 'Dev Ninja', avatar_url: '' }
      },
    ];
    set({ featuredStreams: mockStreams });
  },

  watchStream: (stream) => set({ activeStream: stream }),
}));
