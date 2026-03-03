import { create } from 'zustand'
import { messageService } from '@/services/message.service'
import { useOfflineStore } from '@/store/offline.store'

interface ChatState {
  conversations: any[]
  messages: Record<string, any[]>
  isLoading: boolean
  activeConversationId: string | null
  
  loadConversations: () => Promise<void>
  loadMessages: (conversationId: string) => Promise<void>
  setActiveConversation: (id: string | null) => void
  sendMessage: (conversationId: string, content: string, options?: any) => Promise<void>
  editMessage: (conversationId: string, messageId: string, content: string) => Promise<void>
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>
  unlockMessage: (conversationId: string, messageId: string, password: string) => Promise<boolean>
  addMessageRealtime: (conversationId: string, message: any) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  isLoading: false,
  activeConversationId: null,

  loadConversations: async () => {
    set({ isLoading: true })
    try {
      const data = await messageService.getConversations()
      set({ conversations: data || [], isLoading: false })
    } catch (error) {
      set({ isLoading: false })
    }
  },

  loadMessages: async (conversationId) => {
    try {
      const data = await messageService.getMessages(conversationId)
      set(state => ({
        messages: { ...state.messages, [conversationId]: data }
      }))
    } catch (error) {
      console.error(error)
    }
  },

  setActiveConversation: (id) => {
    set({ activeConversationId: id })
    if (id) get().loadMessages(id)
  },

  addMessageRealtime: (conversationId, message) => {
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message]
      }
    }))
  },

  sendMessage: async (conversationId, content, options = {}) => {
    const tempId = `temp_${crypto.randomUUID()}`
    const newMessage = {
      id: tempId,
      conversation_id: conversationId,
      content: options.has_password ? null : content,
      status: 'sending',
      has_password: options.has_password || false,
      scheduled_for: options.scheduled_for || null,
      created_at: new Date().toISOString()
    }

    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), newMessage]
      }
    }))

    try {
      const saved = await messageService.sendMessage(conversationId, content, options)
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] || []).map(m => 
            m.id === tempId ? { ...saved, status: 'sent' } : m
          )
        }
      }))
    } catch (error: any) {
      if (error.type === 'network') {
        useOfflineStore.getState().addToQueue({
          type: 'send_message',
          payload: { conversationId, content, options }
        })
      }
      
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] || []).map(m => 
            m.id === tempId ? { ...m, status: 'failed' } : m
          )
        }
      }))
    }
  },

  unlockMessage: async (conversationId, messageId, password) => {
    try {
      const content = await messageService.unlockMessage(messageId, password)
      if (content) {
        set(state => ({
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] || []).map(m => 
              m.id === messageId ? { ...m, content, is_unlocked: true } : m
            )
          }
        }))
        return true
      }
      return false
    } catch (error) {
      console.error('[ChatStore] Falha ao desbloquear:', error)
      return false
    }
  },

  editMessage: async (conversationId, messageId, content) => {
    const originalMessages = get().messages[conversationId]
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map(m => 
          m.id === messageId ? { ...m, content, is_edited: true } : m
        )
      }
    }))

    try {
      await messageService.editMessage(messageId, content)
    } catch (error) {
      set(state => ({
        messages: { ...state.messages, [conversationId]: originalMessages }
      }))
    }
  },

  deleteMessage: async (conversationId, messageId) => {
    const originalMessages = get().messages[conversationId]
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).filter(m => m.id !== messageId)
      }
    }))

    try {
      await messageService.deleteMessage(messageId)
    } catch (error) {
      set(state => ({
        messages: { ...state.messages, [conversationId]: originalMessages }
      }))
    }
  }
}))
