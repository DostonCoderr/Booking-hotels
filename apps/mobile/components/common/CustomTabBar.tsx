import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, Animated, Modal, Platform,
  StatusBar
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { COLORS } from '@/constants/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRef, useEffect, useState, useCallback } from 'react'
import * as Haptics from 'expo-haptics'
import { router, useSegments } from 'expo-router'

const { width } = Dimensions.get('window')
const TAB_BAR_WIDTH = width - 24
const TAB_COUNT = 5
const TAB_WIDTH = (TAB_BAR_WIDTH - 16) / TAB_COUNT

// Tab definitions
const TABS = [
  { name: 'index', label: 'Bosh sahifa', icon: 'home-outline', activeIcon: 'home', badge: 0 },
  { name: 'search', label: 'Qidirish', icon: 'search-outline', activeIcon: 'search', badge: 0 },
  { name: 'center', label: 'Xizmatlar', icon: 'apps-outline', activeIcon: 'apps', badge: 0, isCenter: true },
  { name: 'wishlist', label: 'Saqlangan', icon: 'heart-outline', activeIcon: 'heart', badge: 0 },
  { name: 'profile', label: 'Profil', icon: 'person-outline', activeIcon: 'person', badge: 0 },
]

// Services for modal
const SERVICES = [
  { name: 'Xarita', icon: 'map-outline', color: '#FF385C', description: 'Joy qidirish', route: '/(tabs)/map' },
  { name: 'Sayohatlar', icon: 'airplane-outline', color: '#4CAF50', description: 'Trip tarixi', route: '/trips' },
  { name: 'Xabarlar', icon: 'chatbubble-outline', color: '#2196F3', description: 'Mezbon bilan', route: '/messages' },
  { name: "To'lovlar", icon: 'card-outline', color: '#FF9800', description: "Karta va pul", route: '/payments' },
  { name: 'Bronlar', icon: 'calendar-outline', color: '#9C27B0', description: 'Sizning bronlar', route: '/bookings' },
  { name: 'Sozlamalar', icon: 'settings-outline', color: '#607D8B', description: 'Ilova sozlash', route: '/settings' },
]

// Haptic feedback helper
const haptic = (style = Haptics.ImpactFeedbackStyle.Light) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style).catch(() => {})
  }
}

interface TabBarProps {
  state: any
  descriptors: any
  navigation: any
}

