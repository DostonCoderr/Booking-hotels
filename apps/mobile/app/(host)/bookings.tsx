// app/(host)/bookings.tsx

import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert, Animated, Platform, Dimensions, ScrollView } from 'react-native'
import { useState, useCallback, useRef, useEffect } from 'react'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { bookingService, Booking } from '@/services/booking.service'

const { width, height } = Dimensions.get('window')
const isTablet = width >= 768
const isSmallPhone = width <= 360

// Premium Cyberpunk Dark Palette
const C = {
  bg: '#070A13',
  bgCard: 'rgba(17, 24, 39, 0.85)',
  bgCardHover: 'rgba(17, 24, 39, 0.95)',
  primary: '#F43F5E',
  primaryGradient: ['#FF2E93', '#FF4A5A'] as const,
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#F9FAFB',
  textLight: '#9CA3AF',
  textLighter: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
  innerBox: 'rgba(255, 255, 255, 0.03)',
}

type FilterType = 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'

interface BookingCardProps {
  booking: Booking
  index: number
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

// ============================================
// Booking Card Component
// ============================================
function BookingCard({ booking, index, onApprove, onReject }: BookingCardProps) {
  const scaleAnim = useRef(new Animated.Value(0.93)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { 
        toValue: 1, 
        delay: Math.min(index * 60, 300), 
        useNativeDriver: true, 
        tension: 45, 
        friction: 8 
      }),
      Animated.timing(opacityAnim, { 
        toValue: 1, 
        delay: Math.min(index * 60, 300), 
        duration: 350, 
        useNativeDriver: true 
      })
    ]).start()
  }, [index, scaleAnim, opacityAnim])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
  }

  const getStatus = () => {
    switch (booking.status) {
      case 'confirmed': 
        return { color: C.success, text: 'Tasdiqlangan', icon: 'checkmark-circle' }
      case 'pending': 
        return { color: C.warning, text: 'Kutilmoqda', icon: 'time' }
      case 'cancelled': 
        return { color: C.danger, text: 'Bekor qilingan', icon: 'close-circle' }
      case 'completed': 
        return { color: C.primary, text: 'Yakunlangan', icon: 'star' }
      default: 
        return { color: C.textLight, text: booking.status, icon: 'help-circle' }
    }
  }

  const status = getStatus()
  const initials = booking.guest?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'

  if (!booking) return null

  return (
    <Animated.View style={[styles.bookingCard, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient colors={['rgba(255,255,255,0.02)', 'transparent']} style={styles.cardGradient} />
      
      <View style={styles.cardHeader}>
        <View style={styles.listingInfo}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={styles.listingTitle} numberOfLines={1}>
            {booking.listing?.title || 'Maxsus turar joy'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
        </View>
      </View>

      <View style={styles.guestSection}>
        <LinearGradient colors={C.primaryGradient} style={styles.guestAvatar}>
          <Text style={styles.guestAvatarText}>{initials}</Text>
        </LinearGradient>
        <View style={styles.guestInfo}>
          <Text style={styles.guestName} numberOfLines={1}>{booking.guest?.name || 'Mehmon'}</Text>
          <Text style={styles.guestEmail} numberOfLines={1}>{booking.guest?.email || 'No email'}</Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <Ionicons name="calendar-outline" size={14} color={C.textLighter} />
            <Text style={styles.gridLabel}>Kirish/Chiqish:</Text>
            <Text style={styles.gridValue} numberOfLines={1}>
              {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
            </Text>
          </View>
          <View style={[styles.gridItem, { alignItems: 'flex-end' }]}>
            <Ionicons name="people-outline" size={14} color={C.textLighter} />
            <Text style={styles.gridLabel}>Mehmonlar:</Text>
            <Text style={styles.gridValue}>{booking.guests} kishi</Text>
          </View>
        </View>
        
        <View style={[styles.gridRow, styles.gridRowSpacing]}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Umumiy narx:</Text>
            <Text style={styles.priceValue}>${booking.totalPrice.toLocaleString()}</Text>
          </View>
          <View style={[styles.gridItem, { justifyContent: 'center' }]}>
            <TouchableOpacity
              style={styles.contactBtn}
              activeOpacity={0.7}
              onPress={() => {
                if (booking.guest?.id) {
                  router.push({
                    pathname: `/messages/${booking.guest.id}`,
                    params: { 
                      name: booking.guest.name || 'Mehmon', 
                      avatar: booking.guest.avatar || '', 
                      listingTitle: booking.listing?.title || '' 
                    }
                  })
                }
              }}
            >
              <Ionicons name="chatbubble-ellipses" size={14} color={C.primary} />
              <Text style={styles.contactBtnText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {booking.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.confirmBtn]} 
            activeOpacity={0.8} 
            onPress={() => onApprove(booking.id)}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Tasdiqlash</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.cancelBtn]} 
            activeOpacity={0.8} 
            onPress={() => onReject(booking.id)}
          >
            <Ionicons name="close" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Rad etish</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  )
}

// ============================================
// MAIN BOOKINGS SCREEN
// ============================================
export default function HostBookingsScreen() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')

  const { data: bookings, isLoading, refetch } = useQuery<Booking[]>({
    queryKey: ['host-bookings', filter],
    queryFn: async () => {
      const status = filter === 'all' ? undefined : filter
      const result = await bookingService.getHostBookings(status)
      return result || []
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => bookingService.approveBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-bookings'] })
      Alert.alert('Muvaffaqiyatli 🎉', 'Bron tasdiqlandi')
    },
    onError: (error: any) => {
      Alert.alert('Xatolik', error.response?.data?.message || 'Tasdiqlashda xatolik')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      bookingService.rejectBooking(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-bookings'] })
      Alert.alert('Rad etildi', 'Bron rad etildi va to\'lov qaytariladi')
    },
    onError: (error: any) => {
      Alert.alert('Xatolik', error.response?.data?.message || 'Rad etishda xatolik')
    },
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const handleApprove = (id: string) => {
    Alert.alert(
      'Bronni tasdiqlash',
      'Haqiqatan ham bu buyurtmani tasdiqlamoqchimisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        { text: 'Tasdiqlash', onPress: () => approveMutation.mutate(id) }
      ]
    )
  }

  const handleReject = (id: string) => {
    Alert.prompt(
      'Rad etish sababi',
      'Nima uchun bu bronni rad etmoqchisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        { 
          text: 'Rad etish', 
          style: 'destructive',
          onPress: (reason?: string) => {
            if (reason && reason.trim()) {
              rejectMutation.mutate({ id, reason: reason.trim() })
            } else {
              Alert.alert('Xatolik', 'Iltimos, rad etish sababini kiriting')
            }
          }
        }
      ]
    )
  }

  const filterTabs = [
    { key: 'all' as const, label: 'Hammasi', color: C.text },
    { key: 'pending' as const, label: 'Kutilmoqda', color: C.warning },
    { key: 'confirmed' as const, label: 'Tasdiqlangan', color: C.success },
    { key: 'completed' as const, label: 'Tugagan', color: C.primary },
    { key: 'cancelled' as const, label: 'Rad etilgan', color: C.danger },
  ]

  const safeBookings = bookings || []
  
  const counts = {
    all: safeBookings.length,
    pending: safeBookings.filter(b => b.status === 'pending').length,
    confirmed: safeBookings.filter(b => b.status === 'confirmed').length,
    cancelled: safeBookings.filter(b => b.status === 'cancelled').length,
    completed: safeBookings.filter(b => b.status === 'completed').length,
  }

  if (isLoading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Buyurtmalar</Text>
            <Text style={styles.headerSubtitle}>Jami {counts.all} ta so'rov</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <FlatList
        horizontal
        data={filterTabs}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        renderItem={({ item }) => {
          const isActive = filter === item.key
          const count = counts[item.key]
          return (
            <TouchableOpacity
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              activeOpacity={0.8}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {item.label}
              </Text>
              {count > 0 && (
                <View style={[styles.filterCount, { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : item.color + '15' }]}>
                  <Text style={[styles.filterCountText, { color: isActive ? '#fff' : item.color }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        }}
      />

      {/* Bookings List */}
      <FlatList
        data={safeBookings}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, isTablet && styles.tabletList]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={C.primary} 
            colors={[C.primary]} 
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="folder-open-outline" size={44} color={C.textLight} />
            </View>
            <Text style={styles.emptyTitle}>Buyurtmalar yo'q</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' ? "Hozircha hech qanday buyurtma mavjud emas" :
               filter === 'pending' ? "Kutilayotgan buyurtmalar yo'q" :
               filter === 'confirmed' ? "Tasdiqlangan buyurtmalar yo'q" :
               filter === 'completed' ? "Yakunlangan buyurtmalar yo'q" :
               "Rad etilgan buyurtmalar yo'q"}
            </Text>
          </View>
        )}
        renderItem={({ item, index }) => (
          <BookingCard
            booking={item}
            index={index}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      />
    </View>
  )
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
  },

  header: {
    paddingHorizontal: width * 0.05,
    paddingBottom: isTablet ? 20 : 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isTablet ? 20 : 14,
  },
  backBtn: {
    width: isTablet ? 44 : 38,
    height: isTablet ? 44 : 38,
    borderRadius: isTablet ? 14 : 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: C.border,
  },
  headerTitle: {
    fontSize: isTablet ? 28 : isSmallPhone ? 20 : 21,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: isTablet ? 14 : 12,
    color: C.textLight,
    marginTop: 2,
  },

  filterContainer: {
    paddingHorizontal: width * 0.05,
    paddingVertical: isTablet ? 18 : 14,
    gap: isTablet ? 12 : 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: isTablet ? 18 : 14,
    paddingVertical: isTablet ? 10 : 8,
    borderRadius: isTablet ? 16 : 14,
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterTabActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterTabText: {
    fontSize: isTablet ? 14 : 13,
    fontWeight: '600',
    color: C.textLight,
  },
  filterTabTextActive: {
    color: '#fff',
  },
  filterCount: {
    paddingHorizontal: isTablet ? 8 : 6,
    paddingVertical: isTablet ? 3 : 2,
    borderRadius: 8,
  },
  filterCountText: {
    fontSize: isTablet ? 12 : 11,
    fontWeight: '700',
  },

  listContent: {
    paddingHorizontal: width * 0.05,
    paddingBottom: 40,
    gap: isTablet ? 20 : 14,
  },
  tabletList: {
    width: '80%',
    alignSelf: 'center',
    maxWidth: 600,
  },

  bookingCard: {
    backgroundColor: C.bgCard,
    borderRadius: isTablet ? 28 : 24,
    padding: isTablet ? 22 : 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: isTablet ? 20 : 14,
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: isTablet ? 110 : 90,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    paddingBottom: isTablet ? 14 : 12,
    marginBottom: isTablet ? 14 : 12,
  },
  listingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 10,
  },
  statusDot: {
    width: isTablet ? 8 : 6,
    height: isTablet ? 8 : 6,
    borderRadius: 4,
  },
  listingTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '700',
    color: C.text,
  },
  statusBadge: {
    paddingHorizontal: isTablet ? 12 : 10,
    paddingVertical: isTablet ? 6 : 4,
    borderRadius: isTablet ? 12 : 10,
  },
  statusText: {
    fontSize: isTablet ? 12 : 11,
    fontWeight: '700',
  },

  guestSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isTablet ? 14 : 12,
    marginBottom: isTablet ? 18 : 14,
  },
  guestAvatar: {
    width: isTablet ? 52 : 42,
    height: isTablet ? 52 : 42,
    borderRadius: isTablet ? 18 : 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestAvatarText: {
    fontSize: isTablet ? 18 : 15,
    fontWeight: '700',
    color: '#fff',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: isTablet ? 17 : 15,
    fontWeight: '600',
    color: C.text,
  },
  guestEmail: {
    fontSize: isTablet ? 13 : 12,
    color: C.textLighter,
    marginTop: 2,
  },

  detailsGrid: {
    backgroundColor: C.innerBox,
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 16 : 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
    marginBottom: isTablet ? 18 : 14,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridRowSpacing: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
    paddingTop: isTablet ? 12 : 10,
    marginTop: isTablet ? 12 : 10,
  },
  gridItem: {
    flex: 1,
  },
  gridLabel: {
    fontSize: isTablet ? 12 : 11,
    color: C.textLighter,
    marginBottom: isTablet ? 4 : 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  gridValue: {
    fontSize: isTablet ? 14 : 13,
    color: C.text,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: '900',
    color: C.primary,
  },

  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: isTablet ? 8 : 6,
    paddingHorizontal: isTablet ? 14 : 12,
    borderRadius: isTablet ? 12 : 10,
    backgroundColor: C.primary + '10',
    borderWidth: 1,
    borderColor: C.primary + '20',
    alignSelf: 'flex-end',
  },
  contactBtnText: {
    fontSize: isTablet ? 13 : 12,
    color: C.primary,
    fontWeight: '700',
  },

  actionButtons: {
    flexDirection: 'row',
    gap: isTablet ? 12 : 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: isTablet ? 13 : 11,
    borderRadius: isTablet ? 16 : 14,
  },
  confirmBtn: {
    backgroundColor: C.success,
  },
  cancelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: C.danger,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: isTablet ? 14 : 13,
    fontWeight: '700',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: height * 0.15,
    paddingHorizontal: width * 0.1,
  },
  emptyIcon: {
    width: isTablet ? 88 : 72,
    height: isTablet ? 88 : 72,
    borderRadius: isTablet ? 28 : 24,
    backgroundColor: C.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: isTablet ? 20 : 16,
  },
  emptyTitle: {
    fontSize: isTablet ? 20 : 17,
    fontWeight: '700',
    color: C.text,
  },
  emptyText: {
    fontSize: isTablet ? 14 : 13,
    color: C.textLight,
    textAlign: 'center',
    marginTop: isTablet ? 6 : 4,
    lineHeight: isTablet ? 22 : 18,
  },
})