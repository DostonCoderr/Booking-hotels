// services/booking.service.ts

import { api } from './api'

export interface Booking {
  id: string
  checkIn: string
  checkOut: string
  guests: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  listing: {
    id: string
    title: string
    images: string[]
    address: string
    city: string
    country: string
  }
  guest?: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  createdAt: string
}

export const bookingService = {
  // User routes
  createBooking: async (data: {
    listingId: string
    checkIn: string
    checkOut: string
    guests: number
  }): Promise<{ booking: Booking; clientSecret: string }> => {
    const response = await api.post('/bookings', data)
    return response.data
  },

  getMyBookings: async (): Promise<Booking[]> => {
    const response = await api.get('/bookings/my')
    return response.data
  },

  getBookingById: async (id: string): Promise<Booking> => {
    const response = await api.get(`/bookings/${id}`)
    return response.data
  },

  cancelBooking: async (id: string): Promise<void> => {
    await api.post(`/bookings/${id}/cancel`)
  },

  // Host routes - FIXED: faqat to'g'ri URL ishlatiladi
  getHostBookings: async (status?: string): Promise<Booking[]> => {
    const params = status ? { status } : {}
    // FAQAT to'g'ri URL - /bookings/host/listings
    const response = await api.get('/bookings/host/listings', { params })
    return response.data
  },

  approveBooking: async (id: string): Promise<void> => {
    await api.patch(`/bookings/host/${id}/approve`)
  },

  rejectBooking: async (id: string, reason: string): Promise<void> => {
    await api.patch(`/bookings/host/${id}/reject`, { reason })
  },

  updateBookingStatus: async (id: string, status: string): Promise<void> => {
    await api.patch(`/bookings/host/${id}/status`, { status })
  },

  confirmArrival: async (id: string): Promise<void> => {
    await api.post(`/bookings/host/${id}/confirm-arrival`)
  },
}