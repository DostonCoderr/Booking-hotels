// services/auth.service.ts

import { api } from './api'
import { User } from '@/types'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data
  },

  becomeHost: async (): Promise<{ message: string }> => {
    const response = await api.post('/auth/become-host')
    return response.data
  },
}