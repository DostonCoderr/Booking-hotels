// app/(admin)/notifications.tsx

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Animated, Dimensions, ActivityIndicator,
  Modal, Pressable, ScrollView, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Avatar } from '@/components/common/Avatar'

const { width, height } = Dimensions.get('window')
const isTablet = width >= 768
const isSmall  = width <= 375
const rf = (n: number) => isTablet ? n * 1.15 : isSmall ? n * 0.9 : n

const D = {
  bg:     '#07091A',
  card:   '#111827',
  cardR:  '#1A2340',
  stroke: 'rgba(255,255,255,0.07)',
  strokeR:'rgba(124,77,255,0.4)',
  text:   '#FFFFFF',
  muted:  '#8B93A7',
  dimmed: '#6B7280',
  primary:'#7C4DFF',
}

interface Notification {
  id: string; title: string; message: string
  type: string; isRead: boolean; createdAt: string; data?: any
}

const TYPE_CFG: Record<string, { icon: string; color: string; label: string }> = {
  booking:          { icon:'calendar',       color:'#00E5FF', label:'Bron'         },
  listing_approved: { icon:'checkmark-circle',color:'#00E676', label:'Tasdiqlandi' },
  listing_rejected: { icon:'close-circle',   color:'#FF3B30', label:'Rad etildi'  },
  host_request:     { icon:'person-add',     color:'#FFB020', label:'Host so\'rov' },
  message:          { icon:'chatbubble',     color:'#7C4DFF', label:'Xabar'       },
  system:           { icon:'notifications',  color:'#8B93A7', label:'Tizim'       },
}
const cfgOf = (t: string) => TYPE_CFG[t] || TYPE_CFG.system

function fmtTime(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Hozirgina'
  if (m < 60) return `${m} daqiqa`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} soat`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} kun`
  return d.toLocaleDateString('uz-UZ', { day:'numeric', month:'short' })
}

function sectionLabel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 86400000) return 'Bugun'
  if (diff < 172800000) return 'Kecha'
  return new Date(iso).toLocaleDateString('uz-UZ', { day:'numeric', month:'long' })
}

function needsDivider(items: Notification[], i: number) {
  if (i === 0) return true
  return sectionLabel(items[i].createdAt) !== sectionLabel(items[i-1].createdAt)
}

function Skeleton() {
  const p = useRef(new Animated.Value(0.3)).current
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(p, { toValue:0.8, duration:700, useNativeDriver:true }),
      Animated.timing(p, { toValue:0.3, duration:700, useNativeDriver:true }),
    ])).start()
  }, [])
  return (
    <View style={{ padding:16, gap:12 }}>
      {[1,2,3,4,5].map(i => (
        <Animated.View key={i} style={[SK.row, { opacity: p }]}>
          <View style={SK.icon} />
          <View style={SK.lines}>
            <View style={SK.l1} />
            <View style={SK.l2} />
            <View style={SK.l3} />
          </View>
        </Animated.View>
      ))}
    </View>
  )
}
const SK = StyleSheet.create({
  row:   { flexDirection:'row', gap:14, padding:16, backgroundColor:D.card, borderRadius:20, borderWidth:1, borderColor:D.stroke },
  icon:  { width:52, height:52, borderRadius:26, backgroundColor:D.stroke },
  lines: { flex:1, gap:8, justifyContent:'center' },
  l1:    { height:14, width:'60%', borderRadius:7, backgroundColor:D.stroke },
  l2:    { height:11, width:'85%', borderRadius:5, backgroundColor:'rgba(255,255,255,0.04)' },
  l3:    { height:10, width:'35%', borderRadius:5, backgroundColor:'rgba(255,255,255,0.03)' },
})

