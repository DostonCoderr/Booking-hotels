// app/(host)/_layout.tsx

import { useEffect, useRef, useState } from 'react'
import { Tabs, router } from 'expo-router'
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  Dimensions, Platform, Modal, TouchableWithoutFeedback,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import AboutModal from './about' // ✅ AboutModal import qilindi
import { api } from '@/services/api'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const isTablet = SCREEN_WIDTH >= 768
const isSmallPhone = SCREEN_WIDTH <= 375

// Premium Dark Cyber Palette
const C = {
  bg: '#0A0D14',              
  bgCard: 'rgba(16, 20, 30, 0.75)', 
  primary: '#38BDF8',         
  primaryGradient: ['#00F2FE', '#4FACFE'] as const,
  accentGradient: ['#F43F5E', '#FF2E93'] as const,
  text: '#F3F4F6',
  textLight: '#9CA3AF',
  textLighter: '#6B7280',
  border: 'rgba(255, 255, 255, 0.05)',
  danger: '#FF3B30',
  dangerBg: 'rgba(255, 59, 48, 0.12)',
}

// Responsive helpers
const rf = (base: number) => {
  if (isTablet) return base * 1.15
  if (isSmallPhone) return base * 0.9
  return Math.round(base)
}

const rs = (base: number) => {
  if (isTablet) return base * 1.15
  if (isSmallPhone) return base * 0.9
  return Math.round(base)
}

// Dinamik ustun kengliklari parametrlari
// Bir qatorga maksimal 3 ta sig'ishi uchun minimal o'lcham belgilaymiz
const MENU_ITEM_MIN_WIDTH = (SCREEN_WIDTH - rs(40)) / 3
const MENU_ITEM_MAX_WIDTH = (SCREEN_WIDTH - rs(24)) / 2 // 1 yoki 2 ta qolganda o'ta cho'zilib ketmasligi uchun

// Tab config
const TABS_CONFIG: Record<string, { label: string; icon: string; iconFocused: string; center?: boolean }> = {
  index:       { label: 'Dashboard', icon: 'stats-chart-outline', iconFocused: 'stats-chart', center: false },
  listings:    { label: 'E\'lonlar', icon: 'home-outline', iconFocused: 'home', center: false },
  'add-listing': { label: "Qo'shish", icon: 'add-circle-outline', iconFocused: 'add-circle', center: true },
  bookings:    { label: 'Bronlar', icon: 'calendar-outline', iconFocused: 'calendar', center: false },
}

// Menu items for More button
const MENU_ITEMS = [
  { id: 'profile', label: 'Profil', icon: 'person-outline', color: '#F43F5E', route: 'profile' },
  { id: 'messages', label: 'Xabarlar', icon: 'chatbubble-outline', color: '#00F2FE', route: 'messages' },
  { id: 'analytics', label: 'Analitika', icon: 'pie-chart-outline', color: '#FBBF24', route: 'analytics' },
  { id: 'settings', label: 'Sozlamalar', icon: 'settings-outline', color: '#A78BFA', route: 'settings' },
  { id: 'support', label: 'Yordam', icon: 'help-circle-outline', color: '#34D399', route: 'support' },
  { id: 'about', label: 'Ilova haqida', icon: 'information-circle-outline', color: '#818CF8', route: 'about' },
]

// ─────────────────────────────────────────────
// More Menu Modal Component
// ─────────────────────────────────────────────
function MoreMenuModal({ visible, onClose, onNavigate }: any) {
  const slideAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 10 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start()
    }
  }, [visible])

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
        
        <Animated.View 
          style={[
            styles.menuContainer, 
            { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [450, 0] }) }] }
          ]}
        >
          {Platform.OS === 'ios' && <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />}
          
          <View style={styles.menuHandle} />
          
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Menyu</Text>
            <TouchableOpacity onPress={onClose} style={styles.menuCloseBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={rf(18)} color={C.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.menuGrid}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => {
                  onClose()
                  setTimeout(() => onNavigate(item.route), 150)
                }}
                activeOpacity={0.75}
              >
                <LinearGradient colors={[item.color + '08', 'transparent']} style={StyleSheet.absoluteFillObject} />
                <View style={[styles.menuItemIcon, { backgroundColor: item.color + '12' }]}>
                  <Ionicons name={item.icon as any} size={rf(20)} color={item.color} />
                </View>
                <Text style={styles.menuItemLabel} numberOfLines={1}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.menuFooter}>
            <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={() => {
              onClose()
              setTimeout(() => {
                const { useAuthStore } = require('@/stores/authStore')
                useAuthStore.getState().logout()
              }, 150)
            }}>
              <Ionicons name="log-out-outline" size={rf(18)} color={C.danger} />
              <Text style={styles.logoutText}>Tizimdan chiqish</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>Versiya 1.0.0</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

