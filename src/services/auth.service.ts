import { supabase } from '@/config/supabase';
import { UserCredentials } from '@/types'; // Vou precisar adicionar este tipo

/**
 * Serviço para lidar com autenticação via Supabase.
 */
export const authService = {
  /**
   * Realiza login com email e senha.
   */
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Realiza cadastro de novo usuário.
   */
  signup: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Encerra a sessão atual.
   */
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Obtém a sessão atual.
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }
};