function DetailModal({ item, visible, onClose, onNavigate }: { item: Notification | null; visible: boolean; onClose: () => void; onNavigate: () => void }) {
  if (!item) return null
  const cfg = cfgOf(item.type)
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={DM.overlay} onPress={onClose}>
        <Pressable style={DM.card} onPress={() => {}}>
          <View style={[DM.iconBox, { backgroundColor: cfg.color + '18' }]}>
            <LinearGradient colors={[cfg.color, cfg.color + '80']} style={DM.iconGrad}>
              <Ionicons name={cfg.icon as any} size={36} color="#fff" />
            </LinearGradient>
          </View>
          <View style={[DM.typePill, { backgroundColor: cfg.color + '18' }]}>
            <View style={[DM.typeDot, { backgroundColor: cfg.color }]} />
            <Text style={[DM.typeTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={DM.title}>{item.title}</Text>
          <Text style={DM.msg}>{item.message}</Text>
          <View style={DM.timeRow}>
            <Ionicons name="time-outline" size={13} color={D.muted} />
            <Text style={DM.timeTxt}>{fmtTime(item.createdAt)}</Text>
          </View>
          <View style={DM.btns}>
            <TouchableOpacity style={DM.closeBtn} onPress={onClose}>
              <Text style={DM.closeTxt}>Yopish</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[DM.goBtn, { backgroundColor: cfg.color }]} onPress={onNavigate}>
              <Text style={DM.goTxt}>Ko'rish</Text>
              <Ionicons name="arrow-forward" size={15} color="#fff" />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
const DM = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.65)', justifyContent:'center', alignItems:'center', padding:24 },
  card:    { width:'100%', backgroundColor:D.card, borderRadius:28, padding:26, alignItems:'center', gap:10, borderWidth:1, borderColor:D.stroke },
  iconBox: { width:88, height:88, borderRadius:44, justifyContent:'center', alignItems:'center', marginBottom:2 },
  iconGrad:{ width:64, height:64, borderRadius:32, justifyContent:'center', alignItems:'center' },
  typePill:{ flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:5, borderRadius:22 },
  typeDot: { width:6, height:6, borderRadius:3 },
  typeTxt: { fontSize:rf(12), fontWeight:'700' },
  title:   { fontSize:rf(18), fontWeight:'900', color:D.text, textAlign:'center', lineHeight:rf(26) },
  msg:     { fontSize:rf(13.5), color:D.muted, textAlign:'center', lineHeight:rf(21) },
  timeRow: { flexDirection:'row', alignItems:'center', gap:5 },
  timeTxt: { fontSize:rf(12), color:D.muted },
  btns:    { flexDirection:'row', gap:10, marginTop:8, width:'100%' },
  closeBtn:{ flex:1, paddingVertical:13, borderRadius:14, borderWidth:1.5, borderColor:D.stroke, alignItems:'center' },
  closeTxt:{ fontSize:rf(14), color:D.muted, fontWeight:'600' },
  goBtn:   { flex:1.3, flexDirection:'row', paddingVertical:13, borderRadius:14, alignItems:'center', justifyContent:'center', gap:6, elevation:4 },
  goTxt:   { fontSize:rf(14), color:'#fff', fontWeight:'700' },
})

function NotifRow({ item, index, onPress }: { item: Notification; index: number; onPress: () => void }) {
  const cfg = cfgOf(item.type)
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 45, useNativeDriver: true, tension: 60, friction: 9 }).start()
  }, [])
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateX: anim.interpolate({ inputRange:[0,1], outputRange:[30,0] }) }] }}>
      <TouchableOpacity style={[N.card, !item.isRead && N.cardUnread]} onPress={onPress} activeOpacity={0.82}>
        {!item.isRead && <View style={[N.accent, { backgroundColor: cfg.color }]} />}
        <View style={[N.iconWrap, { backgroundColor: cfg.color + '18' }]}>
          <LinearGradient colors={[cfg.color, cfg.color + '88']} style={N.iconGrad}>
            <Ionicons name={cfg.icon as any} size={22} color="#fff" />
          </LinearGradient>
        </View>
        <View style={N.body}>
          <View style={N.topRow}>
            <Text style={[N.title, !item.isRead && N.titleUnread]} numberOfLines={1}>{item.title}</Text>
            <Text style={[N.time, !item.isRead && { color: cfg.color }]}>{fmtTime(item.createdAt)}</Text>
          </View>
          <Text style={N.msg} numberOfLines={2}>{item.message}</Text>
          <View style={[N.typePill, { backgroundColor: cfg.color + '14' }]}>
            <View style={[N.typeDot, { backgroundColor: cfg.color }]} />
            <Text style={[N.typeTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        {!item.isRead && <View style={[N.unreadDot, { backgroundColor: cfg.color }]} />}
      </TouchableOpacity>
    </Animated.View>
  )
}
const N = StyleSheet.create({
  card:        { flexDirection:'row', alignItems:'center', backgroundColor:D.card, borderRadius:20, padding:16, gap:14, borderWidth:1, borderColor:D.stroke, overflow:'hidden', position:'relative' },
  cardUnread:  { backgroundColor:D.cardR, borderColor:D.strokeR },
  accent:      { position:'absolute', left:0, top:'15%', bottom:'15%', width:3.5, borderRadius:2 },
  iconWrap:    { width:52, height:52, borderRadius:26, overflow:'hidden', justifyContent:'center', alignItems:'center' },
  iconGrad:    { width:52, height:52, justifyContent:'center', alignItems:'center' },
  body:        { flex:1, gap:4 },
  topRow:      { flexDirection:'row', justifyContent:'space-between', alignItems:'baseline' },
  title:       { fontSize:rf(14), fontWeight:'600', color:D.text, flex:1, marginRight:6 },
  titleUnread: { fontWeight:'800' },
  time:        { fontSize:rf(11), color:D.dimmed, flexShrink:0 },
  msg:         { fontSize:rf(12.5), color:D.muted, lineHeight:rf(18) },
  typePill:    { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:3, borderRadius:20, alignSelf:'flex-start', marginTop:2 },
  typeDot:     { width:5, height:5, borderRadius:2.5 },
  typeTxt:     { fontSize:rf(10.5), fontWeight:'700' },
  unreadDot:   { width:9, height:9, borderRadius:4.5, flexShrink:0 },
})

