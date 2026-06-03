import { create } from 'zustand'
import { Listing, SearchFilters } from '@/types'
import { listingService } from '@/services/listing.service'

interface SearchStore {
  // State
  query: string
  filters: SearchFilters
  results: Listing[]
  isLoading: boolean
  hasSearched: boolean
  recentSearches: string[]
  
  // Actions
  setQuery: (query: string) => void
  setFilters: (filters: Partial<SearchFilters>) => void
  clearFilters: () => void
  search: () => Promise<void>
  clearResults: () => void
  addRecentSearch: (query: string) => void
  removeRecentSearch: (query: string) => void
  clearRecentSearches: () => void
}

const defaultFilters: SearchFilters = {
  city: undefined,
  checkIn: undefined,
  checkOut: undefined,
  guests: undefined,
  category: undefined,
  minPrice: undefined,
  maxPrice: undefined,
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  // Initial state
  query: '',
  filters: defaultFilters,
  results: [],
  isLoading: false,
  hasSearched: false,
  recentSearches: [],

  // Set search query
  setQuery: (query: string) => {
    set({ query })
  },

  // Set filters
  setFilters: (newFilters: Partial<SearchFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }))
  },

  // Clear all filters
  clearFilters: () => {
    set({ filters: defaultFilters })
  },

  // Search listings
  search: async () => {
    const { query, filters } = get()
    
    if (!query.trim() && !filters.city) {
      return
    }

    set({ isLoading: true, hasSearched: true })
    
    try {
      let results: Listing[] = []
      
      // Agar qidiruv so'zi bo'lsa, search API ishlatamiz
      if (query.trim()) {
        results = await listingService.searchListings(query)
        get().addRecentSearch(query.trim())
      } 
      // Agar filter bo'lsa, listings API ishlatamiz
      else if (filters.city) {
        const response = await listingService.getListings({
          city: filters.city,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          guests: filters.guests,
          category: filters.category,
        })
        results = response.listings
      }
      
      set({ results, isLoading: false })
    } catch (error) {
      set({ isLoading: false, results: [] })
    }
  },

  // Clear search results
  clearResults: () => {
    set({ results: [], hasSearched: false, query: '' })
  },

  // Add recent search
  addRecentSearch: (searchQuery: string) => {
    set((state) => {
      // Remove if exists
      const filtered = state.recentSearches.filter(s => s !== searchQuery)
      // Add to front, keep max 10
      const recent = [searchQuery, ...filtered].slice(0, 10)
      return { recentSearches: recent }
    })
  },

  // Remove recent search
  removeRecentSearch: (searchQuery: string) => {
    set((state) => ({
      recentSearches: state.recentSearches.filter(s => s !== searchQuery),
    }))
  },

  // Clear all recent searches
  clearRecentSearches: () => {
    set({ recentSearches: [] })
  },
}))