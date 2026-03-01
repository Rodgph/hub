import { supabase } from '@/config/supabase';
import { LayoutNode } from '@/types/layout.types';

const USER_SETTINGS_TABLE = 'user_settings';

const isPlaceholder = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  return url.includes('placeholder.supabase.co');
};

/**
 * Salva a árvore de layout de um usuário no Supabase.
 * @param userId O ID do usuário.
 * @param layout A árvore de layout a ser salva.
 */
async function saveLayout(userId: string, layout: LayoutNode): Promise<void> {
  if (isPlaceholder()) {
    // Apenas guarda em memória (Zustand) sem erro de rede
    return;
  }
  
  console.log(`[userService] Salvando layout para o usuário ${userId}...`);
  const { error } = await supabase
    .from(USER_SETTINGS_TABLE)
    .update({ 
        saved_layouts: { main: layout },
        updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('[userService] Erro ao salvar o layout:', error);
    // Em um app real, talvez queiramos criar as configurações se não existirem.
    // const { error: insertError } = await supabase.from(USER_SETTINGS_TABLE).insert({ user_id: userId, saved_layouts: { main: layout } });
    // if(insertError) console.error('[userService] Erro ao criar settings:', insertError);
    throw new Error(error.message);
  }
}

/**
 * Carrega a árvore de layout de um usuário do Supabase.
 * @param userId O ID do usuário.
 * @returns A árvore de layout salva ou null se não houver nenhuma.
 */
async function getLayout(userId: string): Promise<LayoutNode | null> {
    if (isPlaceholder()) return null;
    
    console.log(`[userService] Carregando layout para o usuário ${userId}...`);
    const { data, error } = await supabase
      .from(USER_SETTINGS_TABLE)
      .select('saved_layouts')
      .eq('user_id', userId)
      .single();
  
    if (error) {
      console.error('[userService] Erro ao carregar o layout:', error);
      return null;
    }
  
    if (data && data.saved_layouts && data.saved_layouts.main) {
      return data.saved_layouts.main as LayoutNode;
    }
  
    return null;
}

export const userService = {
  saveLayout,
  getLayout,
};
