// app/(admin)/analytics.tsx
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Animated, Dimensions, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'

const { width, height } = Dimensions.get('window')
const isTablet = width >= 768
const isSmall  = width <= 375
const rf = (n: number) => isTablet ? n * 1.15 : isSmall ? n * 0.9 : n

const D = {
  bg:      '#07091A',
  card:    '#111827',
  stroke:  'rgba(255,255,255,0.07)',
  text:    '#FFFFFF',
  muted:   '#8B93A7',
  primary: '#7C4DFF',
  cyan:    '#00E5FF',
  green:   '#00E676',
  red:     '#FF3B30',
  yellow:  '#FFB300',
  blue:    '#2196F3',
  border:  'rgba(255,255,255,0.06)',
}

const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']

// ── Animated counter ─────────────────────────
function Counter({ to, size = 26 }: { to: number | string; size?: number }) {
  const anim = useRef(new Animated.Value(0)).current
  const [num, setNum] = useState(0)
  useEffect(() => {
    const target = typeof to === 'number' ? to : 0
    Animated.timing(anim, { toValue: target, duration: 1000, useNativeDriver: false }).start()
    const id = anim.addListener(({ value }) => setNum(Math.floor(value)))
    return () => anim.removeListener(id)
  }, [to])
  return (
    <Text style={[S.counter, { fontSize: rf(size) }]}>
      {typeof to === 'string' ? to : num}
    </Text>
  )
}

// ── Skeleton ─────────────────────────────────
function Skeleton() {
  const p = useRef(new Animated.Value(0.3)).current
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(p, { toValue: 0.8, duration: 700, useNativeDriver: true }),
      Animated.timing(p, { toValue: 0.3, duration: 700, useNativeDriver: true }),
    ])).start()
  }, [])
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: height * 0.2 }}>
      <ActivityIndicator size="large" color={D.primary} />
      <Animated.Text style={[{ color: D.muted, fontSize: rf(13), marginTop: 12, opacity: p }]}>
        Yuklanmoqda...
      </Animated.Text>
    </View>
  )
}

