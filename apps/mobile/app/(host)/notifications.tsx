// app/(host)/notifications.tsx

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Animated, Dimensions, ActivityIndicator,
  Modal, Pressable, ScrollView
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'

const { width, height } = Dimensions.get('window')
const isTablet = width >= 768
const isSmall = width <= 375

// Masofalarni ekran o'lchamiga qarab dinamik hisoblash
const rf = (n: number) => isTablet ? n * 1.15 : isSmall ? n * 0.95 : n

const C = {
  bg: '#030712',          // Chuqur premium qora rang
  card: '#090D1A',        // Kartalar uchun to'q ko'k-qora
  cardUnread: '#131B33',  // O'qilmaganlar uchun ajralib turuvchi rang
  stroke: 'rgba(255, 255, 255, 0.05)',
  strokeUnread: 'rgba(244, 63, 94, 0.25)',
  text: '#F3F4F6',
  muted: '#9CA3AF',
  dimmed: '#6B7280',
  primary: '#F43F5E',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  data?: {
    bookingId?: string
    listingTitle?: string
    guestName?: string
    amount?: number
    reason?: string
    rating?: number
    comment?: string
  }
}

const TYPE_CFG: Record<string, { 
  icon: string; 
  color: string; 
  label: string; 
  gradient: readonly [string, string]
}> = {
  booking: { 
    icon: 'calendar-clear', 
    color: C.info, 
    label: 'Yangi bron',
    gradient: ['#3B82F6', '#1D4ED8'] as const
  },
  booking_approved: { 
    icon: 'checkmark-circle', 
    color: C.success, 
    label: 'Tasdiqlandi',
    gradient: ['#10B981', '#047857'] as const
  },
  booking_rejected: { 
    icon: 'close-circle', 
    color: C.danger, 
    label: 'Rad etildi',
    gradient: ['#EF4444', '#B91C1C'] as const
  },
  payment_received: { 
    icon: 'wallet', 
    color: C.success, 
    label: "To'lov",
    gradient: ['#10B981', '#047857'] as const
  },
  host_review: { 
    icon: 'star', 
    color: C.warning, 
    label: 'Sharh',
    gradient: ['#F59E0B', '#B45309'] as const
  },
  listing_approved: { 
    icon: 'business', 
    color: C.success, 
    label: 'Eʼlon tasdiqlandi',
    gradient: ['#10B981', '#047857'] as const
  },
  listing_rejected: { 
    icon: 'alert-circle', 
    color: C.danger, 
    label: 'Eʼlon rad etildi',
    gradient: ['#EF4444', '#B91C1C'] as const
  },
  system: { 
    icon: 'shield-checkmark', 
    color: C.dimmed, 
    label: 'Tizim',
    gradient: ['#6B7280', '#374151'] as const
  },
}

const cfgOf = (t: string) => TYPE_CFG[t] || TYPE_CFG.system

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'Hozirgina'
  if (minutes < 60) return `${minutes} daqiqa avval`
  if (hours < 24) return `${hours} soat avval`
  if (days < 7) return `${days} kun avval`
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
}

function sectionLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (dDate.getTime() === today.getTime()) return 'Bugun'
  if (dDate.getTime() === yesterday.getTime()) return 'Kecha'
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })
}

function needsDivider(items: Notification[], i: number) {
  if (i === 0) return true
  return sectionLabel(items[i].createdAt) !== sectionLabel(items[i - 1].createdAt)
}

