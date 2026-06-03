import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingService } from '@/services/booking.service'
import { CreateBookingData } from '@/services/booking.service'
import { showMessage } from 'react-native-flash-message'
import { router } from 'expo-router'

export const useBooking = () => {
  const queryClient = useQueryClient()

  // Get my bookings
  const myBookingsQuery = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingService.getMyBookings(),
  })

  // Get host bookings
  const hostBookingsQuery = useQuery({
    queryKey: ['host-bookings'],
    queryFn: () => bookingService.getHostBookings(),
  })

  // Create booking mutation - return type aniqlangan
  const createBookingMutation = useMutation({
    mutationFn: async (data: CreateBookingData): Promise<{ bookingId: string; clientSecret: string }> => {
      const response = await bookingService.createBooking(data)
      return { 
        bookingId: response.booking.id, 
        clientSecret: response.clientSecret 
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
    },
    onError: (error: any) => {
      showMessage({
        message: error.response?.data?.message || "Bron qilishda xatolik",
        type: 'danger',
      })
      throw error
    },
  })

  // Confirm booking mutation
  const confirmBookingMutation = useMutation({
    mutationFn: ({ bookingId, paymentIntentId }: { bookingId: string; paymentIntentId: string }) =>
      bookingService.confirmBooking(bookingId, paymentIntentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      showMessage({ message: "Bron tasdiqlandi!", type: 'success' })
      router.push('/(tabs)/bookings')
    },
    onError: (error: any) => {
      showMessage({
        message: error.response?.data?.message || "To'lovda xatolik",
        type: 'danger',
      })
    },
  })

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: (bookingId: string) => bookingService.cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      showMessage({ message: "Bron bekor qilindi", type: 'info' })
    },
    onError: (error: any) => {
      showMessage({
        message: error.response?.data?.message || "Bekor qilishda xatolik",
        type: 'danger',
      })
    },
  })

  // Async function for creating booking
  const createBooking = async (data: CreateBookingData): Promise<{ bookingId: string; clientSecret: string }> => {
    return await createBookingMutation.mutateAsync(data)
  }

  return {
    // Queries
    myBookings: myBookingsQuery.data || [],
    isLoadingMyBookings: myBookingsQuery.isLoading,
    hostBookings: hostBookingsQuery.data || [],
    isLoadingHostBookings: hostBookingsQuery.isLoading,
    refetchMyBookings: myBookingsQuery.refetch,
    refetchHostBookings: hostBookingsQuery.refetch,
    
    // Mutations
    createBooking, // async function that returns Promise
    isCreating: createBookingMutation.isPending,
    confirmBooking: confirmBookingMutation.mutate,
    isConfirming: confirmBookingMutation.isPending,
    cancelBooking: cancelBookingMutation.mutate,
    isCancelling: cancelBookingMutation.isPending,
  }
}