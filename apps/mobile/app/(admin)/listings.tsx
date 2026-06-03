// app/(admin)/listings.tsx
// UI/UX takomillashtirilgan — backend logika o'zgartirilmagan

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Animated,
  Dimensions, Image, Modal, TextInput, ScrollView, SafeAreaView,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { listingService } from '@/services/listing.service'
import { COLORS } from '@/constants/colors'
import { Listing } from '@/types'

const { width, height } = Dimensions.get('window')
const isTablet = width >= 768
const isSmall  = width <= 375
const CARD_W   = isTablet ? (width - 60) / 3 : (width - 40) / 2
const rf = (n: number) => isTablet ? n * 1.15 : isSmall ? n * 0.9 : n

// ── Dark palette (admin dark tema) ───────────
const D = {
  bg:     '#07091A',
  card:   '#111827',
  stroke: 'rgba(255,255,255,0.07)',
  text:   '#FFFFFF',
  muted:  '#8B93A7',
  border: 'rgba(255,255,255,0.06)',
  surface:'rgba(255,255,255,0.05)',
}

type FilterType = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED'

const STATUS_CFG: Record<string, { color: string; label: string; icon: string }> = {
  PENDING:  { color: '#FF9500', label: 'Kutilmoqda',   icon: 'time-outline'             },
  APPROVED: { color: '#00E676', label: 'Tasdiqlangan', icon: 'checkmark-circle-outline' },
  REJECTED: { color: '#FF3B30', label: 'Rad etilgan',  icon: 'close-circle-outline'     },
}
const statusOf = (s?: string) => STATUS_CFG[s || ''] || { color: D.muted, label: s || '—', icon: 'ellipse-outline' }

function fmtDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────
function Skeleton() {
  const p = useRef(new Animated.Value(0.3)).current
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(p, { toValue: 0.8, duration: 750, useNativeDriver: true }),
      Animated.timing(p, { toValue: 0.3, duration: 750, useNativeDriver: true }),
    ])).start()
  }, [])
  return (
    <View style={{ flexDirection:'row', flexWrap:'wrap', gap:12, padding:14 }}>
      {[1,2,3,4].map(i => (
        <Animated.View key={i} style={[SK.card, { opacity: p }]}>
          <View style={SK.img} />
          <View style={SK.body}>
            <View style={SK.l1} /><View style={SK.l2} /><View style={SK.l3} />
          </View>
        </Animated.View>
      ))}
    </View>
  )
}
const SK = StyleSheet.create({
  card: { width: CARD_W, borderRadius: 18, backgroundColor: D.card, overflow:'hidden', borderWidth:1, borderColor:D.border },
  img:  { width:'100%', height: isTablet ? 140 : 108, backgroundColor: D.stroke },
  body: { padding:10, gap:7 },
  l1:   { height:13, width:'80%', borderRadius:6, backgroundColor: D.stroke },
  l2:   { height:10, width:'55%', borderRadius:5, backgroundColor: D.surface },
  l3:   { height:9,  width:'40%', borderRadius:5, backgroundColor: D.surface },
})

