import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, 
  FlatList, Alert, ActivityIndicator, Dimensions, 
  Animated, StatusBar, Platform, RefreshControl,
  Modal, TextInput, ScrollView, Image, Linking
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useStripe } from '@stripe/stripe-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePaymentStore } from '@/stores/paymentStore'
import { paymentService } from '@/services/payment.service'
import { COLORS } from '@/constants/colors'
import * as Haptics from 'expo-haptics'

const { width, height } = Dimensions.get('window')
const CARD_WIDTH = width - 40
const CARD_HEIGHT = CARD_WIDTH * 0.58

// Card brand configurations
const CARD_BRANDS = {
  visa: {
    name: 'VISA',
    gradient: ['#1A1F71', '#2A35B5', '#3A45D9'],
    color: '#1A1F71',
    lightColor: '#2A35B5',
    icon: 'logo-google',
    pattern: 'visa'
  },
  mastercard: {
    name: 'Mastercard',
    gradient: ['#1A1A2E', '#16213E', '#0F3460'],
    color: '#1A1A2E',
    lightColor: '#16213E',
    icon: 'card',
    pattern: 'mastercard'
  },
  amex: {
    name: 'American Express',
    gradient: ['#007B5E', '#00B274', '#00D4A0'],
    color: '#007B5E',
    lightColor: '#00B274',
    icon: 'card',
    pattern: 'amex'
  },
  discover: {
    name: 'Discover',
    gradient: ['#E87C00', '#F49B15', '#FFB347'],
    color: '#E87C00',
    lightColor: '#F49B15',
    icon: 'card',
    pattern: 'discover'
  },
  default: {
    name: 'Karta',
    gradient: ['#2D2D2D', '#4A4A4A', '#6B6B6B'],
    color: '#2D2D2D',
    lightColor: '#4A4A4A',
    icon: 'card-outline',
    pattern: 'default'
  }
}

// Helper functions
const getCardBrand = (brand: string) => {
  const key = brand?.toLowerCase() || 'default'
  return CARD_BRANDS[key as keyof typeof CARD_BRANDS] || CARD_BRANDS.default
}

