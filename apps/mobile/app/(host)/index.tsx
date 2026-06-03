// app/(host)/index.tsx

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions, Animated, Platform } from 'react-native'
import { useState, useCallback, useRef, useEffect } from 'react'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/services/api'

const { width } = Dimensions.get('window')

// Responsive settings
const isTablet = width >= 768
const isSmallPhone = width <= 360
const GRID_GAP = 12
const PADDING_HORIZONTAL = 20
const FEATURE_CARD_WIDTH = isTablet 
  ? (width - (PADDING_HORIZONTAL * 2) - (GRID_GAP * 4)) / 5
  : (width - (PADDING_HORIZONTAL * 2) - GRID_GAP) / 2

// Premium Dark Cyber Colors
const C = {
  bg: '#0A0D14',
  bgCard: 'rgba(16, 20, 30, 0.65)',
  primary: '#38BDF8',
  primaryGradient: ['#00F2FE', '#4FACFE'] as const,
  accentGradient: ['#F43F5E', '#FF2E93'] as const,
  secondary: '#818CF8',
  tertiary: '#A78BFA',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  text: '#F3F4F6',
  textLight: '#9CA3AF',
  textLighter: '#6B7280',
  border: 'rgba(255, 255, 255, 0.05)',
}

// ============================================
// Animated Counter
// ============================================
function AnimatedCounter({ value, prefix = '', suffix = '', color = C.text }: any) {
  const anim = useRef(new Animated.Value(0)).current
  const [count, setCount] = useState(0)

  useEffect(() => {
    Animated.timing(anim, { toValue: value, duration: 1200, useNativeDriver: false }).start()
    const id = anim.addListener(({ value }) => setCount(Math.floor(value)))
    return () => anim.removeListener(id)
  }, [value])

  return (
    <Text style={[styles.mainStatValue, { color }]}>
      {prefix}{count.toLocaleString()}{suffix}
    </Text>
  )
}

// ============================================
// Stats Ring Component
// ============================================
function StatsRing({ title, value, icon, color, progress, onPress }: any) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 40, friction: 8 }).start()
  }, [])

  return (
    <Animated.View style={[styles.ringWrapper, { opacity: anim, transform: [{ scale: anim }] }]}>
      <TouchableOpacity style={styles.ringCard} onPress={onPress} activeOpacity={0.85}>
        <LinearGradient colors={[color + '10', 'rgba(10,13,20,0.4)'] as const} style={styles.ringGradient} />
        <View style={styles.ringTopRow}>
          <View style={[styles.ringIcon, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={isTablet ? 26 : 20} color={color} />
          </View>
          <Text style={[styles.ringValue, { color }]}>{value}</Text>
        </View>
        <Text style={styles.ringTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.ringProgress}>
          <View style={[styles.ringProgressBar, { width: `${progress}%`, backgroundColor: color }]} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ============================================
// Feature Card
// ============================================
function FeatureCard({ icon, label, color, onPress, delay = 0 }: any) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, delay, useNativeDriver: true, tension: 50, friction: 7 }),
      Animated.timing(opacityAnim, { toValue: 1, delay, duration: 400, useNativeDriver: true })
    ]).start()
  }, [])

  return (
    <Animated.View style={{ width: FEATURE_CARD_WIDTH, opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity style={styles.featureCard} onPress={onPress} activeOpacity={0.75}>
        <LinearGradient colors={['rgba(255,255,255,0.02)', 'transparent'] as const} style={styles.ringGradient} />
        <View style={[styles.featureIcon, { backgroundColor: color + '12' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.featureLabel} numberOfLines={1}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ============================================
// Booking Row
// ============================================
function BookingRow({ booking, index }: any) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 80, useNativeDriver: true, tension: 50, friction: 8 }).start()
  }, [])

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  }

  return (
    <Animated.View style={[styles.bookingRow, { opacity: anim, transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }]}>
      <View style={styles.bookingLeft}>
        <LinearGradient colors={C.primaryGradient} style={styles.bookingAvatar}>
          <Text style={styles.bookingAvatarText}>{getInitials(booking.guest?.name)}</Text>
        </LinearGradient>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingTitle} numberOfLines={1}>
            {booking.listing?.title || 'Maxsus joy'}
          </Text>
          <Text style={styles.bookingGuest} numberOfLines={1}>{booking.guest?.name}</Text>
          <Text style={styles.bookingDate}>
            {new Date(booking.checkIn).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' })} - {new Date(booking.checkOut).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>
      
      <View style={styles.bookingRight}>
        <Text style={styles.bookingPrice}>${booking.totalPrice}</Text>
        <View style={styles.bookingStatus}>
          <View style={[styles.statusDot, { backgroundColor: C.success }]} />
          <Text style={styles.statusText}>Tasdiqlandi</Text>
        </View>
      </View>
    </Animated.View>
  )
}

