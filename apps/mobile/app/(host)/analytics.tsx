// app/(host)/analytics.tsx

import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Animated, TouchableOpacity, Platform } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'

const { width } = Dimensions.get('window')
const isTablet = width >= 768
const isSmall = width <= 375

const rf = (n: number) => isTablet ? n * 1.15 : isSmall ? n * 0.9 : n
const rs = (n: number) => isTablet ? n * 1.2 : isSmall ? n * 0.85 : n

// Premium Dark Cyber Palette
const C = {
  bg: '#0A0D14',
  card: 'rgba(16, 20, 30, 0.65)',
  inputBg: 'rgba(255, 255, 255, 0.02)',
  primary: '#38BDF8',         // Neon Havorang
  primaryGradient: ['#00F2FE', '#4FACFE'] as const,
  accent: '#A78BFA',          // Neon Binafsha
  accentGradient: ['#C084FC', '#8B5CF6'] as const,
  success: '#34D399',         // Neon Yashil
  warning: '#FBBF24',         // Neon Sariq
  danger: '#FF3B30',          // Neon Qizil
  text: '#F3F4F6',
  textLight: '#9CA3AF',
  textMuted: '#4B5563',
  border: 'rgba(255, 255, 255, 0.06)',
}

function StatCard({ title, value, icon, color, trend, trendValue }: any) {
  const scaleAnim = useRef(new Animated.Value(0.95)).current

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 9 }).start()
  }, [])

  return (
    <Animated.View style={[styles.statCard, { transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient colors={[color + '06', 'transparent']} style={styles.statCardGradient} />
      <View style={[styles.statIcon, { backgroundColor: color + '12' }]}>
        <Ionicons name={icon} size={rf(20)} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {trend && (
        <View style={[styles.trendBadge, { backgroundColor: trend === 'up' ? C.success + '12' : C.danger + '12' }]}>
          <Ionicons name={trend === 'up' ? 'trending-up' : 'trending-down'} size={11} color={trend === 'up' ? C.success : C.danger} />
          <Text style={[styles.trendText, { color: trend === 'up' ? C.success : C.danger }]}>{trendValue}</Text>
        </View>
      )}
    </Animated.View>
  )
}

function ChartBar({ label, value, maxValue, color }: any) {
  const widthAnim = useRef(new Animated.Value(0)).current
  const percent = maxValue > 0 ? (value / maxValue) * 100 : 0

  useEffect(() => {
    Animated.timing(widthAnim, { toValue: percent, duration: 1000, useNativeDriver: false }).start()
  }, [percent])

  return (
    <View style={styles.chartBarItem}>
      <Text style={styles.chartLabel}>{label}</Text>
      <View style={styles.chartBarBg}>
        <Animated.View 
          style={[
            styles.chartBarFill, 
            { 
              width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), 
              backgroundColor: color 
            }
          ]} 
        />
      </View>
      <Text style={styles.chartValue}>{Math.round(value)}%</Text>
    </View>
  )
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const [selectedPeriod, setSelectedPeriod] = useState('week')

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
  }, [])

  const { data: stats, isLoading } = useQuery({
    queryKey: ['host-stats'],
    queryFn: async () => {
      const { data } = await api.get('/host/stats')
      return data
    },
  })

  const { data: ratingSummary } = useQuery({
    queryKey: ['host-rating-summary'],
    queryFn: async () => {
      const { data } = await api.get('/host/rating-summary')
      return data
    },
  })

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    )
  }

  const totalListings = stats?.listings?.total || 0
  const approvedListings = stats?.listings?.approved || 0
  const pendingListings = stats?.listings?.pending || 0
  const totalRevenue = stats?.revenue || 0
  const totalBookings = stats?.bookings?.total || 0
  const avgRating = ratingSummary?.avgRating || 0
  const totalReviews = ratingSummary?.totalReviews || 0

  const occupancyRate = totalListings > 0 ? Math.round((totalBookings / (totalListings * 30)) * 100) : 0
  const approvalRate = totalListings > 0 ? Math.round((approvedListings / totalListings) * 100) : 0
  const growthRate = totalBookings > 0 ? Math.min(99, Math.floor(totalBookings * 2.3)) : 0

  const periods = [
    { id: 'week', label: 'Hafta' },
    { id: 'month', label: 'Oy' },
    { id: 'year', label: 'Yil' },
  ]

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header Container */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top || 12 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analitika tahlili</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Period Selector Tabs */}
        <View style={styles.periodSelector}>
          {periods.map((period) => {
            const isActive = selectedPeriod === period.id
            return (
              <TouchableOpacity
                key={period.id}
                style={[styles.periodBtn, isActive && styles.periodBtnActive]}
                onPress={() => setSelectedPeriod(period.id)}
                activeOpacity={0.75}
              >
                {isActive && <LinearGradient colors={C.primaryGradient} style={StyleSheet.absoluteFillObject} />}
                <Text style={[styles.periodText, isActive && styles.periodTextActive]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Row 1: Listings Overview */}
        <View style={styles.statsRow}>
          <StatCard title="Jami e'lonlar" value={totalListings} icon="apps-outline" color={C.primary} />
          <StatCard title="Tasdiqlangan" value={approvedListings} icon="checkmark-circle-outline" color={C.success} />
          <StatCard title="Kutilmoqda" value={pendingListings} icon="time-outline" color={C.warning} />
        </View>

        {/* Row 2: Finance & Activity */}
        <View style={styles.statsRow}>
          <StatCard title="Umumiy daromad" value={`$${totalRevenue.toLocaleString()}`} icon="wallet-outline" color={C.success} trend="up" trendValue="+12.4%" />
          <StatCard title="Jami bronlar" value={totalBookings} icon="calendar-outline" color={C.accent} trend="up" trendValue="+8.2%" />
          <StatCard title="O'rtacha reyting" value={avgRating > 0 ? avgRating.toFixed(1) : '0.0'} icon="star-outline" color={C.warning} />
        </View>

        {/* Charts & Indicators */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Asosiy ko'rsatkichlar</Text>
          
          <View style={styles.dualCardRow}>
            {/* Occupancy Rate Circle */}
            <View style={[styles.chartCard, { flex: 1, alignItems: 'center' }]}>
              <Text style={styles.chartCardTitle}>Bandlik darajasi</Text>
              <View style={styles.circleOuter}>
                <LinearGradient colors={C.primaryGradient} style={styles.circleGradient}>
                  <View style={styles.circleInner}>
                    <Text style={styles.circlePercent}>{occupancyRate}%</Text>
                  </View>
                </LinearGradient>
              </View>
              <Text style={styles.chartCardFooter}>Joriy oy hisobidan</Text>
            </View>

            {/* Growth Rate Circle */}
            <View style={[styles.chartCard, { flex: 1, alignItems: 'center' }]}>
              <Text style={styles.chartCardTitle}>O'sish ko'rsatkichi</Text>
              <View style={styles.circleOuter}>
                <LinearGradient colors={C.accentGradient} style={styles.circleGradient}>
                  <View style={styles.circleInner}>
                    <Text style={styles.circlePercent}>+{growthRate}%</Text>
                  </View>
                </LinearGradient>
              </View>
              <Text style={styles.chartCardFooter}>O'tgan oyga nisbatan</Text>
            </View>
          </View>

          {/* Bar Chart: Verification Flow */}
          <View style={styles.chartCard}>
            <Text style={styles.chartCardTitle}>E'lonlar holati nisbati</Text>
            <ChartBar label="Tasdiqlangan" value={approvalRate} maxValue={100} color={C.success} />
            <ChartBar label="Kutilayotgan" value={100 - approvalRate} maxValue={100} color={C.warning} />
          </View>
        </View>

        {/* Rating Analysis Breakdown */}
        {totalReviews > 0 && (
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Sharhlar tahlili</Text>
            <View style={styles.ratingCard}>
              <Text style={styles.ratingAvg}>{avgRating.toFixed(1)}</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Ionicons 
                    key={star} 
                    name={star <= Math.round(avgRating) ? 'star' : 'star-outline'} 
                    size={18} 
                    color={C.warning} 
                  />
                ))}
              </View>
              <Text style={styles.ratingCount}>Jami {totalReviews} ta bildirilgan fikrlar</Text>
            </View>
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: C.bg 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: C.bg 
  },
  
  // Header section
  headerWrapper: {
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 16,
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    marginBottom: 16 
  },
  backBtn: { 
    width: 38, 
    height: 38, 
    borderRadius: 12, 
    backgroundColor: C.card, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  headerTitle: { 
    fontSize: 19, 
    fontWeight: '700', 
    color: C.text,
    letterSpacing: -0.4,
  },
  
  // Period Switcher Selector
  periodSelector: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 8, 
    paddingHorizontal: 16 
  },
  periodBtn: { 
    flex: 1,
    paddingVertical: 9, 
    borderRadius: 12, 
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    position: 'relative',
  },
  periodBtnActive: { 
    borderColor: 'transparent',
  },
  periodText: { 
    color: C.textLight, 
    fontSize: 13.5,
    fontWeight: '500',
  },
  periodTextActive: { 
    color: '#0A0D14', 
    fontWeight: '700' 
  },

  // Main Scroll Container
  scrollContent: { 
    padding: 16, 
    gap: 12 
  },
  statsRow: { 
    flexDirection: 'row', 
    gap: 10 
  },
  
  // Custom Stat Card
  statCard: { 
    flex: 1, 
    backgroundColor: C.card, 
    borderRadius: 18, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: C.border, 
    overflow: 'hidden',
    position: 'relative',
  },
  statCardGradient: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0 
  },
  statIcon: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  statValue: { 
    fontSize: rf(19), 
    fontWeight: '800', 
    color: C.text,
    letterSpacing: -0.5,
  },
  statTitle: { 
    fontSize: 11, 
    color: C.textLight, 
    marginTop: 3,
    fontWeight: '500',
  },
  trendBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 3, 
    alignSelf: 'flex-start', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 8, 
    marginTop: 8 
  },
  trendText: { 
    fontSize: 10, 
    fontWeight: '700' 
  },

  // Charts Blocks
  chartSection: { 
    gap: 12,
    marginTop: 6,
  },
  dualCardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: C.text, 
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  chartCard: { 
    backgroundColor: C.card, 
    borderRadius: 18, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: C.border 
  },
  chartCardTitle: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: C.textLight, 
    marginBottom: 14 
  },
  chartCardFooter: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 10,
    fontWeight: '500',
  },

  // Progress Bar Styles
  chartBarItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    marginBottom: 6,
    marginTop: 4,
  },
  chartLabel: { 
    width: 80, 
    fontSize: 12.5, 
    color: C.textLight,
    fontWeight: '500',
  },
  chartBarBg: { 
    flex: 1, 
    height: 7, 
    backgroundColor: 'rgba(255,255,255,0.04)', 
    borderRadius: 4, 
    overflow: 'hidden' 
  },
  chartBarFill: { 
    height: '100%', 
    borderRadius: 4 
  },
  chartValue: { 
    width: 38, 
    fontSize: 12.5, 
    color: C.text, 
    fontWeight: '600',
    textAlign: 'right' 
  },

  // Circle Graphs Design
  circleOuter: { 
    width: rs(96), 
    height: rs(96), 
    borderRadius: rs(48), 
    backgroundColor: 'rgba(255,255,255,0.02)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  circleGradient: { 
    width: rs(84), 
    height: rs(84), 
    borderRadius: rs(42), 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 2,
  },
  circleInner: { 
    width: '100%', 
    height: '100%', 
    borderRadius: rs(40), 
    backgroundColor: '#10141E', // Match exact card depth background
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  circlePercent: { 
    fontSize: rf(18), 
    fontWeight: '800', 
    color: C.text,
    letterSpacing: -0.5,
  },

  // Reviews Structure
  ratingSection: { 
    gap: 10,
    marginTop: 6,
  },
  ratingCard: { 
    backgroundColor: C.card, 
    borderRadius: 18, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: C.border, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingAvg: { 
    fontSize: rf(44), 
    fontWeight: '900', 
    color: C.warning,
    letterSpacing: -1,
    lineHeight: rf(48),
  },
  ratingStars: { 
    flexDirection: 'row', 
    gap: 4, 
    marginVertical: 10 
  },
  ratingCount: { 
    fontSize: 12.5, 
    color: C.textLight,
    fontWeight: '500',
  },
})