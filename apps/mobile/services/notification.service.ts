import { api } from './api'

export interface NotificationSettings {
  emailEnabled: boolean
  telegramEnabled: boolean
  telegramChatId: string | null
}

export const notificationService = {
  // Save Telegram chat ID
  saveTelegramChatId: async (chatId: string): Promise<void> => {
    const { data } = await api.post('/notifications/telegram-chat', { chatId })
    return data
  },

  // Get notification settings
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    const { data } = await api.get('/notifications/settings')
    return data
  },

  // Create trip reminder
  createTripReminder: async (bookingId: string): Promise<void> => {
    const { data } = await api.post('/notifications/trip-reminder', { bookingId })
    return data
  },
}