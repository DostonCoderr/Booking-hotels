// app/(admin)/approvals.tsx

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
  Animated,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native'

import { useEffect, useRef, useState } from 'react'

import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import { api } from '@/services/api'
import { Listing } from '@/types'

const { width, height } = Dimensions.get('window')

const isTablet = width >= 768

const COLORS = {
  bg: '#0B1020',
  card: '#121A2F',
  primary: '#7C4DFF',
  secondary: '#00E5FF',
  text: '#FFFFFF',
  muted: '#8B93A7',
  success: '#00E676',
  danger: '#FF4D6D',
  warning: '#FFB020',
  border: 'rgba(255,255,255,0.06)',
}

interface ExtendedListing extends Listing {
  host?: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
}

// =======================================
// REJECT MODAL COMPONENT
// =======================================
function RejectModal({
  visible,
  onClose,
  onConfirm,
  loading,
}: {
  visible: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  loading: boolean
}) {
  const [reason, setReason] = useState('')
  const [selectedReason, setSelectedReason] = useState('')
  
  const presetReasons = [
    { id: 'incomplete', label: '📝 Ma\'lumotlar to\'liq emas', icon: 'document-text-outline' },
    { id: 'photos', label: '🖼️ Rasmlar sifatsiz', icon: 'image-outline' },
    { id: 'price', label: '💰 Narx juda yuqori', icon: 'cash-outline' },
    { id: 'location', label: '📍 Joylashuv noto\'g\'ri', icon: 'location-outline' },
    { id: 'duplicate', label: '🔄 Takroriy listing', icon: 'repeat-outline' },
    { id: 'rules', label: '📋 Qoidalarga zid', icon: 'alert-circle-outline' },
    { id: 'other', label: '⚙️ Boshqa sabab', icon: 'settings-outline' },
  ]

  useEffect(() => {
    if (!visible) {
      setReason('')
      setSelectedReason('')
    }
  }, [visible])

  const handlePresetSelect = (presetId: string, presetLabel: string) => {
    setSelectedReason(presetId)
    setReason(presetLabel)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
        
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[COLORS.danger, '#FF1744']}
            style={styles.modalHeader}
          >
            <View style={styles.modalHeaderIcon}>
              <Ionicons name="alert-circle" size={28} color="#fff" />
            </View>
            <Text style={styles.modalTitle}>Rad etish sababi</Text>
            <Text style={styles.modalSubtitle}>
              Nima uchun bu listing rad etilmoqda?
            </Text>
          </LinearGradient>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSectionTitle}>Tezkor sabablar</Text>
            
            <View style={styles.reasonsGrid}>
              {presetReasons.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.reasonCard,
                    selectedReason === item.id && styles.reasonCardActive,
                  ]}
                  onPress={() => handlePresetSelect(item.id, item.label)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={selectedReason === item.id ? COLORS.danger : COLORS.muted}
                  />
                  <Text
                    style={[
                      styles.reasonCardText,
                      selectedReason === item.id && styles.reasonCardTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <Text style={styles.modalSectionTitle}>Batafsil sabab</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Sababni batafsil yozing..."
              placeholderTextColor={COLORS.muted}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.charCount}>{reason.length}/200</Text>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Bekor qilish</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalConfirmBtn, (!reason.trim() || loading) && styles.modalConfirmDisabled]}
              onPress={() => reason.trim() && onConfirm(reason.trim())}
              disabled={!reason.trim() || loading}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[COLORS.danger, '#FF1744']}
                style={styles.modalConfirmGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="close" size={20} color="#fff" />
                    <Text style={styles.modalConfirmText}>Rad etish</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// =======================================
// APPROVAL CARD
// =======================================
function ApprovalCard({
  item,
  onApprove,
  onReject,
  index,
  approvingId,
  rejectingId,
}: any) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: index * 100,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start()
  }, [])

  const isApproving = approvingId === item.id
  const isRejecting = rejectingId === item.id

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
          { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
        ],
      }}
    >
      <BlurView intensity={35} tint="dark" style={styles.card}>
        {/* IMAGE */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: item.images?.[0] || 'https://via.placeholder.com/400x300' }}
            style={styles.image}
            resizeMode="cover"
          />

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />

          <View style={styles.pendingBadge}>
            <Ionicons name="time" size={12} color="#fff" />
            <Text style={styles.pendingText}>Pending</Text>
          </View>

          <View style={styles.priceTag}>
            <Text style={styles.priceText}>${item.price}</Text>
            <Text style={styles.nightText}>/night</Text>
          </View>
        </View>

        {/* INFO */}
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={styles.title}>
              {item.title}
            </Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={13} color="#FFB020" />
            <Text style={styles.location}>
              {item.city}, {item.country}
            </Text>
          </View>

          {/* HOST */}
          <View style={styles.hostCard}>
            <View style={styles.hostLeft}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={18} color="#fff" />
              </View>
              <View>
                <Text style={styles.hostName}>{item.host?.name || 'Host'}</Text>
                <Text style={styles.hostEmail}>{item.host?.email || 'No email'}</Text>
              </View>
            </View>
            <View style={styles.hostStatus}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Active</Text>
            </View>
          </View>

          {/* ACTIONS */}
          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.86}
              style={[styles.rejectBtn, isRejecting && styles.disabledBtn]}
              onPress={() => onReject(item.id)}
              disabled={isApproving || isRejecting}
            >
              <LinearGradient colors={['#FF4D6D', '#FF1744']} style={styles.actionGradient}>
                {isRejecting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="close" size={18} color="#fff" />
                    <Text style={styles.actionText}>Rad etish</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.86}
              style={[styles.approveBtn, isApproving && styles.disabledBtn]}
              onPress={() => onApprove(item.id)}
              disabled={isApproving || isRejecting}
            >
              <LinearGradient colors={['#00E676', '#00C853']} style={styles.actionGradient}>
                {isApproving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.actionText}>Tasdiqlash</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  )
}