// ── KPI card ─────────────────────────────────
function KPICard({ icon, label, value, color, sub, delay = 0, onPress }: {
  icon: string; label: string; value: number | string
  color: string; sub?: string; delay?: number; onPress?: () => void
}) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay, useNativeDriver: true, tension: 65, friction: 9 }).start()
  }, [])
  return (
    <Animated.View style={[KPI.wrap, {
      opacity: anim,
      transform: [{ scale: anim.interpolate({ inputRange:[0,1], outputRange:[0.88,1] }) }],
    }]}>
      <TouchableOpacity style={KPI.card} activeOpacity={onPress ? 0.82 : 1} onPress={onPress}>
        <LinearGradient colors={[color + '1A', 'transparent']} style={KPI.glow} />
        <View style={[KPI.icon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <Counter to={value} size={24} />
        <Text style={KPI.label}>{label}</Text>
        {sub && (
          <View style={KPI.subRow}>
            <Ionicons name="trending-up" size={10} color={color} />
            <Text style={[KPI.sub, { color }]}>{sub}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}
const KPI = StyleSheet.create({
  wrap: { width: (width - 44) / 2 },
  card: { backgroundColor: D.card, borderRadius: 22, padding: isSmall ? 12 : 15, overflow: 'hidden', borderWidth: 1, borderColor: D.border, gap: 6 },
  glow: { position:'absolute', width:120, height:80, borderRadius:40, top:-30, right:-20 },
  icon: { width:42, height:42, borderRadius:21, justifyContent:'center', alignItems:'center' },
  label:{ fontSize:rf(11), color:D.muted, fontWeight:'500' },
  subRow:{ flexDirection:'row', alignItems:'center', gap:4 },
  sub:  { fontSize:rf(10.5), fontWeight:'700' },
})

// ── Bar chart ─────────────────────────────────
function BarChart({ data, maxH = 100 }: { data: { val: number; label: string; color: string }[]; maxH?: number }) {
  const max = Math.max(...data.map(d => d.val), 1)
  return (
    <View style={BC.wrap}>
      {data.map((d, i) => {
        const h = Math.max(6, (d.val / max) * maxH)
        const isLast = i === data.length - 1
        return (
          <View key={i} style={BC.col}>
            <Text style={BC.valTxt}>{d.val > 0 ? d.val : ''}</Text>
            <LinearGradient
              colors={[d.color, d.color + '88']}
              style={[BC.bar, { height: h }]}
            />
            <Text style={BC.lbl}>{d.label}</Text>
          </View>
        )
      })}
    </View>
  )
}
const BC = StyleSheet.create({
  wrap:   { flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between', height:130, gap:4 },
  col:    { flex:1, alignItems:'center', gap:5 },
  bar:    { width:'100%', borderRadius:7, maxWidth:32 },
  lbl:    { fontSize:rf(9), color:D.muted, textAlign:'center' },
  valTxt: { fontSize:rf(9), color:D.muted, marginBottom:2 },
})

// ── Donut ring (simple) ───────────────────────
function RingChart({ items }: { items: { label: string; val: number; color: string }[] }) {
  const total = items.reduce((s, i) => s + i.val, 0) || 1
  return (
    <View style={RG.wrap}>
      {/* Visual bars (ersatz ring) */}
      <View style={RG.bars}>
        {items.map((it, i) => (
          <View key={i} style={[RG.barRow, i > 0 && { marginTop: 8 }]}>
            <View style={[RG.dot, { backgroundColor: it.color }]} />
            <View style={RG.track}>
              <LinearGradient
                colors={[it.color, it.color + '55']}
                start={{ x:0, y:0 }} end={{ x:1, y:0 }}
                style={[RG.fill, { width: `${(it.val / total) * 100}%` as any }]}
              />
            </View>
            <Text style={RG.pct}>{((it.val / total) * 100).toFixed(0)}%</Text>
          </View>
        ))}
      </View>
      {/* Labels */}
      <View style={RG.legends}>
        {items.map((it, i) => (
          <View key={i} style={RG.legend}>
            <View style={[RG.legendDot, { backgroundColor: it.color }]} />
            <View>
              <Text style={RG.legendLbl}>{it.label}</Text>
              <Text style={[RG.legendVal, { color: it.color }]}>{it.val}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
const RG = StyleSheet.create({
  wrap:      { gap: 16 },
  bars:      { gap: 0 },
  barRow:    { flexDirection:'row', alignItems:'center', gap:10 },
  dot:       { width:8, height:8, borderRadius:4 },
  track:     { flex:1, height:10, backgroundColor:D.stroke, borderRadius:5, overflow:'hidden' },
  fill:      { height:'100%', borderRadius:5 },
  pct:       { fontSize:rf(11), color:D.muted, fontWeight:'700', width:32, textAlign:'right' },
  legends:   { flexDirection:'row', flexWrap:'wrap', gap:10 },
  legend:    { flexDirection:'row', alignItems:'center', gap:8, flex:1, minWidth:'40%' },
  legendDot: { width:10, height:10, borderRadius:5 },
  legendLbl: { fontSize:rf(11), color:D.muted },
  legendVal: { fontSize:rf(15), fontWeight:'800' },
})

// ── Activity item ─────────────────────────────
function ActivityItem({ icon, title, sub, amount, color, divider }: {
  icon: string; title: string; sub: string; amount: string; color: string; divider?: boolean
}) {
  return (
    <>
      <View style={AI.row}>
        <View style={[AI.icon, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon as any} size={15} color={color} />
        </View>
        <View style={AI.mid}>
          <Text style={AI.title} numberOfLines={1}>{title}</Text>
          <Text style={AI.sub}>{sub}</Text>
        </View>
        <Text style={[AI.amount, { color }]}>{amount}</Text>
      </View>
      {divider && <View style={AI.sep} />}
    </>
  )
}
const AI = StyleSheet.create({
  row:    { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:11 },
  icon:   { width:34, height:34, borderRadius:17, justifyContent:'center', alignItems:'center' },
  mid:    { flex:1 },
  title:  { fontSize:rf(13), fontWeight:'700', color:D.text },
  sub:    { fontSize:rf(11), color:D.muted, marginTop:1 },
  amount: { fontSize:rf(13), fontWeight:'800' },
  sep:    { height:1, backgroundColor:D.stroke },
})

// ── Section box ───────────────────────────────
function Box({ title, action, onAction, delay = 0, children }: {
  title: string; action?: string; onAction?: () => void; delay?: number; children: React.ReactNode
}) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(anim, { toValue:1, duration:400, delay, useNativeDriver:true }).start()
  }, [])
  return (
    <Animated.View style={[BX.wrap, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:[20,0] }) }] }]}>
      <View style={BX.head}>
        <Text style={BX.title}>{title}</Text>
        {action && <TouchableOpacity onPress={onAction}><Text style={BX.action}>{action} →</Text></TouchableOpacity>}
      </View>
      <View style={BX.body}>{children}</View>
    </Animated.View>
  )
}
const BX = StyleSheet.create({
  wrap:   { marginHorizontal:16, marginBottom:18 },
  head:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  title:  { fontSize:rf(15), fontWeight:'800', color:D.text },
  action: { fontSize:rf(12.5), color:D.cyan, fontWeight:'600' },
  body:   { backgroundColor:D.card, borderRadius:22, borderWidth:1, borderColor:D.border, paddingHorizontal:16, overflow:'hidden' },
})

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function AdminAnalyticsScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod]         = useState<'week' | 'month' | 'year'>('month')
  const heroAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(heroAnim, { toValue: 1, useNativeDriver: true, friction: 9, tension: 60 }).start()
  }, [])

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await api.get('/admin/stats')).data,
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  // Chart data
  const monthlyRaw = stats?.bookings?.monthly || [12, 28, 35, 42, 56, 70, 65, 80, 88, 72, 95, 110]
  const PERIOD_LABELS: Record<string, string[]> = {
    week:  ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'],
    month: MONTHS.slice(0, 6),
    year:  MONTHS,
  }
  const PERIOD_DATA: Record<string, number[]> = {
    week:  [8, 15, 12, 22, 18, 30, 25],
    month: monthlyRaw.slice(0, 6),
    year:  monthlyRaw,
  }

  const barData = useMemo(() => {
    const labels = PERIOD_LABELS[period]
    const vals   = PERIOD_DATA[period]
    const colors = ['#7C4DFF','#6366F1','#4F46E5','#8B5CF6','#A855F7','#D946EF','#EC4899','#F43F5E','#F97316','#EAB308','#22C55E','#06B6D4']
    return labels.map((l, i) => ({ label: l, val: vals[i] || 0, color: colors[i % colors.length] }))
  }, [period, stats])

  const listingDist = [
    { label: 'Tasdiqlangan', val: stats?.listings?.approved || 0, color: D.green  },
    { label: 'Kutilmoqda',   val: stats?.listings?.pending  || 0, color: D.yellow },
    { label: 'Rad etilgan',  val: stats?.listings?.rejected || 0, color: D.red    },
  ]

  const userDist = [
    { label: 'User',  val: (stats?.users?.total || 0) - (stats?.users?.hosts || 0) - (stats?.users?.admins || 0), color: D.cyan    },
    { label: 'Host',  val: stats?.users?.hosts  || 0, color: D.green   },
    { label: 'Admin', val: stats?.users?.admins || 0, color: D.primary },
  ]

  if (isLoading && !refreshing) return (
    <View style={S.root}><Skeleton /></View>
  )

  return (
    <View style={S.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={D.primary} />}
      >

        {/* ━━━ HERO ━━━ */}
        <Animated.View style={{
          opacity: heroAnim,
          transform: [{ translateY: heroAnim.interpolate({ inputRange:[0,1], outputRange:[-24,0] }) }],
        }}>
          <LinearGradient
            colors={['#7C4DFF','#4F46E5','#0096C7']}
            start={{ x:0, y:0 }} end={{ x:1, y:1 }}
            style={S.hero}
          >
            <View style={S.deco1} /><View style={S.deco2} />

            <View style={S.heroTop}>
              <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
                <BlurView intensity={50} tint="dark" style={S.backBlur}>
                  <Ionicons name="arrow-back" size={20} color="#fff" />
                </BlurView>
              </TouchableOpacity>
              <View style={S.heroMid}>
                <Text style={S.heroTitle}>Analitika</Text>
                <Text style={S.heroSub}>Statistika va tahlillar</Text>
              </View>
              <TouchableOpacity style={S.refreshBtn} onPress={onRefresh}>
                <BlurView intensity={50} tint="dark" style={S.backBlur}>
                  <Ionicons name="refresh-outline" size={19} color="#fff" />
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* Revenue banner */}
            <BlurView intensity={50} tint="dark" style={S.revBox}>
              <View>
                <Text style={S.revLabel}>Umumiy daromad</Text>
                <Text style={S.revVal}>${(stats?.revenue || 0).toLocaleString()}</Text>
                <View style={S.revMeta}>
                  <View style={S.greenDot} />
                  <Text style={S.revMetaTxt}>+{stats?.bookings?.today || 0} bugun</Text>
                </View>
              </View>
              <View style={S.revRight}>
                <Text style={{ fontSize: isSmall ? 28 : 36 }}>📊</Text>
                <View style={S.growBadge}>
                  <Ionicons name="trending-up" size={10} color="#00FF94" />
                  <Text style={S.growTxt}>+18%</Text>
                </View>
              </View>
            </BlurView>
          </LinearGradient>
        </Animated.View>

        {/* ━━━ KPI GRID ━━━ */}
        <View style={S.kpiGrid}>
          <KPICard icon="people"       label="Foydalanuvchilar" value={stats?.users?.total || 0}    color={D.cyan}   sub="+5 bugun"  delay={0}   onPress={() => router.push('/(admin)/users'     as any)} />
          <KPICard icon="home"         label="Listinglar"       value={stats?.listings?.total || 0}  color="#FF9800" sub="Aktiv"     delay={80}  onPress={() => router.push('/(admin)/listings'  as any)} />
          <KPICard icon="time-outline" label="Kutilmoqda"       value={stats?.listings?.pending || 0} color={D.red}  sub="Tasdiqlang" delay={160} onPress={() => router.push('/(admin)/approvals' as any)} />
          <KPICard icon="calendar"     label="Jami bronlar"     value={stats?.bookings?.total || 0}  color={D.blue}               delay={240} />
        </View>

        {/* ━━━ BAR CHART ━━━ */}
        <Box title="Oylik bronlar" delay={150}>
          {/* Period tabs */}
          <View style={S.periodRow}>
            {(['week','month','year'] as const).map(p => (
              <TouchableOpacity
                key={p}
                style={[S.periodBtn, period === p && S.periodBtnActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[S.periodTxt, period === p && S.periodTxtActive]}>
                  {p === 'week' ? 'Hafta' : p === 'month' ? 'Oy' : 'Yil'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <BarChart data={barData} maxH={isSmall ? 80 : 100} />
          <View style={{ height: 14 }} />
        </Box>

        {/* ━━━ LISTING DISTRIBUTION ━━━ */}
        <Box title="Listing holatlari" delay={200}>
          <View style={{ paddingVertical: 16 }}>
            <RingChart items={listingDist} />
          </View>
        </Box>

        {/* ━━━ USER DISTRIBUTION ━━━ */}
        <Box title="Foydalanuvchi turlari" delay={250}>
          <View style={{ paddingVertical: 16 }}>
            <RingChart items={userDist} />
          </View>
        </Box>

        {/* ━━━ RECENT ACTIVITY ━━━ */}
        <Box title="So'nggi amallar" action="Barchasi" onAction={() => router.push('/(admin)/listings' as any)} delay={300}>
          <ActivityItem icon="calendar"  title="Yangi bron"          sub="Doston K. · Toshkent"   amount="$130"  color={D.cyan}    divider />
          <ActivityItem icon="home"      title="Listing tasdiqlandi" sub="Buxoro villa"            amount="✅"    color={D.green}   divider />
          <ActivityItem icon="people"    title="Yangi host so'rovi"  sub="Nilufar S."             amount="HOST"  color={D.primary} divider />
          <ActivityItem icon="cash"      title="To'lov amalga oshdi" sub="Stripe · $45"           amount="+$45" color={D.yellow}  divider />
          <ActivityItem icon="star"      title="Yangi sharh"        sub="Samarqand uyi · ⭐5"    amount="+1"   color="#FF9800"   />
        </Box>

        {/* ━━━ SYSTEM STATUS ━━━ */}
        <Box title="Tizim holati" delay={350}>
          {[
            { icon:'server-outline', label:'Backend API',   status:'Online',   color:D.green  },
            { icon:'card-outline',   label:'Stripe',        status:'Ulangan',  color:D.green  },
            { icon:'cloud-outline',  label:'Cloudinary',    status:'Ulangan',  color:D.green  },
            { icon:'mail-outline',   label:'Email',         status:'Ulangan',  color:D.green  },
          ].map((s, i, arr) => (
            <View key={i}>
              <View style={SR.row}>
                <View style={[SR.icon, { backgroundColor: s.color + '18' }]}>
                  <Ionicons name={s.icon as any} size={15} color={s.color} />
                </View>
                <Text style={SR.label}>{s.label}</Text>
                <View style={SR.right}>
                  <View style={[SR.dot, { backgroundColor: s.color }]} />
                  <Text style={[SR.status, { color: s.color }]}>{s.status}</Text>
                </View>
              </View>
              {i < arr.length - 1 && <View style={SR.sep} />}
            </View>
          ))}
        </Box>

      </ScrollView>
    </View>
  )
}

const SR = StyleSheet.create({
  row:    { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:10 },
  icon:   { width:32, height:32, borderRadius:16, justifyContent:'center', alignItems:'center' },
  label:  { flex:1, fontSize:rf(13), color:D.text, fontWeight:'500' },
  right:  { flexDirection:'row', alignItems:'center', gap:6 },
  dot:    { width:7, height:7, borderRadius:3.5 },
  status: { fontSize:rf(12), fontWeight:'700' },
  sep:    { height:1, backgroundColor:D.stroke },
})

const S = StyleSheet.create({
  root: { flex:1, backgroundColor: D.bg },

  hero:     { paddingBottom:26, overflow:'hidden' },
  deco1:    { position:'absolute', width:220, height:220, borderRadius:110, backgroundColor:'rgba(255,255,255,0.07)', top:-90, right:-40 },
  deco2:    { position:'absolute', width:150, height:150, borderRadius:75,  backgroundColor:'rgba(255,255,255,0.05)', bottom:-50, left:-30 },
  heroTop:  { flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:18, paddingTop: isSmall ? 14 : 18, marginBottom:20 },
  backBtn:  {},
  backBlur: { width:40, height:40, borderRadius:20, overflow:'hidden', justifyContent:'center', alignItems:'center' },
  refreshBtn:{},
  heroMid:  { flex:1 },
  heroTitle:{ color:'#fff', fontSize:rf(22), fontWeight:'900' },
  heroSub:  { color:'rgba(255,255,255,0.65)', fontSize:rf(12), marginTop:2 },

  revBox:    { marginHorizontal:18, borderRadius:24, padding:isSmall ? 14 : 18, overflow:'hidden', flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  revLabel:  { color:'rgba(255,255,255,0.65)', fontSize:rf(12) },
  revVal:    { color:'#fff', fontSize:rf(30), fontWeight:'900', letterSpacing:-1, marginTop:3 },
  revMeta:   { flexDirection:'row', alignItems:'center', gap:6, marginTop:5 },
  greenDot:  { width:7, height:7, borderRadius:3.5, backgroundColor:'#00FF94' },
  revMetaTxt:{ color:'rgba(255,255,255,0.65)', fontSize:rf(11) },
  revRight:  { alignItems:'center', gap:8 },
  growBadge: { flexDirection:'row', alignItems:'center', gap:3, backgroundColor:'rgba(0,255,148,0.18)', paddingHorizontal:7, paddingVertical:3, borderRadius:20 },
  growTxt:   { color:'#00FF94', fontSize:rf(10), fontWeight:'800' },

  kpiGrid:  { flexDirection:'row', flexWrap:'wrap', gap:12, paddingHorizontal:16, marginTop:18, marginBottom:4 },

  counter:  { color:D.text, fontWeight:'900', letterSpacing:-0.5 },

  periodRow: { flexDirection:'row', gap:8, paddingVertical:14 },
  periodBtn: { flex:1, paddingVertical:8, borderRadius:20, backgroundColor:D.stroke, alignItems:'center', borderWidth:1, borderColor:D.stroke },
  periodBtnActive:{ backgroundColor:D.primary, borderColor:D.primary },
  periodTxt: { fontSize:rf(12), color:D.muted, fontWeight:'600' },
  periodTxtActive:{ color:'#fff', fontWeight:'800' },
})