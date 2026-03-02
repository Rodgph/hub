import { supabase } from '@/config/supabase'
import { mapSupabaseError } from '@/utils/errors'

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

  async sendMessage(conversationId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content,
        sender_id: user?.id
      })
      .select()
      .single()

    if (error) throw mapSupabaseError(error)
    return data
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