const formatExpiry = (month: number, year: number) => {
  return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`
}

const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light') => {
  if (Platform.OS !== 'web') {
    try {
      switch (style) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          break
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          break
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          break
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          break
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          break
      }
    } catch (error) {}
  }
}

// Card Component
const PaymentCard = ({ card, isSelected, onPress, onSetDefault, onDelete, index }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const shineAnim = useRef(new Animated.Value(0)).current
  const brand = getCardBrand(card.brand)
  const expiry = formatExpiry(card.expiryMonth, card.expiryYear)

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.02 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start()
  }, [isSelected])

  useEffect(() => {
    if (card.isDefault) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(shineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      ).start()
    }
  }, [card.isDefault])

  const shine = shineAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-100%', '0%', '100%'],
  })

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.95}>
        <LinearGradient
          colors={brand.gradient}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Animated shine effect for default card */}
          {card.isDefault && (
            <Animated.View style={[styles.cardShine, { transform: [{ translateX: shine }] }]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                style={styles.cardShineGradient}
              />
            </Animated.View>
          )}

          {/* Decorative elements */}
          <View style={styles.cardDeco1} />
          <View style={styles.cardDeco2} />
          <View style={styles.cardDeco3} />
          <View style={styles.cardDeco4} />
          
          {/* Card pattern circles */}
          {brand.pattern === 'visa' && (
            <>
              <View style={[styles.patternCircle, { top: -30, right: -30, width: 120, height: 120 }]} />
              <View style={[styles.patternCircle, { bottom: -20, left: -20, width: 80, height: 80 }]} />
            </>
          )}
          
          {brand.pattern === 'mastercard' && (
            <>
              <View style={[styles.patternCircle, { top: -40, right: -40, width: 150, height: 150, opacity: 0.1 }]} />
              <View style={[styles.patternCircle, { bottom: -30, left: -30, width: 100, height: 100, opacity: 0.08 }]} />
            </>
          )}

          {/* Card Top Section */}
          <View style={styles.cardTop}>
            <View style={styles.cardChip}>
              <View style={styles.chipRow}>
                <View style={styles.chipCell} />
                <View style={styles.chipCell} />
              </View>
              <View style={styles.chipRow}>
                <View style={styles.chipCell} />
                <View style={styles.chipCell} />
              </View>
            </View>
            <View style={styles.cardBadges}>
              {card.isDefault && (
                <View style={styles.defaultBadgeCard}>
                  <Ionicons name="checkmark-circle" size={12} color="#fff" />
                  <Text style={styles.defaultBadgeCardText}>Asosiy</Text>
                </View>
              )}
              <View style={styles.contactlessBadge}>
                <Ionicons name="wifi-outline" size={14} color="#fff" />
              </View>
            </View>
          </View>

          {/* Card Number */}
          <View style={styles.cardNumberContainer}>
            <Text style={styles.cardNumberLabel}>Karta raqami</Text>
            <Text style={styles.cardNumber}>••••  ••••  ••••  {card.last4}</Text>
          </View>

          {/* Card Details Row */}
          <View style={styles.cardDetailsRow}>
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailLabel}>Karta egasi</Text>
              <Text style={styles.cardDetailValue}>FOYDALANUVCHI</Text>
            </View>
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailLabel}>Muddati</Text>
              <Text style={styles.cardDetailValue}>{expiry}</Text>
            </View>
          </View>

          {/* Card Bottom */}
          <View style={styles.cardBottom}>
            <Text style={styles.cardBrandName}>{brand.name}</Text>
            <View style={styles.cardNetworkIcon}>
              <View style={styles.networkCircle1} />
              <View style={styles.networkCircle2} />
            </View>
          </View>
        </LinearGradient>

        {/* Card Action Buttons */}
        <View style={styles.cardActions}>
          <View style={styles.cardActionsLeft}>
            {card.isDefault ? (
              <View style={styles.defaultPill}>
                <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.primary} />
                <Text style={styles.defaultPillText}>Asosiy karta</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.setDefaultPill} onPress={() => onSetDefault(card.id)}>
                <Ionicons name="radio-button-on-outline" size={14} color={COLORS.gray} />
                <Text style={styles.setDefaultPillText}>Asosiy qilish</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.cardActionsRight}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(card)}>
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

// Add Card Modal Component
const AddCardModal = ({ visible, onClose, onAddCard, isLoading }: any) => {
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')

  const handleExpiryChange = (text: string) => {
    let value = text.replace(/\D/g, '')
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4)
    }
    setExpiryDate(value.slice(0, 5))
  }

  const handleCardNumberChange = (text: string) => {
    let value = text.replace(/\D/g, '')
    if (value.length > 16) value = value.slice(0, 16)
    let formatted = ''
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' '
      formatted += value[i]
    }
    setCardNumber(formatted)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <Animated.View style={styles.modalContainer}>
          <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.modalGradient}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yangi karta qo'shish</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalPreview}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  style={styles.previewCard}
                >
                  <Text style={styles.previewNumber}>{cardNumber || '••••  ••••  ••••  ••••'}</Text>
                  <View style={styles.previewDetails}>
                    <View>
                      <Text style={styles.previewLabel}>Karta egasi</Text>
                      <Text style={styles.previewValue}>{cardholderName || 'FOYDALANUVCHI'}</Text>
                    </View>
                    <View>
                      <Text style={styles.previewLabel}>Muddati</Text>
                      <Text style={styles.previewValue}>{expiryDate || 'MM/YY'}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Karta raqami</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="numeric"
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    maxLength={19}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Muddati (MM/YY)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="MM/YY"
                      placeholderTextColor={COLORS.gray}
                      keyboardType="numeric"
                      value={expiryDate}
                      onChangeText={handleExpiryChange}
                      maxLength={5}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>CVC/CVV</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="123"
                      placeholderTextColor={COLORS.gray}
                      keyboardType="numeric"
                      value={cvv}
                      onChangeText={setCvv}
                      maxLength={4}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Karta egasi ismi</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ISMINIZ FAMILIYANGIZ"
                    placeholderTextColor={COLORS.gray}
                    value={cardholderName}
                    onChangeText={setCardholderName}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.modalAddBtn} onPress={onAddCard} disabled={isLoading}>
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.modalAddGradient}>
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.modalAddText}>Karta qo'shish</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.modalSecurity}>
                <Ionicons name="lock-closed-outline" size={16} color={COLORS.success} />
                <Text style={styles.modalSecurityText}>
                  Ma'lumotlaringiz xavfsiz shifrlangan holda saqlanadi
                </Text>
              </View>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </Modal>
  )
}

// Main Component
export default function PaymentsScreen() {
  const insets = useSafeAreaInsets()
  const { paymentMethods, isLoading, fetchPaymentMethods, removePaymentMethod, setDefault, addPaymentMethod } = usePaymentStore()
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  
  const [addingCard, setAddingCard] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  
  const fadeAnim = useRef(new Animated.Value(0)).current
  const headerAnim = useRef(new Animated.Value(0)).current
  const listAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    loadData()
    animateIn()
  }, [])

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(headerAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.spring(listAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start()
  }

  const loadData = async () => {
    await fetchPaymentMethods()
    const defaultCard = paymentMethods.find(c => c.isDefault)
    if (defaultCard) setSelectedId(defaultCard.id)
    else if (paymentMethods[0]) setSelectedId(paymentMethods[0].id)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [])

  const handleAddCard = async () => {
    triggerHaptic('light')
    setAddingCard(true)
    try {
      const { clientSecret } = await paymentService.createPaymentIntent()
      if (!clientSecret) throw new Error('No client secret received')

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Airbnb Clone',
        allowsDelayedPaymentMethods: true,
        returnURL: 'airbnbclone://payment-complete',
      })

      if (initError) throw new Error(initError.message)

      const { error: presentError } = await presentPaymentSheet()
      if (presentError) throw new Error(presentError.message)

      triggerHaptic('success')
      setShowAddModal(false)
      Alert.alert('Muvaffaqiyatli', 'Karta qo\'shildi')
      await loadData()
    } catch (error: any) {
      triggerHaptic('warning')
      Alert.alert('Xatolik', error?.message || 'Karta qo\'shishda xatolik')
    } finally {
      setAddingCard(false)
    }
  }

  const handleDeleteCard = (card: any) => {
    triggerHaptic('light')
    Alert.alert(
      "Kartani o'chirish",
      `**** **** **** ${card.last4} kartani o'chirmoqchimisiz?`,
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "O'chirish",
          style: "destructive",
          onPress: async () => {
            await removePaymentMethod(card.id)
            if (selectedId === card.id) {
              const remaining = paymentMethods.find(c => c.id !== card.id)
              setSelectedId(remaining?.id || null)
            }
            triggerHaptic('success')
          }
        }
      ]
    )
  }

  const handleDeleteAllCards = async () => {
    triggerHaptic('light')
    Alert.alert(
      "Barcha kartalarni o'chirish",
      "Barcha kartalarni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.",
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "O'chirish",
          style: "destructive",
          onPress: async () => {
            for (const card of paymentMethods) {
              await removePaymentMethod(card.id)
            }
            setSelectedId(null)
            triggerHaptic('success')
            setShowDeleteAllModal(false)
            Alert.alert('Muvaffaqiyatli', 'Barcha kartalar o\'chirildi')
          }
        }
      ]
    )
  }

  const handleSetDefault = async (id: string) => {
    triggerHaptic('light')
    await setDefault(id)
    setSelectedId(id)
    triggerHaptic('success')
  }

  const getTotalCards = () => paymentMethods.length
  const getDefaultCard = () => paymentMethods.find(c => c.isDefault)
  const getCardsByBrand = () => {
    const brands: Record<string, number> = {}
    paymentMethods.forEach(card => {
      const brand = card.brand?.toLowerCase() || 'default'
      brands[brand] = (brands[brand] || 0) + 1
    })
    return brands
  }

  const stats = {
    total: getTotalCards(),
    default: getDefaultCard(),
    brands: getCardsByBrand()
  }

  if (isLoading && paymentMethods.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Kartalar yuklanmoqda...</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <Animated.View style={[styles.header, { transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>To'lovlar</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.helpBtn} onPress={() => setShowHelpModal(true)}>
            <Ionicons name="help-circle-outline" size={22} color={COLORS.gray} />
          </TouchableOpacity>
          {paymentMethods.length > 0 && (
            <TouchableOpacity style={styles.deleteAllBtn} onPress={() => setShowDeleteAllModal(true)}>
              <Ionicons name="trash-outline" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addIconBtn} onPress={() => setShowAddModal(true)} disabled={addingCard}>
            {addingCard ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons name="add" size={22} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {paymentMethods.length === 0 ? (
        <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
          <View style={styles.emptyIconWrap}>
            <LinearGradient colors={[COLORS.primary + '20', COLORS.primary + '10']} style={styles.emptyIconBg}>
              <Ionicons name="card-outline" size={56} color={COLORS.primary} />
            </LinearGradient>
          </View>
          <Text style={styles.emptyTitle}>Karta yo'q</Text>
          <Text style={styles.emptyDesc}>
            To'lov kartangizni qo'shing va bron qilishni osonlashtiring
          </Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowAddModal(true)}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.emptyAddGradient}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyAddText}>Karta qo'shish</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <>
          {/* Stats Cards */}
          <Animated.View style={[styles.statsContainer, { opacity: fadeAnim }]}>
            <LinearGradient colors={[COLORS.surface, COLORS.background]} style={styles.statsCard}>
              <View style={styles.statItem}>
                <Ionicons name="card-outline" size={22} color={COLORS.primary} />
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Jami kartalar</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.primary} />
                <Text style={styles.statValue}>{Object.keys(stats.brands).length}</Text>
                <Text style={styles.statLabel}>Karta turlari</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="star-outline" size={22} color={COLORS.primary} />
                <Text style={styles.statValue}>{stats.default?.brand?.toUpperCase() || '-'}</Text>
                <Text style={styles.statLabel}>Asosiy karta</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <FlatList
            data={paymentMethods}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 120 }]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
            ListHeaderComponent={
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Mening kartalarim</Text>
                <Text style={styles.sectionCount}>{paymentMethods.length} ta karta</Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <Animated.View style={{ opacity: listAnim, transform: [{ translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [50 + index * 20, 0] }) }] }}>
                <PaymentCard
                  card={item}
                  isSelected={selectedId === item.id}
                  onPress={() => setSelectedId(item.id)}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDeleteCard}
                  index={index}
                />
              </Animated.View>
            )}
            ListFooterComponent={
              <>
                {/* Security Section */}
                <View style={styles.securitySection}>
                  <LinearGradient colors={[COLORS.surface, COLORS.background]} style={styles.securityCard}>
                    <View style={styles.securityHeader}>
                      <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.success} />
                      <Text style={styles.securityTitle}>Xavfsiz himoyalangan</Text>
                    </View>
                    <Text style={styles.securityText}>
                      Karta ma'lumotlari Stripe orqali xavfsiz shifrlangan holda saqlanadi. 
                      Biz sizning to'liq karta ma'lumotlaringizni saqlamaymiz.
                    </Text>
                    <View style={styles.securityFeatures}>
                      <View style={styles.securityFeature}>
                        <Ionicons name="lock-closed-outline" size={16} color={COLORS.success} />
                        <Text style={styles.securityFeatureText}>256-bit SSL shifrlash</Text>
                      </View>
                      <View style={styles.securityFeature}>
                        <Ionicons name="shield-outline" size={16} color={COLORS.success} />
                        <Text style={styles.securityFeatureText}>PCI DSS sertifikatlangan</Text>
                      </View>
                      <View style={styles.securityFeature}>
                        <Ionicons name="time-outline" size={16} color={COLORS.success} />
                        <Text style={styles.securityFeatureText}>24/7 monitoring</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                {/* Accepted Cards */}
                <View style={styles.acceptedContainer}>
                  <Text style={styles.acceptedTitle}>Qabul qilinadigan kartalar</Text>
                  <View style={styles.acceptedCards}>
                    <View style={styles.acceptedCard}>
                      <Ionicons name="logo-google" size={28} color="#1A1F71" />
                      <Text style={styles.acceptedCardText}>Visa</Text>
                    </View>
                    <View style={styles.acceptedCard}>
                      <Ionicons name="card" size={28} color="#EB001B" />
                      <Text style={styles.acceptedCardText}>Mastercard</Text>
                    </View>
                    <View style={styles.acceptedCard}>
                      <Ionicons name="card" size={28} color="#007B5E" />
                      <Text style={styles.acceptedCardText}>Amex</Text>
                    </View>
                    <View style={styles.acceptedCard}>
                      <Ionicons name="card" size={28} color="#E87C00" />
                      <Text style={styles.acceptedCardText}>Discover</Text>
                    </View>
                  </View>
                </View>

                {/* Support Section */}
                <TouchableOpacity style={styles.supportBtn} onPress={() => Linking.openURL('mailto:support@airbnbclone.com')}>
                  <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.supportBtnText}>Karta bilan bog'liq muammo bormi? Yordam oling</Text>
                </TouchableOpacity>
              </>
            }
          />

          {/* Bottom Bar */}
          {stats.default && (
            <Animated.View style={[styles.bottomBar, { paddingBottom: insets.bottom || 20, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }] }]}>
              <View>
                <Text style={styles.bottomLabel}>Asosiy karta</Text>
                <Text style={styles.bottomCard}>
                  {stats.default.brand?.toUpperCase()} •••• {stats.default.last4}
                </Text>
              </View>
              <TouchableOpacity style={styles.bottomBtn} onPress={() => router.back()}>
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.bottomBtnGradient}>
                  <Text style={styles.bottomBtnText}>Tasdiqlash</Text>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </>
      )}

      {/* Add Card Modal */}
      <AddCardModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddCard={handleAddCard}
        isLoading={addingCard}
      />

      {/* Delete All Confirmation Modal */}
      <Modal visible={showDeleteAllModal} transparent animationType="fade">
        <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.confirmModalGradient}>
              <View style={styles.confirmIcon}>
                <Ionicons name="warning-outline" size={50} color="#FF3B30" />
              </View>
              <Text style={styles.confirmTitle}>Barcha kartalarni o'chirish</Text>
              <Text style={styles.confirmText}>
                Siz {paymentMethods.length} ta kartani o'chirmoqchisiz. Bu amalni qaytarib bo'lmaydi.
              </Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setShowDeleteAllModal(false)}>
                  <Text style={styles.confirmCancelText}>Bekor qilish</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmDeleteBtn} onPress={handleDeleteAllCards}>
                  <Text style={styles.confirmDeleteText}>O'chirish</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </BlurView>
      </Modal>

      {/* Help Modal */}
      <Modal visible={showHelpModal} transparent animationType="fade">
        <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
          <View style={styles.helpModal}>
            <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.helpModalGradient}>
              <View style={styles.helpHeader}>
                <Text style={styles.helpTitle}>Yordam</Text>
                <TouchableOpacity onPress={() => setShowHelpModal(false)} style={styles.helpClose}>
                  <Ionicons name="close" size={22} color={COLORS.gray} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <View style={styles.helpSection}>
                  <Text style={styles.helpSectionTitle}>Karta qo'shish</Text>
                  <Text style={styles.helpText}>1. "Karta qo'shish" tugmasini bosing</Text>
                  <Text style={styles.helpText}>2. Karta ma'lumotlarini kiriting</Text>
                  <Text style={styles.helpText}>3. To'lovni tasdiqlang</Text>
                </View>
                <View style={styles.helpSection}>
                  <Text style={styles.helpSectionTitle}>Asosiy kartani belgilash</Text>
                  <Text style={styles.helpText}>• Kartaning yonidagi "Asosiy qilish" tugmasini bosing</Text>
                  <Text style={styles.helpText}>• Asosiy karta bron qilishda avtomatik tanlanadi</Text>
                </View>
                <View style={styles.helpSection}>
                  <Text style={styles.helpSectionTitle}>Kartani o'chirish</Text>
                  <Text style={styles.helpText}>• Karta ustidagi o'chirish tugmasini bosing</Text>
                  <Text style={styles.helpText}>• O'chirishni tasdiqlang</Text>
                </View>
                <View style={styles.helpSection}>
                  <Text style={styles.helpSectionTitle}>Xavfsizlik</Text>
                  <Text style={styles.helpText}>• Barcha to'lovlar SSL shifrlangan</Text>
                  <Text style={styles.helpText}>• Karta ma'lumotlari Stripe orqali xavfsiz saqlanadi</Text>
                  <Text style={styles.helpText}>• To'liq karta raqami hech qayerda saqlanmaydi</Text>
                </View>
              </ScrollView>
            </LinearGradient>
          </View>
        </BlurView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F8F8' },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.gray },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  helpBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  deleteAllBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FF3B3010',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#FF3B3025',
  },
  addIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.primary + '30',
  },

  // Stats
  statsContainer: { paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  statsCard: {
    flexDirection: 'row', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.dark },
  statLabel: { fontSize: 11, color: COLORS.gray },
  statDivider: { width: 1, height: 40, backgroundColor: COLORS.border },

  // List
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  sectionCount: { fontSize: 12, color: COLORS.primary, fontWeight: '600', backgroundColor: COLORS.primary + '12', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },

  // Card
  cardWrapper: { marginBottom: 16 },
  cardGradient: { width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 20, padding: 18, justifyContent: 'space-between', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 16, elevation: 10 },
  cardShine: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  cardShineGradient: { width: '100%', height: '100%' },
  cardDeco1: { position: 'absolute', width: CARD_WIDTH * 0.6, height: CARD_WIDTH * 0.6, borderRadius: CARD_WIDTH * 0.3, backgroundColor: 'rgba(255,255,255,0.05)', top: -CARD_WIDTH * 0.2, right: -CARD_WIDTH * 0.15 },
  cardDeco2: { position: 'absolute', width: CARD_WIDTH * 0.4, height: CARD_WIDTH * 0.4, borderRadius: CARD_WIDTH * 0.2, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -CARD_WIDTH * 0.15, left: -CARD_WIDTH * 0.1 },
  cardDeco3: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)', top: '35%', left: '30%' },
  cardDeco4: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.04)', bottom: '20%', right: '15%' },
  patternCircle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardChip: { width: 40, height: 30, borderRadius: 6, backgroundColor: 'rgba(255,220,100,0.9)', padding: 5, gap: 3 },
  chipRow: { flexDirection: 'row', gap: 4, flex: 1 },
  chipCell: { flex: 1, backgroundColor: 'rgba(180,140,0,0.5)', borderRadius: 1 },
  cardBadges: { flexDirection: 'row', gap: 8 },
  defaultBadgeCard: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  defaultBadgeCardText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  contactlessBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  cardNumberContainer: { gap: 4 },
  cardNumberLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '600', letterSpacing: 1 },
  cardNumber: { color: '#fff', fontSize: 18, fontWeight: '600', letterSpacing: 2 },
  cardDetailsRow: { flexDirection: 'row', gap: 24 },
  cardDetailItem: { gap: 4 },
  cardDetailLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 8, fontWeight: '600', letterSpacing: 1 },
  cardDetailValue: { color: '#fff', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardBrandName: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  cardNetworkIcon: { flexDirection: 'row', alignItems: 'center' },
  networkCircle1: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.3)', marginRight: -8 },
  networkCircle2: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)' },

  // Card Actions
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, paddingTop: 12 },
  cardActionsLeft: { flex: 1 },
  cardActionsRight: { flexDirection: 'row', gap: 8 },
  defaultPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary + '12', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary + '25', alignSelf: 'flex-start' },
  defaultPillText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  setDefaultPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, alignSelf: 'flex-start' },
  setDefaultPillText: { fontSize: 11, color: COLORS.gray, fontWeight: '500' },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FF3B3010', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FF3B3025' },

  // Security Section
  securitySection: { marginTop: 16 },
  securityCard: { borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  securityHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  securityTitle: { fontSize: 16, fontWeight: '600', color: COLORS.dark },
  securityText: { fontSize: 13, color: COLORS.gray, lineHeight: 20, marginBottom: 16 },
  securityFeatures: { gap: 10 },
  securityFeature: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  securityFeatureText: { fontSize: 12, color: COLORS.gray },

  // Accepted Cards
  acceptedContainer: { marginTop: 20, paddingHorizontal: 4 },
  acceptedTitle: { fontSize: 14, fontWeight: '600', color: COLORS.dark, marginBottom: 12 },
  acceptedCards: { flexDirection: 'row', gap: 16 },
  acceptedCard: { alignItems: 'center', gap: 6 },
  acceptedCardText: { fontSize: 11, color: COLORS.gray, fontWeight: '500' },

  // Support Button
  supportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, marginTop: 16 },
  supportBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },

  // Bottom Bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 8 },
  bottomLabel: { fontSize: 12, color: COLORS.gray },
  bottomCard: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginTop: 2 },
  bottomBtn: { borderRadius: 14, overflow: 'hidden' },
  bottomBtnGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12 },
  bottomBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Empty State
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIconWrap: { marginBottom: 28 },
  emptyIconBg: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: COLORS.dark, marginBottom: 10 },
  emptyDesc: { fontSize: 15, color: COLORS.gray, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  emptyAddBtn: { borderRadius: 14, overflow: 'hidden' },
  emptyAddGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14 },
  emptyAddText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: width - 40, maxHeight: height * 0.85, borderRadius: 24, overflow: 'hidden' },
  modalGradient: { padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.dark },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  modalPreview: { marginBottom: 24 },
  previewCard: { padding: 16, borderRadius: 16, gap: 16 },
  previewNumber: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 1.5 },
  previewDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  previewLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '600', marginBottom: 4 },
  previewValue: { color: '#fff', fontSize: 12, fontWeight: '600' },
  modalForm: { gap: 16 },
  inputGroup: { gap: 8 },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  input: { backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.dark, borderWidth: 1, borderColor: COLORS.border },
  modalAddBtn: { marginTop: 24, borderRadius: 14, overflow: 'hidden' },
  modalAddGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  modalAddText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalSecurity: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 12 },
  modalSecurityText: { fontSize: 11, color: COLORS.success },

  // Confirm Modal
  confirmModal: { width: width - 60, borderRadius: 24, overflow: 'hidden' },
  confirmModalGradient: { padding: 24, alignItems: 'center', gap: 16 },
  confirmIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FF3B3015', justifyContent: 'center', alignItems: 'center' },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark, textAlign: 'center' },
  confirmText: { fontSize: 14, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },
  confirmButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  confirmCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  confirmCancelText: { fontSize: 14, color: COLORS.gray, fontWeight: '500' },
  confirmDeleteBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FF3B30', alignItems: 'center' },
  confirmDeleteText: { fontSize: 14, color: '#fff', fontWeight: '600' },

  // Help Modal
  helpModal: { width: width - 40, maxHeight: height * 0.8, borderRadius: 24, overflow: 'hidden' },
  helpModalGradient: { padding: 20 },
  helpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  helpTitle: { fontSize: 20, fontWeight: '700', color: COLORS.dark },
  helpClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  helpSection: { marginBottom: 20 },
  helpSectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.dark, marginBottom: 10 },
  helpText: { fontSize: 13, color: COLORS.gray, lineHeight: 22, marginLeft: 8 },
})

export { PaymentCard, AddCardModal }