// ─────────────────────────────────────────────
// REJECT MODAL
// ─────────────────────────────────────────────
function RejectModal({
  visible, title, loading, onClose, onConfirm,
}: {
  visible: boolean; title: string; loading: boolean
  onClose: () => void; onConfirm: (r: string) => void
}) {
  const [reason, setReason] = useState('')
  const slideAnim = useRef(new Animated.Value(300)).current

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : 300, useNativeDriver: true, tension: 70, friction: 12,
    }).start()
  }, [visible])

  const QUICK = ["Noto'g'ri ma'lumot", 'Rasm sifati past', 'Qoidalarga zid', 'Narx noto\'g\'ri']

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={RM.overlay} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[RM.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={RM.handle} />

        {/* Header */}
        <View style={RM.header}>
          <View style={RM.headIcon}>
            <Ionicons name="close-circle" size={26} color="#FF3B30" />
          </View>
          <View style={{ flex:1 }}>
            <Text style={RM.title}>Rad etish sababi</Text>
            <Text style={RM.sub} numberOfLines={1}>{title}</Text>
          </View>
          <TouchableOpacity style={RM.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={18} color={D.muted} />
          </TouchableOpacity>
        </View>

        {/* Quick reasons */}
        <Text style={RM.label}>Tezkor sabablar</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={RM.quickRow}>
          {QUICK.map(q => (
            <TouchableOpacity key={q} style={[RM.chip, reason === q && RM.chipActive]} onPress={() => setReason(q)}>
              <Text style={[RM.chipTxt, reason === q && RM.chipTxtActive]}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Text input */}
        <Text style={RM.label}>Batafsil sabab</Text>
        <View style={RM.inputBox}>
          <TextInput
            style={RM.input}
            placeholder="Sabab yozing..."
            placeholderTextColor={D.muted}
            value={reason}
            onChangeText={setReason}
            multiline numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Buttons */}
        <View style={RM.btns}>
          <TouchableOpacity style={RM.cancelBtn} onPress={onClose}>
            <Text style={RM.cancelTxt}>Bekor</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[RM.confirmBtn, (!reason.trim() || loading) && { opacity:0.45 }]}
            onPress={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim() || loading}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <><Ionicons name="close-circle-outline" size={16} color="#fff" /><Text style={RM.confirmTxt}>Rad etish</Text></>
            }
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  )
}

const RM = StyleSheet.create({
  overlay:    { flex:1, backgroundColor:'rgba(0,0,0,0.6)' },
  sheet:      { position:'absolute', bottom:0, left:0, right:0, backgroundColor:D.card, borderTopLeftRadius:28, borderTopRightRadius:28, padding:22, paddingBottom:40, borderWidth:1, borderColor:D.stroke },
  handle:     { width:36, height:4, borderRadius:2, backgroundColor:D.stroke, alignSelf:'center', marginBottom:18 },
  header:     { flexDirection:'row', alignItems:'center', gap:12, marginBottom:18 },
  headIcon:   { width:46, height:46, borderRadius:23, backgroundColor:'rgba(255,59,48,0.12)', justifyContent:'center', alignItems:'center' },
  title:      { fontSize:rf(17), fontWeight:'800', color:D.text },
  sub:        { fontSize:rf(12), color:D.muted, marginTop:2 },
  closeBtn:   { width:32, height:32, borderRadius:16, backgroundColor:D.surface, justifyContent:'center', alignItems:'center' },
  label:      { fontSize:rf(11), fontWeight:'700', color:D.muted, textTransform:'uppercase', letterSpacing:0.6, marginBottom:8 },
  quickRow:   { gap:8, marginBottom:16 },
  chip:       { paddingHorizontal:14, paddingVertical:8, borderRadius:22, backgroundColor:D.surface, borderWidth:1.5, borderColor:D.stroke },
  chipActive: { backgroundColor:'rgba(255,59,48,0.14)', borderColor:'#FF3B30' },
  chipTxt:    { fontSize:rf(12.5), color:D.muted, fontWeight:'500' },
  chipTxtActive:{ color:'#FF3B30', fontWeight:'700' },
  inputBox:   { backgroundColor:D.surface, borderRadius:14, borderWidth:1.5, borderColor:D.stroke, marginBottom:20 },
  input:      { padding:14, fontSize:rf(14), color:D.text, minHeight:80 },
  btns:       { flexDirection:'row', gap:10 },
  cancelBtn:  { flex:1, paddingVertical:14, borderRadius:14, borderWidth:1.5, borderColor:D.stroke, alignItems:'center' },
  cancelTxt:  { fontSize:rf(14), color:D.muted, fontWeight:'600' },
  confirmBtn: { flex:1.4, flexDirection:'row', paddingVertical:14, borderRadius:14, backgroundColor:'#FF3B30', alignItems:'center', justifyContent:'center', gap:6, elevation:4, shadowColor:'#FF3B30', shadowOffset:{width:0,height:4}, shadowOpacity:0.35, shadowRadius:8 },
  confirmTxt: { fontSize:rf(14), color:'#fff', fontWeight:'700' },
})

