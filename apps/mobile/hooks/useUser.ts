import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/user.service'
import { UpdateProfileData } from '@/services/user.service'
import { useAuthStore } from '@/stores/authStore'
import { showMessage } from 'react-native-flash-message'

export const useUser = (userId?: string) => {
  const queryClient = useQueryClient()
  const { user: currentUser, updateUser } = useAuthStore()
  
  const id = userId || currentUser?.id

  // Get user profile
  const profileQuery = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getProfile(id!),
    enabled: !!id,
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => userService.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Update auth store
      updateUser(updatedUser)
      // Invalidate profile query
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      showMessage({ message: "Profil yangilandi!", type: 'success' })
    },
    onError: (error: any) => {
      showMessage({
        message: error.response?.data?.message || "Profil yangilashda xatolik",
        type: 'danger',
      })
    },
  })

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: (imageUri: string) => userService.uploadAvatar(imageUri),
    onSuccess: (data) => {
      updateUser({ avatar: data.avatar })
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      showMessage({ message: "Rasm yangilandi!", type: 'success' })
    },
    onError: (error: any) => {
      showMessage({
        message: error.response?.data?.message || "Rasm yuklashda xatolik",
        type: 'danger',
      })
    },
  })

  return {
    // Data
    user: profileQuery.data,
    isLoading: profileQuery.isLoading,
    
    // Actions
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    uploadAvatar: uploadAvatarMutation.mutate,
    isUploading: uploadAvatarMutation.isPending,
    
    // Refetch
    refetch: profileQuery.refetch,
  }
}