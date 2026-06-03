// app/index.tsx

import { useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import WelcomeScreen from './(auth)/welcome'

export default function Index() {
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token')
        const userStr = await AsyncStorage.getItem('user')
        
        if (token && userStr) {
          const userData = JSON.parse(userStr)
          setIsLoggedIn(true)
          setUserRole(userData.role)
        }
      } catch (error) {
        console.error('Index check error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  if (isLoading) return null

  // Agar user login qilgan bo'lsa, role bo'yicha redirect
  if (isLoggedIn) {
    switch (userRole) {
      case 'ADMIN':
        return <Redirect href="/(admin)" />
      case 'HOST':
        return <Redirect href="/(host)" />
      default:
        return <Redirect href="/(tabs)" />
    }
  }

  // Login qilmagan bo'lsa, Welcome sahifasini ko'rsat
  return <WelcomeScreen />
}