const FILTERS = [
  { id:'all', label:'Hammasi', icon:'apps-outline' },
  { id:'unread', label:'O\'qilmagan', icon:'mail-unread-outline' },
  { id:'booking', label:'Bronlar', icon:'calendar-outline' },
  { id:'listing', label:'Listinglar', icon:'home-outline' },
  { id:'message', label:'Xabarlar', icon:'chatbubble-outline' },
]

export default function AdminNotificationsScreen() {
  const qc = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<Notification | null>(null)
  const [showModal, setShowModal] = useState(false)
  const heroAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(heroAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start()
  }, [])

  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ['admin-notifications'],
    queryFn: async () => (await api.get('/admin/notifications')).data,
  })

  const { data: hostRequests = [], refetch: refetchHostRequests } = useQuery({
    queryKey: ['admin-host-requests'],
    queryFn: async () => (await api.get('/admin/host-requests')).data,
  })

  const markReadMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-notifications'] }),
  })

  const markAllMut = useMutation({
    mutationFn: () => api.patch('/admin/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-notifications'] }),
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    await refetchHostRequests()
    setRefreshing(false)
  }, [refetch, refetchHostRequests])

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'booking') return n.type === 'booking'
    if (filter === 'listing') return n.type.startsWith('listing')
    if (filter === 'message') return n.type === 'message'
    return true
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handlePress = (item: Notification) => {
    if (!item.isRead) markReadMut.mutate(item.id)
    setSelected(item)
    setShowModal(true)
  }

  const handleNavigate = () => {
    if (!selected) return
    setShowModal(false)
    switch (selected.type) {
      case 'listing_approved':
      case 'listing_rejected':
        router.push('/(admin)/listings'); break
      case 'host_request':
        router.push('/(admin)/users'); break
      case 'booking':
        router.push('/(admin)/listings'); break
      default: break
    }
  }

  return (
    <View style={S.root}>
      <Animated.View style={{ opacity: heroAnim, transform: [{ translateY: heroAnim.interpolate({ inputRange:[0,1], outputRange:[-24,0] }) }] }}>
        <LinearGradient colors={['#7C4DFF', '#4F46E5', '#0096C7']} start={{ x:0, y:0 }} end={{ x:1, y:1 }} style={S.hero}>
          <View style={S.deco1} /><View style={S.deco2} />
          <View style={S.heroTop}>
            <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
              <BlurView intensity={50} tint="dark" style={S.backBlur}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </BlurView>
            </TouchableOpacity>
            <View style={S.heroMid}>
              <Text style={S.heroTitle}>Bildirishnomalar</Text>
              {unreadCount > 0 && <View style={S.heroBadge}><Text style={S.heroBadgeTxt}>{unreadCount}</Text></View>}
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity style={S.readAllBtn} onPress={() => markAllMut.mutate()}>
                <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
                <Text style={S.readAllTxt}>O'qish</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.filterRow}>
            {FILTERS.map(f => {
              const active = filter === f.id
              const cnt = f.id === 'unread' ? unreadCount : f.id === 'booking' ? notifications.filter(n => n.type === 'booking').length : f.id === 'listing' ? notifications.filter(n => n.type.startsWith('listing')).length : f.id === 'message' ? notifications.filter(n => n.type === 'message').length : notifications.length
              return (
                <TouchableOpacity key={f.id} style={[S.chip, active && S.chipActive]} onPress={() => setFilter(f.id)} activeOpacity={0.8}>
                  <Ionicons name={f.icon as any} size={13} color={active ? '#fff' : 'rgba(255,255,255,0.55)'} />
                  <Text style={[S.chipTxt, active && S.chipTxtActive]}>{f.label}</Text>
                  {cnt > 0 && <View style={[S.chipBadge, active && S.chipBadgeActive]}><Text style={[S.chipBadgeTxt, active && { color:'#fff' }]}>{cnt}</Text></View>}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </LinearGradient>
      </Animated.View>

      {/* Host Requests Section */}
      {hostRequests.length > 0 && (
        <View style={S.hostRequestsSection}>
          <Text style={S.hostRequestsTitle}>Yangi host so'rovlari</Text>
          {hostRequests.map((request: any) => (
            <View key={request.id} style={S.hostRequestCard}>
              <View style={S.hostRequestHeader}>
                <View style={[S.hostRequestIcon, { backgroundColor: '#FFB020' + '15' }]}>
                  <Ionicons name="person-add" size={24} color="#FFB020" />
                </View>
                <View style={S.hostRequestInfo}>
                  <Text style={S.hostRequestName}>{request.user?.name}</Text>
                  <Text style={S.hostRequestEmail}>{request.user?.email}</Text>
                </View>
                <View style={S.hostRequestBadge}><Text style={S.hostRequestBadgeText}>Yangi</Text></View>
              </View>
              <Text style={S.hostRequestMessage}>{request.message}</Text>
              <View style={S.hostRequestActions}>
                <TouchableOpacity style={[S.hostRequestBtn, S.approveHostBtn]} onPress={async () => {
                  await api.patch(`/admin/host-requests/${request.id}/${request.user.id}/approve`)
                  refetch(); refetchHostRequests(); Alert.alert('Tasdiqlandi', 'Foydalanuvchi Host qilindi')
                }}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={S.hostRequestBtnText}>Tasdiqlash</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[S.hostRequestBtn, S.rejectHostBtn]} onPress={() => {
                  Alert.prompt('Rad etish sababi', 'Nima uchun bu so\'rov rad etilmoqda?', [
                    { text: 'Bekor', style: 'cancel' },
                    { text: 'Rad etish', style: 'destructive', onPress: async (reason) => {
                      if (reason) await api.patch(`/admin/host-requests/${request.id}/${request.user.id}/reject`, { reason })
                      refetch(); refetchHostRequests(); Alert.alert('Rad etildi', 'Host so\'rovi rad etildi')
                    }}
                  ])
                }}>
                  <Ionicons name="close" size={16} color="#fff" />
                  <Text style={S.hostRequestBtnText}>Rad etish</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {isLoading && !refreshing ? <Skeleton /> : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={S.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={D.primary} />}
          renderItem={({ item, index }) => {
            const showSec = needsDivider(filtered, index)
            return (<>
              {showSec && <View style={S.secRow}><View style={S.secLine} /><View style={S.secPill}><Text style={S.secTxt}>{sectionLabel(item.createdAt)}</Text></View><View style={S.secLine} /></View>}
              <NotifRow item={item} index={index} onPress={() => handlePress(item)} />
            </>)
          }}
          ListEmptyComponent={
            <View style={S.empty}>
              <View style={S.emptyIcon}><Ionicons name="notifications-off-outline" size={48} color={D.muted} /></View>
              <Text style={S.emptyTitle}>{filter === 'unread' ? "O'qilmagan bildirishnoma yo'q" : "Bildirishnomalar yo'q"}</Text>
              <Text style={S.emptyDesc}>Yangilikar kelganda shu yerda ko'rinadi</Text>
              {filter !== 'all' && <TouchableOpacity style={S.resetBtn} onPress={() => setFilter('all')}><Text style={S.resetTxt}>Hammasini ko'rish</Text></TouchableOpacity>}
            </View>
          }
        />
      )}
      <DetailModal item={selected} visible={showModal} onClose={() => setShowModal(false)} onNavigate={handleNavigate} />
    </View>
  )
}

const S = StyleSheet.create({
  root: { flex:1, backgroundColor: D.bg },
  hero: { paddingBottom:18, overflow:'hidden' },
  deco1: { position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:'rgba(255,255,255,0.07)', top:-80, right:-40 },
  deco2: { position:'absolute', width:130, height:130, borderRadius:65, backgroundColor:'rgba(255,255,255,0.05)', bottom:-40, left:-30 },
  heroTop: { flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:18, paddingTop: isSmall ? 14 : 18, marginBottom:16 },
  backBtn: {},
  backBlur: { width:40, height:40, borderRadius:20, overflow:'hidden', justifyContent:'center', alignItems:'center' },
  heroMid: { flex:1, flexDirection:'row', alignItems:'center', gap:8 },
  heroTitle: { color:'#fff', fontSize:rf(20), fontWeight:'900' },
  heroBadge: { backgroundColor:'#FF3B30', borderRadius:12, minWidth:22, height:22, justifyContent:'center', alignItems:'center', paddingHorizontal:6 },
  heroBadgeTxt: { color:'#fff', fontSize:rf(12), fontWeight:'800' },
  readAllBtn: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(255,255,255,0.18)', paddingHorizontal:10, paddingVertical:7, borderRadius:20 },
  readAllTxt: { color:'#fff', fontSize:rf(11), fontWeight:'700' },
  filterRow: { paddingHorizontal:18, gap:8, paddingBottom:2 },
  chip: { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:7, borderRadius:22, backgroundColor:'rgba(255,255,255,0.1)', borderWidth:1.5, borderColor:'rgba(255,255,255,0.15)' },
  chipActive: { backgroundColor:D.primary, borderColor:D.primary },
  chipTxt: { color:'rgba(255,255,255,0.65)', fontSize:rf(12), fontWeight:'600' },
  chipTxtActive: { color:'#fff' },
  chipBadge: { backgroundColor:'rgba(255,255,255,0.2)', borderRadius:10, minWidth:18, height:18, justifyContent:'center', alignItems:'center', paddingHorizontal:4 },
  chipBadgeActive: { backgroundColor:'rgba(255,255,255,0.35)' },
  chipBadgeTxt: { color:'rgba(255,255,255,0.8)', fontSize:rf(10), fontWeight:'800' },
  listContent: { padding:16, gap:10, paddingBottom:110 },
  secRow: { flexDirection:'row', alignItems:'center', gap:8, marginVertical:12 },
  secLine: { flex:1, height:1, backgroundColor:D.stroke },
  secPill: { backgroundColor:D.card, paddingHorizontal:12, paddingVertical:4, borderRadius:20, borderWidth:1, borderColor:D.stroke },
  secTxt: { color:D.muted, fontSize:rf(11), fontWeight:'600' },
  empty: { alignItems:'center', paddingTop: height * 0.12, gap:12 },
  emptyIcon: { width:90, height:90, borderRadius:45, backgroundColor:D.card, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:D.stroke },
  emptyTitle: { fontSize:rf(16), fontWeight:'800', color:D.muted, textAlign:'center' },
  emptyDesc: { fontSize:rf(13), color:D.dimmed, textAlign:'center', paddingHorizontal:30 },
  resetBtn: { backgroundColor:'rgba(124,77,255,0.16)', paddingHorizontal:20, paddingVertical:10, borderRadius:22, borderWidth:1.5, borderColor:'rgba(124,77,255,0.4)', marginTop:4 },
  resetTxt: { fontSize:rf(13), color:D.primary, fontWeight:'700' },
  hostRequestsSection: { marginHorizontal:16, marginTop:16, marginBottom:8 },
  hostRequestsTitle: { fontSize:rf(16), fontWeight:'800', color:D.text, marginBottom:12 },
  hostRequestCard: { backgroundColor:D.card, borderRadius:20, padding:16, marginBottom:12, borderWidth:1, borderColor:D.stroke },
  hostRequestHeader: { flexDirection:'row', alignItems:'center', gap:12, marginBottom:12 },
  hostRequestIcon: { width:48, height:48, borderRadius:24, justifyContent:'center', alignItems:'center' },
  hostRequestInfo: { flex:1 },
  hostRequestName: { fontSize:rf(15), fontWeight:'700', color:D.text },
  hostRequestEmail: { fontSize:rf(12), color:D.muted, marginTop:2 },
  hostRequestBadge: { backgroundColor:'#FFB020', paddingHorizontal:10, paddingVertical:4, borderRadius:12 },
  hostRequestBadgeText: { color:'#fff', fontSize:rf(10), fontWeight:'700' },
  hostRequestMessage: { fontSize:rf(13), color:D.muted, marginBottom:14 },
  hostRequestActions: { flexDirection:'row', gap:12 },
  hostRequestBtn: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:10, borderRadius:12 },
  approveHostBtn: { backgroundColor:'#00A651' },
  rejectHostBtn: { backgroundColor:'#FF3B30' },
  hostRequestBtnText: { color:'#fff', fontSize:rf(13), fontWeight:'600' },
})