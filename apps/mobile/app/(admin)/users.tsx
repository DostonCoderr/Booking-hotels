// app/(admin)/users.tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Dimensions,
  TextInput, Animated, Alert,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { listingService } from '@/services/listing.service'
import { Avatar } from '@/components/common/Avatar'

const { width, height } = Dimensions.get('window')
const isTablet     = width >= 768
const isSmall      = width <= 375
const rf = (n: number) => isTablet ? n * 1.18 : isSmall ? n * 0.9 : n

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type RoleFilter = 'all' | 'USER' | 'HOST' | 'ADMIN'

interface ApiUser {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  avatar?: string | null
  listings?: any[]
  bookings?: any[]
}

// ─────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────
const C = {
  bg:     '#07091A',
  card:   '#111827',
  stroke: 'rgba(255,255,255,0.07)',
  text:   '#FFFFFF',
  muted:  '#8B93A7',
  primary:'#7C4DFF',
  cyan:   '#00E5FF',
  green:  '#00E676',
  red:    '#FF3B30',
  yellow: '#FFB300',
  border: 'rgba(255,255,255,0.06)',
}

const ROLE_CFG: Record<string, { color: string; label: string; icon: string }> = {
  USER:  { color: C.cyan,    label: 'User',  icon: 'person-outline'         },
  HOST:  { color: C.green,   label: 'Host',  icon: 'home-outline'           },
  ADMIN: { color: C.red,     label: 'Admin', icon: 'shield-checkmark-outline'},
}
const roleOf = (r: string) => ROLE_CFG[r] || ROLE_CFG.USER

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─────────────────────────────────────────────
// SKELETON ROW
// ─────────────────────────────────────────────
function SkeletonRow() {
  const p = useRef(new Animated.Value(0.4)).current
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(p, { toValue: 1,   duration: 700, useNativeDriver: true }),
      Animated.timing(p, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ])).start()
  }, [])
  return (
    <Animated.View style={[SK.row, { opacity: p }]}>
      <View style={SK.avatar} />
      <View style={SK.lines}>
        <View style={SK.l1} />
        <View style={SK.l2} />
        <View style={SK.l3} />
      </View>
      <View style={SK.btn} />
    </Animated.View>
  )
}
const SK = StyleSheet.create({
  row:    { flexDirection:'row', alignItems:'center', padding:14, gap:12, backgroundColor:C.card, borderRadius:18, marginBottom:10, borderWidth:1, borderColor:C.border },
  avatar: { width:50, height:50, borderRadius:25, backgroundColor:C.stroke },
  lines:  { flex:1, gap:8 },
  l1:     { height:14, width:'55%', borderRadius:7, backgroundColor:C.stroke },
  l2:     { height:11, width:'70%', borderRadius:5, backgroundColor:'rgba(255,255,255,0.04)' },
  l3:     { height:10, width:'40%', borderRadius:5, backgroundColor:'rgba(255,255,255,0.04)' },
  btn:    { width:36, height:36, borderRadius:12, backgroundColor:C.stroke },
})

