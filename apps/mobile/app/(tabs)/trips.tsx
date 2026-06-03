import { useState, useCallback, useRef, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Image, ActivityIndicator, Animated,
  Dimensions, Platform, Modal, Share, Alert, ScrollView
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/stores/authStore'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNotificationStore } from '@/stores/notificationStore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Haptics from 'expo-haptics'
import { ReviewModal } from '@/components/review/ReviewModal'

const { width, height } = Dimensions.get('window')
const CARD_WIDTH = width - 32

interface Booking {
  id: string
  checkIn: string
  checkOut: string
  guests: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled'
  listing: {
    id: string
    title: string
    images: string[]
    address: string
    city: string
    country: string
  }
  guest: {
    id: string
    name: string
    avatar: string | null
  }
  createdAt: string
}

// Calculate days until check-in
const getDaysUntil = (checkInDate: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkIn = new Date(checkInDate)
  checkIn.setHours(0, 0, 0, 0)
  const diffTime = checkIn.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Check if trip is today
const isToday = (checkInDate: string) => {
  const today = new Date().toDateString()
  const checkIn = new Date(checkInDate).toDateString()
  return today === checkIn
}

// Check if trip is completed (can review)
const isCompleted = (checkOutDate: string) => {
  const today = new Date()
  const checkOut = new Date(checkOutDate)
  return checkOut < today
}

// Check if trip is tomorrow
const isTomorrow = (checkInDate: string) => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const checkIn = new Date(checkInDate)
  return tomorrow.toDateString() === checkIn.toDateString()
}

// Haptic feedback
const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
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
      }
    } catch (error) {}
  }
}