// ─────────────────────────────────────────────
// LISTING DETAIL MODAL
// ─────────────────────────────────────────────
function DetailModal({
  visible, listing, onClose, onDelete, onApprove, onReject,
}: {
  visible: boolean; listing: Listing | null; onClose: () => void
  onDelete: () => void; onApprove: () => void; onReject: () => void
}) {
  if (!listing) return null
  const cfg = statusOf((listing as any).status)

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={{ flex:1, backgroundColor: D.bg }}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

          {/* Hero image */}
          <View style={DM.imgWrap}>
            <Image source={{ uri: listing.images?.[0] || 'https://picsum.photos/800/600' }} style={DM.img} resizeMode="cover" />
            <LinearGradient colors={['rgba(7,9,26,0)', 'rgba(7,9,26,0.92)']} style={DM.imgGrad} />

            {/* Close */}
            <TouchableOpacity style={DM.closeBtn} onPress={onClose}>
              <BlurView intensity={60} tint="dark" style={DM.closeBlur}>
                <Ionicons name="close" size={20} color="#fff" />
              </BlurView>
            </TouchableOpacity>

            {/* Status badge */}
            <View style={[DM.statusBadge, { backgroundColor: cfg.color }]}>
              <Ionicons name={cfg.icon as any} size={12} color="#fff" />
              <Text style={DM.statusTxt}>{cfg.label}</Text>
            </View>

            {/* Price overlay */}
            <View style={DM.priceBox}>
              <Text style={DM.priceTxt}>${listing.price}<Text style={DM.priceUnit}>/kecha</Text></Text>
            </View>
          </View>

          {/* Content */}
          <View style={DM.content}>
            <Text style={DM.title}>{listing.title}</Text>

            {/* Info rows */}
            {[
              { icon:'location-outline', txt: `${listing.address}, ${listing.city}` },
              { icon:'calendar-outline',  txt: `Qo'shilgan: ${fmtDate((listing as any).createdAt)}` },
            ].map((r, i) => (
              <View key={i} style={DM.infoRow}>
                <View style={DM.infoIcon}><Ionicons name={r.icon as any} size={16} color={COLORS.primary} /></View>
                <Text style={DM.infoTxt}>{r.txt}</Text>
              </View>
            ))}

            <View style={DM.divider} />

            {/* Stats grid */}
            <View style={DM.statsGrid}>
              {[
                { icon:'people-outline', val: listing.maxGuests,  lbl: 'Mehmonlar'   },
                { icon:'bed-outline',    val: listing.bedrooms,    lbl: 'Yotoqxonalar'},
                { icon:'water-outline',  val: listing.bathrooms,   lbl: 'Hammomlar'   },
              ].map((s, i) => (
                <View key={i} style={DM.statItem}>
                  <View style={DM.statIcon}><Ionicons name={s.icon as any} size={18} color={COLORS.primary} /></View>
                  <Text style={DM.statVal}>{s.val}</Text>
                  <Text style={DM.statLbl}>{s.lbl}</Text>
                </View>
              ))}
            </View>

            <View style={DM.divider} />

            {/* Description */}
            <Text style={DM.secTitle}>Tavsif</Text>
            <Text style={DM.desc}>{listing.description}</Text>

            <View style={DM.divider} />

            {/* Action buttons */}
            <View style={DM.actionRow}>
              {(listing as any).status === 'PENDING' && (
                <>
                  <TouchableOpacity style={[DM.actionBtn, DM.approveBtn]} onPress={onApprove} activeOpacity={0.85}>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={DM.actionTxt}>Tasdiqlash</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[DM.actionBtn, DM.rejectBtn]} onPress={onReject} activeOpacity={0.85}>
                    <Ionicons name="close-circle" size={18} color="#fff" />
                    <Text style={DM.actionTxt}>Rad etish</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity style={[DM.actionBtn, DM.deleteBtn]} onPress={onDelete} activeOpacity={0.85}>
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={DM.actionTxt}>O'chirish</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

const DM = StyleSheet.create({
  imgWrap:    { height: height * 0.4, position:'relative' },
  img:        { width:'100%', height:'100%' },
  imgGrad:    { position:'absolute', bottom:0, left:0, right:0, height:160 },
  closeBtn:   { position:'absolute', top: isSmall ? 40 : 52, left:16 },
  closeBlur:  { width:40, height:40, borderRadius:20, overflow:'hidden', justifyContent:'center', alignItems:'center' },
  statusBadge:{ position:'absolute', top: isSmall ? 40 : 52, right:16, flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:6, borderRadius:22 },
  statusTxt:  { color:'#fff', fontSize:rf(12), fontWeight:'700' },
  priceBox:   { position:'absolute', bottom:16, left:16, backgroundColor:'rgba(255,255,255,0.15)', paddingHorizontal:14, paddingVertical:7, borderRadius:20, borderWidth:1, borderColor:'rgba(255,255,255,0.25)' },
  priceTxt:   { color:'#fff', fontSize:rf(18), fontWeight:'900' },
  priceUnit:  { fontSize:rf(12), fontWeight:'400' },
  content:    { padding:20, backgroundColor: D.bg },
  title:      { fontSize:rf(22), fontWeight:'900', color:D.text, marginBottom:16, lineHeight:rf(30) },
  infoRow:    { flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 },
  infoIcon:   { width:32, height:32, borderRadius:16, backgroundColor: COLORS.primary + '14', justifyContent:'center', alignItems:'center' },
  infoTxt:    { fontSize:rf(13.5), color:D.muted, flex:1 },
  divider:    { height:1, backgroundColor:D.stroke, marginVertical:18 },
  statsGrid:  { flexDirection:'row', justifyContent:'space-around' },
  statItem:   { alignItems:'center', gap:6 },
  statIcon:   { width:42, height:42, borderRadius:21, backgroundColor: COLORS.primary + '14', justifyContent:'center', alignItems:'center' },
  statVal:    { fontSize:rf(20), fontWeight:'900', color:D.text },
  statLbl:    { fontSize:rf(11), color:D.muted },
  secTitle:   { fontSize:rf(16), fontWeight:'800', color:D.text, marginBottom:10 },
  desc:       { fontSize:rf(14), color:D.muted, lineHeight:rf(22) },
  actionRow:  { flexDirection:'row', gap:10, flexWrap:'wrap' },
  actionBtn:  { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7, paddingVertical:14, borderRadius:16, minWidth:100 },
  approveBtn: { backgroundColor:'#00A651', elevation:4, shadowColor:'#00A651', shadowOffset:{width:0,height:4}, shadowOpacity:0.35, shadowRadius:8 },
  rejectBtn:  { backgroundColor:'#FF3B30', elevation:4, shadowColor:'#FF3B30', shadowOffset:{width:0,height:4}, shadowOpacity:0.35, shadowRadius:8 },
  deleteBtn:  { backgroundColor:'#374151', elevation:2 },
  actionTxt:  { color:'#fff', fontSize:rf(14.5), fontWeight:'700' },
})

// ─────────────────────────────────────────────
// ADMIN CARD
// ─────────────────────────────────────────────
function AdminCard({
  item, index, onPress, onApprove, onReject, onDelete,
}: {
  item: Listing & { status?: string }
  index: number
  onPress: () => void; onApprove: () => void; onReject: () => void; onDelete: () => void
}) {
  const cfg  = statusOf(item.status)
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, useNativeDriver: true,
      tension: 55, friction: 10, delay: index * 45,
    }).start()
  }, [])

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ scale: anim.interpolate({ inputRange:[0,1], outputRange:[0.9,1] }) }],
    }}>
      <TouchableOpacity style={AC.card} onPress={onPress} activeOpacity={0.86}>
        {/* Image */}
        <View style={AC.imgWrap}>
          <Image source={{ uri: item.images?.[0] || 'https://picsum.photos/400/300' }} style={AC.img} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(7,9,26,0.55)']} style={AC.imgGrad} />

          {/* Status */}
          <View style={[AC.statusBadge, { backgroundColor: cfg.color }]}>
            <Ionicons name={cfg.icon as any} size={9} color="#fff" />
            <Text style={AC.badgeTxt}>{cfg.label}</Text>
          </View>

          {/* Price */}
          <View style={AC.priceBadge}>
            <Text style={AC.priceTxt}>${item.price}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={AC.body}>
          <Text style={AC.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={AC.locRow}>
            <Ionicons name="location-outline" size={10} color={D.muted} />
            <Text style={AC.locTxt} numberOfLines={1}>{item.city}</Text>
          </View>
          <View style={AC.metaRow}>
            <View style={AC.metaChip}>
              <Ionicons name="people-outline" size={10} color={D.muted} />
              <Text style={AC.metaTxt}>{item.maxGuests}</Text>
            </View>
            <View style={AC.metaDot} />
            <View style={AC.metaChip}>
              <Ionicons name="bed-outline" size={10} color={D.muted} />
              <Text style={AC.metaTxt}>{item.bedrooms}</Text>
            </View>
          </View>
          {(item as any).createdAt && (
            <Text style={AC.dateTxt}>{fmtDate((item as any).createdAt)}</Text>
          )}
        </View>

        {/* Action buttons */}
        <View style={AC.actions}>
          {item.status === 'PENDING' && (
            <>
              <TouchableOpacity style={AC.approveBtn} onPress={onApprove} activeOpacity={0.85}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={AC.rejectBtn} onPress={onReject} activeOpacity={0.85}>
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={AC.deleteBtn} onPress={onDelete} activeOpacity={0.85}>
            <Ionicons name="trash-outline" size={13} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const AC = StyleSheet.create({
  card:       { width: CARD_W, backgroundColor: D.card, borderRadius:18, overflow:'hidden', borderWidth:1, borderColor:D.border, elevation:3, shadowColor:'#000', shadowOffset:{width:0,height:3}, shadowOpacity:0.2, shadowRadius:8 },
  imgWrap:    { position:'relative' },
  img:        { width:'100%', height: isTablet ? 140 : isSmall ? 95 : 108 },
  imgGrad:    { position:'absolute', bottom:0, left:0, right:0, height:50 },
  statusBadge:{ position:'absolute', top:8, left:8, flexDirection:'row', alignItems:'center', gap:3, paddingHorizontal:7, paddingVertical:3, borderRadius:14 },
  badgeTxt:   { color:'#fff', fontSize:rf(9), fontWeight:'800' },
  priceBadge: { position:'absolute', bottom:7, right:8, backgroundColor:'rgba(7,9,26,0.7)', paddingHorizontal:8, paddingVertical:3, borderRadius:12 },
  priceTxt:   { color:'#fff', fontSize:rf(11), fontWeight:'800' },
  body:       { padding: isSmall ? 8 : 10, gap:3 },
  cardTitle:  { fontSize:rf(12.5), fontWeight:'800', color:D.text },
  locRow:     { flexDirection:'row', alignItems:'center', gap:3 },
  locTxt:     { fontSize:rf(10.5), color:D.muted, flex:1 },
  metaRow:    { flexDirection:'row', alignItems:'center', gap:5, marginTop:2 },
  metaChip:   { flexDirection:'row', alignItems:'center', gap:3 },
  metaTxt:    { fontSize:rf(10.5), color:D.muted },
  metaDot:    { width:3, height:3, borderRadius:1.5, backgroundColor:D.stroke },
  dateTxt:    { fontSize:rf(9.5), color:'rgba(255,255,255,0.25)', marginTop:2 },
  actions:    { flexDirection:'row', gap:6, padding: isSmall ? 8 : 10, paddingTop:4, borderTopWidth:1, borderTopColor:D.stroke },
  approveBtn: { width:28, height:28, borderRadius:14, backgroundColor:'#00A651', justifyContent:'center', alignItems:'center' },
  rejectBtn:  { width:28, height:28, borderRadius:14, backgroundColor:'#FF3B30', justifyContent:'center', alignItems:'center' },
  deleteBtn:  { width:28, height:28, borderRadius:14, backgroundColor:'rgba(255,59,48,0.12)', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'rgba(255,59,48,0.3)', marginLeft:'auto' },
})

// ─────────────────────────────────────────────
// FILTER CONFIG
// ─────────────────────────────────────────────
const FILTERS = [
  { id:'all',      label:'Hammasi',     icon:'apps-outline',             color:'#fff'    },
  { id:'PENDING',  label:'Kutilmoqda',  icon:'time-outline',             color:'#FF9500' },
  { id:'APPROVED', label:'Tasdiqlangan',icon:'checkmark-circle-outline', color:'#00E676' },
  { id:'REJECTED', label:'Rad etilgan', icon:'close-circle-outline',     color:'#FF3B30' },
]

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function AdminListingsScreen() {
  const insets = useSafeAreaInsets()
  const qc     = useQueryClient()

  const [filter,      setFilter]      = useState<FilterType>('all')
  const [refreshing,  setRefreshing]  = useState(false)
  const [rejectTarget,setRejectTarget]= useState<Listing | null>(null)
  const [selected,    setSelected]    = useState<Listing | null>(null)
  const [showDetail,  setShowDetail]  = useState(false)

  const heroAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(heroAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 10 }).start()
  }, [])

  // ── Queries (backend unchanged) ─────────────
  const { data: listings = [], isLoading, refetch } = useQuery<(Listing & { status?: string })[]>({
    queryKey: ['admin-listings', filter],
    queryFn: async () => {
      if (filter === 'all')      return listingService.getAllListings()
      if (filter === 'PENDING')  return listingService.getPendingListings()
      if (filter === 'APPROVED') return listingService.getApprovedListings()
      if (filter === 'REJECTED') return listingService.getRejectedListings()
      return listingService.getAllListings()
    },
  })

  // ── Mutations (backend unchanged) ──────────
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-listings'] })
    qc.invalidateQueries({ queryKey: ['admin-stats'] })
  }

  const deleteMut = useMutation({
    mutationFn: (id: string) => listingService.deleteListing(id),
    onSuccess: () => { invalidate(); setShowDetail(false); Alert.alert('✅ O\'chirildi', 'Listing o\'chirildi') },
    onError: (e: any) => Alert.alert('Xatolik', e.response?.data?.message || 'O\'chirishda xatolik'),
  })

  const approveMut = useMutation({
    mutationFn: (id: string) => listingService.approveListing(id),
    onSuccess: () => { invalidate(); setShowDetail(false); Alert.alert('✅ Tasdiqlandi', 'Listing tasdiqlandi') },
    onError: (e: any) => Alert.alert('Xatolik', e.response?.data?.message || 'Tasdiqlashda xatolik'),
  })

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      listingService.rejectListing(id, reason),
    onSuccess: () => { invalidate(); setRejectTarget(null); setShowDetail(false); Alert.alert('❌ Rad etildi', 'Listing rad etildi') },
    onError: (e: any) => Alert.alert('Xatolik', e.response?.data?.message || 'Rad etishda xatolik'),
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [])

  // ── Handlers ────────────────────────────────
  const openDetail  = (item: Listing) => { setSelected(item); setShowDetail(true) }
  const handleDelete  = (item: Listing) => {
    setShowDetail(false)
    Alert.alert("O'chirish", `"${item.title}" listingni o'chirmoqchimisiz?`, [
      { text: 'Bekor', style: 'cancel' },
      { text: "O'chirish", style: 'destructive', onPress: () => deleteMut.mutate(item.id) },
    ])
  }
  const handleApprove = (item: Listing) => {
    setShowDetail(false)
    Alert.alert('Tasdiqlash', `"${item.title}" ni tasdiqlaysizmi?`, [
      { text: 'Bekor', style: 'cancel' },
      { text: 'Tasdiqlash', onPress: () => approveMut.mutate(item.id) },
    ])
  }
  const handleReject  = (item: Listing) => { setShowDetail(false); setRejectTarget(item) }

  // ── Stats ───────────────────────────────────
  const allQ = useQuery<(Listing & { status?: string })[]>({
    queryKey: ['admin-listings', 'all'],
    queryFn:  () => listingService.getAllListings(),
  })
  const all = allQ.data || []
  const counts = {
    total:    all.length,
    pending:  all.filter(l => l.status === 'PENDING').length,
    approved: all.filter(l => l.status === 'APPROVED').length,
    rejected: all.filter(l => l.status === 'REJECTED').length,
  }

  return (
    <View style={[S.root, { paddingTop: insets.top }]}>

      {/* ━━━ HERO HEADER ━━━ */}
      <Animated.View style={{
        opacity: heroAnim,
        transform: [{ translateY: heroAnim.interpolate({ inputRange:[0,1], outputRange:[-20,0] }) }],
      }}>
        <LinearGradient
          colors={['#7C4DFF', '#4F46E5', '#0096C7']}
          start={{ x:0, y:0 }} end={{ x:1, y:1 }}
          style={S.hero}
        >
          <View style={S.deco1} /><View style={S.deco2} />

          {/* Title row */}
          <View style={S.heroTop}>
            <View>
              <Text style={S.heroTitle}>Listinglar</Text>
              <Text style={S.heroSub}>{counts.total} ta jami listing</Text>
            </View>
            <View style={S.heroActions}>
              <TouchableOpacity style={S.heroIconBtn} onPress={onRefresh}>
                <Ionicons name="refresh-outline" size={19} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats strip */}
          <View style={S.statsStrip}>
            {[
              { label:'Jami',         val: counts.total,    color:'#fff',    filter:'all'      },
              { label:'Kutilmoqda',   val: counts.pending,  color:'#FF9500', filter:'PENDING'  },
              { label:'Tasdiqlangan', val: counts.approved, color:'#00E676', filter:'APPROVED' },
              { label:'Rad etilgan',  val: counts.rejected, color:'#FF3B30', filter:'REJECTED' },
            ].map((s, i, arr) => (
              <TouchableOpacity
                key={i}
                style={[S.statItem, i < arr.length-1 && S.statBorder]}
                onPress={() => setFilter(s.filter as FilterType)}
              >
                <Text style={[S.statVal, { color: s.color }]}>{s.val}</Text>
                <Text style={S.statLbl}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.filterRow}>
            {FILTERS.map(f => {
              const active = filter === f.id
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[S.filterChip, active && { backgroundColor: f.color + '22', borderColor: f.color }]}
                  onPress={() => setFilter(f.id as FilterType)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={f.icon as any} size={13} color={active ? f.color : 'rgba(255,255,255,0.55)'} />
                  <Text style={[S.filterTxt, active && { color: f.color, fontWeight:'800' }]}>{f.label}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </LinearGradient>
      </Animated.View>

      {/* ━━━ CONTENT ━━━ */}
      {isLoading && !refreshing ? (
        <Skeleton />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={item => item.id}
          numColumns={isTablet ? 3 : 2}
          columnWrapperStyle={S.row}
          contentContainerStyle={[S.listContent, listings.length === 0 && { flex: 1 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C4DFF" />}
          ListEmptyComponent={
            <View style={S.empty}>
              <View style={S.emptyIcon}>
                <Ionicons name="home-outline" size={48} color={D.muted} />
              </View>
              <Text style={S.emptyTitle}>
                {filter === 'all' ? "Listinglar yo'q" :
                 filter === 'PENDING' ? "Kutilayotgan yo'q" :
                 filter === 'APPROVED' ? "Tasdiqlangan yo'q" : "Rad etilgan yo'q"}
              </Text>
              {filter !== 'all' && (
                <TouchableOpacity style={S.resetBtn} onPress={() => setFilter('all')}>
                  <Text style={S.resetTxt}>Hammasini ko'rish</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item, index }) => (
            <AdminCard
              item={item}
              index={index}
              onPress={() => openDetail(item)}
              onApprove={() => handleApprove(item)}
              onReject={() => handleReject(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

      {/* ━━━ MODALS ━━━ */}
      <DetailModal
        visible={showDetail}
        listing={selected}
        onClose={() => setShowDetail(false)}
        onDelete={() => selected && handleDelete(selected)}
        onApprove={() => selected && handleApprove(selected)}
        onReject={() => selected && handleReject(selected)}
      />

      <RejectModal
        visible={!!rejectTarget}
        title={rejectTarget?.title || ''}
        loading={rejectMut.isPending}
        onClose={() => setRejectTarget(null)}
        onConfirm={reason => rejectTarget && rejectMut.mutate({ id: rejectTarget.id, reason })}
      />
    </View>
  )
}

// ─────────────────────────────────────────────
// MAIN STYLES
// ─────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex:1, backgroundColor: D.bg },

  // Hero
  hero:       { paddingBottom:20, overflow:'hidden' },
  deco1:      { position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:'rgba(255,255,255,0.07)', top:-80, right:-40 },
  deco2:      { position:'absolute', width:130, height:130, borderRadius:65,  backgroundColor:'rgba(255,255,255,0.05)', bottom:-40, left:-30 },
  heroTop:    { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', paddingHorizontal:20, paddingTop:isSmall ? 14 : 18, marginBottom:16 },
  heroTitle:  { color:'#fff', fontSize:rf(24), fontWeight:'900' },
  heroSub:    { color:'rgba(255,255,255,0.65)', fontSize:rf(13), marginTop:3 },
  heroActions:{ flexDirection:'row', gap:8 },
  heroIconBtn:{ width:40, height:40, borderRadius:20, backgroundColor:'rgba(255,255,255,0.15)', justifyContent:'center', alignItems:'center' },

  // Stats
  statsStrip: { flexDirection:'row', marginHorizontal:18, marginBottom:14, backgroundColor:'rgba(255,255,255,0.1)', borderRadius:16, overflow:'hidden' },
  statItem:   { flex:1, alignItems:'center', paddingVertical:10 },
  statBorder: { borderRightWidth:1, borderRightColor:'rgba(255,255,255,0.12)' },
  statVal:    { fontSize:rf(18), fontWeight:'900' },
  statLbl:    { color:'rgba(255,255,255,0.6)', fontSize:rf(9.5), marginTop:2 },

  // Filter chips
  filterRow:  { paddingHorizontal:18, gap:8, paddingBottom:4 },
  filterChip: { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:7, borderRadius:22, backgroundColor:'rgba(255,255,255,0.1)', borderWidth:1.5, borderColor:'rgba(255,255,255,0.15)' },
  filterTxt:  { color:'rgba(255,255,255,0.7)', fontSize:rf(12), fontWeight:'600' },

  // List
  listContent:{ padding:14, gap:12, paddingBottom:110 },
  row:        { justifyContent:'space-between' },

  // Empty
  empty:      { flex:1, alignItems:'center', justifyContent:'center', paddingTop:60, gap:12 },
  emptyIcon:  { width:90, height:90, borderRadius:45, backgroundColor:D.card, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:D.border },
  emptyTitle: { fontSize:rf(17), fontWeight:'800', color:D.muted, textAlign:'center' },
  resetBtn:   { backgroundColor:'rgba(124,77,255,0.16)', paddingHorizontal:20, paddingVertical:10, borderRadius:22, borderWidth:1.5, borderColor:'rgba(124,77,255,0.4)' },
  resetTxt:   { fontSize:rf(13), color:'#7C4DFF', fontWeight:'700' },
})