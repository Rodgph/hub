import { create } from 'zustand';
import { User } from '@/types/user.types';
import { supabase } from '@/config/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  setUser: (user) => set({ user }),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),

  signOut: async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    await supabase.auth.signOut();
    set({ user: null });
    // Avisa o Rust para trocar as janelas
    await invoke('logout_transition');
  },

  initialize: async () => {
    console.log('[AuthStore] Inicializando autenticação...');
    set({ isLoading: true });
    
    try {
      // 1. Verifica sessão atual
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[AuthStore] Erro ao buscar sessão:', error);
        set({ error: error.message });
      }

      if (session?.user) {
        console.log('[AuthStore] Sessão encontrada para:', session.user.email);
        
        set({ user: {
          id: session.user.id,
          email: session.user.email!,
          username: session.user.user_metadata?.username || session.user.email!.split('@')[0],
          full_name: session.user.user_metadata?.full_name || '',
          status: 'online',
          settings: { language: 'pt-BR', theme: 'dark', notifications: true },
          created_at: session.user.created_at,
        } as User });
      } else {
        console.log('[AuthStore] Nenhuma sessão ativa.');
      }

      // 2. Escuta mudanças futuras (login/logout)
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('[AuthStore] Mudança de estado:', event);
        if (session?.user) {
          set({ user: {
            id: session.user.id,
            email: session.user.email!,
            username: session.user.user_metadata?.username || session.user.email!.split('@')[0],
            full_name: session.user.user_metadata?.full_name || '',
            status: 'online',
            settings: { language: 'pt-BR', theme: 'dark', notifications: true },
            created_at: session.user.created_at,
          } as User });
        } else {
          set({ user: null });
        }
        set({ isLoading: false });
      });
    } catch (err: any) {
      console.error('[AuthStore] Erro crítico na inicialização:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
      console.log('[AuthStore] Inicialização concluída.');
    }
  },
}));