// ─────────────────────────────────────────────
// USER CARD
// ─────────────────────────────────────────────
function UserCard({
  item, index, onToggle,
}: {
  item: ApiUser; index: number; onToggle: (id: string) => void
}) {
  const cfg  = roleOf(item.role)
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, useNativeDriver: true,
      tension: 60, friction: 9, delay: index * 40,
    }).start()
  }, [])

  const handleToggle = () => {
    Alert.alert(
      item.isActive ? '🔒 Bloklash' : '✅ Aktivlashtirish',
      `"${item.name}" ni ${item.isActive ? 'bloklamoqchimisiz?' : 'aktivlashtirmoqchimisiz?'}`,
      [
        { text: 'Bekor', style: 'cancel' },
        { text: item.isActive ? 'Bloklash' : 'Aktivlashtirish', onPress: () => onToggle(item.id) },
      ]
    )
  }

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateX: anim.interpolate({ inputRange:[0,1], outputRange:[40,0] }) }],
    }}>
      <View style={[S.card, !item.isActive && S.cardInactive]}>
        {/* Left accent */}
        <View style={[S.accent, { backgroundColor: cfg.color }]} />

        {/* Avatar */}
        <View style={S.avatarWrap}>
          <Avatar source={item.avatar} name={item.name} size={isSmall ? 44 : 50} />
          {/* Online dot */}
          <View style={[S.activeDot, { backgroundColor: item.isActive ? C.green : C.red }]} />
        </View>

        {/* Info */}
        <View style={S.info}>
          <Text style={S.name} numberOfLines={1}>{item.name}</Text>
          <Text style={S.email} numberOfLines={1}>{item.email}</Text>

          <View style={S.metaRow}>
            {/* Role badge */}
            <View style={[S.roleBadge, { backgroundColor: cfg.color + '18', borderColor: cfg.color + '40' }]}>
              <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
              <Text style={[S.roleTxt, { color: cfg.color }]}>{cfg.label}</Text>
            </View>

            {/* Listings count */}
            {item.listings && item.listings.length > 0 && (
              <View style={S.countChip}>
                <Ionicons name="home-outline" size={10} color={C.muted} />
                <Text style={S.countTxt}>{item.listings.length}</Text>
              </View>
            )}

            {/* Date */}
            <Text style={S.dateTxt}>{fmtDate(item.createdAt)}</Text>
          </View>
        </View>

        {/* Toggle button */}
        <TouchableOpacity
          style={[S.toggleBtn, item.isActive ? S.toggleActive : S.toggleInactive]}
          onPress={handleToggle}
          activeOpacity={0.8}
        >
          <Ionicons
            name={item.isActive ? 'checkmark' : 'close'}
            size={16}
            color={item.isActive ? C.green : C.red}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function AdminUsersScreen() {
  const qc = useQueryClient()

  const [filterRole, setFilterRole] = useState<RoleFilter>('all')
  const [query,      setQuery]      = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const heroAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(heroAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start()
  }, [])

  // Data
  const { data: users = [], isLoading, refetch } = useQuery<ApiUser[]>({
    queryKey: ['admin-users'],
    queryFn:  async () => (await (listingService as any).getAllUsers()) as ApiUser[],
  })

  const toggleMut = useMutation({
    mutationFn: (id: string) => (listingService as any).toggleUserStatus(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (e: any) => Alert.alert('Xatolik', e?.response?.data?.message || "Holat o'zgarmadi"),
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  // Filter + search
  const filtered = users.filter(u => {
    if (filterRole !== 'all' && u.role !== filterRole) return false
    if (query) {
      const q = query.toLowerCase()
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    }
    return true
  })

  // Counts
  const counts = {
    total: users.length,
    user:  users.filter(u => u.role === 'USER').length,
    host:  users.filter(u => u.role === 'HOST').length,
    admin: users.filter(u => u.role === 'ADMIN').length,
  }

  const FILTERS: { id: RoleFilter; label: string; color: string; count: number }[] = [
    { id: 'all',   label: 'Hammasi', color: C.primary, count: counts.total },
    { id: 'USER',  label: 'User',    color: C.cyan,    count: counts.user  },
    { id: 'HOST',  label: 'Host',    color: C.green,   count: counts.host  },
    { id: 'ADMIN', label: 'Admin',   color: C.red,     count: counts.admin },
  ]

  return (
    <View style={S.root}>

      {/* ━━━ HERO ━━━ */}
      <Animated.View style={{
        opacity: heroAnim,
        transform: [{ translateY: heroAnim.interpolate({ inputRange:[0,1], outputRange:[-24,0] }) }],
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
              <Text style={S.heroTitle}>Foydalanuvchilar</Text>
              <Text style={S.heroSub}>{counts.total} ta ro'yxatda</Text>
            </View>
            <View style={S.heroBadge}>
              <Ionicons name="people" size={18} color="#fff" />
            </View>
          </View>

          {/* Stats strip */}
          <View style={S.statsRow}>
            {[
              { label: 'Jami',  val: counts.total, color: '#fff'  },
              { label: 'User',  val: counts.user,  color: C.cyan  },
              { label: 'Host',  val: counts.host,  color: C.green },
              { label: 'Admin', val: counts.admin, color: C.red   },
            ].map((s, i, arr) => (
              <View key={i} style={[S.statItem, i < arr.length - 1 && S.statBorder]}>
                <Text style={[S.statVal, { color: s.color }]}>{s.val}</Text>
                <Text style={S.statLbl}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Search */}
          <BlurView intensity={40} tint="dark" style={S.searchWrap}>
            <Ionicons name="search-outline" size={17} color="rgba(255,255,255,0.7)" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ism yoki email bo'yicha qidirish..."
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={S.searchInput}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </BlurView>

          {/* Filter chips */}
          <View style={S.filterRow}>
            {FILTERS.map(f => {
              const active = filterRole === f.id
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[S.filterChip, active && { backgroundColor: f.color, borderColor: f.color }]}
                  onPress={() => setFilterRole(f.id)}
                  activeOpacity={0.82}
                >
                  <Text style={[S.filterTxt, active && { color: '#fff' }]}>{f.label}</Text>
                  <View style={[S.filterBadge, active && { backgroundColor: 'rgba(255,255,255,0.28)' }]}>
                    <Text style={[S.filterBadgeTxt, active && { color: '#fff' }]}>{f.count}</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ━━━ LIST ━━━ */}
      {isLoading && !refreshing ? (
        <View style={{ padding: 14, gap: 10 }}>
          {[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={S.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          ListEmptyComponent={
            <View style={S.empty}>
              <View style={S.emptyIcon}>
                <Ionicons name="people-outline" size={48} color={C.muted} />
              </View>
              <Text style={S.emptyTitle}>
                {query ? `"${query}" bo'yicha natija yo'q` : "Foydalanuvchilar yo'q"}
              </Text>
              {query.length > 0 && (
                <TouchableOpacity style={S.clearBtn} onPress={() => setQuery('')}>
                  <Text style={S.clearBtnTxt}>Qidiruvni tozalash</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item, index }) => (
            <UserCard item={item} index={index} onToggle={id => toggleMut.mutate(id)} />
          )}
        />
      )}
    </View>
  )
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Hero
  hero:    { paddingBottom: 22, overflow:'hidden' },
  deco1:   { position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:'rgba(255,255,255,0.07)', top:-80, right:-40 },
  deco2:   { position:'absolute', width:140, height:140, borderRadius:70,  backgroundColor:'rgba(255,255,255,0.05)', bottom:-50, left:-30 },
  heroTop: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', paddingHorizontal:20, paddingTop:isSmall ? 14 : 18, marginBottom:18 },
  heroTitle:{ color:'#fff', fontSize:rf(24), fontWeight:'900' },
  heroSub: { color:'rgba(255,255,255,0.65)', fontSize:rf(13), marginTop:3 },
  heroBadge:{ width:44, height:44, borderRadius:22, backgroundColor:'rgba(255,255,255,0.18)', justifyContent:'center', alignItems:'center' },

  // Stats
  statsRow: { flexDirection:'row', marginHorizontal:18, marginBottom:16, backgroundColor:'rgba(255,255,255,0.1)', borderRadius:16, overflow:'hidden' },
  statItem: { flex:1, alignItems:'center', paddingVertical:10 },
  statBorder:{ borderRightWidth:1, borderRightColor:'rgba(255,255,255,0.12)' },
  statVal:  { fontSize:rf(18), fontWeight:'900' },
  statLbl:  { color:'rgba(255,255,255,0.6)', fontSize:rf(10), marginTop:2 },

  // Search
  searchWrap: { marginHorizontal:18, marginBottom:14, flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:14, paddingVertical:11, borderRadius:16, overflow:'hidden', borderWidth:1, borderColor:'rgba(255,255,255,0.14)' },
  searchInput:{ flex:1, color:'#fff', fontSize:rf(14), padding:0 },

  // Filters
  filterRow: { flexDirection:'row', paddingHorizontal:18, gap:8, flexWrap:'wrap' },
  filterChip:{ flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:7, borderRadius:22, backgroundColor:'rgba(255,255,255,0.1)', borderWidth:1.5, borderColor:'rgba(255,255,255,0.15)' },
  filterTxt: { color:'rgba(255,255,255,0.8)', fontSize:rf(12), fontWeight:'600' },
  filterBadge:{ backgroundColor:'rgba(255,255,255,0.15)', borderRadius:10, minWidth:18, height:18, justifyContent:'center', alignItems:'center', paddingHorizontal:5 },
  filterBadgeTxt:{ color:'rgba(255,255,255,0.8)', fontSize:rf(10), fontWeight:'800' },

  // List
  listContent: { padding:14, gap:10, paddingBottom:110 },

  // Card
  card: { flexDirection:'row', alignItems:'center', backgroundColor:C.card, borderRadius:18, padding:isSmall ? 11 : 14, gap:12, borderWidth:1, borderColor:C.border, overflow:'hidden', elevation:2, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.15, shadowRadius:6 },
  cardInactive: { opacity:0.62 },
  accent: { position:'absolute', left:0, top:'15%', bottom:'15%', width:3.5, borderRadius:2 },

  avatarWrap: { position:'relative' },
  activeDot:  { position:'absolute', bottom:0, right:0, width:11, height:11, borderRadius:5.5, borderWidth:2, borderColor:C.card },

  info:  { flex:1, minWidth:0 },
  name:  { color:C.text, fontWeight:'800', fontSize:rf(14.5) },
  email: { color:C.muted, fontSize:rf(11.5), marginTop:2 },

  metaRow:   { flexDirection:'row', alignItems:'center', gap:7, marginTop:7, flexWrap:'wrap' },
  roleBadge: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:3, borderRadius:20, borderWidth:1 },
  roleTxt:   { fontSize:rf(10.5), fontWeight:'700' },
  countChip: { flexDirection:'row', alignItems:'center', gap:3, backgroundColor:'rgba(255,255,255,0.07)', paddingHorizontal:6, paddingVertical:3, borderRadius:12 },
  countTxt:  { color:C.muted, fontSize:rf(10), fontWeight:'600' },
  dateTxt:   { fontSize:rf(10), color:'rgba(255,255,255,0.35)' },

  toggleBtn:      { width:isSmall ? 32 : 36, height:isSmall ? 32 : 36, borderRadius:12, justifyContent:'center', alignItems:'center', borderWidth:1 },
  toggleActive:   { backgroundColor:'rgba(0,230,118,0.12)', borderColor:'rgba(0,230,118,0.3)' },
  toggleInactive: { backgroundColor:'rgba(255,59,48,0.12)',  borderColor:'rgba(255,59,48,0.3)'  },

  // Empty
  empty:     { alignItems:'center', paddingTop: height * 0.12, gap:12 },
  emptyIcon: { width:80, height:80, borderRadius:40, backgroundColor:C.card, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:C.border },
  emptyTitle:{ fontSize:rf(15), color:C.muted, fontWeight:'600', textAlign:'center', paddingHorizontal:30 },
  clearBtn:  { backgroundColor:C.primary + '18', paddingHorizontal:18, paddingVertical:9, borderRadius:20, borderWidth:1, borderColor:C.primary + '40' },
  clearBtnTxt:{ color:C.primary, fontSize:rf(13), fontWeight:'700' },
})