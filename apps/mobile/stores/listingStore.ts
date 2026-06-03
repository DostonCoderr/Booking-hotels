import { create } from 'zustand'
import { Listing, SearchFilters } from '@/types'
import { listingService } from '@/services/listing.service'

interface ListingStore {
  listings: Listing[]
  selectedListing: Listing | null
  isLoading: boolean
  pagination: {
    page: number
    totalPages: number
    total: number
  }
  fetchListings: (filters?: SearchFilters, page?: number) => Promise<void>
  fetchListingById: (id: string) => Promise<void>
  searchListings: (query: string) => Promise<void>
  clearSelected: () => void
}

export const useListingStore = create<ListingStore>((set, get) => ({
  listings: [],
  selectedListing: null,
  isLoading: false,
  pagination: { page: 1, totalPages: 1, total: 0 },

  fetchListings: async (filters = {}, page = 1) => {
    set({ isLoading: true })
    try {
      const response = await listingService.getListings({ ...filters, page })
      set({
        listings: page === 1 ? response.listings : [...get().listings, ...response.listings],
        pagination: response.pagination,
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
    }
  },

  fetchListingById: async (id: string) => {
    set({ isLoading: true })
    try {
      const listing = await listingService.getListingById(id)
      set({ selectedListing: listing, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
    }
  },

  searchListings: async (query: string) => {
    set({ isLoading: true })
    try {
      const listings = await listingService.searchListings(query)
      set({ listings, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
    }
  },

  clearSelected: () => set({ selectedListing: null }),
}))