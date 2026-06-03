// services/listing.service.ts

import { api } from './api'
import { Listing, SearchFilters, AdminStats, User } from '@/types'

export interface ListingsResponse {
  listings: Listing[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const listingService = {
  // ============================================
  // PUBLIC ROUTES (faqat APPROVED listinglar)
  // ============================================
  getListings: async (params?: {
    page?: number
    limit?: number
    city?: string
    category?: string
    minPrice?: number
    maxPrice?: number
    guests?: number
  }): Promise<ListingsResponse> => {
    const response = await api.get('/listings', { params })
    return response.data
  },

  getListingById: async (id: string): Promise<Listing> => {
    const response = await api.get(`/listings/${id}`)
    return response.data
  },

  searchListings: async (query: string): Promise<Listing[]> => {
    const response = await api.get('/listings/search', { params: { q: query } })
    return response.data
  },

  getBookedDates: async (id: string): Promise<string[]> => {
    const response = await api.get(`/listings/${id}/booked-dates`)
    return response.data
  },

  // ============================================
  // HOST ROUTES
  // ============================================
  getHostListings: async (): Promise<Listing[]> => {
    const response = await api.get('/host/listings')
    return response.data
  },

  getHostStats: async (): Promise<any> => {
    const response = await api.get('/host/stats')
    return response.data
  },

  createListing: async (formData: FormData): Promise<{ listing: Listing; message: string }> => {
    const response = await api.post('/host/listings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  updateListing: async (id: string, data: Partial<Listing>): Promise<{ listing: Listing; message: string }> => {
    const response = await api.put(`/host/listings/${id}`, data)
    return response.data
  },

  deleteHostListing: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/host/listings/${id}`)
    return response.data
  },

  getHostBookings: async (): Promise<any[]> => {
    const response = await api.get('/host/bookings')
    return response.data
  },

  // ============================================
  // ADMIN ROUTES
  // ============================================
  getAdminStats: async (): Promise<AdminStats> => {
    const response = await api.get('/admin/stats')
    return response.data
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/admin/users')
    return response.data
  },

  toggleUserStatus: async (userId: string): Promise<{ message: string; user: User }> => {
    const response = await api.patch(`/admin/users/${userId}/toggle`)
    return response.data
  },

  // Admin - Listing management
  getAllListings: async (status?: string): Promise<Listing[]> => {
    const params = status && status !== 'all' ? { status } : {}
    const response = await api.get('/admin/listings', { params })
    return response.data
  },

  getPendingListings: async (): Promise<Listing[]> => {
    const response = await api.get('/admin/listings/pending')
    return response.data
  },

  getApprovedListings: async (): Promise<Listing[]> => {
    const response = await api.get('/admin/listings/approved')
    return response.data
  },

  getRejectedListings: async (): Promise<Listing[]> => {
    const response = await api.get('/admin/listings/rejected')
    return response.data
  },

  approveListing: async (id: string): Promise<{ message: string; listing: Listing }> => {
    const response = await api.patch(`/admin/listings/${id}/approve`)
    return response.data
  },

  rejectListing: async (id: string, reason: string): Promise<{ message: string; listing: Listing }> => {
    const response = await api.patch(`/admin/listings/${id}/reject`, { reason })
    return response.data
  },

  deleteListing: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/admin/listings/${id}`)
    return response.data
  },
}