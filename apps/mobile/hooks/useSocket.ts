// hooks/useSocket.ts
import { useEffect, useState, useCallback } from 'react'
import { socketService } from '@/services/socket.service'
import { Message } from '@/types'
import { useAuthStore } from '@/stores/authStore'

export const useSocket = () => {
  const { isAuthenticated } = useAuthStore()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return

    let unsubscribeConnect: (() => void) | undefined
    let unsubscribeDisconnect: (() => void) | undefined

    const initSocket = async () => {
      await socketService.connect()
      
      unsubscribeConnect = socketService.on('connect', () => setIsConnected(true))
      unsubscribeDisconnect = socketService.on('disconnect', () => setIsConnected(false))
    }

    initSocket()

    return () => {
      if (unsubscribeConnect) unsubscribeConnect()
      if (unsubscribeDisconnect) unsubscribeDisconnect()
      socketService.disconnect()
    }
  }, [isAuthenticated])

  const sendMessage = useCallback((receiverId: string, content: string) => {
    socketService.sendMessage(receiverId, content)
  }, [])

  const markAsRead = useCallback((senderId: string) => {
    socketService.markAsRead(senderId)
  }, [])

  const sendTyping = useCallback((receiverId: string, isTyping: boolean) => {
    socketService.sendTyping(receiverId, isTyping)
  }, [])

  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    return socketService.on('newMessage', callback)
  }, [])

  const onMessageRead = useCallback((callback: (data: { byUser: string }) => void) => {
    return socketService.on('messagesRead', callback)
  }, [])

  const onUserTyping = useCallback((callback: (data: { userId: string; isTyping: boolean }) => void) => {
    return socketService.on('userTyping', callback)
  }, [])

  return {
    isConnected,
    sendMessage,
    markAsRead,
    sendTyping,
    onNewMessage,
    onMessageRead,
    onUserTyping,
  }
}