function NotifRow({ item, index, onPress }: { item: Notification; index: number; onPress: () => void }) {
  const cfg = cfgOf(item.type)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(15)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: Math.min(index * 40, 400), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: Math.min(index * 40, 400), useNativeDriver: true })
    ]).start()
  }, [])

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: isTablet ? 0.5 : 1 }}>
      <TouchableOpacity 
        style={[styles.card, !item.isRead && styles.cardUnread]} 
        onPress={onPress} 
        activeOpacity={0.75}
      >
        <View style={[styles.iconWrap, { backgroundColor: cfg.color + '15' }]}>
          <LinearGradient colors={cfg.gradient} style={styles.iconGrad}>
            <Ionicons name={cfg.icon as any} size={rf(20)} color="#fff" />
          </LinearGradient>
        </View>
        
        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
          </View>
          
          <Text style={styles.msg} numberOfLines={2}>
            {item.message}
          </Text>
          
          <View style={styles.bottomRow}>
            <View style={[styles.typePill, { backgroundColor: 'rgba(255,255,255,0.04)' }]}>
              <View style={[styles.typeDot, { backgroundColor: cfg.color }]} />
              <Text style={styles.typeTxt}>{cfg.label}</Text>
            </View>
            
            {!item.isRead && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>Yangi</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

function DetailModal({ item, visible, onClose, onAction }: { item: Notification | null; visible: boolean; onClose: () => void; onAction?: (item: Notification) => void }) {
  if (!item) return null
  const cfg = cfgOf(item.type)

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View style={styles.modalCard}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          
          <LinearGradient colors={cfg.gradient} style={styles.modalIconBox}>
            <Ionicons name={cfg.icon as any} size={rf(32)} color="#fff" />
          </LinearGradient>
          
          <Text style={styles.modalTitle}>{item.title}</Text>
          <Text style={styles.modalMsg}>{item.message}</Text>
          
          <View style={styles.modalTimeRow}>
            <Ionicons name="time-outline" size={14} color={C.muted} />
            <Text style={styles.modalTimeTxt}>{formatTime(item.createdAt)}</Text>
          </View>
          
          {item.type === 'payment_received' && item.data?.amount && (
            <View style={styles.modalAmountBox}>
              <Text style={styles.modalAmountLabel}>To'lov miqdori</Text>
              <Text style={styles.modalAmount}>${item.data.amount}</Text>
            </View>
          )}
          
          {item.type === 'host_review' && item.data?.rating && (
            <View style={styles.modalRatingBox}>
              <View style={styles.modalStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= (item.data?.rating || 0) ? 'star' : 'star-outline'}
                    size={rf(18)}
                    color={C.warning}
                  />
                ))}
              </View>
              {item.data?.comment && <Text style={styles.modalComment}>"{item.data.comment}"</Text>}
            </View>
          )}
          
          {item.type === 'booking_rejected' && item.data?.reason && (
            <View style={styles.modalReasonBox}>
              <Text style={styles.modalReasonLabel}>Rad etish sababi:</Text>
              <Text style={styles.modalReasonText}>{item.data.reason}</Text>
            </View>
          )}
          
          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <Text style={styles.modalCloseTxt}>Yopish</Text>
            </TouchableOpacity>
            
            {(item.type === 'booking' || item.type === 'booking_approved') && (
              <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: C.primary }]} onPress={() => { onClose(); onAction?.(item); }}>
                <Text style={styles.modalActionTxt}>Bronni ko'rish</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

const FILTERS = [
  { id: 'all', label: 'Hammasi', icon: 'apps-outline' },
  { id: 'unread', label: "O'qilmagan", icon: 'mail-unread-outline' },
  { id: 'booking', label: 'Bronlar', icon: 'calendar-outline' },
  { id: 'payment', label: "To'lovlar", icon: 'card-outline' },
  { id: 'listing', label: 'Eʼlonlar', icon: 'home-outline' },
]

