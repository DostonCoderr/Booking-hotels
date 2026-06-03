// ============================================
// components/common/Avatar.tsx
// ============================================
import { View, Text, Image, StyleSheet } from 'react-native'
import { COLORS } from '@/constants/colors'

interface AvatarProps {
  source?: string | null
  name?: string
  size?: number
  showOnline?: boolean
  isOnline?: boolean
  borderColor?: string
  borderWidth?: number
}

export function Avatar({
  source,
  name,
  size = 44,
  showOnline = false,
  isOnline = false,
  borderColor,
  borderWidth: bw = 0,
}: AvatarProps) {
  const initials = name
    ? name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const radius   = size / 2
  const dotSize  = Math.round(size * 0.27)
  const fontSize = Math.round(size * 0.36)

  return (
    <View style={{ width: size, height: size }}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={[
            AV.img,
            {
              width: size, height: size, borderRadius: radius,
              borderWidth: bw, borderColor: borderColor || 'transparent',
            },
          ]}
        />
      ) : (
        <View
          style={[
            AV.placeholder,
            {
              width: size, height: size, borderRadius: radius,
              borderWidth: bw, borderColor: borderColor || 'transparent',
            },
          ]}
        >
          <Text style={[AV.initials, { fontSize }]}>{initials}</Text>
        </View>
      )}

      {showOnline && (
        <View
          style={[
            AV.dot,
            {
              width: dotSize, height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: isOnline ? '#00A651' : COLORS.lightGray,
            },
          ]}
        />
      )}
    </View>
  )
}

const AV = StyleSheet.create({
  img: { resizeMode: 'cover' },
  placeholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  initials: { color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
  dot: {
    position: 'absolute', bottom: 0, right: 0,
    borderWidth: 2, borderColor: '#fff',
  },
})


// ============================================
// hooks/useMessages.ts
// ============================================
import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL =
  (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api').replace('/api', '')

export interface Message {
  id: string
  content: string
  isRead: boolean
  sender: { id: string; name: string; avatar: string | null }
  receiverId: string
  createdAt: string
}

export interface Conversation {
  user: { id: string; name: string; avatar: string | null }
  lastMessage: { id: string; content: string; createdAt: string; senderId: string }
  unreadCount: number
}

export function useMessages(targetUserId?: string) {
  const { user, token } = useAuthStore()
  const qc = useQueryClient()
  const socketRef = useRef<Socket | null>(null)

  const [isConnected, setIsConnected] = useState(false)
  const [isSending,   setIsSending]   = useState(false)

  // ── Socket ─────────────────────────────────
  useEffect(() => {
    if (!token || !user) return
    const socket = io(SOCKET_URL, {
      auth: { userId: user.id },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      timeout: 10000,
    })
    socketRef.current = socket

    socket.on('connect',    () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))

    socket.on('new_message', (msg: Message) => {
      qc.setQueryData<Message[]>(['messages', msg.sender.id], old => [...(old || []), msg])
      qc.invalidateQueries({ queryKey: ['conversations'] })
    })

    socket.on('message_sent', (msg: Message) => {
      qc.setQueryData<Message[]>(['messages', targetUserId], old => [...(old || []), msg])
      qc.invalidateQueries({ queryKey: ['conversations'] })
    })

    socket.on('messages_read', () => {
      qc.invalidateQueries({ queryKey: ['messages', targetUserId] })
    })

    return () => socket.disconnect()
  }, [token, user?.id])

  // ── Conversations ──────────────────────────
  const { data: conversations = [], isLoading: isLoadingConversations } =
    useQuery<Conversation[]>({
      queryKey: ['conversations'],
      queryFn:  async () => {
        const { data } = await api.get('/messages/conversations')
        return data
      },
      enabled: !!user,
      refetchInterval: 20000,
    })

  // ── Messages ───────────────────────────────
  const {
    data:    messages = [],
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useQuery<Message[]>({
    queryKey: ['messages', targetUserId],
    queryFn:  async () => {
      const { data } = await api.get(`/messages/${targetUserId}`)
      return data
    },
    enabled: !!targetUserId && !!user,
  })

  // ── Send message ───────────────────────────
  const sendMessage = (receiverId: string, content: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', { receiverId, content })
      return
    }
    // REST fallback
    setIsSending(true)
    api.post('/messages', { receiverId, content })
      .then(({ data }) => {
        qc.setQueryData<Message[]>(['messages', receiverId], old => [...(old || []), data])
        qc.invalidateQueries({ queryKey: ['conversations'] })
      })
      .catch(console.error)
      .finally(() => setIsSending(false))
  }

  // ── Mark read ──────────────────────────────
  const markRead = (senderId: string) => {
    socketRef.current?.emit('mark_read', { senderId })
    qc.invalidateQueries({ queryKey: ['conversations'] })
  }

  return {
    conversations, isLoadingConversations,
    messages,      isLoadingMessages, refetchMessages,
    sendMessage,   markRead,
    isSending,     isConnected,
  }
}