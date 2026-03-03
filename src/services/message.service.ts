import { supabase } from '@/config/supabase'
import { mapSupabaseError } from '@/utils/errors'

// Helper para gerar hash de senha (nativo)
async function hashPassword(password: string) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const messageService = {
  async getConversations() {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        members:conversation_members(
          *,
          user:users(
            *,
            status:user_status(*)
          )
        ),
        last_message:messages(
          id,
          content,
          created_at,
          sender_id
        )
      `)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
    
    if (error) throw mapSupabaseError(error)
    return data
  },

  async sendMessage(conversationId: string, content: string, options: any = {}) {
    const { data: { user } } = await supabase.auth.getUser()
    
    const payload: any = {
      conversation_id: conversationId,
      sender_id: user?.id,
      content: options.has_password ? null : content,
      private_content: options.has_password ? content : null,
      has_password: options.has_password || false,
      scheduled_for: options.scheduled_for || null,
      is_silent: options.is_silent || false,
      burn_after_read: options.burn_after_read || false
    }

    if (options.has_password && options.password) {
      payload.password_hash = await hashPassword(options.password)
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(payload)
      .select()
      .single()

    if (error) throw mapSupabaseError(error)
    return data
  },

  async unlockMessage(messageId: string, password: string) {
    const hash = await hashPassword(password)
    
    const { data, error } = await supabase
      .from('messages')
      .select('private_content, password_hash')
      .eq('id', messageId)
      .single()

    if (error) throw mapSupabaseError(error)
    
    if (data.password_hash === hash) {
      return data.private_content
    }
    
    throw new Error('Senha incorreta')
  },
  
  async getMessages(conversationId: string, limit = 50) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users(*),
        reactions:message_reactions(*)
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw mapSupabaseError(error)
    return data?.reverse() || []
  },

  async editMessage(messageId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .select()
      .single()

    if (error) throw mapSupabaseError(error)
    return data
  },

  async deleteMessage(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId)

    if (error) throw mapSupabaseError(error)
  }
}
