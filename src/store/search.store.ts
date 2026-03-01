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
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  selectedIndex: 0,
  isLoading: false,

  setQuery: async (query) => {
    set({ query, isLoading: true });

    // 1. Módulos Estáticos
    const modules: SearchResult[] = [
      { id: 'chat', title: 'Chat', description: 'Abrir mensagens', category: 'module', icon: '💬', action: () => openModule(ModuleId.Chat) },
      { id: 'feed', title: 'Feed', description: 'Ver novidades', category: 'module', icon: '📰', action: () => openModule(ModuleId.Feed) },
      { id: 'music', title: 'Music', description: 'Ouvir música', category: 'module', icon: '🎵', action: () => openModule(ModuleId.Music) },
      { id: 'browser', title: 'Browser', description: 'Navegar na web', category: 'module', icon: '🌐', action: () => openModule(ModuleId.Browser) },
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

    // 3. Busca de Usuários no Supabase (apenas se começar com @)
    if (query.startsWith('@') && query.length > 1) {
      const searchTerm = query.substring(1); // Remove o @
      const { data: users } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .limit(5);

      if (users) {
        const userResults: SearchResult[] = users.map(u => {
          // Limpeza de segurança caso o banco ainda tenha e-mails como nomes
          const cleanName = (u.display_name || u.username).split('@')[0];
          const cleanUser = u.username.split('@')[0];

          return {
            id: `user-${u.id}`,
            title: cleanName,
            description: `@${cleanUser}`,
            category: 'user',
            icon: '👤',
            action: () => {
              openModule(ModuleId.Chat);
            }
          };
        });
        results = userResults; 
      }
    } else {
      // Se não começar com @, filtra apenas os resultados locais (módulos e ações)
      results = results.filter(r => r.category !== 'user');
    }

    set({ results, selectedIndex: 0, isLoading: false });
  },

  setSelectedIndex: (index) => set({ selectedIndex: index }),

  executeSelected: () => {
    const { results, selectedIndex } = get();
    if (results[selectedIndex]) {
      results[selectedIndex].action();
      set({ query: '', results: [] });
    }
  }
}));

function openModule(moduleId: ModuleId) {
  const layout = useLayoutStore.getState();
  const targetId = layout.activeNodeId || 'root';
  
  // No Tauri, como as janelas são processos separados, usamos o emit
  // mas para garantir que funcione, vamos tentar ambos
  import('@tauri-apps/api/event').then(m => {
    m.emit('layout:insert-module', { moduleId });
  });

  // Fecha a busca
  import('@tauri-apps/api/webviewWindow').then(m => {
    m.getCurrentWebviewWindow().hide();
  });
}
