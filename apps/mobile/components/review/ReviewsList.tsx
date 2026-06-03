import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Modal, TextInput, Alert, ActivityIndicator,
  Dimensions, ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/stores/authStore'

const { width } = Dimensions.get('window')

interface Review {
  id: string
  rating: number
  comment: string
  author: { id: string; name: string; avatar: string | null }
  createdAt: string
}

interface Props {
  listingId: string
  listingTitle: string
  canReview?: boolean
}

// ── Star rating ─────────────────────────────────
function Stars({ rating, size = 16, onRate }: { rating: number; size?: number; onRate?: (r: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} onPress={() => onRate?.(s)} disabled={!onRate} activeOpacity={onRate ? 0.7 : 1}>
          <Ionicons name={s <= rating ? 'star' : 'star-outline'} size={size} color={s <= rating ? '#FFB800' : COLORS.lightGray} />
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ── Rating distribution bar ──────────────────────
function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <View style={rb.row}>
      <Text style={rb.label}>{star}</Text>
      <Ionicons name="star" size={11} color="#FFB800" />
      <View style={rb.track}>
        <View style={[rb.fill, { width: `${pct}%` as any }]} />
      </View>
      <Text style={rb.count}>{count}</Text>
    </View>
  )
}

const rb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  label: { fontSize: 12, color: COLORS.dark, fontWeight: '600', width: 12, textAlign: 'right' },
  track: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#FFB800', borderRadius: 3 },
  count: { fontSize: 11, color: COLORS.gray, width: 22, textAlign: 'right' },
})

