// app/(admin)/profile.tsx
import { useRef, useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, ScrollView, Alert, Switch,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useAuthStore } from '@/stores/authStore'
import { Avatar } from '@/components/common/Avatar'

const { width } = Dimensions.get('window')
const isTablet = width >= 768
const isSmall  = width <= 375
const rf = (n: number) => isTablet ? n * 1.15 : isSmall ? n * 0.9 : n

const D = {
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
}

// ── Stat chip ─────────────────────────────────
function StatChip({ icon, label, val, color }: {
  icon: string; label: string; val: string | number; color: string
}) {
  return (
    <View style={[SC.wrap, { borderColor: color + '30' }]}>
      <View style={[SC.icon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={17} color={color} />
      </View>
      <Text style={SC.val}>{val}</Text>
      <Text style={SC.lbl}>{label}</Text>
    </View>
  )
}
const SC = StyleSheet.create({
  wrap: { flex:1, alignItems:'center', gap:5, backgroundColor:D.card, borderRadius:18, paddingVertical:14, borderWidth:1 },
  icon: { width:36, height:36, borderRadius:18, justifyContent:'center', alignItems:'center' },
  val:  { fontSize:rf(18), fontWeight:'900', color:D.text },
  lbl:  { fontSize:rf(10), color:D.muted, fontWeight:'500' },
})

// ── Menu item ─────────────────────────────────
function MenuItem({
  icon, label, color, desc, onPress, danger, toggle, toggleVal, onToggle, delay = 0,
}: {
  icon: string; label: string; color: string; desc?: string
  onPress?: () => void; danger?: boolean; toggle?: boolean
  toggleVal?: boolean; onToggle?: (v: boolean) => void; delay?: number
}) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.spring(anim, { toValue:1, delay, useNativeDriver:true, tension:60, friction:9 }).start()
  }, [])

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateX: anim.interpolate({ inputRange:[0,1], outputRange:[30,0] }) }],
    }}>
      <TouchableOpacity
        style={MI.row}
        onPress={onPress}
        activeOpacity={toggle ? 1 : 0.82}
        disabled={toggle}
      >
        <View style={[MI.iconBox, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon as any} size={19} color={color} />
        </View>
        <View style={MI.mid}>
          <Text style={[MI.label, danger && { color: D.red }]}>{label}</Text>
          {desc && <Text style={MI.desc}>{desc}</Text>}
        </View>
        {toggle
          ? <Switch value={toggleVal} onValueChange={onToggle} trackColor={{ false: D.stroke, true: D.primary + '80' }} thumbColor={toggleVal ? D.primary : D.muted} />
          : <Ionicons name="chevron-forward" size={15} color={D.muted} />
        }
      </TouchableOpacity>
    </Animated.View>
  )
}
const MI = StyleSheet.create({
  row:     { flexDirection:'row', alignItems:'center', gap:14, paddingVertical:13, borderBottomWidth:1, borderBottomColor:D.stroke },
  iconBox: { width:40, height:40, borderRadius:20, justifyContent:'center', alignItems:'center' },
  mid:     { flex:1 },
  label:   { fontSize:rf(14.5), fontWeight:'600', color:D.text },
  desc:    { fontSize:rf(11.5), color:D.muted, marginTop:2 },
})

