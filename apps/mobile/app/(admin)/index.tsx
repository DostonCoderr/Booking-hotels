// app/(admin)/index.tsx - to'liq fayl

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Animated, Dimensions, ActivityIndicator, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { Avatar } from '@/components/common/Avatar'

const { width, height } = Dimensions.get('window')
const isTablet = width >= 768
const isSmallPhone = width <= 375
const CARD_W = isTablet ? (width - 60) / 3 : (width - 46) / 2
const rf = (base: number) => isTablet ? base * 1.2 : isSmallPhone ? base * 0.9 : base

const C = {
  bg: '#07091A', card: '#111827', stroke: 'rgba(255,255,255,0.07)', text: '#FFFFFF',
  muted: '#8B93A7', primary: '#7C4DFF', cyan: '#00E5FF', green: '#00E676', red: '#FF3B30',
  yellow: '#FFB300', blue: '#2196F3', teal: '#00BCD4', orange: '#FF9800', border: 'rgba(255,255,255,0.06)',
}

function Counter({ to, size = 28 }: { to: number | string; size?: number }) {
  const anim = useRef(new Animated.Value(0)).current
  const [num, setNum] = useState(0)
  useEffect(() => {
    const target = typeof to === 'number' ? to : 0
    Animated.timing(anim, { toValue: target, duration: 1000, useNativeDriver: false }).start()
    const id = anim.addListener(({ value }) => setNum(Math.floor(value)))
    return () => anim.removeListener(id)
  }, [to])
  return <Text style={[styles.counter, { fontSize: rf(size) }]}>{typeof to === 'string' ? to : num}</Text>
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1)
  return (
    <View style={styles.spark}>{data.map((v, i) => (
      <View key={i} style={[styles.sparkBar, { height: Math.max(5, (v / max) * 38), backgroundColor: i === data.length - 1 ? color : color + '45' }]} />
    ))}</View>
  )
}

function BarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  return (
    <View style={styles.barChart}>{data.map((v, i) => (
      <View key={i} style={styles.barCol}>
        <View style={[styles.barFill, { height: (v / max) * 68, backgroundColor: i === data.length - 1 ? C.cyan : C.primary + '70', borderRadius: 6 }]} />
      </View>
    ))}</View>
  )
}

function KPI({ label, value, icon, color, onPress }: any) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => { Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start() }, [])
  return (
    <Animated.View style={[styles.kpiWrap, { opacity: anim, transform: [{ scale: anim.interpolate({ inputRange:[0,1], outputRange:[0.88,1] }) }] }]}>
      <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={styles.kpi}>
        <BlurView intensity={30} tint="dark" style={styles.kpiBlur}>
          <LinearGradient colors={[color + '1A', 'transparent']} style={styles.kpiGlow} />
          <View style={[styles.kpiIcon, { backgroundColor: color + '22' }]}><Ionicons name={icon} size={17} color={color} /></View>
          <Counter to={value} size={22} /><Text style={styles.kpiLabel}>{label}</Text>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  )
}

function StatCard({ icon, label, value, color, sub, chart, urgent, delay = 0, onPress }: any) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => { Animated.spring(anim, { toValue: 1, delay, useNativeDriver: true, friction: 8, tension: 65 }).start() }, [])
  return (
    <Animated.View style={[styles.statWrap, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:[40,0] }) }, { scale: anim.interpolate({ inputRange:[0,1], outputRange:[0.9,1] }) }] }]}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        <BlurView intensity={40} tint="dark" style={[styles.statCard, urgent && { borderColor: C.red, borderWidth: 1.5 }]}>
          <LinearGradient colors={[color + '1A', 'transparent']} style={styles.cardGlow} />
          <View style={styles.statTop}>
            <View style={[styles.statIcon, { backgroundColor: color + '22' }]}><Ionicons name={icon} size={21} color={color} /></View>
            {onPress && <Ionicons name="chevron-forward" size={13} color={C.muted} />}
          </View>
          <Counter to={value} size={26} /><Text style={styles.statLabel}>{label}</Text>
          {sub && <View style={styles.statSub}><Ionicons name="trending-up" size={10} color={color} /><Text style={[styles.statSubTxt, { color }]}>{sub}</Text></View>}
          {chart && <Sparkline data={chart} color={color} />}{urgent && <View style={[styles.urgentDot, { backgroundColor: C.red }]} />}
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  )
}

