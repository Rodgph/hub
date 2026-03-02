import { create } from 'zustand';
import { Message } from '@/types/message.types';
import { supabase } from '@/config/supabase';

interface ChatState {
  conversations: any[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  isLoading: boolean;
  
  setConversations: (conversations: any[]) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, userId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isLoading: false,

  setConversations: (conversations) => set({ conversations }),
  
  setActiveConversation: (id) => set({ activeConversationId: id }),

  addMessage: (conversationId, message) => set((state) => {
    const currentMsgs = state.messages[conversationId] || [];
    return {
      messages: {
        ...state.messages,
        [conversationId]: [...currentMsgs, message]
      }
    };
  }),

  loadMessages: async (conversationId) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data) {
      set((state) => ({
        messages: { ...state.messages, [conversationId]: data }
      }));
    }
    set({ isLoading: false });
  },

  sendMessage: async (conversationId, content, userId) => {
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content,
        type: 'text',
        status: 'sent'
      });

    if (error) {
      console.error('[ChatStore] Erro ao enviar mensagem:', error);
    }
  }
}));
