import { api } from './api'

export const tripReminderService = {
  createReminder: async (bookingId: string) => {
    const { data } = await api.post('/notifications/trip-reminder', { bookingId })
    return data
  },
  
  saveTelegramChatId: async (chatId: string) => {
    const { data } = await api.post('/notifications/telegram-chat', { chatId })
    return data
  },
  
  checkUpcomingTrips: async () => {
    const { data } = await api.get('/bookings/upcoming')
    return data
  }
}