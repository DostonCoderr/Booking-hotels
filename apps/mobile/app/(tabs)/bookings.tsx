import { useState, useCallback, useRef } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Animated, Dimensions,
  Modal, Share, Alert, Image, ScrollView
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useBooking } from '@/hooks/useBooking'
import { ReviewModal } from '@/components/review/ReviewModal'
import { api } from '@/services/api'  // API import qilindi
import { COLORS } from '@/constants/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width, height } = Dimensions.get('window')

export default function BookingsScreen() {
  const { myBookings, isLoadingMyBookings, refetchMyBookings } = useBooking()
  const insets = useSafeAreaInsets()
  const scrollY = useRef(new Animated.Value(0)).current
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)

  // Header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [-80, 0],
    extrapolate: 'clamp',
  })

  // Check if user can review
  const canReview = (checkOut: string) => {
    const checkoutDate = new Date(checkOut)
    const today = new Date()
    return checkoutDate < today
  }

  // Filter bookings
  const filteredBookings = myBookings?.filter(booking => {
    if (selectedFilter === 'all') return true
    if (selectedFilter === 'upcoming') {
      return new Date(booking.checkIn) > new Date()
    }
    if (selectedFilter === 'past') {
      return new Date(booking.checkOut) < new Date()
    }
    return booking.status === selectedFilter
  }) || []

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

  const handleShare = async (booking: any) => {
    try {
      await Share.share({
        title: booking.listing.title,
        message: `🏠 ${booking.listing.title}\n📍 ${booking.listing.city}, ${booking.listing.country}\n📅 ${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}\n👥 ${booking.guests} mehmon\n💰 $${booking.totalPrice}\n\nAirbnb orqali bron qilingan!`,
      })
    } catch (error) {
      console.error('Share error:', error)
    }
  }

  const handleCancelBooking = (booking: any) => {
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
              refetchMyBookings()
              Alert.alert("Muvaffaqiyatli", "Bron bekor qilindi")
            } catch (error) {
              Alert.alert("Xatolik", "Bronni bekor qilishda xatolik yuz berdi")
            }
          }
        }
      ]
    )
  }

  const filters = [
    { id: 'all', label: 'Hammasi', icon: 'apps', count: myBookings?.length || 0 },
    { id: 'upcoming', label: 'Kelgusi', icon: 'calendar', color: '#2196F3', count: myBookings?.filter(b => new Date(b.checkIn) > new Date()).length || 0 },
    { id: 'past', label: "O'tgan", icon: 'time', color: COLORS.gray, count: myBookings?.filter(b => new Date(b.checkOut) < new Date()).length || 0 },
    { id: 'confirmed', label: 'Tasdiqlangan', icon: 'checkmark-circle', color: '#4CAF50', count: myBookings?.filter(b => b.status === 'confirmed').length || 0 },
    { id: 'pending', label: 'Kutilmoqda', icon: 'time', color: '#FF9800', count: myBookings?.filter(b => b.status === 'pending').length || 0 },
  ]

  const stats = {
    total: myBookings?.length || 0,
    totalSpent: myBookings?.reduce((sum, b) => sum + b.totalPrice, 0) || 0,
    upcoming: myBookings?.filter(b => new Date(b.checkIn) > new Date()).length || 0,
    completed: myBookings?.filter(b => new Date(b.checkOut) < new Date() && b.status === 'confirmed').length || 0,
  }

  const renderStatsBar = () => (
    <View style={styles.statsContainer}>
      <LinearGradient
        colors={[COLORS.surface, COLORS.background]}
        style={styles.statsGradient}
      >
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Jami bron</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.primary }]}>${stats.totalSpent}</Text>
          <Text style={styles.statLabel}>Umumiy xarajat</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#2196F3' }]}>{stats.upcoming}</Text>
          <Text style={styles.statLabel}>Kelgusi</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Yakunlangan</Text>
        </View>
      </LinearGradient>
    </View>
  )

  const renderBookingCard = ({ item }: { item: any }) => {
    const nights = calculateNights(item.checkIn, item.checkOut)
    const statusColor = getStatusColor(item.status)
    const isUpcoming = new Date(item.checkIn) > new Date()
    const isCompleted = new Date(item.checkOut) < new Date()
    const canWriteReview = isCompleted && item.status === 'confirmed'
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          setSelectedBooking(item)
          setModalVisible(true)
        }}
        activeOpacity={0.9}
      >
        <Image 
          source={{ uri: item.listing.images?.[0] || 'https://via.placeholder.com/400' }} 
          style={styles.cardImage} 
        />
        
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
            <View style={[styles.nightsBadge, { backgroundColor: isUpcoming ? COLORS.primary + '15' : COLORS.surface }]}>
              <Text style={[styles.nightsText, { color: isUpcoming ? COLORS.primary : COLORS.gray }]}>
                {nights} kecha
              </Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={16} color={COLORS.gray} />
              <Text style={styles.detailText}>{item.guests} mehmon</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={16} color={COLORS.gray} />
              <Text style={styles.detailText}>${item.totalPrice}</Text>
            </View>
          </View>

          {/* Review Button */}
          {canWriteReview && (
            <TouchableOpacity 
              style={styles.reviewBtn}
              onPress={() => {
                setSelectedBooking(item)
                setShowReviewModal(true)
              }}
            >
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.reviewBtnGradient}>
                <Ionicons name="star-outline" size={18} color="#fff" />
                <Text style={styles.reviewBtnText}>Sharh qoldirish</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {item.status === 'pending' && (
            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => handleCancelBooking(item)}
            >
              <Text style={styles.cancelBtnText}>Bekor qilish</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  if (isLoadingMyBookings) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  if (!myBookings || myBookings.length === 0) {
    return (
      <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="calendar-outline" size={64} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>Bronlar yo'q</Text>
        <Text style={styles.emptyText}>
          Hali hech qanday bron qilmagansiz. Birinchi sayohatingizni rejalashtiring!
        </Text>
        <TouchableOpacity style={styles.searchBtn} onPress={() => router.push('/(tabs)/search')}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.searchBtnGradient}>
            <Ionicons name="search-outline" size={20} color="#fff" />
            <Text style={styles.searchBtnText}>Qidirish</Text>
          </LinearGradient>
        </TouchableOpacity>
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
              <Text style={styles.headerTitle}>Bronlarim</Text>
              <TouchableOpacity onPress={() => refetchMyBookings()} style={styles.refreshBtn}>
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
            <RefreshControl refreshing={isLoadingMyBookings} onRefresh={refetchMyBookings} colors={[COLORS.primary]} />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          ListHeaderComponent={
            <>
              {renderStatsBar()}
              
              {/* Filter Chips */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.filterContainer}
                contentContainerStyle={styles.filterContent}
              >
                {filters.map((filter) => (
                  <TouchableOpacity
                    key={filter.id}
                    style={[styles.filterChip, selectedFilter === filter.id && styles.filterChipActive]}
                    onPress={() => setSelectedFilter(filter.id)}
                  >
                    <Ionicons 
                      name={filter.icon as any} 
                      size={16} 
                      color={selectedFilter === filter.id ? COLORS.primary : COLORS.gray} 
                    />
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
            refetchMyBookings()
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
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.dark },
  statLabel: { fontSize: 11, color: COLORS.gray, marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
  filterContainer: { marginBottom: 16 },
  filterContent: { paddingHorizontal: 16 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 30, backgroundColor: COLORS.surface, marginRight: 10, gap: 6, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary + '10', borderColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.gray, fontWeight: '500' },
  filterTextActive: { color: COLORS.primary },
  filterBadge: { borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  card: { marginHorizontal: 16, marginBottom: 16, backgroundColor: COLORS.background, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: COLORS.border },
  cardImage: { width: '100%', height: 180 },
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
  nightsBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  nightsText: { fontSize: 10, fontWeight: '500' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: COLORS.dark },
  detailDivider: { width: 1, height: 20, backgroundColor: COLORS.border, marginHorizontal: 12 },
  reviewBtn: { marginTop: 12, borderRadius: 12, overflow: 'hidden' },
  reviewBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 8 },
  reviewBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  cancelBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F44336', alignItems: 'center' },
  cancelBtnText: { fontSize: 13, color: '#F44336', fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: COLORS.dark, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },
  searchBtn: { marginTop: 24, borderRadius: 30, overflow: 'hidden' },
  searchBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, gap: 8 },
  searchBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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