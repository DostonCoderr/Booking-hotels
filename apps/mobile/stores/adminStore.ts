// stores/adminStore.ts

import { create } from 'zustand'
import { Listing, AdminStats, User } from '@/types'
import { listingService } from '@/services/listing.service'

interface AdminStore {
  stats: AdminStats | null
  pendingListings: Listing[]
  users: User[]
  isLoading: boolean
  fetchStats: () => Promise<void>
  fetchPendingListings: () => Promise<void>
  fetchUsers: () => Promise<void>
  approveListing: (id: string) => Promise<void>
  rejectListing: (id: string, reason: string) => Promise<void>
  toggleUserStatus: (userId: string) => Promise<void>
  clear: () => void
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  stats: null,
  pendingListings: [],
  users: [],
  isLoading: false,

  fetchStats: async () => {
    set({ isLoading: true })
    try {
      const stats = await listingService.getAdminStats()
      set({ stats, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
    }
  },

  fetchPendingListings: async () => {
    set({ isLoading: true })
    try {
      const pendingListings = await listingService.getPendingListings()
      set({ pendingListings, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
    }
  },

  fetchUsers: async () => {
    set({ isLoading: true })
    try {
      const users = await listingService.getAllUsers()
      set({ users, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
    }
  },

  approveListing: async (id: string) => {
    try {
      await listingService.approveListing(id)
      set((state) => ({
        pendingListings: state.pendingListings.filter(l => l.id !== id)
      }))
      await get().fetchStats()
    } catch (error) {
      throw error
    }
  },

  rejectListing: async (id: string, reason: string) => {
    try {
      await listingService.rejectListing(id, reason)
      set((state) => ({
        pendingListings: state.pendingListings.filter(l => l.id !== id)
      }))
      await get().fetchStats()
    } catch (error) {
      throw error
    }
  },

  toggleUserStatus: async (userId: string) => {
    try {
      const { user } = await listingService.toggleUserStatus(userId)
      set((state) => ({
        users: state.users.map(u => u.id === userId ? { ...u, isActive: user.isActive } : u)
      }))
    } catch (error) {
      throw error
    }
  },

  clear: () => {
    set({ stats: null, pendingListings: [], users: [], isLoading: false })
  },
}))