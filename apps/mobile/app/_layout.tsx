// app/_layout.tsx

import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import FlashMessage from 'react-native-flash-message'
import { COLORS } from '@/constants/colors'

// Clerk token storage
const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return await SecureStore.setItemAsync(key, value)
    } catch {
      return
    }
  },
}

// ✅ Clerk publishable key
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_Y2VydGFpbi1jcmFiLTQ5LmNsZXJrLmFjY291bnRzLmRldiQ'

const queryClient = new QueryClient()

export default function RootLayout() {
  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY} 
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <QueryClientProvider client={queryClient}>
              <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top']}>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="(host)" />
                  <Stack.Screen name="(admin)" />
                  <Stack.Screen name="listing" />
                  <Stack.Screen name="booking" />
                  <Stack.Screen name="messages" />
                </Stack>
                <FlashMessage position="top" />
              </SafeAreaView>
            </QueryClientProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  )
}