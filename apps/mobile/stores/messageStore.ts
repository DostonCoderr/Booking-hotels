import { create } from 'zustand'
import { Message } from '@/types'
import { messageService, Conversation } from '@/services/message.service'
import { socketService } from '@/services/socket.service'

interface MessageStore {
  conversations: Conversation[]
  messages: Message[]
  isLoading: boolean
  fetchConversations: () => Promise<void>
  fetchMessages: (userId: string) => Promise<void>
  sendMessage: (receiverId: string, content: string) => void
  addMessage: (message: Message) => void
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  conversations: [],
  messages: [],
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true })
    try {
      const conversations = await messageService.getConversations()
      set({ conversations, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
    }
  },

  fetchMessages: async (userId: string) => {
    set({ isLoading: true })
    try {
      const messages = await messageService.getMessages(userId)
      set({ messages, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
    }
  },

  sendMessage: (receiverId: string, content: string) => {
    socketService.sendMessage(receiverId, content)
  },

  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }))
  },
}))

// Socket listeners setup
socketService.on('newMessage', (message: Message) => {
  useMessageStore.getState().addMessage(message)
})