export default function HostNotificationsScreen() {
  const qc = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<Notification | null>(null)
  const [showModal, setShowModal] = useState(false)

  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ['host-notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications/host')
      return response.data
    },
  })

  const markReadMut = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/host/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['host-notifications'] }),
  })

  const markAllMut = useMutation({
    mutationFn: () => api.put('/notifications/host/read/all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['host-notifications'] }),
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'booking') return ['booking', 'booking_approved', 'booking_rejected'].includes(n.type)
    if (filter === 'payment') return n.type === 'payment_received'
    if (filter === 'listing') return ['listing_approved', 'listing_rejected'].includes(n.type)
    return true
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handlePress = (item: Notification) => {
    if (!item.isRead) markReadMut.mutate(item.id)
    setSelected(item)
    setShowModal(true)
  }

  if (isLoading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={C.primary} />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      {/* Premium Glassmorphic Header */}
      <BlurView intensity={30} tint="dark" style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bildirishnomalar</Text>
          {unreadCount > 0 ? (
            <TouchableOpacity style={styles.readAllBtn} onPress={() => markAllMut.mutate()}>
              <Ionicons name="checkmark-done" size={16} color={C.primary} />
              <Text style={styles.readAllTxt}>Hammasi o'qildi</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 80 }} />}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.id
            return (
              <TouchableOpacity key={f.id} style={[styles.chip, active && styles.chipActive]} onPress={() => setFilter(f.id)}>
                <Ionicons name={f.icon as any} size={14} color={active ? '#fff' : C.muted} />
                <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{f.label}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </BlurView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={isTablet ? 2 : 1}
        columnWrapperStyle={isTablet ? { gap: 12 } : null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
        renderItem={({ item, index }) => {
          const showSec = needsDivider(filtered, index)
          return (
            <View style={isTablet ? { flex: 0.5 } : { width: '100%' }}>
              {showSec && (
                <View style={styles.secRow}>
                  <Text style={styles.secTxt}>{sectionLabel(item.createdAt)}</Text>
                  <View style={styles.secLine} />
                </View>
              )}
              <NotifRow item={item} index={index} onPress={() => handlePress(item)} />
            </View>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="mail-open-outline" size={rf(48)} color={C.dimmed} />
            <Text style={styles.emptyTitle}>Bildirishnomalar topilmadi</Text>
            <Text style={styles.emptyDesc}>Bu yerda barcha kelib tushgan yangilanishlar va bildirishnomalar ko'rinadi.</Text>
          </View>
        }
      />
      
      <DetailModal item={selected} visible={showModal} onClose={() => setShowModal(false)} onAction={(item) => router.push('/(host)/bookings')} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  
  headerContainer: {
    paddingTop: rf(45),
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: C.stroke,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: C.text,
    fontSize: rf(18),
    fontWeight: '700',
  },
  readAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  readAllTxt: {
    color: C.primary,
    fontSize: rf(11),
    fontWeight: '600',
  },
  
  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.stroke,
  },
  chipActive: {
    backgroundColor: C.text,
    borderColor: C.text,
  },
  chipTxt: {
    color: C.muted,
    fontSize: rf(12),
    fontWeight: '500',
  },
  chipTxtActive: {
    color: C.bg,
    fontWeight: '600',
  },
  
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  
  secRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  secTxt: {
    color: C.dimmed,
    fontSize: rf(12),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  
  card: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: C.stroke,
    marginBottom: 8,
  },
  cardUnread: {
    backgroundColor: C.cardUnread,
    borderColor: C.strokeUnread,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGrad: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: rf(14),
    fontWeight: '500',
    color: C.text,
    flex: 1,
    marginRight: 8,
  },
  titleUnread: {
    fontWeight: '700',
  },
  time: {
    fontSize: rf(11),
    color: C.dimmed,
  },
  msg: {
    fontSize: rf(12.5),
    color: C.muted,
    lineHeight: rf(17),
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typeTxt: {
    fontSize: rf(11),
    color: C.muted,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: C.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: rf(10),
    fontWeight: '600',
  },
  
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: height * 0.2,
    gap: 12,
  },
  emptyTitle: {
    fontSize: rf(15),
    fontWeight: '600',
    color: C.text,
  },
  emptyDesc: {
    fontSize: rf(12.5),
    color: C.dimmed,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: rf(18),
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.stroke,
    overflow: 'hidden',
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: rf(18),
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMsg: {
    fontSize: rf(13.5),
    color: C.muted,
    textAlign: 'center',
    lineHeight: rf(20),
    marginBottom: 16,
  },
  modalTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  modalTimeTxt: {
    fontSize: rf(12),
    color: C.dimmed,
  },
  modalAmountBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    padding: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAmountLabel: {
    fontSize: rf(11),
    color: C.muted,
    marginBottom: 2,
  },
  modalAmount: {
    fontSize: rf(22),
    fontWeight: '700',
    color: C.success,
  },
  modalRatingBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    padding: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  modalComment: {
    fontSize: rf(13),
    color: C.text,
    fontStyle: 'italic',
  },
  modalReasonBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    padding: 12,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  modalReasonLabel: {
    fontSize: rf(11),
    color: C.dimmed,
  },
  modalReasonText: {
    fontSize: rf(13),
    color: C.danger,
    fontWeight: '500',
    marginTop: 2,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCloseBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: C.stroke,
    alignItems: 'center',
  },
  modalCloseTxt: {
    fontSize: rf(13.5),
    color: C.text,
    fontWeight: '500',
  },
  modalActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  modalActionTxt: {
    fontSize: rf(13.5),
    color: '#fff',
    fontWeight: '600',
  },
})