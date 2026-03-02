import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover_url?: string;
  audio_url: string;
  duration_ms: number;
}

interface MusicState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  playlist: Track[];
  queue: Track[];
  
  playTrack: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  setVolume: (volume: number) => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.5,
  playlist: [],
  queue: [],

  playTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  
  next: () => {
    const { queue, currentTrack } = get();
    if (queue.length > 0) {
      const nextTrack = queue[0];
      set({ currentTrack: nextTrack, queue: queue.slice(1) });
    }
  },

  previous: () => {
    // Lógica simplificada
  },

  setVolume: (volume) => set({ volume }),
}));