// =======================================
// MAIN
// =======================================
export default function AdminApprovalsScreen() {
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const {
    data: listings,
    isLoading,
    refetch,
  } = useQuery<ExtendedListing[]>({
    queryKey: ['admin-pending-listings'],
    queryFn: async () => {
      const { data } = await api.get('/admin/listings/pending')
      return data
    },
  })

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      setApprovingId(id)
      const response = await api.patch(`/admin/listings/${id}/approve`)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-listings'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      Alert.alert('✅ Tasdiqlandi', 'Listing aktiv qilindi')
    },
    onError: (error: any) => {
      Alert.alert('❌ Xatolik', error.response?.data?.message || 'Tasdiqlashda xatolik')
    },
    onSettled: () => {
      setApprovingId(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      setRejectingId(id)
      const response = await api.patch(`/admin/listings/${id}/reject`, { reason })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-listings'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      Alert.alert('❌ Rad etildi', 'Listing rad etildi va hostga xabar yuborildi')
      setRejectModalVisible(false)
      setSelectedListingId(null)
    },
    onError: (error: any) => {
      Alert.alert('❌ Xatolik', error.response?.data?.message || 'Rad etishda xatolik')
    },
    onSettled: () => {
      setRejectingId(null)
    },
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handleReject = (id: string) => {
    setSelectedListingId(id)
    setRejectModalVisible(true)
  }

  const handleConfirmReject = async (reason: string) => {
    if (selectedListingId && reason.trim()) {
      await rejectMutation.mutateAsync({ id: selectedListingId, reason })
    }
  }

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  if (!listings || listings.length === 0) {
    return (
      <View style={styles.empty}>
        <LinearGradient colors={['#00E676', '#00C853']} style={styles.emptyIcon}>
          <Ionicons name="checkmark-done" size={36} color="#fff" />
        </LinearGradient>
        <Text style={styles.emptyTitle}>Everything Approved 🎉</Text>
        <Text style={styles.emptyText}>Hozir pending listinglar yo'q</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={['#7C4DFF', '#5B3DF5', '#00E5FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <Text style={styles.headerTitle}>Listing Approvals</Text>
        <Text style={styles.headerSub}>{listings.length} ta tasdiqlash kutilmoqda</Text>
      </LinearGradient>

      {/* LIST */}
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        renderItem={({ item, index }) => (
          <ApprovalCard
            item={item}
            index={index}
            onApprove={(id: string) => approveMutation.mutate(id)}
            onReject={handleReject}
            approvingId={approvingId}
            rejectingId={rejectingId}
          />
        )}
      />

      {/* REJECT MODAL */}
      <RejectModal
        visible={rejectModalVisible}
        onClose={() => {
          setRejectModalVisible(false)
          setSelectedListingId(null)
        }}
        onConfirm={handleConfirmReject}
        loading={rejectMutation.isPending}
      />
    </View>
  )
}

// =======================================
// STYLES
// =======================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -80,
    right: -40,
  },
  circle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -40,
    left: -20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: isTablet ? 34 : 30,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
    fontSize: 14,
  },
  list: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: 'rgba(18,26,47,0.8)',
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: isTablet ? 260 : 220,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  pendingBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  pendingText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  priceTag: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  priceText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  nightText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginBottom: 2,
    marginLeft: 2,
  },
  info: {
    padding: 18,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginRight: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  location: {
    color: COLORS.muted,
    fontSize: 13,
  },
  hostCard: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 14,
  },
  hostLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  hostEmail: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },
  hostStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#00E676',
  },
  onlineText: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  approveBtn: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  rejectBtn: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 14,
  },
  actionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  empty: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 24,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContainer: {
    width: width - 40,
    maxWidth: 500,
    backgroundColor: COLORS.card,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    padding: 24,
    alignItems: 'center',
  },
  modalHeaderIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  modalContent: {
    padding: 20,
    maxHeight: height * 0.5,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reasonCardActive: {
    backgroundColor: 'rgba(255,77,109,0.15)',
    borderColor: COLORS.danger,
  },
  reasonCardText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  reasonCardTextActive: {
    color: COLORS.danger,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  reasonInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 14,
    color: COLORS.text,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'right',
    marginTop: 6,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalConfirmDisabled: {
    opacity: 0.5,
  },
  modalConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
})