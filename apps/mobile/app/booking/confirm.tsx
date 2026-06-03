import { useEffect, useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, 
  Alert, Animated, Dimensions, ScrollView, Platform
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useStripe } from '@stripe/stripe-react-native'
import { useBooking } from '@/hooks/useBooking'
import { usePaymentStore } from '@/stores/paymentStore'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { COLORS } from '@/constants/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'

const { width, height } = Dimensions.get('window')

export default function BookingConfirmScreen() {
     const { clientSecret, paymentIntentId, totalPrice } = useLocalSearchParams<{
    clientSecret: string
    paymentIntentId: string
    totalPrice: string
  }>()

  const [paymentAmount, setPaymentAmount] = useState(parseFloat(totalPrice || '0'))

  

  
  
  const insets = useSafeAreaInsets()
  const { confirmBooking, isConfirming } = useBooking()
  const { paymentMethods, fetchPaymentMethods } = usePaymentStore()
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')

  const [bookingNumber, setBookingNumber] = useState('')
  
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current

  // PaymentIntent ma'lumotlarini olish
  const { data: paymentIntentData } = useQuery({
    queryKey: ['payment-intent', paymentIntentId],
    queryFn: async () => {
      const { data } = await api.get(`/payments/intent/${paymentIntentId}`)
      return data
    },
    enabled: !!paymentIntentId && paymentAmount === 0,
  })

    useEffect(() => {
    if (paymentIntentData?.amount && paymentAmount === 0) {
      setPaymentAmount(paymentIntentData.amount / 100)
    }
  }, [paymentIntentData])

  useEffect(() => {
    if (!clientSecret) {
      Alert.alert('Xatolik', "To'lov ma'lumotlari topilmadi")
      router.back()
      return
    }
    loadData()
    animateIn()
  }, [])

  const loadData = async () => {
    await fetchPaymentMethods()
    initializePaymentSheet()
  }

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start()
  }

  const initializePaymentSheet = async () => {
    if (!clientSecret) {
      Alert.alert('Xatolik', "To'lov ma'lumotlari topilmadi")
      router.back()
      return
    }

    const { error } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'Airbnb Clone',
      style: 'alwaysLight',
      returnURL: 'airbnbclone://payment-complete',
    })

    if (error) {
      Alert.alert('Xatolik', error.message)
      router.back()
    } else {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setPaymentStatus('processing')
    
    const { error } = await presentPaymentSheet()

    if (error) {
      setPaymentStatus('error')
      Alert.alert('To\'lov xatosi', error.message, [
        { text: "Qayta urinib ko'rish", onPress: () => setPaymentStatus('idle') },
        { text: "Bekor qilish", style: "cancel", onPress: () => router.back() }
      ])
    } else {
      setPaymentStatus('success')
      
      // To'lov muvaffaqiyatli - bron yaratish
      try {
        await api.post('/bookings/create-after-payment', {
          paymentIntentId: paymentIntentId
        })
      } catch (error) {
        console.error('Create booking error:', error)
      }
      
      setTimeout(() => {
        router.replace('/(tabs)/bookings')
      }, 2000)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>To'lov tayyorlanmoqda...</Text>
      </View>
    )
  }

  if (paymentStatus === 'success') {
    return (
      <View style={styles.center}>
        <Animated.View style={[styles.successContainer, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={['#4CAF50', '#45A049']} style={styles.successIcon}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </LinearGradient>
          <Text style={styles.successTitle}>To'lov muvaffaqiyatli!</Text>
          <Text style={styles.successText}>
            Sizning broningiz tasdiqlandi.{"\n"}
            Tez orada tasdiq xabari keladi.
          </Text>
        </Animated.View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.background, COLORS.surface]} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>To'lov</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { opacity: fadeAnim }]}
      >
        {/* Amount Card */}
              <LinearGradient colors={[COLORS.primary + '15', COLORS.primary + '05']} style={styles.amountCard}>
        <Text style={styles.amountLabel}>To'lov summasi</Text>
        <Text style={styles.amountValue}>${paymentAmount.toFixed(2)}</Text>
        <Text style={styles.amountDesc}>Bron qilish uchun to'lov</Text>
      </LinearGradient>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Bron haqida</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Bron raqami</Text>
              <Text style={styles.summaryValue}>#{bookingNumber}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>To'lov summasi</Text>
              <Text style={styles.summaryValue}>${paymentAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>To'lov valyutasi</Text>
              <Text style={styles.summaryValue}>USD</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>Jami to'lov</Text>
              <Text style={styles.summaryTotalValue}>${paymentAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Secure Note */}
        <View style={styles.secureNote}>
          <LinearGradient colors={[COLORS.success + '15', COLORS.success + '05']} style={styles.secureGradient}>
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.success} />
            <Text style={styles.secureText}>To'lovlaringiz xavfsiz himoyalangan</Text>
          </LinearGradient>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={[styles.payBtn, (paymentStatus === 'processing') && styles.disabled]}
          onPress={handlePayment}
          disabled={paymentStatus === 'processing'}
          activeOpacity={0.8}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.payBtnGradient}>
            {paymentStatus === 'processing' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payBtnText}>To'lov qilish</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.gray },
  successContainer: { alignItems: 'center', paddingHorizontal: 32 },
  successIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: '700', color: COLORS.dark, marginBottom: 12 },
  successText: { fontSize: 14, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.dark },
  content: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 20 },
  amountCard: { borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: COLORS.primary + '20' },
  amountLabel: { fontSize: 13, color: COLORS.gray, marginBottom: 8 },
  amountValue: { fontSize: 36, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  amountDesc: { fontSize: 12, color: COLORS.gray },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.dark, marginBottom: 12 },
  summarySection: { marginBottom: 24 },
  summaryCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryLabel: { fontSize: 13, color: COLORS.gray },
  summaryValue: { fontSize: 13, fontWeight: '500', color: COLORS.dark },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
  summaryTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 },
  summaryTotalLabel: { fontSize: 15, fontWeight: '600', color: COLORS.dark },
  summaryTotalValue: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  secureNote: { marginBottom: 20 },
  secureGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12 },
  secureText: { fontSize: 12, color: COLORS.success, fontWeight: '500' },
  payBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 20 },
  payBtnGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  payBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  disabled: { opacity: 0.7 },
})