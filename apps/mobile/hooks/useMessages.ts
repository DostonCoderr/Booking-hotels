// hooks/useMessages.ts

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api').replace('/api', '')

export interface Message {
  id: string
  content: string
  isRead: boolean
  sender: { id: string; name: string; avatar: string | null }
  receiver: { id: string; name: string; avatar: string | null }
  receiverId: string
  createdAt: string
}

export interface Conversation {
  user: { id: string; name: string; avatar: string | null; phone?: string }
  lastMessage: { id: string; content: string; createdAt: string; senderId: string; isRead: boolean }
  unreadCount: number
}

export function useMessages(targetUserId?: string) {
  const { user, token } = useAuthStore()
  const qc = useQueryClient()
  const socketRef = useRef<Socket | null>(null)

  const [isConnected, setIsConnected] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // ── Socket connection ─────────────────────────────────
  useEffect(() => {
    if (!token || !user) return

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 10000,
    })

    socketRef.current = socket

    const handleConnect = () => {
      console.log('✅ Socket connected')
      setIsConnected(true)
    }

    const handleDisconnect = () => {
      console.log('🔌 Socket disconnected')
      setIsConnected(false)
    }

    const handleNewMessage = (msg: Message) => {
      if (targetUserId && (msg.sender.id === targetUserId || msg.receiver.id === targetUserId)) {
        qc.setQueryData<Message[]>(['messages', targetUserId], (old = []) => {
          const exists = old.some(m => m.id === msg.id)
          if (exists) return old
          return [...old, msg]
        })
      }
      qc.invalidateQueries({ queryKey: ['conversations'] })
    }

    const handleMessageSent = (msg: Message) => {
      if (targetUserId) {
        qc.setQueryData<Message[]>(['messages', targetUserId], (old = []) => {
          const exists = old.some(m => m.id === msg.id)
          if (exists) return old
          return [...old, msg]
        })
      }
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setIsSending(false)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('new_message', handleNewMessage)
    socket.on('message_sent', handleMessageSent)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('new_message', handleNewMessage)
      socket.off('message_sent', handleMessageSent)
      
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [token, user?.id, targetUserId, qc])

  // ── Conversations query ──────────────────────────
  const { 
    data: conversations = [], 
    isLoading: isLoadingConversations,
  } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/messages/conversations')
      return data
    },
    enabled: !!user,
  })

  // ── Messages query ───────────────────────────────
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useQuery<Message[]>({
    queryKey: ['messages', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return []
      const { data } = await api.get(`/messages/${targetUserId}`)
      return data
    },
    enabled: !!targetUserId && !!user,
  })

  // ── Send message function ───────────────────────────
  const sendMessage = useCallback((receiverId: string, content: string) => {
    if (!content.trim()) return

    setIsSending(true)

    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', { receiverId, content })
    } else {
      api.post('/messages', { receiverId, content })
        .then(({ data }) => {
          qc.setQueryData<Message[]>(['messages', receiverId], (old = []) => [...old, data])
          qc.invalidateQueries({ queryKey: ['conversations'] })
        })
        .catch(console.error)
        .finally(() => setIsSending(false))
    }
  }, [qc])

  // ── Mark message as read by ID ───────────────────────────
  const markMessageAsRead = useCallback((messageId: string) => {
    api.put(`/messages/${messageId}/read`).catch(console.error)
    qc.invalidateQueries({ queryKey: ['conversations'] })
  }, [qc])

  // ── Mark all messages from user as read ───────────────────
  const markMessagesAsRead = useCallback((senderId: string) => {
    // Get all unread message IDs from this sender
    const unreadMessages = messages.filter(m => !m.isRead && m.sender.id === senderId)
    unreadMessages.forEach(msg => {
      api.put(`/messages/${msg.id}/read`).catch(console.error)
    })
    qc.invalidateQueries({ queryKey: ['conversations'] })
    qc.invalidateQueries({ queryKey: ['messages', targetUserId] })
  }, [messages, qc, targetUserId])

  return {
    conversations,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    isConnected,
    sendMessage,
    markMessageAsRead,
    markMessagesAsRead,
    refetchMessages,
  }
}