export default function TripsScreen() {
  const { user } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const scrollY = useRef(new Animated.Value(0)).current
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [countdowns, setCountdowns] = useState<{ [key: string]: string }>({})

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['host-bookings'],
    queryFn: async () => {
      const { data } = await api.get('/bookings/host')
      return data as Booking[]
    },
    enabled: user?.isHost === true,
  })

  // Countdown uchun useEffect
  useEffect(() => {
    if (bookings) {
      const intervals: NodeJS.Timeout[] = []
      
      bookings.forEach(booking => {
        if (booking.status === 'confirmed') {
          const updateRemaining = () => {
            const daysUntil = getDaysUntil(booking.checkIn)
            
            if (daysUntil === 0) {
              setCountdowns(prev => ({ ...prev, [booking.id]: "🔴 BUGUN!" }))
            } else if (daysUntil === 1) {
              setCountdowns(prev => ({ ...prev, [booking.id]: "🟡 ERTAGA!" }))
            } else if (daysUntil < 0) {
              setCountdowns(prev => ({ ...prev, [booking.id]: "✅ TUGAGAN" }))
            } else {
              setCountdowns(prev => ({ ...prev, [booking.id]: `📅 ${daysUntil} kun qoldi` }))
            }
          }
          
          updateRemaining()
          const interval = setInterval(updateRemaining, 1000 * 60 * 60)
          intervals.push(interval)
        }
      })
      
      return () => intervals.forEach(clearInterval)
    }
  }, [bookings])

  // Filter bookings
  const filteredBookings = bookings?.filter(booking => {
    if (selectedFilter === 'all') return true
    if (selectedFilter === 'upcoming') {
      return booking.status === 'confirmed' && getDaysUntil(booking.checkIn) > 0
    }
    if (selectedFilter === 'today') {
      return booking.status === 'confirmed' && isToday(booking.checkIn)
    }
    if (selectedFilter === 'completed') {
      return booking.status === 'confirmed' && isCompleted(booking.checkOut)
    }
    return booking.status === selectedFilter
  }) || []

  // Header animation
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [-80, 0],
    extrapolate: 'clamp',
  })

  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('uz-UZ', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }

  const formatShortDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('uz-UZ', { 
      day: 'numeric', 
      month: 'short'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#4CAF50'
      case 'pending': return '#FF9800'
      case 'cancelled': return '#F44336'
      default: return COLORS.gray
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return 'checkmark-circle'
      case 'pending': return 'time'
      case 'cancelled': return 'close-circle'
      default: return 'ellipse'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Tasdiqlangan'
      case 'pending': return 'Kutilmoqda'
      case 'cancelled': return 'Bekor qilingan'
      default: return status
    }
  }

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const handleShare = async (booking: Booking) => {
    triggerHaptic('light')
    try {
      await Share.share({
        title: booking.listing.title,
        message: `🏠 ${booking.listing.title}\n📍 ${booking.listing.city}, ${booking.listing.country}\n📅 ${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}\n👥 ${booking.guests} mehmon\n💰 $${booking.totalPrice}\n\nAirbnb orqali bron qilingan!`,
      })
    } catch (error) {
      console.error('Share error:', error)
    }
  }

  const handleCancelBooking = (booking: Booking) => {
    triggerHaptic('light')
    Alert.alert(
      "Bronni bekor qilish",
      `"${booking.listing.title}" bronini bekor qilmoqchimisiz?`,
      [
        { text: "Bekor qilish", style: "cancel" },
        { 
          text: "Bekor qilish", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/bookings/${booking.id}`)
              queryClient.invalidateQueries({ queryKey: ['host-bookings'] })
              triggerHaptic('medium')
              Alert.alert("Muvaffaqiyatli", "Bron bekor qilindi")
            } catch (error) {
              Alert.alert("Xatolik", "Bronni bekor qilishda xatolik yuz berdi")
            }
          }
        }
      ]
    )
  }

  const handleConfirmArrival = (booking: Booking) => {
    triggerHaptic('medium')
    Alert.alert(
      "Kelishni tasdiqlash",
      `Siz "${booking.listing.title}" ga keldingizmi?`,
      [
        { text: "Hali emas", style: "cancel" },
        { 
          text: "Ha, keldim",
          onPress: async () => {
            try {
              await api.post(`/bookings/${booking.id}/confirm-arrival`)
              Alert.alert("Muvaffaqiyatli", "Kelishingiz tasdiqlandi. Yaxshi dam oling!")
            } catch (error) {
              Alert.alert("Xatolik", "Tasdiqlashda xatolik")
            }
          }
        }
      ]
    )
  }

  const filters = [
    { id: 'all', label: 'Hammasi', icon: 'apps', count: bookings?.length || 0 },
    { id: 'upcoming', label: "Kelgusi", icon: 'calendar', color: '#2196F3', count: bookings?.filter(b => b.status === 'confirmed' && getDaysUntil(b.checkIn) > 0).length || 0 },
    { id: 'today', label: "Bugun", icon: 'today', color: '#FF9800', count: bookings?.filter(b => b.status === 'confirmed' && isToday(b.checkIn)).length || 0 },
    { id: 'completed', label: "Yakunlangan", icon: 'checkmark-circle', color: '#4CAF50', count: bookings?.filter(b => b.status === 'confirmed' && isCompleted(b.checkOut)).length || 0 },
    { id: 'confirmed', label: 'Tasdiqlangan', icon: 'checkmark-circle', color: '#4CAF50', count: bookings?.filter(b => b.status === 'confirmed').length || 0 },
    { id: 'pending', label: 'Kutilmoqda', icon: 'time', color: '#FF9800', count: bookings?.filter(b => b.status === 'pending').length || 0 },
  ]

  const stats = {
    total: bookings?.length || 0,
    confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
    completed: bookings?.filter(b => b.status === 'confirmed' && isCompleted(b.checkOut)).length || 0,
    totalEarnings: bookings?.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.totalPrice, 0) || 0,
  }

  const renderStatsBar = () => (
    <View style={styles.statsContainer}>
      <LinearGradient colors={[COLORS.surface, COLORS.background]} style={styles.statsGradient}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Jami bron</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.confirmed}</Text>
          <Text style={styles.statLabel}>Tasdiqlangan</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Yakunlangan</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.primary }]}>${stats.totalEarnings}</Text>
          <Text style={styles.statLabel}>Daromad</Text>
        </View>
      </LinearGradient>
    </View>
  )

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const nights = calculateNights(item.checkIn, item.checkOut)
    const statusColor = getStatusColor(item.status)
    const daysUntil = getDaysUntil(item.checkIn)
    const isTodayTrip = isToday(item.checkIn)
    const isTomorrowTrip = isTomorrow(item.checkIn)
    const isCompletedTrip = isCompleted(item.checkOut)
    const countdown = countdowns[item.id] || ''
    
    return (
      <Animated.View style={styles.cardWrapper}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            setSelectedBooking(item)
            setModalVisible(true)
          }}
          activeOpacity={0.9}
        >
          <Image source={{ uri: item.listing.images?.[0] || 'https://via.placeholder.com/400' }} style={styles.cardImage} />
          
          {/* Countdown Badge */}
          {item.status === 'confirmed' && daysUntil > 0 && daysUntil <= 14 && (
            <LinearGradient
              colors={isTodayTrip ? ['#FF9800', '#F44336'] : isTomorrowTrip ? ['#2196F3', '#4CAF50'] : ['#FF9800', '#FFC107']}
              style={styles.countdownBadge}
            >
              <Ionicons name="time-outline" size={12} color="#fff" />
              <Text style={styles.countdownText}>{countdown}</Text>
            </LinearGradient>
          )}
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.cardOverlay}
          >
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Ionicons name={getStatusIcon(item.status) as any} size={12} color={statusColor} />
                <Text style={[styles.statusText, { color: statusColor }]}>{getStatusText(item.status)}</Text>
              </View>
            </View>
          </LinearGradient>
          
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <Text style={styles.listingTitle} numberOfLines={1}>{item.listing.title}</Text>
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={12} color={COLORS.gray} />
                  <Text style={styles.listingLocation} numberOfLines={1}>
                    {item.listing.city}, {item.listing.country}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleShare(item)} style={styles.shareBtn}>
                <Ionicons name="share-outline" size={18} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            {/* Date Info */}
            <View style={styles.dateContainer}>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>Kirish</Text>
                <Text style={styles.dateValue}>{formatShortDate(item.checkIn)}</Text>
              </View>
              <View style={styles.dateLine}>
                <Ionicons name="arrow-forward" size={16} color={COLORS.gray} />
              </View>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>Chiqish</Text>
                <Text style={styles.dateValue}>{formatShortDate(item.checkOut)}</Text>
              </View>
              <View style={styles.nightsBadge}>
                <Text style={styles.nightsText}>{nights} kecha</Text>
              </View>
            </View>

            {/* Guest Info */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="people-outline" size={16} color={COLORS.gray} />
                <Text style={styles.detailText}>{item.guests} mehmon</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Ionicons name="person-circle-outline" size={16} color={COLORS.gray} />
                <Text style={styles.detailText}>{item.guest?.name || 'Mehmon'}</Text>
              </View>
            </View>

            {/* Price Row */}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Jami to'lov</Text>
              <Text style={styles.priceAmount}>${item.totalPrice}</Text>
            </View>

            {/* Review Button - for completed trips */}
            {isCompletedTrip && item.status === 'confirmed' && (
              <TouchableOpacity 
                style={styles.reviewBtn}
                onPress={() => {
                  setSelectedBooking(item)
                  setShowReviewModal(true)
                }}
              >
                <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.reviewBtnGradient}>
                  <Ionicons name="star-outline" size={16} color="#fff" />
                  <Text style={styles.reviewBtnText}>Sharh qoldirish</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Arrival Button */}
            {item.status === 'confirmed' && daysUntil === 0 && !isCompletedTrip && (
              <TouchableOpacity style={styles.arrivalBtn} onPress={() => handleConfirmArrival(item)}>
                <LinearGradient colors={['#4CAF50', '#45A049']} style={styles.arrivalBtnGradient}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.arrivalBtnText}>Kelishni tasdiqlash</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Cancel Button */}
            {item.status === 'pending' && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelBooking(item)}>
                <Text style={styles.cancelBtnText}>Bekor qilish</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  if (!user?.isHost) {
    return (
      <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="home-outline" size={64} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>Sayohatlar yo'q</Text>
        <Text style={styles.emptyText}>
          Siz hali mezbon emassiz. Listing yaratib, mehmonlarni qabul qiling!
        </Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/listing/create')}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.createBtnGradient}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.createBtnText}>Listing yaratish</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    )
  }

  if (!bookings || bookings.length === 0) {
    return (
      <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="calendar-outline" size={64} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>Hali bronlar yo'q</Text>
        <Text style={styles.emptyText}>
          Listinglaringizga hali hech kim bron qilmagan
        </Text>
      </LinearGradient>
    )
  }

  return (
    <>
      <View style={styles.container}>
        {/* Animated Header */}
        <Animated.View style={[styles.animatedHeader, { transform: [{ translateY: headerTranslate }] }]}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.headerGradient}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Sayohatlar</Text>
              <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn}>
                <Ionicons name="refresh-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingTop: 100 }]}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[COLORS.primary]} />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          ListHeaderComponent={
            <>
              {renderStatsBar()}
              
              {/* Filter Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                {filters.map((filter) => (
                  <TouchableOpacity
                    key={filter.id}
                    style={[styles.filterChip, selectedFilter === filter.id && styles.filterChipActive]}
                    onPress={() => setSelectedFilter(filter.id)}
                  >
                    <Ionicons name={filter.icon as any} size={16} color={selectedFilter === filter.id ? COLORS.primary : COLORS.gray} />
                    <Text style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}>
                      {filter.label}
                    </Text>
                    {filter.count > 0 && (
                      <View style={[styles.filterBadge, { backgroundColor: filter.color || COLORS.primary }]}>
                        <Text style={styles.filterBadgeText}>{filter.count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          }
          renderItem={renderBookingCard}
          ListEmptyComponent={() => (
            <View style={styles.listEmptyContainer}>
              <Ionicons name="funnel-outline" size={48} color={COLORS.gray} />
              <Text style={styles.listEmptyText}>Bu statusda bronlar yo'q</Text>
            </View>
          )}
        />

        {/* Detail Modal */}
        <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            {selectedBooking && (
              <>
                <Image source={{ uri: selectedBooking.listing.images?.[0] }} style={styles.modalImage} />
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedBooking.listing.title}</Text>
                    <View style={[styles.modalStatus, { backgroundColor: getStatusColor(selectedBooking.status) + '15' }]}>
                      <Ionicons name={getStatusIcon(selectedBooking.status) as any} size={14} color={getStatusColor(selectedBooking.status)} />
                      <Text style={[styles.modalStatusText, { color: getStatusColor(selectedBooking.status) }]}>
                        {getStatusText(selectedBooking.status)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalLocation}>
                    <Ionicons name="location-outline" size={16} color={COLORS.gray} />
                    <Text style={styles.modalLocationText}>{selectedBooking.listing.address}</Text>
                  </View>

                  <View style={styles.modalCountdown}>
                    <LinearGradient
                      colors={isToday(selectedBooking.checkIn) ? ['#FF9800', '#F44336'] : ['#2196F3', '#4CAF50']}
                      style={styles.modalCountdownGradient}
                    >
                      <Ionicons name="time-outline" size={20} color="#fff" />
                      <Text style={styles.modalCountdownText}>
                        {countdowns[selectedBooking.id] || `${getDaysUntil(selectedBooking.checkIn)} kun qoldi`}
                      </Text>
                    </LinearGradient>
                  </View>

                  <View style={styles.modalDates}>
                    <View style={styles.modalDateItem}>
                      <Text style={styles.modalDateLabel}>Kirish</Text>
                      <Text style={styles.modalDateValue}>{formatDate(selectedBooking.checkIn)}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={20} color={COLORS.gray} />
                    <View style={styles.modalDateItem}>
                      <Text style={styles.modalDateLabel}>Chiqish</Text>
                      <Text style={styles.modalDateValue}>{formatDate(selectedBooking.checkOut)}</Text>
                    </View>
                  </View>

                  <View style={styles.modalDetails}>
                    <View style={styles.modalDetail}>
                      <Ionicons name="people-outline" size={20} color={COLORS.gray} />
                      <Text style={styles.modalDetailText}>{selectedBooking.guests} mehmon</Text>
                    </View>
                    <View style={styles.modalDetail}>
                      <Ionicons name="cash-outline" size={20} color={COLORS.gray} />
                      <Text style={styles.modalDetailText}>${selectedBooking.totalPrice}</Text>
                    </View>
                    <View style={styles.modalDetail}>
                      <Ionicons name="bed-outline" size={20} color={COLORS.gray} />
                      <Text style={styles.modalDetailText}>{calculateNights(selectedBooking.checkIn, selectedBooking.checkOut)} kecha</Text>
                    </View>
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                      <Text style={styles.modalCloseText}>Yopish</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.modalDetailBtn}
                      onPress={() => {
                        setModalVisible(false)
                        router.push(`/listing/${selectedBooking.listing.id}`)
                      }}
                    >
                      <Text style={styles.modalDetailBtnText}>Listingni ko'rish</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </Modal>
      </View>

      {/* Review Modal */}
      {selectedBooking && (
        <ReviewModal
          visible={showReviewModal}
          listingId={selectedBooking.listing.id}
          listingTitle={selectedBooking.listing.title}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            refetch()
          }}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  animatedHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerGradient: { paddingBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  list: { paddingBottom: 100 },
  statsContainer: { paddingHorizontal: 16, marginBottom: 20 },
  statsGradient: { flexDirection: 'row', borderRadius: 20, paddingVertical: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.dark },
  statLabel: { fontSize: 10, color: COLORS.gray, marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
  filterContainer: { paddingHorizontal: 16, marginBottom: 16 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 30, backgroundColor: COLORS.surface, marginRight: 10, gap: 6, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary + '10', borderColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.gray, fontWeight: '500' },
  filterTextActive: { color: COLORS.primary },
  filterBadge: { borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  cardWrapper: { marginHorizontal: 16, marginBottom: 16 },
  card: { backgroundColor: COLORS.background, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: COLORS.border },
  cardImage: { width: '100%', height: 180 },
  countdownBadge: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, zIndex: 10 },
  countdownText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 180 },
  statusContainer: { position: 'absolute', top: 16, right: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  titleContainer: { flex: 1, marginRight: 12 },
  listingTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listingLocation: { fontSize: 12, color: COLORS.gray },
  shareBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  dateContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dateBox: { flex: 1 },
  dateLabel: { fontSize: 10, color: COLORS.gray, marginBottom: 2 },
  dateValue: { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  dateLine: { paddingHorizontal: 8 },
  nightsBadge: { backgroundColor: COLORS.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  nightsText: { fontSize: 10, color: COLORS.gray, fontWeight: '500' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: COLORS.dark },
  detailDivider: { width: 1, height: 20, backgroundColor: COLORS.border, marginHorizontal: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  priceLabel: { fontSize: 14, color: COLORS.gray },
  priceAmount: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  reviewBtn: { marginTop: 12, borderRadius: 12, overflow: 'hidden' },
  reviewBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 8 },
  reviewBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  arrivalBtn: { marginTop: 12, borderRadius: 12, overflow: 'hidden' },
  arrivalBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 8 },
  arrivalBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  cancelBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F44336', alignItems: 'center' },
  cancelBtnText: { fontSize: 13, color: '#F44336', fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: COLORS.dark, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },
  createBtn: { marginTop: 24, borderRadius: 30, overflow: 'hidden' },
  createBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, gap: 8 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  listEmptyContainer: { alignItems: 'center', paddingVertical: 40 },
  listEmptyText: { fontSize: 14, color: COLORS.gray, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: height * 0.9 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  modalImage: { width: '100%', height: 200 },
  modalContent: { padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.dark, flex: 1 },
  modalStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4 },
  modalStatusText: { fontSize: 12, fontWeight: '600' },
  modalLocation: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  modalLocationText: { fontSize: 13, color: COLORS.gray, flex: 1 },
  modalCountdown: { marginBottom: 20, borderRadius: 12, overflow: 'hidden' },
  modalCountdownGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  modalCountdownText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  modalDates: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  modalDateItem: { flex: 1 },
  modalDateLabel: { fontSize: 12, color: COLORS.gray, marginBottom: 4 },
  modalDateValue: { fontSize: 14, fontWeight: '600', color: COLORS.dark },
  modalDetails: { gap: 12, marginBottom: 24 },
  modalDetail: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalDetailText: { fontSize: 14, color: COLORS.dark },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCloseBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  modalCloseText: { fontSize: 15, color: COLORS.gray, fontWeight: '500' },
  modalDetailBtn: { flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', gap: 6 },
  modalDetailBtnText: { fontSize: 15, color: '#fff', fontWeight: '600' },
})