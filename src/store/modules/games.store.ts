import { create } from 'zustand';

export interface Game {
  id: string;
  name: string;
  cover_url: string;
  is_active: boolean;
  cpu_usage?: number;
  play_time_hours?: number;
}

interface GamesState {
  games: Game[];
  activeGame: Game | null;
  loadGames: () => Promise<void>;
  pinGame: (game: Partial<Game>) => Promise<void>;
}

export const useGamesStore = create<GamesState>((set) => ({
  games: [],
  activeGame: null,

  loadGames: async () => {
    // Simulação de carregamento
    const mockGames: Game[] = [
      { id: '1', name: 'Cyberpunk 2077', cover_url: 'https://images.unsplash.com/photo-1605898960710-90da00403833?w=300&h=400&fit=crop', is_active: false, play_time_hours: 120 },
      { id: '2', name: 'Elden Ring', cover_url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=400&fit=crop', is_active: true, cpu_usage: 45, play_time_hours: 85 },
      { id: '3', name: 'Valorant', cover_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=400&fit=crop', is_active: false, play_time_hours: 450 },
    ];
    set({ games: mockGames, activeGame: mockGames[1] });
  },

  pinGame: async (game) => {
    // Lógica para fixar jogo
  }
}));
