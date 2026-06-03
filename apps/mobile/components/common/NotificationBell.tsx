import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef } from 'react'
import { router } from 'expo-router'
import { useNotificationStore } from '@/stores/notificationStore'
import { COLORS } from '@/constants/colors'

export function NotificationBell() {
  const { unreadCount, fetchUnreadCount, fetchNotifications } = useNotificationStore()
  const scaleAnim = useRef(new Animated.Value(1)).current
  const prevCount = useRef(0)

  useEffect(() => {
    fetchUnreadCount()
    
    const interval = setInterval(() => {
      const current = unreadCount
      if (current > prevCount.current) {
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.4,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
          }),
        ]).start()
      }
      prevCount.current = current
    }, 5000)
    
    return () => clearInterval(interval)
  }, [unreadCount])

  const handlePress = () => {
    fetchNotifications()
    router.push('/(tabs)/notifications')
  }

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container} activeOpacity={0.7}>
      <Ionicons name="notifications-outline" size={24} color={COLORS.dark} />
      {unreadCount > 0 && (
        <Animated.View style={[styles.badge, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 6,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
})