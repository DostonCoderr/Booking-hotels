import { create } from 'zustand'
import { Booking } from '@/types'
import { bookingService, CreateBookingData } from '@/services/booking.service'

interface BookingStore {
  bookings: Booking[]
  isLoading: boolean
  fetchMyBookings: () => Promise<void>
  createBooking: (data: CreateBookingData) => Promise<{ clientSecret: string; bookingId: string }>
  confirmBooking: (bookingId: string, paymentIntentId: string) => Promise<void>
  cancelBooking: (bookingId: string) => Promise<void>
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: [],
  isLoading: false,

  fetchMyBookings: async () => {
    set({ isLoading: true })
    try {
      const bookings = await bookingService.getMyBookings()
      set({ bookings, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
    }
  },

  createBooking: async (data) => {
    const response = await bookingService.createBooking(data)
    return { clientSecret: response.clientSecret, bookingId: response.booking.id }
  },

  confirmBooking: async (bookingId, paymentIntentId) => {
    await bookingService.confirmBooking(bookingId, paymentIntentId)
    await get().fetchMyBookings()
  },

  cancelBooking: async (bookingId) => {
    await bookingService.cancelBooking(bookingId)
    await get().fetchMyBookings()
  },
}))