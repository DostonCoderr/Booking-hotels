import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/auth.service'
import { useMutation } from '@tanstack/react-query'
import { showMessage } from 'react-native-flash-message'
import { router } from 'expo-router'

export const useAuth = () => {
  const { user, token, isLoading, isAuthenticated, setAuth, logout, updateUser } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return await authService.login({ email, password })
    },
    onSuccess: async (data) => {
      await setAuth(data.user, data.token)
      showMessage({ message: "Xush kelibsiz!", type: 'success' })
      router.replace('/(tabs)')
    },
    onError: (error: any) => {
      showMessage({
        message: error.response?.data?.message || "Login xatosi",
        type: 'danger',
      })
    },
  })

  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      return await authService.register({ name, email, password })
    },
    onSuccess: async (data) => {
      await setAuth(data.user, data.token)
      showMessage({ message: "Ro'yxatdan o'tish muvaffaqiyatli!", type: 'success' })
      router.replace('/(tabs)')
    },
    onError: (error: any) => {
      showMessage({
        message: error.response?.data?.message || "Ro'yxatdan o'tish xatosi",
        type: 'danger',
      })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await logout()
    },
    onSuccess: () => {
      router.replace('/(auth)/welcome')
    },
  })

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    updateUser,
  }
}