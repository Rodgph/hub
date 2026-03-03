import { create } from 'zustand';
import { ModuleId } from '@/types/module.types';
import { useLayoutStore } from './layout.store';
import { supabase } from '@/config/supabase';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'module' | 'action' | 'user';
  icon: string;
  action: () => void;
}

interface SearchState {
  query: string;
  results: SearchResult[];
  selectedIndex: number;
  isLoading: boolean;
  setQuery: (query: string) => Promise<void>;
  setSelectedIndex: (index: number) => void;
  executeSelected: () => void;
  openDirectMessage: (userId: string) => void;
  openProfile: (userId: string) => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  selectedIndex: 0,
  isLoading: false,

  setQuery: async (query) => {
    set({ query, isLoading: true });

    if (!query.trim()) {
      set({ results: [], isLoading: false, selectedIndex: 0 });
      return;
    }

    // 1. Módulos Estáticos
    const modules: SearchResult[] = [
      { id: 'chat', title: 'Chat', description: 'Abrir mensagens', category: 'module', icon: '💬', action: () => openModule(ModuleId.Chat) },
      { id: 'feed', title: 'Feed', description: 'Ver novidades', category: 'module', icon: '📰', action: () => openModule(ModuleId.Feed) },
      { id: 'music', title: 'Music', description: 'Ouvir música', category: 'module', icon: '🎵', action: () => openModule(ModuleId.Music) },
      { id: 'browser', title: 'Browser', description: 'Navegar na web', category: 'module', icon: '🌐', action: () => openModule(ModuleId.Browser) },
      { id: 'settings', title: 'Configurações', description: 'Ajustar sistema', category: 'module', icon: '⚙️', action: () => openModule(ModuleId.Settings) },
      { id: 'cpu', title: 'CPU', description: 'Monitorar processador', category: 'module', icon: '⚡', action: () => openModule(ModuleId.CPU) },
      { id: 'ram', title: 'RAM', description: 'Monitorar memória', category: 'module', icon: '🧠', action: () => openModule(ModuleId.RAM) },
      { id: 'gpu', title: 'GPU', description: 'Monitorar placa de vídeo', category: 'module', icon: '🎮', action: () => openModule(ModuleId.GPU) },
      { id: 'storage', title: 'Disco', description: 'Monitorar armazenamento', category: 'module', icon: '💾', action: () => openModule(ModuleId.Storage) },
    ];

    // 2. Ações de Sistema
    const actions: SearchResult[] = [
      { id: 'act-logout', title: 'Sair do Sistema', description: 'Fazer logoff', category: 'action', icon: '🚪', action: () => {
        import('./auth.store').then(m => m.useAuthStore.getState().signOut());
      }},
      { id: 'act-clear', title: 'Limpar Layout', description: 'Resetar painéis', category: 'action', icon: '🧹', action: () => useLayoutStore.getState().resetLayout() },
    ];

    let results: SearchResult[] = [...modules, ...actions].filter(r => 
      r.title.toLowerCase().includes(query.toLowerCase()) || 
      r.description.toLowerCase().includes(query.toLowerCase())
    );

    if (query.startsWith('@') && query.length > 1) {
      const searchTerm = query.substring(1);
      try {
        const { data: users } = await supabase
          .from('users')
          .select('id, username, display_name, avatar_url')
          .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
          .limit(5);

        if (users) {
          const userResults: SearchResult[] = users.map(u => ({
            id: `user-${u.id}`,
            title: (u.display_name || u.username).split('@')[0],
            description: `@${u.username.split('@')[0]}`,
            category: 'user',
            icon: '👤',
            action: () => get().openProfile(u.id)
          }));
          results = [...results, ...userResults];
        }
      } catch (error) {
        console.error('Erro na busca de usuários:', error);
      }
    }

    set({ results, selectedIndex: 0, isLoading: false });
  },

  setSelectedIndex: (index) => set({ selectedIndex: index }),

  clearSearch: () => set({ query: '', results: [], selectedIndex: 0, isLoading: false }),

  executeSelected: () => {
    const { results, selectedIndex } = get();
    if (results[selectedIndex]) {
      results[selectedIndex].action();
      set({ query: '', results: [] });
    }
  },

  openDirectMessage: (userId) => {
    // 1. Abre o módulo de Chat na Nav
    openModule(ModuleId.Chat);
    
    // 2. Avisa o módulo de chat para iniciar/abrir a conversa com este usuário
    import('@tauri-apps/api/event').then(m => {
      m.emit('chat:open-dm', { userId });
    });
  },

  openProfile: (userId) => {
    // 1. Abre o módulo de Perfil na Nav
    openModule(ModuleId.Profile);
    
    // 2. Avisa o módulo de perfil para carregar este usuário
    import('@tauri-apps/api/event').then(m => {
      m.emit('profile:open', { userId });
    });
  }
}));

function openModule(moduleId: ModuleId) {
  // Emitimos um evento global para que a janela principal (que tem o LayoutStore real) processe o acoplamento
  import('@tauri-apps/api/event').then(m => {
    m.emit('layout:dock-module', { moduleId });
  });

  // Fecha a janela de busca (Overlay)
  import('@tauri-apps/api/webviewWindow').then(m => {
    m.getCurrentWebviewWindow().hide().catch(() => {});
  });
}