export function CustomTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets()
  const segments = useSegments()
  
  // Animations
  const indicatorAnim = useRef(new Animated.Value(state.index)).current
  const scaleAnims = useRef(TABS.map((_, i) => new Animated.Value(i === state.index ? 1 : 0))).current
  const sheetAnim = useRef(new Animated.Value(500)).current
  const overlayAnim = useRef(new Animated.Value(0)).current
  const bounceAnim = useRef(new Animated.Value(0)).current
  
  const [modalVisible, setModalVisible] = useState(false)
  const [lastTap, setLastTap] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)

  // Update wishlist badge count
  useEffect(() => {
    const fetchWishlistCount = async () => {
      try {
        const { data } = await import('@/services/api').then(mod => mod.api.get('/wishlist'))
        setWishlistCount(data.length)
      } catch (error) {
        console.error('Failed to fetch wishlist count:', error)
      }
    }
    fetchWishlistCount()
  }, [])

  // Update active tab
  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: state.index,
      useNativeDriver: true,
      tension: 65,
      friction: 9,
    }).start()
    
    TABS.forEach((_, i) => {
      Animated.spring(scaleAnims[i], {
        toValue: i === state.index ? 1 : 0,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }).start()
    })
    
    // Bounce animation for center tab when modal closes
    if (!modalVisible && state.index === 2) {
      Animated.sequence([
        Animated.spring(bounceAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 5 }),
        Animated.spring(bounceAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 5 }),
      ]).start()
    }
  }, [state.index, modalVisible])

  const indicatorX = indicatorAnim.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * TAB_WIDTH),
  })

  // Modal handlers
  const openModal = useCallback(() => {
    haptic()
    setModalVisible(true)
    StatusBar.setBarStyle('light-content')
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
    ]).start()
  }, [])

  const closeModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(sheetAnim, { toValue: 500, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setModalVisible(false)
      StatusBar.setBarStyle('dark-content')
    })
  }, [])

  // Tab press handler
  const onPress = useCallback((tabName: string, index: number) => {
    haptic()
    
    if (tabName === 'center') {
      openModal()
      return
    }

    const now = Date.now()
    if (now - lastTap < 300 && state.routes[index]?.name === state.routes[state.index]?.name) {
      navigation.emit({ type: 'scrollToTop', target: state.routes[index]?.key })
    }
    setLastTap(now)

    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes[index]?.key,
      canPreventDefault: true,
    })
    
    if (!event.defaultPrevented) {
      navigation.navigate(tabName)
    }
  }, [lastTap, navigation, state, openModal])

  // Get current badge for wishlist
  const getBadge = (tab: typeof TABS[0]) => {
    if (tab.name === 'wishlist') return wishlistCount
    return tab.badge
  }

  return (
    <>
      {/* Tab Bar Container */}
      <View style={[styles.tabBarWrapper, { paddingBottom: insets.bottom || 12 }]} pointerEvents="box-none">
        <View style={styles.tabBar}>
          {/* Sliding Indicator */}
          <Animated.View style={[styles.indicator, { transform: [{ translateX: indicatorX }] }]} />
          
          {/* Tabs */}
          {TABS.map((tab, index) => {
            const isFocused = state.index === index
            const iconScale = scaleAnims[index].interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.15]
            })
            const labelColor = scaleAnims[index].interpolate({
              inputRange: [0, 1],
              outputRange: [COLORS.gray, COLORS.primary]
            })
            const badge = getBadge(tab)
            
            // Center Tab (Xizmatlar)
            if (tab.isCenter) {
              return (
                <TouchableOpacity
                  key={tab.name}
                  style={styles.centerTab}
                  onPress={() => onPress(tab.name, index)}
                  activeOpacity={0.85}
                >
                  <Animated.View style={[
                    styles.centerWrapper,
                    { transform: [{ scale: bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }] }
                  ]}>
                    <View style={styles.centerGlow} />
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryDark]}
                      style={styles.centerButton}
                    >
                      <Ionicons
                        name={modalVisible ? 'close' : (tab.icon as any)}
                        size={26}
                        color="#fff"
                      />
                    </LinearGradient>
                  </Animated.View>
                  <Animated.Text style={[styles.tabLabel, { color: labelColor, marginTop: 4 }]}>
                    {tab.label}
                  </Animated.Text>
                </TouchableOpacity>
              )
            }
            
            // Regular Tabs
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tabItem}
                onPress={() => onPress(tab.name, index)}
                activeOpacity={0.7}
              >
                <Animated.View style={[
                  styles.iconContainer,
                  isFocused && styles.iconContainerActive,
                  { transform: [{ scale: iconScale }] }
                ]}>
                  <Ionicons
                    name={isFocused ? (tab.activeIcon as any) : (tab.icon as any)}
                    size={isFocused ? 23 : 21}
                    color={isFocused ? COLORS.primary : COLORS.gray}
                  />
                  {badge > 0 && !isFocused && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                    </View>
                  )}
                </Animated.View>
                <Animated.Text style={[styles.tabLabel, { color: labelColor }]}>
                  {tab.label}
                </Animated.Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Services Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        {/* Backdrop */}
        <Animated.View style={[styles.modalBackdrop, { opacity: overlayAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={closeModal} activeOpacity={1} />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetAnim }] }]}>
          {/* Handle Bar */}
          <View style={styles.sheetHandle} />

          {/* Header */}
          <LinearGradient
            colors={[COLORS.background, COLORS.surface]}
            style={styles.sheetHeader}
          >
            <View>
              <Text style={styles.sheetTitle}>Xizmatlar</Text>
              <Text style={styles.sheetSubtitle}>Kerakli bo'limni tanlang</Text>
            </View>
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={closeModal}>
              <Ionicons name="close" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          </LinearGradient>

          {/* Services Grid */}
          <View style={styles.servicesGrid}>
            {SERVICES.map((service, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.serviceCard}
                activeOpacity={0.7}
                onPress={() => {
                  haptic(Haptics.ImpactFeedbackStyle.Medium)
                  closeModal()
                  setTimeout(() => router.push(service.route as any), 200)
                }}
              >
                <LinearGradient
                  colors={[service.color + '15', service.color + '08']}
                  style={styles.serviceIconWrapper}
                >
                  <View style={[styles.serviceIconInner, { backgroundColor: service.color + '20' }]}>
                    <Ionicons name={service.icon as any} size={26} color={service.color} />
                  </View>
                </LinearGradient>
                <Text style={styles.serviceName} numberOfLines={1}>{service.name}</Text>
                <Text style={styles.serviceDesc} numberOfLines={1}>{service.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Quick Auth Row */}
          <View style={styles.quickAuthRow}>
            <TouchableOpacity
              style={styles.quickAuthBtn}
              onPress={() => {
                closeModal()
                setTimeout(() => router.push('/(auth)/login'), 200)
              }}
            >
              <Ionicons name="log-in-outline" size={18} color={COLORS.primary} />
              <Text style={styles.quickAuthText}>Kirish</Text>
            </TouchableOpacity>
            <View style={styles.quickAuthDivider} />
            <TouchableOpacity
              style={styles.quickAuthBtn}
              onPress={() => {
                closeModal()
                setTimeout(() => router.push('/(auth)/register'), 200)
              }}
            >
              <Ionicons name="person-add-outline" size={18} color={COLORS.primary} />
              <Text style={styles.quickAuthText}>Ro'yxatdan o'tish</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  // Tab Bar Styles
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    width: TAB_BAR_WIDTH,
    height: 68,
    backgroundColor: COLORS.white,
    borderRadius: 34,
    paddingHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  indicator: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: TAB_WIDTH,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '12',
  },
  
  // Regular Tab
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    zIndex: 1,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconContainerActive: {
    backgroundColor: COLORS.primary + '14',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.gray,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  
  // Center Tab
  centerTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  centerWrapper: {
    alignItems: 'center',
    marginTop: -32,
  },
  centerGlow: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary + '1A',
    top: -6,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  
  // Modal Styles
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 14,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 8,
  },
  serviceCard: {
    width: (width - 48) / 3,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 18,
    marginBottom: 4,
  },
  serviceIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  serviceIconInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
  },
  serviceDesc: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 2,
    textAlign: 'center',
  },
  
  // Quick Auth
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
    marginTop: 12,
  },
  quickAuthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickAuthBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
  },
  quickAuthText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quickAuthDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
})