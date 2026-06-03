import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listingService } from '@/services/listing.service'
import { SearchFilters } from '@/types'
import { showMessage } from 'react-native-flash-message'

export const useListings = (filters?: SearchFilters, pageSize: number = 10) => {
  const queryClient = useQueryClient()

  // Get all listings with pagination
  const listingsQuery = useInfiniteQuery({
    queryKey: ['listings', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await listingService.getListings({
        ...filters,
        page: pageParam,
        limit: pageSize,
      })
      return response
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
  })

  // Get single listing by ID
  const useListing = (id: string) => {
    return useQuery({
      queryKey: ['listing', id],
      queryFn: () => listingService.getListingById(id),
      enabled: !!id,
    })
  }

  // Search listings
  const searchQuery = useQuery({
    queryKey: ['search', filters?.city],
    queryFn: () => listingService.searchListings(filters?.city || ''),
    enabled: false,
  })

  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: (formData: FormData) => listingService.createListing(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      showMessage({ message: "Listing yaratildi!", type: 'success' })
    },
    onError: (error: any) => {
      showMessage({
        message: error.response?.data?.message || "Listing yaratishda xatolik",
        type: 'danger',
      })
    },
  })

  // Update listing mutation
  const updateListingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<any> }) =>
      listingService.updateListing(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['listing', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      showMessage({ message: "Listing yangilandi!", type: 'success' })
    },
  })

  // Delete listing mutation
  const deleteListingMutation = useMutation({
    mutationFn: (id: string) => listingService.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      showMessage({ message: "Listing o'chirildi", type: 'success' })
    },
  })

  return {
    // Queries
    listings: listingsQuery.data?.pages.flatMap(page => page.listings) || [],
    pagination: listingsQuery.data?.pages[listingsQuery.data.pages.length - 1]?.pagination,
    isLoading: listingsQuery.isLoading,
    isFetchingNextPage: listingsQuery.isFetchingNextPage,
    hasNextPage: listingsQuery.hasNextPage,
    fetchNextPage: listingsQuery.fetchNextPage,
    refetch: listingsQuery.refetch,
    
    // Single listing
    useListing,
    
    // Search
    search: searchQuery.refetch,
    searchResults: searchQuery.data,
    isSearching: searchQuery.isLoading,
    
    // Mutations
    createListing: createListingMutation.mutate,
    isCreating: createListingMutation.isPending,
    updateListing: updateListingMutation.mutate,
    isUpdating: updateListingMutation.isPending,
    deleteListing: deleteListingMutation.mutate,
    isDeleting: deleteListingMutation.isPending,
  }
}