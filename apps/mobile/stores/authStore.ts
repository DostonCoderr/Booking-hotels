// stores/authStore.ts

import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { User } from '@/types'
import { authService } from '@/services/auth.service'
import { socketService } from '@/services/socket.service'

interface AuthStore {
  user: User | null
  token: string | null
  refreshToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  setAuth: (user: User, token: string, refreshToken: string) => Promise<void>
  logout: () => Promise<void>
  loadAuth: () => Promise<void>
  updateUser: (data: Partial<User>) => void
  becomeHost: () => Promise<void>
  clearAuth: () => Promise<void>  // YANGI - auth ma'lumotlarini tozalash
  isHost: () => boolean
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: async (user, token, refreshToken) => {
    console.log('🔐 setAuth called', { user: user.email, role: user.role })
    
    await AsyncStorage.setItem('token', token)
    await AsyncStorage.setItem('refreshToken', refreshToken)
    await AsyncStorage.setItem('user', JSON.stringify(user))
    
    set({ user, token, refreshToken, isAuthenticated: true })
    
    // Socket ni ulash (ixtiyoriy)
    try {
      await socketService.connect()
    } catch (error) {
      console.log('Socket connection skipped:', error)
    }
  },

  logout: async () => {
    console.log('🚪 logout called')
    try {
      await authService.logout()
    } catch (error) {
      console.log('Logout API error:', error)
    }
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user'])
    socketService.disconnect()
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  },

  // YANGI - auth ma'lumotlarini tozalash (auto-login oldini olish uchun)
  clearAuth: async () => {
    console.log('🧹 Clearing auth data...')
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user'])
    socketService.disconnect()
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  },

  loadAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      const refreshToken = await AsyncStorage.getItem('refreshToken')
      const userStr = await AsyncStorage.getItem('user')
      
      console.log('📦 Loading auth:', { 
        hasToken: !!token, 
        hasRefreshToken: !!refreshToken, 
        hasUser: !!userStr 
      })
      
      if (token && refreshToken && userStr) {
        const user = JSON.parse(userStr)
        set({ token, refreshToken, user, isAuthenticated: true })
        try {
          await socketService.connect()
        } catch (error) {
          console.log('Socket connection skipped:', error)
        }
      } else {
        console.log('❌ No valid auth data found')
        set({ isAuthenticated: false, user: null })
      }
    } catch (error) {
      console.error('Load auth error:', error)
      set({ isAuthenticated: false, user: null })
    } finally {
      set({ isLoading: false })
    }
  },

  updateUser: (data) => {
    const current = get().user
    if (current) {
      const updated = { ...current, ...data }
      set({ user: updated })
      AsyncStorage.setItem('user', JSON.stringify(updated))
    }
  },

  becomeHost: async () => {
    await authService.becomeHost()
    const user = await authService.getProfile()
    get().updateUser(user)
  },

  isHost: () => {
    const { user } = get()
    return user?.role === 'HOST' || user?.role === 'ADMIN'
  },

  isAdmin: () => {
    const { user } = get()
    return user?.role === 'ADMIN'
  },
}))