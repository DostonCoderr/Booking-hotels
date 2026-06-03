// app/(auth)/login.tsx — Clerk Social + Email/Password integrated 🚀

import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Dimensions, Animated, Easing
} from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/services/api'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { showMessage } from 'react-native-flash-message'
import { useSignIn, useOAuth } from '@clerk/clerk-expo'
import * as WebBrowser from 'expo-web-browser'

WebBrowser.maybeCompleteAuthSession()

const { width, height } = Dimensions.get('window')
const isSM = height <= 720
const rf = (n: number) => isSM ? n * 0.9 : n

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null)
  
  const { setAuth } = useAuthStore()
  const { signIn } = useSignIn()
  
  // Clerk OAuth
  const { startOAuthFlow: googleFlow } = useOAuth({ strategy: 'oauth_google' })
  const { startOAuthFlow: appleFlow } = useOAuth({ strategy: 'oauth_apple' })
  const { startOAuthFlow: facebookFlow } = useOAuth({ strategy: 'oauth_facebook' })

  // Cosmic Background Animators
  const fadeAnim = useRef(new Animated.Value(0)).current
  const orbY = useRef(new Animated.Value(-10)).current

  useEffect(() => {
    fadeAnim.setValue(0)
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(orbY, { toValue: 15, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(orbY, { toValue: -10, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
        ])
      )
    ]).start()
  }, [])

  // Clerk Email/Password Login
  const handleClerkLogin = async () => {
    if (!email || !password) {
      showMessage({
        message: "Email va parolni kiriting",
        type: 'warning',
        backgroundColor: '#F59E0B'
      })
      return
    }

    setLoading(true)
    
    try {
      const { createdSessionId, setActive } = await signIn!.create({
        identifier: email,
        password,
      })
      
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
        
        const response = await api.post('/auth/clerk-sync', {
          clerkId: createdSessionId,
          email: email,
          name: email.split('@')[0],
        })
        
        await setAuth(response.data.user, response.data.token, response.data.refreshToken)
        
        showMessage({ message: `Xush kelibsiz!`, type: 'success', backgroundColor: '#10B981' })
        router.replace('/(tabs)')
      }
    } catch (error: any) {
      showMessage({
        message: error.errors?.[0]?.message || "Email yoki parol noto'g'ri",
        type: 'danger',
      })
    } finally {
      setLoading(false)
    }
  }

  // Clerk OAuth Login
  const handleOAuthLogin = async (provider: string, startFlow: any) => {
    setLoading(true)
    try {
      const { createdSessionId, setActive } = await startFlow()
      
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
        
        const response = await api.post('/auth/clerk-sync', {
          clerkId: createdSessionId,
          email: '',
          name: '',
          provider,
        })
        
        await setAuth(response.data.user, response.data.token, response.data.refreshToken)
        
        showMessage({ message: `${provider} orqali muvaffaqiyatli kirdingiz!`, type: 'success', backgroundColor: '#10B981' })
        router.replace('/(tabs)')
      }
    } catch (err: any) {
      showMessage({ message: err.errors?.[0]?.message || 'OAuth xatosi', type: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  const goToWelcome = () => router.replace('/')
  const isFormValid = email.includes('@') && password.length >= 6

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#020408' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0D001A', '#050014', '#020408']} style={StyleSheet.absoluteFillObject} />
      <Animated.View style={[styles.glowOrb, { transform: [{ translateY: orbY }], backgroundColor: '#FF2E93' }]} />

      <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Back Button */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity style={styles.backBtnWrapper} onPress={goToWelcome} activeOpacity={0.7}>
            <BlurView intensity={20} tint="dark" style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        {/* Header */}
        <Animated.View style={[styles.headerSection, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Xush kelibsiz</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>Hisobingizga </Text>
            <Text style={[styles.subtitleAccent, { color: '#FF2E93' }]}>kiring</Text>
          </View>
        </Animated.View>

        {/* Email/Password Form */}
        <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
          
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[
              styles.inputWrap,
              focusedInput === 'email' && { borderColor: '#FF2E93', shadowColor: '#FF2E93', shadowOpacity: 0.15 }
            ]}>
              <Ionicons name="mail-outline" size={18} color={focusedInput === 'email' ? '#FF2E93' : 'rgba(255,255,255,0.3)'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Parol</Text>
            <View style={[
              styles.inputWrap,
              focusedInput === 'password' && { borderColor: '#FF2E93', shadowColor: '#FF2E93', shadowOpacity: 0.15 }
            ]}>
              <Ionicons name="lock-closed-outline" size={18} color={focusedInput === 'password' ? '#FF2E93' : 'rgba(255,255,255,0.3)'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Parolingiz"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} hitSlop={10}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Parolni unutdingizmi?</Text>
          </TouchableOpacity>

        </Animated.View>

        {/* Login Button */}
        <Animated.View style={[styles.actionZone, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[styles.loginBtn, (!isFormValid || loading) && styles.disabledBtn, isFormValid && !loading && { shadowColor: '#FF2E93' }]}
            onPress={handleClerkLogin}
            disabled={loading || !isFormValid}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <LinearGradient
                colors={isFormValid ? ['#FF2E93', '#F43F5E'] : ['#1E1B4B', '#1E1B4B']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.btnGrad}
              >
                <Ionicons name="log-in-outline" size={18} color="#fff" />
                <Text style={[styles.loginBtnText, !isFormValid && { color: 'rgba(255,255,255,0.25)' }]}>Kirish</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>yoki</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Clerk Social Login Icons */}
          <View style={styles.socialRow}>
            <TouchableOpacity 
              style={styles.socialIcon} 
              onPress={() => handleOAuthLogin('Google', googleFlow)}
              disabled={loading}
            >
              <BlurView intensity={30} tint="dark" style={styles.socialIconBlur}>
                <Ionicons name="logo-google" size={22} color="#DB4437" />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialIcon} 
              onPress={() => handleOAuthLogin('Apple', appleFlow)}
              disabled={loading}
            >
              <BlurView intensity={30} tint="dark" style={styles.socialIconBlur}>
                <Ionicons name="logo-apple" size={22} color="#fff" />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialIcon} 
              onPress={() => handleOAuthLogin('Facebook', facebookFlow)}
              disabled={loading}
            >
              <BlurView intensity={30} tint="dark" style={styles.socialIconBlur}>
                <Ionicons name="logo-facebook" size={22} color="#1877F2" />
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View style={styles.registerRowContainer}>
            <Text style={styles.registerText}>Hisobingiz yo'qmi? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={[styles.registerLink, { color: '#FF2E93' }]}>Ro'yxatdan o'ting</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, justifyContent: 'center', flexGrow: 1 },
  glowOrb: { position: 'absolute', width: width * 0.9, height: width * 0.9, borderRadius: width * 0.45, top: height * 0.08, right: -width * 0.3, opacity: 0.08 },
  backBtnWrapper: { borderRadius: 12, overflow: 'hidden', alignSelf: 'flex-start', marginBottom: rf(28) },
  backBtn: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  headerSection: { marginBottom: rf(32) },
  title: { fontSize: rf(32), fontWeight: '900', color: '#fff', letterSpacing: -1, marginBottom: 6 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  subtitle: { fontSize: rf(14), color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  subtitleAccent: { fontSize: rf(14), fontWeight: '700', letterSpacing: -0.2 },
  formContainer: { gap: 18 },
  inputGroup: { gap: 8 },
  label: { fontSize: rf(12), fontWeight: '600', color: 'rgba(255,255,255,0.5)', paddingLeft: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 16, height: 54, backgroundColor: 'rgba(255,255,255,0.03)' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#fff', fontWeight: '500' },
  eyeBtn: { padding: 6 },
  forgotBtn: { alignSelf: 'flex-end', paddingVertical: 4 },
  forgotText: { color: '#FF2E93', fontSize: rf(13), fontWeight: '600', letterSpacing: -0.1 },
  actionZone: { marginTop: rf(32), gap: 16 },
  loginBtn: { borderRadius: 14, overflow: 'hidden', height: 54, justifyContent: 'center', elevation: 4, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
  btnGrad: { width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  loginBtnText: { color: '#fff', fontSize: rf(15), fontWeight: '800', letterSpacing: 0.2 },
  disabledBtn: { shadowOpacity: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText: { color: 'rgba(255,255,255,0.3)', fontSize: rf(12) },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginVertical: 8 },
  socialIcon: { borderRadius: 24, overflow: 'hidden' },
  socialIconBlur: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  registerRowContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: rf(16) },
  registerText: { color: 'rgba(255,255,255,0.4)', fontSize: rf(13), fontWeight: '500' },
  registerLink: { fontSize: rf(13), fontWeight: '800' },
})