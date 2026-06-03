import { create } from 'zustand'
import { Review } from '@/types'
import { reviewService, CreateReviewData } from '@/services/review.service'

interface ReviewStore {
  reviews: Review[]
  isLoading: boolean
  error: string | null
  fetchReviews: (listingId: string) => Promise<void>
  addReview: (listingId: string, data: CreateReviewData) => Promise<Review>
  deleteReview: (reviewId: string) => Promise<void>
  clearReviews: () => void
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  reviews: [],
  isLoading: false,
  error: null,

  fetchReviews: async (listingId: string) => {
    if (!listingId) {
      console.log('❌ No listingId provided')
      return
    }
    
    console.log('📡 Fetching reviews for listing:', listingId)
    set({ isLoading: true, error: null })
    
    try {
      const reviews = await reviewService.getListingReviews(listingId)
      console.log('✅ Reviews fetched:', reviews.length)
      set({ reviews, isLoading: false })
    } catch (error: any) {
      console.error('❌ Fetch reviews error:', error.response?.data || error.message)
      set({ error: error.response?.data?.message || 'Failed to fetch reviews', isLoading: false })
    }
  },

  addReview: async (listingId: string, data: CreateReviewData) => {
    const review = await reviewService.createReview(listingId, data)
    set((state) => ({
      reviews: [review, ...state.reviews]
    }))
    return review
  },

  deleteReview: async (reviewId: string) => {
    await reviewService.deleteReview(reviewId)
    set((state) => ({
      reviews: state.reviews.filter(r => r.id !== reviewId)
    }))
  },

  clearReviews: () => {
    set({ reviews: [], error: null })
  },
}))