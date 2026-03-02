import { supabase } from '@/config/supabase';

/**
 * Serviço para gerenciar relacionamentos de seguir/deixar de seguir.
 */
export const followService = {
  /**
   * Verifica se o usuário logado segue outro usuário.
   */
  isFollowing: async (followerId: string, followingId: string) => {
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();
    
    return !!data;
  },

  /**
   * Segue um usuário.
   */
  follow: async (followerId: string, followingId: string) => {
    await supabase.from('follows').insert({
      follower_id: followerId,
      following_id: followingId
    });
  },

  /**
   * Deixa de seguir um usuário.
   */
  unfollow: async (followerId: string, followingId: string) => {
    await supabase.from('follows').delete().match({
      follower_id: followerId,
      following_id: followingId
    });
  }
};
