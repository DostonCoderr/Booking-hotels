// app/(auth)/forgot-password.tsx

import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Linking
} from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { COLORS } from '@/constants/colors'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'telegram' | 'code' | 'reset'>('email')
  const [telegramCode, setTelegramCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const { clearAuth } = useAuthStore()

  // ✅ Sizning Telegram bot nomingiz
  const TELEGRAM_BOT_USERNAME = 'hotel_reminding_bot'

  useEffect(() => {
    const clearOldAuth = async () => {
      await clearAuth()
    }
    clearOldAuth()
  }, [])

  // Step 1: Email orqali tekshirish va kod yuborish
  const handleSendEmail = async () => {
    if (!email) {
      Alert.alert('Xatolik', 'Email manzilingizni kiriting')
      return
    }

    setLoading(true)
    try {
      // 1. Email mavjudligini tekshirish
      const checkResponse = await api.post('/auth/check-email', { email })
      
      if (checkResponse.data.exists) {
        // 2. Kod yuborish
        await api.post('/auth/send-reset-code', { email })
        
        setStep('telegram')
        Alert.alert(
          'Foydalanuvchi topildi',
          `"${email}" manzili tizimda mavjud. Parolni tiklash kodi Telegram orqali yuborildi.`,
          [{ text: 'OK' }]
        )
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.response?.data?.message || 'Email topilmadi')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Telegram botga o'tish
  const openTelegram = () => {
    const botUrl = `https://t.me/${TELEGRAM_BOT_USERNAME}`
    Linking.openURL(botUrl).catch(() => {
      Alert.alert(
        'Telegram o\'rnatilmagan',
        'Iltimos, Telegram ilovasini o\'rnating yoki brauzerda oching.',
        [
          { text: 'Bekor' },
          { text: 'Brauzerda ochish', onPress: () => Linking.openURL(`https://t.me/${TELEGRAM_BOT_USERNAME}`) }
        ]
      )
    })
  }

  // Step 3: Kodni tekshirish
  const handleVerifyCode = async () => {
    if (!telegramCode || telegramCode.length !== 6) {
      Alert.alert('Xatolik', 'Iltimos, 6 xonalik kodni kiriting')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/verify-reset-code', {
        email,
        code: telegramCode
      })
      
      if (response.data.valid) {
        setResetToken(response.data.token)
        setStep('reset')
        Alert.alert('Tasdiqlandi', 'Endi yangi parol o\'rnatishingiz mumkin')
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.response?.data?.message || 'Noto\'g\'ri kod yoki muddati o\'tgan')
    } finally {
      setLoading(false)
    }
  }

  // Step 4: Yangi parolni saqlash
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Xatolik', 'Iltimos, parolni kiriting')
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Xatolik', 'Parollar mos kelmadi')
      return
    }

    if (newPassword.length < 6) {
      Alert.alert('Xatolik', 'Parol kamida 6 belgidan iborat bo\'lishi kerak')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email,
        token: resetToken,
        newPassword
      })
      
      Alert.alert(
        'Muvaffaqiyatli!',
        'Parolingiz muvaffaqiyatli tiklandi. Endi yangi parol bilan kiring.',
        [{ text: 'Kirish', onPress: () => router.replace('/(auth)/login') }]
      )
    } catch (error: any) {
      Alert.alert('Xatolik', error.response?.data?.message || 'Parol tiklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  // Back to login
  const handleBackToLogin = async () => {
    await clearAuth()
    router.replace('/(auth)/login')
  }

  // Step 1: Email kiritish
  if (step === 'email') {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar style="dark" />
        <View style={styles.container}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBackToLogin}>
            <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
          </TouchableOpacity>

          <Text style={styles.title}>Parolni tiklash</Text>
          <Text style={styles.subtitle}>
            Email manzilingizni kiriting. Parolni tiklash kodi Telegram orqali yuboriladi.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor={COLORS.gray}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, loading && styles.disabled]}
            onPress={handleSendEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>Kod yuborish</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backToLogin} onPress={handleBackToLogin}>
            <Text style={styles.backToLoginText}>Kirish sahifasiga qaytish</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )
  }

  // Step 2: Telegram botga o'tish
  if (step === 'telegram') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep('email')}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>

        <LinearGradient
          colors={['#2AABEE', '#229ED9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.telegramCard}
        >
          <View style={styles.telegramIcon}>
            <Ionicons name="send-outline" size={48} color="#fff" />
          </View>
          <Text style={styles.telegramTitle}>Telegram bot orqali davom eting</Text>
          <Text style={styles.telegramText}>
            Quyidagi Telegram botga o'ting. Bot sizga 6 xonalik kod yuboradi.
          </Text>
          <Text style={styles.telegramBotName}>@{TELEGRAM_BOT_USERNAME}</Text>
          
          <TouchableOpacity style={styles.openTelegramBtn} onPress={openTelegram}>
            <Ionicons name="send-outline" size={22} color="#2AABEE" />
            <Text style={styles.openTelegramText}>Telegram botni ochish</Text>
            <Ionicons name="open-outline" size={18} color="#2AABEE" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.orContainer}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>yoki</Text>
          <View style={styles.orLine} />
        </View>

        <TouchableOpacity style={styles.checkLaterBtn} onPress={() => setStep('code')}>
          <Text style={styles.checkLaterText}>Kodni oldim, davom etish</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backToLogin} onPress={handleBackToLogin}>
          <Text style={styles.backToLoginText}>Kirish sahifasiga qaytish</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Step 3: Kodni tekshirish
  if (step === 'code') {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar style="dark" />
        <View style={styles.container}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep('telegram')}>
            <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
          </TouchableOpacity>

          <Text style={styles.title}>Kodni tasdiqlash</Text>
          <Text style={styles.subtitle}>
            Telegram botdan olingan 6 xonalik kodni kiriting.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tasdiqlash kodi</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="key-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={COLORS.gray}
                value={telegramCode}
                onChangeText={setTelegramCode}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, loading && styles.disabled]}
            onPress={handleVerifyCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>Tasdiqlash</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendBtn} onPress={() => setStep('telegram')}>
            <Text style={styles.resendText}>Kodni qayta yuborish</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backToLogin} onPress={handleBackToLogin}>
            <Text style={styles.backToLoginText}>Kirish sahifasiga qaytish</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )
  }

  // Step 4: Yangi parol o'rnatish
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep('code')}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>

        <Text style={styles.title}>Yangi parol o'rnatish</Text>
        <Text style={styles.subtitle}>
          Yangi parolingizni kiriting. Parol kamida 6 belgidan iborat bo'lishi kerak.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Yangi parol</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Yangi parol"
              placeholderTextColor={COLORS.gray}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Parolni tasdiqlang</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Parolni qayta kiriting"
              placeholderTextColor={COLORS.gray}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.sendBtn, loading && styles.disabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>Parolni tiklash</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backToLogin} onPress={handleBackToLogin}>
          <Text style={styles.backToLoginText}>Kirish sahifasiga qaytish</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background, 
    paddingHorizontal: 24, 
    paddingTop: 60 
  },
  backBtn: { 
    marginBottom: 24, 
    width: 40, 
    height: 40, 
    justifyContent: 'center' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: COLORS.dark, 
    marginBottom: 12 
  },
  subtitle: { 
    fontSize: 14, 
    color: COLORS.gray, 
    marginBottom: 32, 
    lineHeight: 20 
  },
  inputGroup: { 
    marginBottom: 24 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.dark, 
    marginBottom: 8 
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 54,
    backgroundColor: COLORS.surface,
  },
  inputIcon: { 
    marginRight: 10 
  },
  input: { 
    flex: 1, 
    fontSize: 15, 
    color: COLORS.dark 
  },
  eyeBtn: { 
    padding: 4 
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  sendBtnText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  disabled: { 
    opacity: 0.7 
  },
  backToLogin: { 
    alignItems: 'center' 
  },
  backToLoginText: { 
    color: COLORS.primary, 
    fontSize: 14, 
    fontWeight: '500' 
  },
  resendBtn: { 
    alignItems: 'center', 
    marginBottom: 16 
  },
  resendText: { 
    color: COLORS.gray, 
    fontSize: 14 
  },
  telegramCard: {
    backgroundColor: '#2AABEE',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  telegramIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  telegramTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  telegramText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  telegramBotName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  openTelegramBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  openTelegramText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2AABEE',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  orText: {
    marginHorizontal: 12,
    color: COLORS.gray,
    fontSize: 12,
  },
  checkLaterBtn: {
    alignItems: 'center',
    marginBottom: 16,
  },
  checkLaterText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
})