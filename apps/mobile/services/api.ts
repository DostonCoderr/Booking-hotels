import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.197:3000/api'

console.log('🔧 API_URL:', API_URL)

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request — token qo'shish
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('🔑 Token added to request')
  }
  return config
}, (error) => {
  console.log('❌ Request error:', error)
  return Promise.reject(error)
})

// Response — 401 da refresh token orqali yangilash
let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status, response.config.url)
    return response
  },
  async (error) => {
    console.log('❌ Response error:', error.response?.status, error.config?.url)
    
    const originalRequest = error.config

    // 401 va retry qilinmagan bo'lsa
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken')
        console.log('🔄 Refreshing token...', refreshToken ? 'has refreshToken' : 'no refreshToken')
        
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
        
        await AsyncStorage.setItem('token', data.token)
        await AsyncStorage.setItem('refreshToken', data.refreshToken)

        processQueue(null, data.token)
        originalRequest.headers.Authorization = `Bearer ${data.token}`
        return api(originalRequest)
      } catch (refreshError) {
        console.log('❌ Refresh failed:', refreshError)
        processQueue(refreshError, null)
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'user'])
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Error message - showMessage ni olib tashladik, console.log bilan almashtirdik
    const message = error.response?.data?.message || error.message || 'Nimadir noto\'g\'ri ketdi'
    console.log('❌ API Error:', message)
    
    // showMessage vaqtincha o'chirib qo'ydik
    // showMessage({ message, type: 'danger' })
    
    return Promise.reject(error)
  }
)