// ── Section label ─────────────────────────────
function SectionLabel({ title }: { title: string }) {
  return <Text style={SL.txt}>{title}</Text>
}
const SL = StyleSheet.create({
  txt: { fontSize:rf(11), fontWeight:'700', color:D.muted, textTransform:'uppercase', letterSpacing:0.7, marginBottom:4, marginTop:20, paddingHorizontal:16 },
})

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
export default function AdminProfileScreen() {
  const { user, logout } = useAuthStore()

  const [notifications, setNotifications] = useState(true)
  const [darkMode,       setDarkMode]      = useState(true)

  const heroAnim = useRef(new Animated.Value(0)).current
  const cardAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(heroAnim, { toValue:1, useNativeDriver:true, tension:60, friction:10 }),
      Animated.spring(cardAnim, { toValue:1, useNativeDriver:true, tension:60, friction:10 }),
    ]).start()
  }, [])

  const handleLogout = () => {
    Alert.alert('Chiqish', 'Admin paneldan chiqmoqchimisiz?', [
      { text: 'Bekor', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: logout },
    ])
  }

  return (
    <View style={S.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ━━━ HERO CARD ━━━ */}
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

            {/* Avatar + info */}
            <View style={S.heroBody}>
              <View style={S.avatarWrap}>
                <Avatar source={user?.avatar} name={user?.name} size={isSmall ? 72 : 84} borderWidth={3} borderColor="rgba(255,255,255,0.5)" />
                <View style={S.onlineDot} />
              </View>

              <Text style={S.heroName}>{user?.name || 'Admin'}</Text>
              <Text style={S.heroEmail}>{user?.email}</Text>

              <View style={S.heroRow}>
                <BlurView intensity={40} tint="dark" style={S.rolePill}>
                  <Ionicons name="shield-checkmark" size={13} color={D.cyan} />
                  <Text style={S.roleTxt}>Super Admin</Text>
                </BlurView>
                <BlurView intensity={40} tint="dark" style={S.activePill}>
                  <View style={S.activeDot} />
                  <Text style={S.activeTxt}>Faol</Text>
                </BlurView>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ━━━ STATS ━━━ */}
        <Animated.View style={[S.statsRow, {
          opacity: cardAnim,
          transform: [{ scale: cardAnim.interpolate({ inputRange:[0,1], outputRange:[0.9,1] }) }],
        }]}>
          <StatChip icon="home-outline"      label="Listinglar"    val={0}   color={D.cyan}   />
          <StatChip icon="people-outline"    label="Foydalanuvchi" val={0}   color={D.green}  />
          <StatChip icon="calendar-outline"  label="Bronlar"       val={0}   color={D.yellow} />
        </Animated.View>

        {/* ━━━ NAVIGATION ━━━ */}
        <SectionLabel title="Boshqaruv" />
        <View style={S.section}>
          <MenuItem icon="stats-chart-outline"    label="Dashboard"         color={D.cyan}    desc="Umumiy statistika"      onPress={() => router.push('/(admin)/'         as any)} delay={0}   />
          <MenuItem icon="home-outline"           label="Listinglar"        color={D.yellow}  desc="Barcha listinglarni boshqarish" onPress={() => router.push('/(admin)/listings'   as any)} delay={40}  />
          <MenuItem icon="people-outline"         label="Foydalanuvchilar"  color={D.primary} desc="User va hostlarni boshqarish"   onPress={() => router.push('/(admin)/users'      as any)} delay={80}  />
          <MenuItem icon="checkmark-circle-outline" label="Tasdiqlashlar"   color={D.green}   desc="Kutilayotgan listinglar"  onPress={() => router.push('/(admin)/approvals' as any)} delay={120} />
          <MenuItem icon="notifications-outline"  label="Bildirishnomalar" color="#FF9500"   desc="Tizim xabarlari"         onPress={() => router.push('/(admin)/notifications' as any)} delay={160} />
        </View>

        {/* ━━━ SETTINGS ━━━ */}
        <SectionLabel title="Sozlamalar" />
        <View style={S.section}>
          <MenuItem icon="notifications-outline" label="Push bildirishnomalar" color={D.primary} toggle toggleVal={notifications} onToggle={setNotifications} delay={200} />
          <MenuItem icon="moon-outline"          label="Qorong'i rejim"        color={D.cyan}    toggle toggleVal={darkMode}      onToggle={setDarkMode}      delay={240} />
          <MenuItem icon="lock-closed-outline"   label="Xavfsizlik"           color={D.yellow}  desc="Parol va 2FA"              onPress={() => Alert.alert('Tez orada', 'Bu funksiya tez orada qo\'shiladi')} delay={280} />
        </View>

        {/* ━━━ SWITCH / LOGOUT ━━━ */}
        <SectionLabel title="Boshqa" />
        <View style={S.section}>
          <MenuItem
            icon="swap-horizontal-outline"
            label="User rejimiga o'tish"
            color={D.cyan}
            desc="Oddiy foydalanuvchi sifatida ko'rish"
            onPress={() => router.push('/(tabs)' as any)}
            delay={320}
          />
          <MenuItem
            icon="information-circle-outline"
            label="Ilova haqida"
            color={D.muted}
            desc="v1.0.0 — Airbnb Clone"
            onPress={() => Alert.alert('Airbnb Clone', 'v1.0.0\nBuilt with React Native + Expo')}
            delay={360}
          />
        </View>

        {/* ━━━ LOGOUT ━━━ */}
        <View style={S.logoutWrap}>
          <TouchableOpacity style={S.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <LinearGradient colors={['#FF3B30', '#CC2A1F']} style={S.logoutGrad}>
              <Ionicons name="log-out-outline" size={18} color="#fff" />
              <Text style={S.logoutTxt}>Chiqish</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  )
}

const S = StyleSheet.create({
  root: { flex:1, backgroundColor: D.bg },

  // Hero
  hero:      { paddingBottom:28, overflow:'hidden' },
  deco1:     { position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:'rgba(255,255,255,0.07)', top:-80, right:-40 },
  deco2:     { position:'absolute', width:130, height:130, borderRadius:65,  backgroundColor:'rgba(255,255,255,0.05)', bottom:-40, left:-30 },
  heroBody:  { alignItems:'center', paddingTop: isSmall ? 18 : 24, gap:8 },
  avatarWrap:{ position:'relative' },
  onlineDot: { position:'absolute', bottom:2, right:2, width:14, height:14, borderRadius:7, backgroundColor:D.green, borderWidth:2.5, borderColor:'#4F46E5' },
  heroName:  { color:'#fff', fontSize:rf(22), fontWeight:'900', marginTop:4 },
  heroEmail: { color:'rgba(255,255,255,0.7)', fontSize:rf(13) },
  heroRow:   { flexDirection:'row', gap:10, marginTop:4 },
  rolePill:  { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:6, borderRadius:22, overflow:'hidden', borderWidth:1, borderColor:'rgba(0,229,255,0.3)' },
  roleTxt:   { color:D.cyan, fontSize:rf(12), fontWeight:'700' },
  activePill:{ flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:6, borderRadius:22, overflow:'hidden', borderWidth:1, borderColor:'rgba(0,230,118,0.3)' },
  activeDot: { width:7, height:7, borderRadius:3.5, backgroundColor:D.green },
  activeTxt: { color:D.green, fontSize:rf(12), fontWeight:'700' },

  // Stats
  statsRow: { flexDirection:'row', gap:10, paddingHorizontal:16, marginTop:16 },

  // Sections
  section: { backgroundColor:D.card, borderRadius:20, marginHorizontal:16, paddingHorizontal:16, borderWidth:1, borderColor:D.stroke },

  // Logout
  logoutWrap: { paddingHorizontal:16, marginTop:24 },
  logoutBtn:  { borderRadius:18, overflow:'hidden', elevation:4, shadowColor:D.red, shadowOffset:{width:0,height:4}, shadowOpacity:0.35, shadowRadius:10 },
  logoutGrad: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:15 },
  logoutTxt:  { color:'#fff', fontSize:rf(15), fontWeight:'800' },
})