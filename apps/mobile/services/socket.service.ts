// services/socket.service.ts

import { io, Socket } from 'socket.io-client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Message } from '@/types'

// Backend bilan bir xil IP va PORT ishlatilishi kerak
// API_URL dan socket URL ni yaratamiz
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.15:3000/api'
// Socket URL = API_URL dan /api ni olib tashlaymiz
const SOCKET_URL = API_URL.replace('/api', '')

console.log('🔌 Socket URL:', SOCKET_URL)

type EventCallback = (data: any) => void
type Unsubscribe = () => void

class SocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Set<EventCallback>> = new Map()
  private isConnecting: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5

  async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      console.log('Socket already connected or connecting')
      return
    }
    
    const token = await AsyncStorage.getItem('token')
    if (!token) {
      console.log('No token, skipping socket connection')
      return
    }

    this.isConnecting = true
    console.log('🔌 Connecting to socket...')

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'], // polling fallback qo'shildi
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    })

    this.socket.on('connect', () => {
      console.log('✅ Socket connected')
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.emit('connect', null)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason)
      this.isConnecting = false
      this.emit('disconnect', null)
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message)
      this.isConnecting = false
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('Max reconnection attempts reached, giving up')
        this.socket?.close()
      }
    })

    this.socket.on('new_message', (message: Message) => {
      console.log('📨 New message received:', message.id)
      this.emit('newMessage', message)
    })

    this.socket.on('message_sent', (message: Message) => {
      console.log('📤 Message sent:', message.id)
      this.emit('messageSent', message)
    })

    this.socket.on('messages_read', (data: { byUser: string }) => {
      console.log('📖 Messages read by:', data.byUser)
      this.emit('messagesRead', data)
    })

    this.socket.on('user_typing', (data: { userId: string; isTyping: boolean }) => {
      this.emit('userTyping', data)
    })
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...')
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnecting = false
    this.listeners.clear()
  }

  sendMessage(receiverId: string, content: string): void {
    if (this.socket?.connected) {
      this.socket.emit('send_message', { receiverId, content })
      console.log('📤 Sending message via socket')
    } else {
      console.log('⚠️ Socket not connected, message will be sent via REST API')
    }
  }

  markAsRead(senderId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_read', { senderId })
      console.log('📖 Marking as read via socket')
    } else {
      console.log('⚠️ Socket not connected, mark read via REST API')
    }
  }

  sendTyping(receiverId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { receiverId, isTyping })
    }
  }

  on(event: string, callback: EventCallback): Unsubscribe {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
    this.socket?.on(event, callback)
    
    return () => {
      this.off(event, callback)
    }
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.listeners.delete(event)
      }
    }
    this.socket?.off(event, callback)
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const socketService = new SocketService()