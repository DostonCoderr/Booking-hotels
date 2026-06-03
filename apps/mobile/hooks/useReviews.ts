import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewService } from '@/services/review.service'
import { CreateReviewData } from '@/services/review.service'
import { showMessage } from 'react-native-flash-message'

export const useReviews = (listingId: string) => {
  const queryClient = useQueryClient()

  // Get listing reviews
  const reviewsQuery = useQuery({
    queryKey: ['reviews', listingId],
    queryFn: () => reviewService.getListingReviews(listingId),
    enabled: !!listingId,
  })

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: (data: CreateReviewData) => reviewService.createReview(listingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', listingId] })
      queryClient.invalidateQueries({ queryKey: ['listing', listingId] })
      showMessage({ message: "Sharh qoldirildi!", type: 'success' })
    },
    onError: (error: any) => {
      showMessage({
        message: error.response?.data?.message || "Sharh qoldirishda xatolik",
        type: 'danger',
      })
    },
  })

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string) => reviewService.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', listingId] })
      queryClient.invalidateQueries({ queryKey: ['listing', listingId] })
      showMessage({ message: "Sharh o'chirildi", type: 'info' })
    },
  })

  // Calculate average rating
  const averageRating = reviewsQuery.data?.length
    ? reviewsQuery.data.reduce((sum, r) => sum + r.rating, 0) / reviewsQuery.data.length
    : 0

  return {
    // Queries
    reviews: reviewsQuery.data || [],
    isLoading: reviewsQuery.isLoading,
    averageRating,
    totalReviews: reviewsQuery.data?.length || 0,
    canReview: false, // This would be determined by checking if user has booked and completed stay
    
    // Mutations
    createReview: createReviewMutation.mutate,
    isCreating: createReviewMutation.isPending,
    deleteReview: deleteReviewMutation.mutate,
    isDeleting: deleteReviewMutation.isPending,
    
    // Refetch
    refetch: reviewsQuery.refetch,
  }
}