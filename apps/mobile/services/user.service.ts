import { io, Socket } from 'socket.io-client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Message } from '@/types'

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://10.0.2.2:3000'

class SocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Function[]> = new Map()

  async connect() {
    const token = await AsyncStorage.getItem('token')
    if (!token) {
      console.log('No token, skipping socket connection')
      return
    }

    if (this.socket?.connected) {
      console.log('Socket already connected')
      return
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    this.socket.on('connect', () => {
      console.log('✅ Socket connected')
    })

    this.socket.on('connect_error', (error) => {
      console.log('❌ Socket connection error:', error.message)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason)
    })

    this.socket.on('new_message', (message: Message) => {
      console.log('📩 New message received:', message)
      this.emitListener('newMessage', message)
    })

    this.socket.on('new_notification', (notification: any) => {
      console.log('🔔 New notification:', notification)
      this.emitListener('newNotification', notification)
    })

    this.socket.on('messages_read', (data: { by: string }) => {
      console.log('📖 Messages read by:', data.by)
      this.emitListener('messagesRead', data)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  sendMessage(receiverId: string, content: string) {
    console.log('📤 Sending message to:', receiverId, content)
    this.socket?.emit('send_message', { receiverId, content })
  }

  markMessagesAsRead(senderId: string) {
    this.socket?.emit('mark_read', { senderId })
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index !== -1) callbacks.splice(index, 1)
    }
  }

  private emitListener(event: string, data: any) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }
}

export const socketService = new SocketService()