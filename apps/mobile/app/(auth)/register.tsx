// app/(auth)/register.tsx

import { useEffect, useRef, useState } from 'react'
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
import { useSignUp } from '@clerk/clerk-expo'

const { width, height } = Dimensions.get('window')
const isSM = height <= 720
const rf = (n: number) => isSM ? n * 0.9 : n

export default function RegisterScreen() {
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focusedInput, setFocusedInput] = useState<'name' | 'email' | 'password' | null>(null)
  
  const { setAuth } = useAuthStore()
  const { signUp } = useSignUp()

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

  const handleRegister = async () => {
    if (!email || !password || !name) {
      showMessage({ message: "Barcha maydonlarni to'ldiring", type: 'warning', backgroundColor: '#F59E0B' })
      return
    }
    if (password.length < 6) {
      showMessage({ message: "Parol kamida 6 belgidan iborat bo'lishi kerak", type: 'warning', backgroundColor: '#F59E0B' })
      return
    }

    setLoading(true)
    try {
      const { createdSessionId, setActive } = await signUp!.create({
        emailAddress: email,
        password,
        firstName: name,
      })
      
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
        
        const response = await api.post('/auth/clerk-sync', {
          clerkId: createdSessionId,
          email: email,
          name: name,
        })
        
        await setAuth(response.data.user, response.data.token, response.data.refreshToken)
        
        showMessage({ message: "Muvaffaqiyatli ro'yxatdan o'tdingiz!", type: 'success', backgroundColor: '#10B981' })
        router.replace('/(tabs)')
      }
    } catch (error: any) {
      showMessage({ message: error.errors?.[0]?.message || "Ro'yxatdan o'tishda xatolik", type: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => router.back()
  const isFormValid = name.length > 0 && email.includes('@') && password.length >= 6

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#020408' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0D001A', '#050014', '#020408']} style={StyleSheet.absoluteFillObject} />
      <Animated.View style={[styles.glowOrb, { transform: [{ translateY: orbY }], backgroundColor: '#FF2E93' }]} />

      <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity style={styles.backBtnWrapper} onPress={goBack} activeOpacity={0.7}>
            <BlurView intensity={20} tint="dark" style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.headerSection, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Hisob yarating</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>StayVerse ga </Text>
            <Text style={[styles.subtitleAccent, { color: '#FF2E93' }]}>qo'shiling</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ismingiz</Text>
            <View style={[styles.inputWrap, focusedInput === 'name' && { borderColor: '#FF2E93' }]}>
              <Ionicons name="person-outline" size={18} color={focusedInput === 'name' ? '#FF2E93' : 'rgba(255,255,255,0.3)'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ismingiz"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrap, focusedInput === 'email' && { borderColor: '#FF2E93' }]}>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Parol</Text>
            <View style={[styles.inputWrap, focusedInput === 'password' && { borderColor: '#FF2E93' }]}>
              <Ionicons name="lock-closed-outline" size={18} color={focusedInput === 'password' ? '#FF2E93' : 'rgba(255,255,255,0.3)'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Kamida 6 belgi"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} hitSlop={10}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>
          </View>

        </Animated.View>

        <Animated.View style={[styles.actionZone, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[styles.registerBtn, (!isFormValid || loading) && styles.disabledBtn, isFormValid && !loading && { shadowColor: '#FF2E93' }]}
            onPress={handleRegister}
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
                <Ionicons name="person-add-outline" size={18} color="#fff" />
                <Text style={[styles.registerBtnText, !isFormValid && { color: 'rgba(255,255,255,0.25)' }]}>Ro'yxatdan o'tish</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>

          <View style={styles.registerRowContainer}>
            <Text style={styles.registerText}>Hisobingiz bormi? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.registerLink, { color: '#FF2E93' }]}>Kirish</Text>
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
  actionZone: { marginTop: rf(32), gap: 16 },
  registerBtn: { borderRadius: 14, overflow: 'hidden', height: 54, justifyContent: 'center', elevation: 4, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
  btnGrad: { width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  registerBtnText: { color: '#fff', fontSize: rf(15), fontWeight: '800', letterSpacing: 0.2 },
  disabledBtn: { shadowOpacity: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  registerRowContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: rf(16) },
  registerText: { color: 'rgba(255,255,255,0.4)', fontSize: rf(13), fontWeight: '500' },
  registerLink: { fontSize: rf(13), fontWeight: '800' },
})