// ============================================
// MAIN DASHBOARD
// ============================================
export default function HostDashboard() {
  const { user } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)
  
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(40)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 45, friction: 8 }),
    ]).start()
  }, [])

  // Fetch unread notifications count
  const { data: unreadNotifCount = 0, refetch: refetchNotif } = useQuery({
    queryKey: ['host-unread-notifications'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/notifications/host/unread/count')
        return data.count || 0
      } catch { return 0 }
    },
    refetchInterval: 30000,
  })

  // Fetch stats from backend
  const { data: stats, refetch } = useQuery({
    queryKey: ['host-stats'],
    queryFn: async () => {
      const { data } = await api.get('/host/stats')
      return data
    },
  })

  // Fetch rating summary from backend
  const { data: ratingSummary } = useQuery({
    queryKey: ['host-rating-summary'],
    queryFn: async () => {
      const { data } = await api.get('/host/rating-summary')
      return data
    },
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetch(), refetchNotif()])
    setRefreshing(false)
  }, [])

  // REAL DATA FROM BACKEND
  const totalListings = stats?.listings?.total || 0
  const approved = stats?.listings?.approved || 0
  const pending = stats?.listings?.pending || 0
  const totalRevenue = stats?.revenue || 0
  const totalBookings = stats?.bookings?.total || 0
  
  const avgRating = ratingSummary?.avgRating || 0
  const totalReviews = ratingSummary?.totalReviews || 0
  const ratingDistribution = ratingSummary?.distribution || { five: 0, four: 0, three: 0, two: 0, one: 0 }
  
  const approvedProgress = totalListings > 0 ? (approved / totalListings) * 100 : 0
  const pendingProgress = totalListings > 0 ? (pending / totalListings) * 100 : 0
  
  const growthPercentage = totalBookings > 0 ? Math.min(99, Math.floor(totalBookings * 2.3)) : 0

  const getHostLevel = () => {
    if (totalListings >= 50) return 'Diamond Host'
    if (totalListings >= 25) return 'Platinum Host'
    if (totalListings >= 10) return 'Gold Host'
    if (totalListings >= 5) return 'Silver Host'
    if (totalListings >= 1) return 'Premium Host'
    return 'Yangi Host'
  }

  const getHostLevelColor = () => {
    if (totalListings >= 50) return C.tertiary
    if (totalListings >= 25) return C.primary
    if (totalListings >= 10) return C.warning
    return C.success
  }

  const remainingListings = (() => {
    if (totalListings < 5) return 5 - totalListings
    if (totalListings < 10) return 10 - totalListings
    if (totalListings < 25) return 25 - totalListings
    if (totalListings < 50) return 50 - totalListings
    return 0
  })()

  const progressToNextLevel = totalListings >= 50 ? 100 : Math.min(100, (totalListings / 50) * 100)

  const ratingStars = {
    five: ratingDistribution.five || 0,
    four: ratingDistribution.four || 0,
    three: ratingDistribution.three || 0,
    two: ratingDistribution.two || 0,
    one: ratingDistribution.one || 0,
    total: totalReviews
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Notification Bell */}
        <Animated.View style={[styles.header, { transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.headerGreeting}>Xush kelibsiz 👋</Text>
            <Text style={styles.headerName} numberOfLines={1}>
              {user?.name || 'Host'}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            {/* ✅ Notification Bell Button */}
            <TouchableOpacity 
              style={styles.notificationBtn} 
              onPress={() => router.push('/(host)/notifications')}
              activeOpacity={0.7}
            >
              <LinearGradient colors={['rgba(56,189,248,0.15)', 'rgba(56,189,248,0.05)']} style={styles.notificationBtnGrad}>
                <Ionicons name="notifications-outline" size={22} color={C.primary} />
                {unreadNotifCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Avatar */}
            <TouchableOpacity style={styles.headerAvatar} activeOpacity={0.8}>
              <LinearGradient colors={C.primaryGradient} style={styles.headerAvatarGrad}>
                <Text style={styles.headerAvatarText}>{user?.name?.charAt(0).toUpperCase() || 'H'}</Text>
              </LinearGradient>
              <View style={styles.headerBadge} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Hero Banner */}
        <View style={styles.heroWrapper}>
          <LinearGradient colors={['#111625', '#0A0D14'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBanner}>
            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroTitle}>Host darajangiz</Text>
                <Text style={[styles.heroSubtitle, { color: getHostLevelColor() }]}>{getHostLevel()}</Text>
                {remainingListings > 0 && (
                  <>
                    <View style={styles.heroProgress}>
                      <LinearGradient colors={C.primaryGradient} style={[styles.heroProgressBar, { width: `${progressToNextLevel}%` }]} />
                    </View>
                    <Text style={styles.heroText}>Yana {remainingListings} ta joy qo'shing</Text>
                  </>
                )}
              </View>
              <View style={[styles.heroIconContainer, { borderColor: getHostLevelColor() + '30' }]}>
                <Ionicons name="trophy" size={isTablet ? 54 : 38} color={getHostLevelColor()} />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Statistics Section */}
        <View style={styles.statsSection}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Statistika</Text>
              <Text style={styles.sectionSubtitle}>Faoliyatingiz tahlili va ko'rsatkichlar</Text>
            </View>
          </View>

          <View style={styles.mainStats}>
            <View style={styles.mainStatCard}>
              <Text style={styles.mainStatLabel}>Jami e'lonlar</Text>
              <AnimatedCounter value={totalListings} color={C.primary} />
            </View>
            <View style={styles.mainStatDivider} />
            <View style={styles.mainStatCard}>
              <Text style={styles.mainStatLabel}>Umumiy daromad</Text>
              <AnimatedCounter value={totalRevenue} prefix="$" color={C.success} />
            </View>
          </View>

          <View style={styles.ringsRow}>
            <StatsRing title="Tasdiqlangan" value={approved} icon="checkmark-circle" color={C.success} progress={approvedProgress} onPress={() => router.push('/(host)/listings?status=approved')} />
            <StatsRing title="Kutilmoqda" value={pending} icon="time" color={C.warning} progress={pendingProgress} onPress={() => router.push('/(host)/listings?status=pending')} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Tezkor amallar</Text>
          <View style={styles.featuresGrid}>
            <FeatureCard icon="add-circle" label="Yangi e'lon" color={C.primary} onPress={() => router.push('/(host)/add-listing')} delay={0} />
            <FeatureCard icon="list" label="E'lonlarim" color={C.secondary} onPress={() => router.push('/(host)/listings')} delay={50} />
            <FeatureCard icon="calendar" label="Bronlar" color={C.tertiary} onPress={() => router.push('/(host)/bookings')} delay={100} />
            <FeatureCard icon="chatbubble-ellipses" label="Xabarlar" color="#22D3EE" onPress={() => router.push('/(host)/messages')} delay={150} />
            {isTablet && (
              <FeatureCard icon="stats-chart" label="Analitika" color={C.warning} onPress={() => router.push('/(host)/analytics')} delay={200} />
            )}
          </View>
        </View>

        {/* Recent Bookings */}
        {stats?.bookings?.recent && stats.bookings.recent.length > 0 && (
          <View style={styles.bookingsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>So'nggi bronlar</Text>
              <TouchableOpacity onPress={() => router.push('/(host)/bookings')} activeOpacity={0.7}>
                <Text style={styles.viewAllText}>Barchasi →</Text>
              </TouchableOpacity>
            </View>
            {stats.bookings.recent.slice(0, 3).map((booking: any, idx: number) => (
              <BookingRow key={booking.id} booking={booking} index={idx} />
            ))}
          </View>
        )}

        {/* Dynamic Stats Cards */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatsCard}>
            <View style={[styles.quickStatsIcon, { backgroundColor: 'rgba(52,211,153,0.08)' }]}>
              <Ionicons name="trending-up" size={20} color={C.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickStatsValue, { color: C.success }]}>{growthPercentage > 0 ? `+${growthPercentage}%` : '0%'}</Text>
              <Text style={styles.quickStatsLabel}>O'tgan oyga nisbatan</Text>
            </View>
          </View>
          <View style={styles.quickStatsCard}>
            <View style={[styles.quickStatsIcon, { backgroundColor: 'rgba(251,191,36,0.08)' }]}>
              <Ionicons name="star" size={20} color={C.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickStatsValue, { color: C.warning }]}>{avgRating > 0 ? avgRating.toFixed(1) : '0.0'}</Text>
              <Text style={styles.quickStatsLabel}>
                {totalReviews > 0 ? `${totalReviews} ta sharh` : 'Sharhlar yo\'q'}
              </Text>
            </View>
          </View>
        </View>

        {/* Rating Details */}
        {ratingStars.total > 0 && (
          <View style={styles.ratingContainer}>
            <View style={styles.ratingHeader}>
              <Ionicons name="star" size={18} color={C.warning} />
              <Text style={styles.ratingTitle}>Sharhlar tahlili</Text>
              <Text style={styles.ratingTotal}>{ratingStars.total} ta sharh</Text>
            </View>
            <View style={styles.ratingBars}>
              {[
                { label: '5 ★', count: ratingStars.five, color: C.success },
                { label: '4 ★', count: ratingStars.four, color: C.primary },
                { label: '3 ★', count: ratingStars.three, color: C.warning },
                { label: '2 ★', count: ratingStars.two, color: '#FB923C' },
                { label: '1 ★', count: ratingStars.one, color: C.danger },
              ].map((item) => (
                <View key={item.label} style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>{item.label}</Text>
                  <View style={styles.ratingBar}>
                    <View style={[styles.ratingBarFill, { width: ratingStars.total > 0 ? (item.count / ratingStars.total) * 100 : 0, backgroundColor: item.color }]} />
                  </View>
                  <Text style={styles.ratingCount}>{item.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tip Card */}
        <View style={styles.tipCard}>
          <LinearGradient colors={['rgba(56,189,248,0.05)', 'rgba(10,13,20,0.01)'] as const} style={styles.tipGradient}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb" size={22} color={C.primary} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Maslahat</Text>
              <Text style={styles.tipText}>
                Yuqori sifatli (4K) rasmlar joylash e'lonlarning mijozlarga ko'rinish darajasini 3.5 barobargacha oshiradi.
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={{ height: Platform.OS === 'ios' ? 120 : 80 }} />
      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PADDING_HORIZONTAL,
    paddingTop: Platform.OS === 'ios' ? 24 : 44,
    paddingBottom: 20,
  },
  headerGreeting: {
    fontSize: isSmallPhone ? 12 : 13,
    color: C.textLight,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerName: {
    fontSize: isTablet ? 32 : isSmallPhone ? 22 : 26,
    fontWeight: '800',
    color: C.text,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBtn: {
    position: 'relative',
  },
  notificationBtnGrad: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.danger,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  headerAvatar: {
    position: 'relative',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  headerAvatarGrad: {
    width: isTablet ? 48 : 44,
    height: isTablet ? 48 : 44,
    borderRadius: isTablet ? 24 : 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.success,
    borderWidth: 2,
    borderColor: C.bg,
  },

  // Hero Banner
  heroWrapper: {
    paddingHorizontal: PADDING_HORIZONTAL,
    marginBottom: 26,
  },
  heroBanner: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  heroContent: {
    padding: isTablet ? 28 : 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1,
    paddingRight: 10,
  },
  heroTitle: {
    fontSize: 11,
    color: C.textLighter,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  heroSubtitle: {
    fontSize: isTablet ? 26 : 22,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  heroProgress: {
    width: '85%',
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    marginTop: 14,
    overflow: 'hidden',
  },
  heroProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  heroText: {
    fontSize: 12,
    color: C.textLight,
    fontWeight: '500',
    marginTop: 8,
  },
  heroIconContainer: {
    width: isTablet ? 76 : 56,
    height: isTablet ? 76 : 56,
    borderRadius: isTablet ? 38 : 28,
    backgroundColor: 'rgba(255,255,255,0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  // Stats Section (qolgan style'lar o'zgarishsiz)
  statsSection: {
    paddingHorizontal: PADDING_HORIZONTAL,
    marginBottom: 26,
  },
  sectionHeaderRow: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: C.textLighter,
    marginTop: 2,
  },
  mainStats: {
    flexDirection: 'row',
    backgroundColor: C.bgCard,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  mainStatCard: {
    flex: 1,
    alignItems: 'center',
  },
  mainStatLabel: {
    fontSize: 12,
    color: C.textLight,
    fontWeight: '500',
  },
  mainStatValue: {
    fontSize: isTablet ? 36 : isSmallPhone ? 24 : 28,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  mainStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: C.border,
    alignSelf: 'center',
  },
  ringsRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  ringWrapper: {
    flex: 1,
  },
  ringCard: {
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  ringGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ringTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ringIcon: {
    width: isTablet ? 44 : 36,
    height: isTablet ? 44 : 36,
    borderRadius: isTablet ? 22 : 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringTitle: {
    fontSize: 12,
    color: C.textLight,
    fontWeight: '500',
  },
  ringValue: {
    fontSize: isTablet ? 26 : 20,
    fontWeight: '800',
  },
  ringProgress: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  ringProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  featuresSection: {
    paddingHorizontal: PADDING_HORIZONTAL,
    marginBottom: 26,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  featureCard: {
    backgroundColor: C.bgCard,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: isSmallPhone ? 11 : 12,
    fontWeight: '600',
    color: C.text,
  },
  bookingsSection: {
    paddingHorizontal: PADDING_HORIZONTAL,
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    color: C.primary,
    fontWeight: '600',
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  bookingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  bookingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookingAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  bookingGuest: {
    fontSize: 12,
    color: C.textLight,
    marginTop: 1,
  },
  bookingDate: {
    fontSize: 11,
    color: C.textLighter,
    marginTop: 2,
  },
  bookingRight: {
    alignItems: 'flex-end',
  },
  bookingPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
  },
  bookingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    color: C.success,
    fontWeight: '500',
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: PADDING_HORIZONTAL,
    gap: GRID_GAP,
    marginBottom: 26,
  },
  quickStatsCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  quickStatsIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStatsValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  quickStatsLabel: {
    fontSize: 11,
    color: C.textLighter,
    marginTop: 1,
  },
  ratingContainer: {
    marginHorizontal: PADDING_HORIZONTAL,
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 16,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: C.border,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  ratingTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  ratingTotal: {
    fontSize: 11,
    color: C.textLight,
  },
  ratingBars: {
    gap: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingLabel: {
    width: 35,
    fontSize: 11,
    color: C.textLight,
  },
  ratingBar: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  ratingCount: {
    width: 30,
    fontSize: 11,
    color: C.textLight,
    textAlign: 'right',
  },
  tipCard: {
    marginHorizontal: PADDING_HORIZONTAL,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.08)',
  },
  tipGradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56,189,248,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginBottom: 2,
  },
  tipText: {
    fontSize: 12,
    color: C.textLight,
    lineHeight: 16,
  },
})