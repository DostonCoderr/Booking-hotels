// app/(auth)/clerk-login.tsx

import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useOAuth } from '@clerk/clerk-expo'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/services/api'
import { COLORS } from '@/constants/colors'
import { showMessage } from 'react-native-flash-message'
import * as WebBrowser from 'expo-web-browser'
import { useState } from 'react'

WebBrowser.maybeCompleteAuthSession()

export default function ClerkLoginScreen() {
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  
  const { startOAuthFlow: googleFlow } = useOAuth({ strategy: 'oauth_google' })

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { createdSessionId, setActive } = await googleFlow()
      
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
        
        const response = await api.post('/auth/clerk-sync', {
          clerkId: createdSessionId,
          email: '',
          name: '',
          provider: 'google',
        })
        
        await setAuth(response.data.user, response.data.token, response.data.refreshToken)
        
        showMessage({ message: "Google orqali muvaffaqiyatli kirdingiz!", type: 'success' })
        router.replace('/(tabs)')
      }
    } catch (err: any) {
      Alert.alert('Xatolik', err.errors?.[0]?.message || 'OAuth xatosi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0D001A', '#020408']} style={StyleSheet.absoluteFillObject} />
      
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Ionicons name="person-circle" size={80} color="#fff" />
        <Text style={styles.title}>Ijtimoiy tarmoq orqali</Text>
        <Text style={styles.subtitle}>Hisobingizga kiring</Text>

        <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleSignIn} disabled={loading}>
          <BlurView intensity={30} tint="dark" style={styles.socialBtnInner}>
            {loading ? (
              <ActivityIndicator size="small" color="#DB4437" />
            ) : (
              <>
                <Ionicons name="logo-google" size={24} color="#DB4437" />
                <Text style={styles.socialBtnText}>Google bilan davom etish</Text>
              </>
            )}
          </BlurView>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.emailLink}>Email bilan kirish</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020408' },
  backBtn: { marginTop: 50, marginLeft: 20, width: 40, height: 40 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  socialBtn: { width: '100%', borderRadius: 12, overflow: 'hidden' },
  socialBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, justifyContent: 'center' },
  socialBtnText: { fontSize: 16, fontWeight: '500', color: '#fff' },
  emailLink: { color: '#A855F7', fontSize: 14, marginTop: 20 },
})