// ── Review card ──────────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = review.comment.length > 160
  const short = review.comment.slice(0, 160) + '...'

  return (
    <View style={rc.card}>
      <View style={rc.top}>
        <Image source={{ uri: review.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author.name)}&background=FF385C&color=fff&size=80` }} style={rc.avatar} />
        <View style={rc.meta}>
          <Text style={rc.name}>{review.author.name}</Text>
          <Text style={rc.date}>{new Date(review.createdAt).toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' })}</Text>
        </View>
        <Stars rating={review.rating} size={13} />
      </View>
      <Text style={rc.comment}>{isLong && !expanded ? short : review.comment}</Text>
      {isLong && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={rc.toggle}>{expanded ? 'Yig\'ish ↑' : 'Ko\'proq ↓'}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const rc = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  meta: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  date: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  comment: { fontSize: 14, color: COLORS.dark, lineHeight: 21 },
  toggle: { marginTop: 6, fontSize: 13, color: COLORS.primary, fontWeight: '600' },
})

// ── Add review modal ─────────────────────────────
function AddReviewModal({ visible, listingTitle, onClose, onSubmit, loading }: { visible: boolean; listingTitle: string; onClose: () => void; onSubmit: (rating: number, comment: string) => void; loading: boolean }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const LABELS = ['', 'Yomon', 'Qoniqarsiz', "O'rtacha", 'Yaxshi', "A'lo!"]

  const handleSubmit = () => {
    if (rating === 0) { Alert.alert('Baho bering', 'Iltimos, yulduzchalardan birini tanlang'); return }
    if (!comment.trim()) { Alert.alert('Izoh kiriting', 'Iltimos, sharh yozing'); return }
    onSubmit(rating, comment)
  }

  const handleClose = () => {
    setRating(0)
    setComment('')
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={am.overlay} activeOpacity={1} onPress={handleClose} />
      <View style={am.sheet}>
        <View style={am.handle} />
        <View style={am.header}>
          <View>
            <Text style={am.title}>Sharh yozing</Text>
            <Text style={am.subtitle} numberOfLines={1}>{listingTitle}</Text>
          </View>
          <TouchableOpacity style={am.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>
        <View style={am.starWrap}>
          <Stars rating={rating} size={40} onRate={setRating} />
          <Text style={[am.ratingLabel, { color: rating > 0 ? '#FFB800' : COLORS.lightGray }]}>{LABELS[rating] || 'Bahoyingiz...'}</Text>
        </View>
        <View style={am.inputWrap}>
          <TextInput style={am.input} placeholder="Tajribangiz haqida yozing..." placeholderTextColor={COLORS.gray} multiline numberOfLines={5} value={comment} onChangeText={setComment} textAlignVertical="top" maxLength={500} />
          <Text style={am.charCount}>{comment.length}/500</Text>
        </View>
        <TouchableOpacity style={[am.submitBtn, (rating === 0 || !comment.trim() || loading) && am.submitDisabled]} onPress={handleSubmit} disabled={rating === 0 || !comment.trim() || loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={am.submitTxt}>Sharh qo'shish</Text>}
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

const am = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, elevation: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  subtitle: { fontSize: 13, color: COLORS.gray, marginTop: 3, maxWidth: width - 100 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  starWrap: { alignItems: 'center', gap: 10, marginBottom: 24 },
  ratingLabel: { fontSize: 16, fontWeight: '700' },
  inputWrap: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 16, marginBottom: 20, backgroundColor: COLORS.surface },
  input: { padding: 14, fontSize: 15, color: COLORS.dark, minHeight: 110, maxHeight: 160 },
  charCount: { textAlign: 'right', fontSize: 11, color: COLORS.gray, paddingRight: 14, paddingBottom: 8 },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', elevation: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  submitDisabled: { opacity: 0.45 },
  submitTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
})

// ── MAIN ReviewsList ─────────────────────────────
export function ReviewsList({ listingId, listingTitle, canReview = false }: Props) {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [showModal, setShowModal] = useState(false)
  const [showAll, setShowAll] = useState(false)

  // TO'G'RI ENDPOINT: /reviews/listing/:listingId
  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['reviews', listingId],
    queryFn: async () => {
      console.log('📡 Fetching reviews for listing:', listingId)
      const { data } = await api.get(`/reviews/listing/${listingId}`)
      console.log('✅ Reviews response:', data)
      return data
    },
    enabled: !!listingId,
  })

  // add review mutation - TO'G'RI ENDPOINT
  const addMutation = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment: string }) => {
      await api.post(`/reviews/listing/${listingId}`, { rating, comment })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', listingId] })
      qc.invalidateQueries({ queryKey: ['listing', listingId] })
      setShowModal(false)
      Alert.alert('✅ Rahmat!', 'Sharhingiz muvaffaqiyatli qo\'shildi')
    },
    onError: (error: any) => {
      console.error('Review error:', error.response?.data)
      Alert.alert('Xatolik', error.response?.data?.message || 'Sharh qo\'shishda xatolik yuz berdi')
    },
  })

  const alreadyReviewed = user ? reviews.some((r) => r.author.id === user.id) : false
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0
  const dist = [5, 4, 3, 2, 1].map((n) => ({ star: n, count: reviews.filter((r) => r.rating === n).length }))
  const displayed = showAll ? reviews : reviews.slice(0, 4)

  if (isLoading) {
    return (
      <View style={S.loadWrap}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={S.loadTxt}>Sharhlar yuklanmoqda...</Text>
      </View>
    )
  }

  return (
    <View style={S.container}>
      {/* Header */}
      <View style={S.header}>
        <View style={S.headerLeft}>
          <Ionicons name="star" size={22} color="#FFB800" />
          <Text style={S.avgTxt}>{reviews.length > 0 ? avgRating.toFixed(1) : '—'}</Text>
          <Text style={S.countTxt}>· {reviews.length} ta sharh</Text>
        </View>
        {canReview && !alreadyReviewed && (
          <TouchableOpacity style={S.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="create-outline" size={15} color={COLORS.primary} />
            <Text style={S.addBtnTxt}>Sharh yozing</Text>
          </TouchableOpacity>
        )}
        {alreadyReviewed && (
          <View style={S.reviewedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#00A651" />
            <Text style={S.reviewedTxt}>Sharh qoldirdingiz</Text>
          </View>
        )}
      </View>

      {/* Rating distribution */}
      {reviews.length > 0 && (
        <View style={S.distBox}>
          <View style={S.distLeft}>
            <Text style={S.distAvg}>{avgRating.toFixed(1)}</Text>
            <Stars rating={Math.round(avgRating)} size={14} />
            <Text style={S.distTotal}>{reviews.length} sharh</Text>
          </View>
          <View style={S.distBars}>
            {dist.map((d) => (
              <RatingBar key={d.star} star={d.star} count={d.count} total={reviews.length} />
            ))}
          </View>
        </View>
      )}

      {/* Empty state */}
      {reviews.length === 0 && (
        <View style={S.empty}>
          <View style={S.emptyIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color={COLORS.lightGray} />
          </View>
          <Text style={S.emptyTitle}>Hali sharh yo'q</Text>
          <Text style={S.emptyDesc}>
            {canReview ? 'Bu joyda turdingizmi? Birinchi sharh qoldiring!' : 'Sharhlar kelganda shu yerda ko\'rinadi'}
          </Text>
          {canReview && !alreadyReviewed && (
            <TouchableOpacity style={S.emptyBtn} onPress={() => setShowModal(true)}>
              <Ionicons name="create-outline" size={16} color={COLORS.primary} />
              <Text style={S.emptyBtnTxt}>Sharh yozish</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Review cards */}
      {displayed.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}

      {/* Show more / less */}
      {reviews.length > 4 && (
        <TouchableOpacity style={S.moreBtn} onPress={() => setShowAll(!showAll)}>
          <Text style={S.moreTxt}>
            {showAll ? 'Kamroq ko\'rsatish ↑' : `Barcha ${reviews.length} ta sharhni ko'rish →`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Add review modal */}
      <AddReviewModal
        visible={showModal}
        listingTitle={listingTitle}
        onClose={() => setShowModal(false)}
        onSubmit={(rating, comment) => addMutation.mutate({ rating, comment })}
        loading={addMutation.isPending}
      />
    </View>
  )
}

const S = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 8 },
  loadWrap: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  loadTxt: { fontSize: 13, color: COLORS.gray },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avgTxt: { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  countTxt: { fontSize: 14, color: COLORS.gray },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primary + '12', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary + '35' },
  addBtnTxt: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  reviewedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#00A65112', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  reviewedTxt: { fontSize: 12, color: '#00A651', fontWeight: '600' },
  distBox: { flexDirection: 'row', gap: 16, backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: COLORS.border },
  distLeft: { alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 64 },
  distAvg: { fontSize: 36, fontWeight: '800', color: COLORS.dark, lineHeight: 40 },
  distTotal: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  distBars: { flex: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.dark },
  emptyDesc: { fontSize: 13, color: COLORS.gray, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: COLORS.primary + '12', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary + '35' },
  emptyBtnTxt: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
  moreBtn: { paddingVertical: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 4 },
  moreTxt: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
})