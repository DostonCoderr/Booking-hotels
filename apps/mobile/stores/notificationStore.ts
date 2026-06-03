import { create } from 'zustand'
import { api } from '@/services/api'
import { socketService } from '@/services/socket.service'
import { Notification } from '@/types'

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  deleteAllNotifications: () => Promise<void>
  addNotification: (notification: Notification) => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true })
    try {
      const { data } = await api.get('/notifications')
      set({ notifications: data, isLoading: false })
    } catch (error) {
      console.error('Fetch notifications error:', error)
      set({ isLoading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get('/notifications/unread/count')
      set({ unreadCount: data.count })
    } catch (error) {
      console.error('Fetch unread count error:', error)
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`)
      set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }))
    } catch (error) {
      console.error('Mark as read error:', error)
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read/all')
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }))
    } catch (error) {
      console.error('Mark all as read error:', error)
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`)
      const deleted = get().notifications.find(n => n.id === id)
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id),
        unreadCount: deleted && !deleted.isRead ? state.unreadCount - 1 : state.unreadCount
      }))
    } catch (error) {
      console.error('Delete notification error:', error)
    }
  },

  deleteAllNotifications: async () => {
    try {
      await api.delete('/notifications/all')
      set({ notifications: [], unreadCount: 0 })
    } catch (error) {
      console.error('Delete all notifications error:', error)
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }))
  },
}))

// Socket listener
socketService.on('new_notification', (notification: Notification) => {
  useNotificationStore.getState().addNotification(notification)
})