function Action({ icon, label, color, badge, onPress, delay = 0 }: any) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => { Animated.spring(anim, { toValue: 1, delay, useNativeDriver: true, friction: 8, tension: 70 }).start() }, [])
  return (
    <Animated.View style={{ flex: 1, opacity: anim, transform: [{ scale: anim.interpolate({ inputRange:[0,1], outputRange:[0.8,1] }) }] }}>
      <TouchableOpacity activeOpacity={0.82} style={styles.actionBtn} onPress={onPress}>
        <LinearGradient colors={[color + '22', 'transparent']} style={styles.actionGlow} />
        <View style={[styles.actionIcon, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={21} color={color} />
          {badge > 0 && <View style={styles.badge}><Text style={styles.badgeTxt}>{badge > 99 ? '99+' : badge}</Text></View>}
        </View>
        <Text style={[styles.actionTxt, { color }]} numberOfLines={1}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

function Section({ title, action, onAction, children, delay = 0 }: any) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => { Animated.timing(anim, { toValue: 1, duration: 400, delay, useNativeDriver: true }).start() }, [])
  return (
    <Animated.View style={[styles.section, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:[18,0] }) }] }]}>
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{title}</Text>{action && <TouchableOpacity onPress={onAction}><Text style={styles.sectionAction}>{action} →</Text></TouchableOpacity>}</View>
      <View style={styles.sectionBody}>{children}</View>
    </Animated.View>
  )
}

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)
  const heroAnim = useRef(new Animated.Value(0)).current

  useEffect(() => { Animated.spring(heroAnim, { toValue: 1, useNativeDriver: true, friction: 9, tension: 55 }).start() }, [])

  const { data: stats, isLoading, refetch } = useQuery({ queryKey: ['admin-stats'], queryFn: async () => (await api.get('/admin/stats')).data })
  const { data: hostRequests, refetch: refetchHostRequests } = useQuery({ queryKey: ['admin-host-requests'], queryFn: async () => (await api.get('/admin/host-requests')).data })

  const onRefresh = useCallback(async () => { setRefreshing(true); await refetch(); await refetchHostRequests(); setRefreshing(false) }, [refetch, refetchHostRequests])

  const pending = stats?.listings?.pending || 0
  const chart = useMemo(() => [2, 4, 5, 3, 6, 9, stats?.bookings?.today || 1], [stats])
  const barChart = useMemo(() => [3, 5, 4, 7, 6, 8, stats?.bookings?.today || 2], [stats])
  const h = new Date().getHours()
  const greet = h < 6 ? '🌙 Xayrli tun' : h < 12 ? '☀️ Xayrli tong' : h < 17 ? '👋 Xayrli kun' : '🌆 Xayrli kech'
  const nav = (r: string) => router.push(r as any)

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}>
        <Animated.View style={{ opacity: heroAnim, transform: [{ translateY: heroAnim.interpolate({ inputRange:[0,1], outputRange:[-24,0] }) }] }}>
          <LinearGradient colors={['#7C4DFF', '#4F46E5', '#0096C7']} start={{ x:0, y:0 }} end={{ x:1, y:1 }} style={styles.hero}>
            <View style={styles.deco1} /><View style={styles.deco2} /><View style={styles.deco3} />
            <View style={styles.heroTop}>
              <View><Text style={styles.greet}>{greet}</Text><Text style={styles.heroName}>{user?.name || 'Admin'}</Text></View>
              <View style={styles.heroRight}>
                <TouchableOpacity style={styles.notifBtn} onPress={() => nav('/notifications')}>
                  <Ionicons name="notifications-outline" size={20} color="#fff" />
                  {pending > 0 && <View style={styles.notifDot} />}
                </TouchableOpacity>
                <View style={styles.rolePill}><Ionicons name="shield-checkmark" size={12} color="#fff" /><Text style={styles.roleTxt}>Admin</Text></View>
              </View>
            </View>
            <BlurView intensity={50} tint="dark" style={styles.revCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.revLabel}>Umumiy daromad</Text>
                <Text style={styles.revVal}>${(stats?.revenue || 0).toLocaleString()}</Text>
                <View style={styles.revMeta}><View style={styles.greenDot} /><Text style={styles.revMetaTxt}>Bugun +{stats?.bookings?.today || 0} ta bron</Text></View>
                <View style={styles.heroBtns}>
                  <TouchableOpacity style={styles.heroBtn} onPress={() => nav('/(admin)/users')}><Ionicons name="people" size={12} color="#fff" /><Text style={styles.heroBtnTxt}>Users</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.heroBtn} onPress={() => nav('/(admin)/listings')}><Ionicons name="home" size={12} color="#fff" /><Text style={styles.heroBtnTxt}>Listings</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.heroBtn, pending > 0 && styles.heroBtnAlert]} onPress={() => nav('/(admin)/approvals')}><Ionicons name="checkmark-circle" size={12} color="#fff" /><Text style={styles.heroBtnTxt}>Approve{pending > 0 ? ` (${pending})` : ''}</Text></TouchableOpacity>
                </View>
              </View>
              <View style={styles.revRight}><Text style={{ fontSize: isSmallPhone ? 28 : 36 }}>🚀</Text><View style={styles.growBadge}><Ionicons name="trending-up" size={10} color="#00FF94" /><Text style={styles.growTxt}>+12%</Text></View></View>
            </BlurView>
          </LinearGradient>
        </Animated.View>

        <Section title="Overview KPIs" delay={100}>
          <View style={styles.kpiRow}>
            <KPI label="Foydalanuvchilar" value={stats?.users?.total || 0} icon="people" color={C.cyan} onPress={() => nav('/(admin)/users')} />
            <KPI label="Hostlar" value={stats?.users?.hosts || 0} icon="business" color={C.green} onPress={() => nav('/(admin)/users')} />
            <KPI label="Kutilmoqda" value={pending} icon="time" color={C.red} onPress={() => nav('/(admin)/approvals')} />
          </View>
        </Section>

        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <StatCard icon="people" label="Foydalanuvchilar" value={stats?.users?.total || 0} color={C.cyan} sub="+12 bugun" delay={0} onPress={() => nav('/(admin)/users')} />
            <StatCard icon="home" label="Listinglar" value={stats?.listings?.total || 0} color={C.orange} sub="Aktiv" delay={100} onPress={() => nav('/(admin)/listings')} />
          </View>
          <View style={styles.gridRow}>
            <StatCard icon="time-outline" label="Kutilmoqda" value={pending} color={C.red} urgent={pending > 0} sub="Tasdiqlang" delay={180} onPress={() => nav('/(admin)/approvals')} />
            <StatCard icon="calendar" label="Bronlar" value={stats?.bookings?.total || 0} color={C.blue} chart={chart} delay={260} />
          </View>
          <View style={styles.gridRow}>
            <StatCard icon="business" label="Hostlar" value={stats?.users?.hosts || 0} color={C.teal} delay={340} onPress={() => nav('/(admin)/users')} />
            <StatCard icon="cash-outline" label="Daromad" value={`$${stats?.revenue || 0}`} color={C.green} sub="Umumiy" delay={420} />
          </View>
        </View>

        <Section title="Oylik bronlar" delay={200}>
          <View style={styles.chartWrap}><BarChart data={barChart} /><View style={styles.chartLabels}>{['Yan','Fev','Mar','Apr','May','Iyun','Bugun'].map(l => <Text key={l} style={styles.chartLabel}>{l}</Text>)}</View></View>
        </Section>

        {pending > 0 && (
          <TouchableOpacity style={styles.alertWrap} onPress={() => nav('/(admin)/approvals')} activeOpacity={0.85}>
            <LinearGradient colors={['#FF6B00','#FF9500']} start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={styles.alertGrad}>
              <View style={styles.alertLeft}><View style={styles.alertIcon}><Ionicons name="warning" size={18} color="#fff" /></View><View><Text style={styles.alertTitle}>{pending} ta listing tasdiqlanmagan</Text><Text style={styles.alertSub}>Hoziroq ko'rib chiqing →</Text></View></View>
              <Ionicons name="arrow-forward" size={17} color="rgba(255,255,255,0.85)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Host Requests Section */}
        {hostRequests && hostRequests.length > 0 && (
          <View style={styles.hostRequestsSection}>
            <Text style={styles.hostRequestsTitle}>Yangi host so'rovlari</Text>
            {hostRequests.slice(0, 3).map((request: any) => (
              <View key={request.id} style={styles.hostRequestCard}>
                <View style={styles.hostRequestHeader}>
                  <View style={[styles.hostRequestIcon, { backgroundColor: '#FFB020' + '15' }]}><Ionicons name="person-add" size={22} color="#FFB020" /></View>
                  <View style={styles.hostRequestInfo}>
                    <Text style={styles.hostRequestName}>{request.user?.name}</Text>
                    <Text style={styles.hostRequestEmail}>{request.user?.email}</Text>
                  </View>
                  <View style={styles.hostRequestBadge}><Text style={styles.hostRequestBadgeText}>Yangi</Text></View>
                </View>
                <Text style={styles.hostRequestMessage}>{request.message}</Text>
                <View style={styles.hostRequestActions}>
                  <TouchableOpacity style={[styles.hostRequestBtn, styles.approveHostBtn]} onPress={async () => {
                    await api.patch(`/admin/host-requests/${request.id}/${request.user.id}/approve`)
                    refetch(); refetchHostRequests(); Alert.alert('Tasdiqlandi', 'Foydalanuvchi Host qilindi')
                  }}><Ionicons name="checkmark" size={14} color="#fff" /><Text style={styles.hostRequestBtnText}>Tasdiqlash</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.hostRequestBtn, styles.rejectHostBtn]} onPress={() => {
                    Alert.prompt('Rad etish sababi', 'Nima uchun bu so\'rov rad etilmoqda?', [
                      { text: 'Bekor', style: 'cancel' },
                      { text: 'Rad etish', style: 'destructive', onPress: async (reason) => {
                        if (reason) await api.patch(`/admin/host-requests/${request.id}/${request.user.id}/reject`, { reason })
                        refetch(); refetchHostRequests(); Alert.alert('Rad etildi', 'Host so\'rovi rad etildi')
                      }}
                    ])
                  }}><Ionicons name="close" size={14} color="#fff" /><Text style={styles.hostRequestBtnText}>Rad etish</Text></TouchableOpacity>
                </View>
              </View>
            ))}
            {hostRequests.length > 3 && <TouchableOpacity style={styles.viewAllBtn} onPress={() => nav('/(admin)/notifications')}><Text style={styles.viewAllText}>Barcha so'rovlarni ko'rish →</Text></TouchableOpacity>}
          </View>
        )}

        <Text style={styles.secTitle}>Tezkor amallar</Text>
        <View style={styles.actions}>
          <Action icon="checkmark-circle" label="Tasdiqlash" color={C.green} badge={pending} delay={0} onPress={() => nav('/(admin)/approvals')} />
          <Action icon="people" label="Foydalanuvchi" color={C.cyan} delay={60} onPress={() => nav('/(admin)/users')} />
          <Action icon="business" label="Listinglar" color={C.orange} delay={120} onPress={() => nav('/(admin)/listings')} />
          <Action icon="stats-chart" label="Bronlar" color={C.blue} delay={180} onPress={() => nav('/(admin)/listings')} />
        </View>

        <Section title="Tizim holati" delay={300}>
          <View style={styles.sysRow}><View style={[styles.sysIcon, { backgroundColor: C.green + '18' }]}><Ionicons name="server-outline" size={14} color={C.green} /></View><Text style={styles.sysLabel}>Backend API</Text><View style={styles.sysRight}><View style={[styles.sysDot, { backgroundColor: C.green }]} /><Text style={[styles.sysTxt, { color: C.green }]}>Ishlayapti</Text></View></View>
          <View style={styles.sep} />
          <View style={styles.sysRow}><View style={[styles.sysIcon, { backgroundColor: C.green + '18' }]}><Ionicons name="card-outline" size={14} color={C.green} /></View><Text style={styles.sysLabel}>Stripe</Text><View style={styles.sysRight}><View style={[styles.sysDot, { backgroundColor: C.green }]} /><Text style={[styles.sysTxt, { color: C.green }]}>Ulangan</Text></View></View>
          <View style={styles.sep} />
          <View style={styles.sysRow}><View style={[styles.sysIcon, { backgroundColor: C.green + '18' }]}><Ionicons name="cloud-outline" size={14} color={C.green} /></View><Text style={styles.sysLabel}>Cloudinary</Text><View style={styles.sysRight}><View style={[styles.sysDot, { backgroundColor: C.green }]} /><Text style={[styles.sysTxt, { color: C.green }]}>Ulangan</Text></View></View>
          <View style={styles.sep} />
          <View style={styles.sysRow}><View style={[styles.sysIcon, { backgroundColor: C.green + '18' }]}><Ionicons name="mail-outline" size={14} color={C.green} /></View><Text style={styles.sysLabel}>Email xizmati</Text><View style={styles.sysRight}><View style={[styles.sysDot, { backgroundColor: C.green }]} /><Text style={[styles.sysTxt, { color: C.green }]}>Ulangan</Text></View></View>
        </Section>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  hero: { paddingBottom: 28, overflow: 'hidden' },
  deco1: { position:'absolute', width:220, height:220, borderRadius:110, backgroundColor:'rgba(255,255,255,0.07)', top:-90, right:-40 },
  deco2: { position:'absolute', width:160, height:160, borderRadius:80, backgroundColor:'rgba(255,255,255,0.05)', bottom:-60, left:-40 },
  deco3: { position:'absolute', width:90, height:90, borderRadius:45, backgroundColor:'rgba(255,255,255,0.05)', top:50, right:110 },
  heroTop: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', paddingHorizontal:20, paddingTop: isSmallPhone ? 14 : 18, marginBottom:20 },
  greet: { color:'rgba(255,255,255,0.7)', fontSize:rf(13) },
  heroName: { color:'#fff', fontSize:rf(24), fontWeight:'900', marginTop:3 },
  heroRight: { alignItems:'flex-end', gap:8 },
  notifBtn: { position:'relative', width:44, height:44, borderRadius:22, backgroundColor:'rgba(255,255,255,0.16)', justifyContent:'center', alignItems:'center' },
  notifDot: { position:'absolute', top:8, right:8, width:10, height:10, borderRadius:5, backgroundColor:'#00FF94', borderWidth:2, borderColor:'#4F46E5' },
  rolePill: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(255,255,255,0.18)', paddingHorizontal:10, paddingVertical:5, borderRadius:20 },
  roleTxt: { color:'#fff', fontSize:rf(11), fontWeight:'700' },
  revCard: { marginHorizontal:18, borderRadius:24, padding: isSmallPhone ? 14 : 18, overflow:'hidden', flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' },
  revLabel: { color:'rgba(255,255,255,0.65)', fontSize:rf(12) },
  revVal: { color:'#fff', fontSize:rf(30), fontWeight:'900', letterSpacing:-1, marginTop:3 },
  revMeta: { flexDirection:'row', alignItems:'center', gap:6, marginTop:5 },
  greenDot: { width:7, height:7, borderRadius:3.5, backgroundColor:'#00FF94' },
  revMetaTxt: { color:'rgba(255,255,255,0.65)', fontSize:rf(11) },
  revRight: { alignItems:'center', gap:8, paddingLeft:8 },
  growBadge: { flexDirection:'row', alignItems:'center', gap:3, backgroundColor:'rgba(0,255,148,0.18)', paddingHorizontal:7, paddingVertical:3, borderRadius:20 },
  growTxt: { color:'#00FF94', fontSize:rf(10), fontWeight:'800' },
  heroBtns: { flexDirection:'row', gap:7, marginTop:14, flexWrap:'wrap' },
  heroBtn: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(255,255,255,0.14)', paddingHorizontal:9, paddingVertical:6, borderRadius:12 },
  heroBtnTxt: { color:'#fff', fontSize:rf(10), fontWeight:'700' },
  heroBtnAlert: { backgroundColor:'rgba(255,107,0,0.5)' },
  kpiRow: { flexDirection:'row', gap: isSmallPhone ? 8 : 10 },
  kpiWrap: { flex:1 }, kpi: { flex:1 },
  kpiBlur: { padding: isSmallPhone ? 10 : 13, borderRadius:18, gap:5, overflow:'hidden', borderWidth:1, borderColor:C.border },
  kpiGlow: { position:'absolute', width:80, height:80, borderRadius:40, top:-30, right:-20 },
  kpiIcon: { width:32, height:32, borderRadius:16, justifyContent:'center', alignItems:'center', marginBottom:4 },
  kpiLabel: { color:C.muted, fontSize:rf(9.5), fontWeight:'500', flexWrap:'wrap' },
  grid: { paddingHorizontal:16, marginTop:4, gap: isSmallPhone ? 10 : 13 },
  gridRow: { flexDirection:'row', gap: isSmallPhone ? 10 : 13 },
  statWrap: { width:CARD_W },
  statCard: { backgroundColor:'rgba(17,24,39,0.9)', borderRadius:22, padding: isSmallPhone ? 12 : 15, overflow:'hidden', borderWidth:1, borderColor:C.border },
  cardGlow: { position:'absolute', width:120, height:120, borderRadius:60, top:-50, right:-30 },
  statTop: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: isSmallPhone ? 8 : 12 },
  statIcon: { width: isSmallPhone ? 38 : 44, height: isSmallPhone ? 38 : 44, borderRadius:14, justifyContent:'center', alignItems:'center' },
  counter: { color:C.text, fontWeight:'900', letterSpacing:-0.5 },
  statLabel: { color:C.muted, fontSize:rf(10.5), marginTop:3 },
  statSub: { flexDirection:'row', alignItems:'center', gap:3, marginTop:7 },
  statSubTxt: { fontSize:rf(10.5), fontWeight:'700' },
  urgentDot: { position:'absolute', top:12, right:12, width:9, height:9, borderRadius:4.5 },
  spark: { flexDirection:'row', alignItems:'flex-end', gap:3, height:36, marginTop:11 }, sparkBar: { flex:1, borderRadius:4 },
  chartWrap: { backgroundColor:'rgba(255,255,255,0.04)', borderRadius:18, padding:16, overflow:'hidden', borderWidth:1, borderColor:C.border },
  barChart: { flexDirection:'row', alignItems:'flex-end', height:76, gap: isSmallPhone ? 4 : 6 }, barCol: { flex:1, justifyContent:'flex-end' }, barFill: { width:'100%' },
  chartLabels: { flexDirection:'row', justifyContent:'space-between', marginTop:8 }, chartLabel: { color:C.muted, fontSize:rf(9), flex:1, textAlign:'center' },
  alertWrap: { marginHorizontal:16, marginTop:8, marginBottom:4, borderRadius:16, overflow:'hidden', elevation:6, shadowColor:'#FF9500', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8 },
  alertGrad: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:16, paddingVertical:14 },
  alertLeft: { flexDirection:'row', alignItems:'center', gap:12 }, alertIcon: { width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,0.22)', justifyContent:'center', alignItems:'center' },
  alertTitle: { fontSize:rf(13.5), fontWeight:'800', color:'#fff' }, alertSub: { fontSize:rf(11), color:'rgba(255,255,255,0.8)', marginTop:1 },
  secTitle: { color:C.text, fontSize:rf(15), fontWeight:'900', marginTop:22, marginBottom:12, paddingHorizontal:18 },
  actions: { flexDirection:'row', gap: isSmallPhone ? 8 : 10, paddingHorizontal:16 },
  actionBtn: { flex:1, backgroundColor:C.card, borderRadius:20, paddingVertical: isSmallPhone ? 12 : 15, alignItems:'center', overflow:'hidden', borderWidth:1, borderColor:C.border },
  actionGlow: { position:'absolute', width:100, height:100, borderRadius:50, top:-40, right:-30 },
  actionIcon: { width: isSmallPhone ? 44 : 50, height: isSmallPhone ? 44 : 50, borderRadius:25, justifyContent:'center', alignItems:'center', marginBottom:8, position:'relative' },
  actionTxt: { fontSize:rf(10), fontWeight:'700', textAlign:'center' },
  badge: { position:'absolute', top:-2, right:-2, backgroundColor:C.red, minWidth:17, height:17, borderRadius:9, justifyContent:'center', alignItems:'center', paddingHorizontal:4, borderWidth:2, borderColor:C.card },
  badgeTxt: { color:'#fff', fontSize:8, fontWeight:'900' },
  section: { paddingHorizontal:16, marginTop: isSmallPhone ? 16 : 20 },
  sectionHead: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  sectionTitle: { color:C.text, fontSize:rf(14.5), fontWeight:'800' }, sectionAction: { color:C.cyan, fontSize:rf(12.5), fontWeight:'600' },
  sectionBody: { backgroundColor:'rgba(255,255,255,0.04)', borderRadius:20, borderWidth:1, borderColor:C.stroke, paddingHorizontal:14 },
  sysRow: { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:10 }, sysIcon: { width:30, height:30, borderRadius:15, justifyContent:'center', alignItems:'center' },
  sysLabel: { flex:1, fontSize:rf(12.5), color:C.text, fontWeight:'500' }, sysRight: { flexDirection:'row', alignItems:'center', gap:5 }, sysDot: { width:6, height:6, borderRadius:3 },
  sysTxt: { fontSize:rf(11.5), fontWeight:'700' }, sep: { height:1, backgroundColor:C.stroke },
  hostRequestsSection: { marginHorizontal:16, marginTop:16, marginBottom:8 },
  hostRequestsTitle: { color:C.text, fontSize:rf(15), fontWeight:'800', marginBottom:12 },
  hostRequestCard: { backgroundColor:C.card, borderRadius:20, padding:14, marginBottom:10, borderWidth:1, borderColor:C.border },
  hostRequestHeader: { flexDirection:'row', alignItems:'center', gap:12, marginBottom:10 },
  hostRequestIcon: { width:44, height:44, borderRadius:22, justifyContent:'center', alignItems:'center' },
  hostRequestInfo: { flex:1 }, hostRequestName: { fontSize:rf(14), fontWeight:'700', color:C.text },
  hostRequestEmail: { fontSize:rf(11), color:C.muted, marginTop:2 },
  hostRequestBadge: { backgroundColor:'#FFB020', paddingHorizontal:8, paddingVertical:3, borderRadius:10 },
  hostRequestBadgeText: { color:'#fff', fontSize:rf(9), fontWeight:'700' },
  hostRequestMessage: { fontSize:rf(12), color:C.muted, marginBottom:12 },
  hostRequestActions: { flexDirection:'row', gap:10 },
  hostRequestBtn: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5, paddingVertical:8, borderRadius:10 },
  approveHostBtn: { backgroundColor:'#00A651' }, rejectHostBtn: { backgroundColor:'#FF3B30' },
  hostRequestBtnText: { color:'#fff', fontSize:rf(12), fontWeight:'600' },
  viewAllBtn: { alignItems:'center', paddingVertical:8 }, viewAllText: { color:C.primary, fontSize:rf(12), fontWeight:'600' },
})