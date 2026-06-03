// services/message.service.ts
import { api } from './api'
import { Message } from '@/types'

export interface Conversation {
  user: {
    id: string
    name: string
    avatar: string | null
    phone?: string
  }
  lastMessage: {
    id: string
    content: string
    createdAt: string
    isRead: boolean
    senderId: string
  }
  unreadCount: number
}

export const messageService = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get('/messages/conversations')
    return response.data
  },

  getMessages: async (userId: string): Promise<Message[]> => {
    const response = await api.get(`/messages/${userId}`)
    return response.data
  },

  sendMessage: async (receiverId: string, content: string): Promise<Message> => {
    const response = await api.post('/messages', { receiverId, content })
    return response.data
  },

  markAsRead: async (messageId: string): Promise<void> => {
    await api.put(`/messages/${messageId}/read`)
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/messages/unread/count')
    return response.data.count
  }
}