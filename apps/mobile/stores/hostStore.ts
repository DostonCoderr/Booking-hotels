// stores/hostStore.ts

import { create } from 'zustand'
import { Listing, HostStats } from '@/types'
import { listingService } from '@/services/listing.service'

interface HostStore {
  listings: Listing[]
  stats: HostStats | null
  isLoading: boolean
  fetchListings: () => Promise<void>
  fetchStats: () => Promise<void>
  createListing: (formData: FormData) => Promise<void>
  updateListing: (id: string, data: Partial<Listing>) => Promise<void>
  deleteListing: (id: string) => Promise<void>
  clear: () => void
}

export const useHostStore = create<HostStore>((set, get) => ({
  listings: [],
  stats: null,
  isLoading: false,

  fetchListings: async () => {
    set({ isLoading: true })
    try {
      const listings = await listingService.getHostListings()
      set({ listings, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
    }
  },

  fetchStats: async () => {
    try {
      const response = await listingService.getAdminStats?.() // Host stats endpoint
      // set({ stats: response })
    } catch (error) {
      console.error(error)
    }
  },

  createListing: async (formData: FormData) => {
    set({ isLoading: true })
    try {
      const { listing, message } = await listingService.createListing(formData)
      set((state) => ({ 
        listings: [listing, ...state.listings],
        isLoading: false 
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  updateListing: async (id: string, data: Partial<Listing>) => {
    set({ isLoading: true })
    try {
      const { listing, message } = await listingService.updateListing(id, data)
      set((state) => ({
        listings: state.listings.map(l => l.id === id ? listing : l),
        isLoading: false
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  deleteListing: async (id: string) => {
    set({ isLoading: true })
    try {
      await listingService.deleteListing(id)
      set((state) => ({
        listings: state.listings.filter(l => l.id !== id),
        isLoading: false
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  clear: () => {
    set({ listings: [], stats: null, isLoading: false })
  },
}))