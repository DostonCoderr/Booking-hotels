// app/(admin)/_layout.tsx

import { Tabs } from 'expo-router'
import { View, Text, StyleSheet, Dimensions, Platform, TouchableOpacity, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'
import { router } from 'expo-router'
import { api } from '@/services/api'

const { width } = Dimensions.get('window')
const isTablet = width >= 768

const COLORS = {
  primary: '#7C4DFF',
  secondary: '#00E5FF',
  muted: '#8B93A7',
}

// ============================================
// Floating Menu Component
// ============================================
function FloatingMenu({ visible, onClose, pending, onNavigate }: { 
  visible: boolean; 
  onClose: () => void; 
  pending: number;
  onNavigate: (route: string) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 0, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start()
    }
  }, [visible])

  if (!visible) return null

  const menuItems = [
    { id: 'notifications', label: 'Bildirishnomalar', icon: 'notifications-outline', color: '#FF3B30', badge: pending },
    { id: 'profile', label: 'Profil', icon: 'person-circle-outline', color: '#00E676', badge: 0 },
    { id: 'settings', label: 'Sozlamalar', icon: 'settings-outline', color: '#8B93A7', badge: 0 },
    { id: 'analytics', label: 'Analitika', icon: 'stats-chart-outline', color: '#00E5FF', badge: 0 },
    { id: 'support', label: 'Yordam', icon: 'help-circle-outline', color: '#FFB020', badge: 0 },
    { id: 'logout', label: 'Chiqish', icon: 'log-out-outline', color: '#FF3B30', badge: 0 },
  ]

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
      <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.floatingMenu, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => {
                onClose()
                setTimeout(() => {
                  if (item.id === 'logout') {
                    const { useAuthStore } = require('@/stores/authStore')
                    useAuthStore.getState().logout()
                  } else {
                    router.push(`/(admin)/${item.id}`)
                  }
                }, 200)
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
                {item.badge > 0 && (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.arrowDown} />
      </Animated.View>
    </Animated.View>
  )
}

// ============================================
// Custom Tab Bar Component
// ============================================
function CustomTabBar({ state, descriptors, navigation, pending }: any) {
  const [menuVisible, setMenuVisible] = useState(false)
  const TAB_HEIGHT = 65

  const tabItems = [
    { name: 'index', label: 'Home', iconOn: 'grid', iconOff: 'grid-outline' },
    { name: 'approvals', label: 'Approve', iconOn: 'shield-checkmark', iconOff: 'shield-checkmark-outline' },
    { name: 'users', label: 'Users', iconOn: 'people', iconOff: 'people-outline' },
    { name: 'listings', label: 'Listings', iconOn: 'storefront', iconOff: 'storefront-outline' },
  ]

  return (
    <>
      <View style={[styles.tabBarContainer, { height: TAB_HEIGHT }]}>
        <View style={styles.tabBarInner}>
          {tabItems.map((tab, index) => {
            const isFocused = state.index === index
            const iconName = isFocused ? tab.iconOn : tab.iconOff

            return (
              <TouchableOpacity
                key={tab.name}
                onPress={() => navigation.navigate(tab.name)}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <View>
                  <Ionicons name={iconName as any} size={22} color={isFocused ? COLORS.secondary : COLORS.muted} />
                  {tab.name === 'approvals' && pending > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{pending > 99 ? '99+' : pending}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tabLabel, { color: isFocused ? COLORS.secondary : COLORS.muted }]}>{tab.label}</Text>
              </TouchableOpacity>
            )
          })}

          {/* More Button */}
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.tabItem} activeOpacity={0.7}>
            <Ionicons name="menu-outline" size={22} color={menuVisible ? COLORS.secondary : COLORS.muted} />
            <Text style={[styles.tabLabel, { color: menuVisible ? COLORS.secondary : COLORS.muted }]}>More</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FloatingMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        pending={pending} 
        onNavigate={(route) => router.push(`/(admin)/${route}`)} 
      />
    </>
  )
}

// ============================================
// Main Admin Layout
// ============================================
export default function AdminLayout() {
  const insets = useSafeAreaInsets()

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats')
      return data
    },
    refetchInterval: 30000,
  })

  const pending = stats?.listings?.pending || 0

  return (
    <View style={{ flex: 1, backgroundColor: '#0B1020' }}>
      <View style={{ flex: 1 }}>
        <Tabs
          tabBar={(props) => <CustomTabBar {...props} pending={pending} />}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tabs.Screen name="index" options={{ title: 'Home' }} />
          <Tabs.Screen name="approvals" options={{ title: 'Approve' }} />
          <Tabs.Screen name="users" options={{ title: 'Users' }} />
          <Tabs.Screen name="listings" options={{ title: 'Listings' }} />
          <Tabs.Screen name="notifications" options={{ title: 'Notifications', href: null }} />
          <Tabs.Screen name="profile" options={{ title: 'Profile', href: null }} />
          <Tabs.Screen name="settings" options={{ title: 'Settings', href: null }} />
          <Tabs.Screen name="analytics" options={{ title: 'Analytics', href: null }} />
          <Tabs.Screen name="support" options={{ title: 'Support', href: null }} />
        </Tabs>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121A2F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  tabBarInner: {
    flexDirection: 'row',
    height: 65,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: isTablet ? 40 : 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabBadge: {
    position: 'absolute',
    top: -8,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#121A2F',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  
  // Floating Menu Styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlayTouch: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  floatingMenu: {
    position: 'absolute',
    bottom: 85,
    left: 20,
    right: 20,
    backgroundColor: '#121A2F',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  arrowDown: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 16,
    height: 16,
    backgroundColor: '#121A2F',
    transform: [{ rotate: '45deg' }],
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  menuItem: {
    width: (width - 72) / 3,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
  },
  menuIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  menuBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#121A2F',
  },
  menuBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  menuLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
})