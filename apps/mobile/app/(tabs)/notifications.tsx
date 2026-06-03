import { useState, useCallback, useEffect, useRef } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert, Animated,
  Dimensions, ScrollView, Modal, Pressable
} from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { Swipeable } from 'react-native-gesture-handler'
import { LinearGradient } from 'expo-linear-gradient'
import { useNotificationStore } from '@/stores/notificationStore'
import { Notification } from '@/types'
import { COLORS } from '@/constants/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width, height } = Dimensions.get('window')

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map())
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  
  const { 
    notifications, 
    isLoading, 
    fetchNotifications, 
    fetchUnreadCount,
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
  } = useNotificationStore()

  useEffect(() => {
    loadNotifications()
    animateIn()
  }, [])

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const loadNotifications = async () => {
    await fetchNotifications()
    await fetchUnreadCount()
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadNotifications()
    setRefreshing(false)
  }, [])

  const filteredNotifications = notifications.filter((notification: Notification) => {
    if (selectedFilter === 'all') return true
    if (selectedFilter === 'unread') return !notification.isRead
    return notification.type === selectedFilter
  })

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    
    setSelectedNotification(notification)
    setModalVisible(true)
  }

  const handleNavigate = () => {
    if (!selectedNotification) return
    
    setModalVisible(false)
    switch (selectedNotification.type) {
      case 'booking':
        router.push('/(tabs)/bookings')
        break
      case 'message':
        router.push('/(tabs)/messages')
        break
      case 'review':
        router.push('/(tabs)/trips')
        break
      case 'payment':
        router.push('/(tabs)/payments')
        break
      default:
        break
    }
  }

  const handleDelete = (id: string) => {
    Alert.alert(
      "Bildirishnomani o'chirish",
      "Bu bildirishnomani o'chirmoqchimisiz?",
      [
        { text: "Bekor qilish", style: "cancel" },
        { 
          text: "O'chirish", 
          style: "destructive",
          onPress: async () => {
            await deleteNotification(id)
          }
        }
      ]
    )
  }

  const handleDeleteAll = () => {
    if (notifications.length === 0) return
    
    Alert.alert(
      "Barcha bildirishnomalarni o'chirish",
      `Barcha (${notifications.length}) bildirishnomalarni o'chirmoqchimisiz?`,
      [
        { text: "Bekor qilish", style: "cancel" },
        { 
          text: "O'chirish", 
          style: "destructive",
          onPress: async () => {
            await deleteAllNotifications()
          }
        }
      ]
    )
  }

  const handleMarkAll = () => {
    const unread = notifications.filter((n: Notification) => !n.isRead).length
    if (unread === 0) {
      Alert.alert("Bildirishnomalar", "Barcha bildirishnomalar o'qilgan")
      return
    }
    
    Alert.alert(
      "Hammasini o'qish",
      `Barcha (${unread}) bildirishnomalarni o'qilgan deb belgilaysizmi?`,
      [
        { text: "Bekor qilish", style: "cancel" },
        { text: "Belgilash", onPress: () => markAllAsRead() }
      ]
    )
  }

  const renderRightActions = (id: string) => {
    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(id)}
      >
        <Ionicons name="trash-outline" size={24} color="#fff" />
        <Text style={styles.deleteText}>O'chirish</Text>
      </TouchableOpacity>
    )
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Hozir'
    if (minutes < 60) return `${minutes} minut`
    if (hours < 24) return `${hours} soat`
    if (days < 7) return `${days} kun`
    return d.toLocaleDateString('uz-UZ')
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return 'calendar'
      case 'message': return 'chatbubble'
      case 'review': return 'star'
      case 'payment': return 'card'
      default: return 'notifications'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking': return '#4CAF50'
      case 'message': return '#2196F3'
      case 'review': return '#FF9800'
      case 'payment': return '#9C27B0'
      default: return COLORS.primary
    }
  }

  const filters = [
    { id: 'all', label: 'Hammasi', icon: 'apps', count: notifications.length },
    { id: 'unread', label: "O'qilmagan", icon: 'mail-unread', count: notifications.filter(n => !n.isRead).length },
    { id: 'booking', label: 'Bronlar', icon: 'calendar', count: notifications.filter(n => n.type === 'booking').length },
    { id: 'message', label: 'Xabarlar', icon: 'chatbubble', count: notifications.filter(n => n.type === 'message').length },
  ]

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <Swipeable
      ref={(ref) => {
        if (ref) swipeableRefs.current.set(item.id, ref)
      }}
      renderRightActions={() => renderRightActions(item.id)}
      overshootRight={false}
    >
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.unread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[getNotificationColor(item.type) + '20', getNotificationColor(item.type) + '05']}
          style={styles.iconGradient}
        >
          <View style={styles.iconContainer}>
            <Ionicons 
              name={getNotificationIcon(item.type) as any} 
              size={24} 
              color={getNotificationColor(item.type)} 
            />
          </View>
        </LinearGradient>
        <View style={styles.content}>
          <Text style={[styles.title, !item.isRead && styles.unreadText]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={12} color={COLORS.gray} />
            <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
      </TouchableOpacity>
    </Swipeable>
  )

  if (isLoading && !notifications.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.background, COLORS.surface]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bildirishnomalar</Text>
          <View style={styles.headerActions}>
            {notifications.length > 0 && (
              <TouchableOpacity onPress={handleDeleteAll} style={styles.deleteAllBtn}>
                <Ionicons name="trash-outline" size={22} color={COLORS.gray} />
              </TouchableOpacity>
            )}
            {notifications.filter((n: Notification) => !n.isRead).length > 0 && (
              <TouchableOpacity onPress={handleMarkAll} style={styles.markAllBtn}>
                <Text style={styles.markAllText}>Hammasini o'qish</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterTab, selectedFilter === filter.id && styles.filterTabActive]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Ionicons 
              name={filter.icon as any} 
              size={18} 
              color={selectedFilter === filter.id ? COLORS.primary : COLORS.gray} 
            />
            <Text style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}>
              {filter.label}
            </Text>
            {filter.count > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filter.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Notifications List */}
      <Animated.FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          filteredNotifications.length === 0 && styles.emptyList
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={renderNotificationItem}
        ListEmptyComponent={() => (
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Ionicons name="notifications-off-outline" size={80} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>Bildirishnomalar yo'q</Text>
            <Text style={styles.emptyText}>
              Yangi bildirishnomalar kelganda bu yerda ko'rinadi
            </Text>
          </Animated.View>
        )}
      />

      {/* Notification Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={[getNotificationColor(selectedNotification?.type || 'system') + '15', COLORS.background]}
              style={styles.modalGradient}
            >
              <View style={styles.modalIcon}>
                <Ionicons 
                  name={getNotificationIcon(selectedNotification?.type || 'system') as any} 
                  size={48} 
                  color={getNotificationColor(selectedNotification?.type || 'system')} 
                />
              </View>
              <Text style={styles.modalTitle}>{selectedNotification?.title}</Text>
              <Text style={styles.modalMessage}>{selectedNotification?.message}</Text>
              <View style={styles.modalTime}>
                <Ionicons name="time-outline" size={16} color={COLORS.gray} />
                <Text style={styles.modalTimeText}>
                  {selectedNotification && formatDate(selectedNotification.createdAt)}
                </Text>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCloseText}>Yopish</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalActionBtn} onPress={handleNavigate}>
                  <Text style={styles.modalActionText}>Ko'rish</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backBtn: {
    padding: 8,
    width: 44,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteAllBtn: {
    padding: 8,
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.primary,
  },
  filterBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
  },
  emptyList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  unread: {
    backgroundColor: COLORS.primary + '05',
  },
  iconGradient: {
    borderRadius: 28,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.dark,
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 4,
    lineHeight: 18,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 11,
    color: COLORS.gray,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginVertical: 8,
  },
  deleteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width - 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 24,
    alignItems: 'center',
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  modalTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  modalTimeText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCloseBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: '500',
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalActionText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
})