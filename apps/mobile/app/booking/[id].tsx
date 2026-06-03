import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Animated,
  Dimensions, Image, Platform
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import { useStripe } from '@stripe/stripe-react-native'
import { DatePicker } from '@/components/booking/DatePicker'
import { GuestPicker } from '@/components/booking/GuestPicker'
import { PriceBreakdown } from '@/components/booking/PriceBreakdown'
import { api } from '@/services/api'
import { COLORS } from '@/constants/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width, height } = Dimensions.get('window')

export default function BookingScreen() {
  const { id } = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  
  const [checkIn, setCheckIn] = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)
  const [guests, setGuests] = useState(1)
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [finalTotal, setFinalTotal] = useState(0)
  
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data } = await api.get(`/listings/${id}`)
      return data
    },
  })

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start()
  }, [])

  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const basePrice = listing ? listing.price * nights : 0
  const cleaningFee = basePrice * 0.1
  const serviceFee = basePrice * 0.05
  const totalPrice = basePrice + cleaningFee + serviceFee

  const handleTotalChange = (total: number) => {
    setFinalTotal(total)
  }

  const canProceed = () => {
    if (step === 1 && (!checkIn || !checkOut)) return false
    if (step === 2 && (!guests || guests < 1)) return false
    return true
  }

  const handleNext = () => {
    if (step === 1 && (!checkIn || !checkOut)) {
      Alert.alert('Xatolik', "Iltimos, sanalarni tanlang")
      return
    }
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      router.back()
    }
  }

  const handleBooking = async () => {
    if (!checkIn || !checkOut) {
      Alert.alert('Xatolik', "Iltimos, sanalarni tanlang")
      return
    }

    if (guests > listing?.maxGuests) {
      Alert.alert('Xatolik', `Maksimal ${listing?.maxGuests} mehmon qabul qilinadi`)
      return
    }

    setIsProcessing(true)
    
    try {
      // 1. PaymentIntent yaratish
          const { data } = await api.post('/bookings/create-payment-intent', {
      listingId: id as string,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      guests,
    })
      
      console.log('PaymentIntent created:', data)
      
      // 2. Confirm sahifasiga o'tish
      router.push({
      pathname: '/booking/confirm',
      params: { 
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
        totalPrice: data.totalPrice.toString()
      }
    })
      
    } catch (error: any) {
      console.error('Booking error:', error)
      if (error.response?.status === 409) {
        Alert.alert("Sanalar band", "Bu sanalar allaqachon band")
      } else {
        Alert.alert("Xatolik", error.response?.data?.message || "Bron qilishda xatolik")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  if (!listing) return null

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS.surface]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <View style={styles.stepsContainer}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
          <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]} />
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.listingCard}>
          <Image source={{ uri: listing.images?.[0] }} style={styles.listingImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.listingOverlay}
          >
            <Text style={styles.listingTitle}>{listing.title}</Text>
            <View style={styles.listingLocation}>
              <Ionicons name="location-outline" size={14} color="#fff" />
              <Text style={styles.listingLocationText}>{listing.city}, {listing.country}</Text>
            </View>
          </LinearGradient>
        </View>

        {step === 1 && (
          <Animated.View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Sanalarni tanlang</Text>
            </View>
            <DatePicker
              listingId={id as string}
              checkIn={checkIn}
              checkOut={checkOut}
              onCheckInChange={setCheckIn}
              onCheckOutChange={setCheckOut}
            />
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Mehmonlar soni</Text>
            </View>
            <GuestPicker
              guests={guests}
              maxGuests={listing.maxGuests}
              onGuestsChange={setGuests}
            />
          </Animated.View>
        )}

        {step === 3 && checkIn && checkOut && (
          <Animated.View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>Bron ma'lumotlari</Text>
            </View>
            <PriceBreakdown
              pricePerNight={listing.price}
              nights={nights}
              total={basePrice}
              onTotalChange={handleTotalChange}
            />
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Bron haqida</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sanalar</Text>
                <Text style={styles.summaryValue}>
                  {checkIn?.toLocaleDateString()} - {checkOut?.toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Kechalar</Text>
                <Text style={styles.summaryValue}>{nights} kecha</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Mehmonlar</Text>
                <Text style={styles.summaryValue}>{guests} mehmon</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Jami summa</Text>
                <Text style={styles.summaryValue}>${finalTotal > 0 ? finalTotal.toFixed(2) : totalPrice.toFixed(2)}</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </Animated.ScrollView>

      <LinearGradient
        colors={[COLORS.background + 'E0', COLORS.background]}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}
      >
        {step < 3 ? (
          <TouchableOpacity
            style={[styles.nextBtn, !canProceed() && styles.disabled]}
            onPress={handleNext}
            disabled={!canProceed()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.nextBtnGradient}
            >
              <Text style={styles.nextBtnText}>
                {step === 1 ? "Davom etish" : "Keyingi"}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.bookBtn, (!checkIn || !checkOut) && styles.disabled]}
            onPress={handleBooking}
            disabled={!checkIn || !checkOut || isProcessing}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.bookBtnGradient}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.bookBtnText}>Bron qilish</Text>
                  <Text style={styles.bookBtnPrice}>
                    ${finalTotal > 0 ? finalTotal.toFixed(2) : totalPrice.toFixed(2)}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  stepsContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.border },
  stepDotActive: { backgroundColor: COLORS.primary, width: 12, height: 12, borderRadius: 6 },
  stepLine: { width: 30, height: 2, backgroundColor: COLORS.border },
  stepLineActive: { backgroundColor: COLORS.primary },
  content: { paddingHorizontal: 20, paddingBottom: 100 },
  listingCard: { height: 160, borderRadius: 20, overflow: 'hidden', marginBottom: 24 },
  listingImage: { width: '100%', height: '100%' },
  listingOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  listingTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  listingLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listingLocationText: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  stepContainer: { marginBottom: 24 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  stepNumberText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  stepTitle: { fontSize: 18, fontWeight: '600', color: COLORS.dark },
  summaryCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginTop: 20, borderWidth: 1, borderColor: COLORS.border },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: COLORS.dark, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  summaryLabel: { fontSize: 13, color: COLORS.gray },
  summaryValue: { fontSize: 13, fontWeight: '500', color: COLORS.dark },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  nextBtn: { borderRadius: 14, overflow: 'hidden' },
  nextBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  bookBtn: { borderRadius: 14, overflow: 'hidden' },
  bookBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  bookBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  bookBtnPrice: { fontSize: 18, fontWeight: '700', color: '#fff' },
  disabled: { opacity: 0.6 },
})