// ─────────────────────────────────────────────
// Custom Tab Bar Component
// ─────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets()
  const [menuVisible, setMenuVisible] = useState(false)
  const [aboutVisible, setAboutVisible] = useState(false) 

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['host-pending-bookings'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/bookings/host?status=pending')
        return Array.isArray(data) ? data.length : 0
      } catch { return 0 }
    },
    refetchInterval: 30000,
  })

  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ['host-unread-messages'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/messages/unread/count')
        return data.count || 0
      } catch { return 0 }
    },
    refetchInterval: 30000,
  })

  const handleNavigate = (route: string) => {
    if (route === 'about') {
      setAboutVisible(true) 
    } else {
      router.push(`/(host)/${route}`)
    }
  }

  const tabRoutes = ['index', 'listings', 'add-listing', 'bookings']

  return (
    <>
      <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom || rs(12) }]}>
        {Platform.OS === 'ios' && <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFillObject} />}
        <View style={styles.tabBarInner}>
          {state.routes.map((route: any, index: number) => {
            const routeName = route.name
            if (!tabRoutes.includes(routeName)) return null
            
            const config = TABS_CONFIG[routeName]
            if (!config) return null
            
            const isFocused = state.index === index
            const badge = routeName === 'bookings' && pendingCount > 0 ? pendingCount : 0
            
            const onPress = () => {
              if (!isFocused) {
                navigation.navigate(routeName)
              }
            }

            const iconName = isFocused ? config.iconFocused : config.icon
            const iconColor = isFocused ? C.primary : C.textLight

            if (config.center) {
              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  style={styles.centerButtonWrapper}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={C.primaryGradient} style={styles.centerButton}>
                    <Ionicons name="add" size={rf(26)} color="#0A0D14" />
                  </LinearGradient>
                  <Text style={[styles.tabLabel, { marginTop: rs(4), fontWeight: '600' }]}>
                    {config.label}
                  </Text>
                </TouchableOpacity>
              )
            }

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons name={iconName as any} size={rf(20)} color={iconColor} />
                  {badge > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]} numberOfLines={1}>
                  {config.label}
                </Text>
                {isFocused && <View style={styles.activeDot} />}
              </TouchableOpacity>
            )
          })}

          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name="apps-outline" size={rf(20)} color={menuVisible ? C.primary : C.textLight} />
              {unreadMessages > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadMessages > 99 ? '99+' : unreadMessages}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, menuVisible && styles.tabLabelActive]} numberOfLines={1}>
              Yana
            </Text>
            {menuVisible && <View style={styles.activeDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <MoreMenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={handleNavigate}
      />

      <AboutModal
        visible={aboutVisible}
        onClose={() => setAboutVisible(false)}
      />
    </>
  )
}

export default function HostLayout() {
  return (
    <View style={styles.layoutContainer}>
      <Tabs tabBar={props => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="listings" options={{ title: 'E\'lonlar' }} />
        <Tabs.Screen name="add-listing" options={{ title: "Qo'shish" }} />
        <Tabs.Screen name="bookings" options={{ title: 'Bronlar' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', href: null }} />
        <Tabs.Screen name="messages" options={{ title: 'Messages', href: null }} />
        <Tabs.Screen name="analytics" options={{ title: 'Analytics', href: null }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings', href: null }} />
        <Tabs.Screen name="support" options={{ title: 'Support', href: null }} />
        <Tabs.Screen name="about" options={{ title: 'About', href: null }} />
      </Tabs>
    </View>
  )
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  layoutContainer: {
    flex: 1,
    backgroundColor: C.bg,
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(10, 13, 20, 0.85)' : '#0A0D14',
    borderTopWidth: 1,
    borderTopColor: C.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 24 },
    }),
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: isTablet ? rs(24) : rs(6),
    height: rs(62),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(3),
    paddingVertical: rs(4),
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: rs(22),
    width: rs(22),
  },
  activeDot: {
    width: rs(4),
    height: rs(4),
    borderRadius: rs(2),
    backgroundColor: C.primary,
    position: 'absolute',
    bottom: rs(-5),
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: rs(-4),
    right: rs(-8),
    minWidth: rs(16),
    height: rs(16),
    borderRadius: rs(8),
    backgroundColor: C.danger,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: rs(3),
    borderWidth: 1.5,
    borderColor: '#0A0D14',
  },
  badgeText: {
    color: '#fff',
    fontSize: rf(8),
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: rf(isSmallPhone ? 9 : 10),
    color: C.textLight,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: C.primary,
    fontWeight: '700',
  },
  centerButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(-22),
  },
  centerButton: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(24),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: C.bg,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },

  // Modal BackDrop
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.65)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(16, 20, 30, 0.94)' : '#10141E',
    borderTopLeftRadius: rs(24),
    borderTopRightRadius: rs(24),
    borderWidth: 1,
    borderColor: C.border,
    paddingBottom: Platform.OS === 'ios' ? rs(30) : rs(20),
    overflow: 'hidden',
  },
  menuHandle: {
    width: rs(36),
    height: rs(4),
    borderRadius: rs(2),
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'center',
    marginTop: rs(10),
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  menuTitle: {
    fontSize: rf(16),
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
  },
  menuCloseBtn: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(15),
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },

  // Dynamic Grid System (Smart Responsive)
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: rs(12),
    gap: rs(8),
  },
  menuItem: {
    // flexGrow: 1 orqali oxirgi qatorda kam element qolsa kengayadi
    flexGrow: 1,
    // Baza o'lchami har doim qatorda 3 ta bo'lishini ta'minlaydi
    minWidth: MENU_ITEM_MIN_WIDTH,
    // 1 ta qolganda o'ta haddan tashqari cho'zilib ketishini cheklaydi
    maxWidth: MENU_ITEM_MAX_WIDTH,
    alignItems: 'center',
    paddingVertical: rs(12),
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
  },
  menuItemIcon: {
    width: rs(42),
    height: rs(42),
    borderRadius: rs(21),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rs(6),
  },
  menuItemLabel: {
    fontSize: rf(11),
    fontWeight: '500',
    color: C.text,
    paddingHorizontal: 4,
    textAlign: 'center'
  },
  menuFooter: {
    paddingHorizontal: rs(16),
    paddingTop: rs(8),
    gap: rs(10),
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    paddingVertical: rs(11),
    borderRadius: rs(12),
    backgroundColor: C.dangerBg,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.15)',
  },
  logoutText: {
    color: C.danger,
    fontSize: rf(13),
    fontWeight: '600',
  },
  versionText: {
    color: C.textLighter,
    fontSize: rf(10.5),
    textAlign: 'center',
    marginTop: 2,
  },
})