import { api } from './api'
import { Review } from '@/types'

export interface CreateReviewData {
  rating: number
  comment: string
}

export const reviewService = {
  createReview: async (listingId: string, data: CreateReviewData): Promise<Review> => {
    const response = await api.post(`/reviews/listing/${listingId}`, data)
    return response.data
  },

  getListingReviews: async (listingId: string): Promise<Review[]> => {
    console.log('🔍 Fetching reviews for listing:', listingId)
    const response = await api.get(`/reviews/listing/${listingId}`)
    console.log('✅ Reviews response:', response.data)
    return response.data
  },

  deleteReview: async (reviewId: string): Promise<void> => {
    await api.delete(`/reviews/${reviewId}`)
  },
}