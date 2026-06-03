// app/(auth)/welcome.tsx

import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, Animated, Easing, Image, ScrollView, Alert, ActivityIndicator
} from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'

const { width, height } = Dimensions.get('window')
const isTAB = width >= 768
const isSM = height <= 720
const rf = (n: number) => isTAB ? n * 1.25 : isSM ? n * 0.88 : n

const SLIDES = [
  {
    bg: ['#0D001A', '#1a0033', '#2d0052'] as const,
    accent: '#A855F7',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
    tag: '🏡 Toshkent, O\'zbekiston',
    title: ['Dunyo bo\'ylab', 'uyingiz', 'topiladi'],
    sub: '6,000,000+ xil joy',
    price: '$85/kecha',
    rating: '4.9',
  },
  {
    bg: ['#001a0d', '#003320', '#004d30'] as const,
    accent: '#34D399',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
    tag: '🌴 Bali, Indoneziya',
    title: ['Mahalliy', 'mezbon', 'bilan'],
    sub: 'Haqiqiy tajriba',
    price: '$120/kecha',
    rating: '5.0',
  },
  {
    bg: ['#001a1a', '#002d2d', '#004040'] as const,
    accent: '#22D3EE',
    image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=900&q=80',
    tag: '☀️ Santorini, Gretsiya',
    title: ['Xavfsiz va', 'ishonchli', 'bron'],
    sub: '100% kafolat',
    price: '$200/kecha',
    rating: '4.8',
  },
]

const STATS = [
  { icon: 'home-outline', end: 6, suf: 'M+', label: 'Joy' },
  { icon: 'globe-outline', end: 220, suf: '+', label: 'Mamlakat' },
  { icon: 'star-outline', end: 4.9, suf: '', label: 'Reyting', float: true },
  { icon: 'people-outline', end: 50, suf: 'M+', label: 'Mehmon' },
]

// Orbs Component
function Orbs({ accent }: { accent: string }) {
  const orbs = useRef(
    Array.from({ length: 5 }, (_, i) => ({
      tx: new Animated.Value(0),
      ty: new Animated.Value(0),
      op: new Animated.Value(0),
      sc: new Animated.Value(0.4 + Math.random() * 0.6),
      left: (i / 5) * width + Math.random() * (width / 5) - 20,
      top: Math.random() * height * 0.5,
      size: 4 + Math.random() * 5,
    }))
  ).current

  useEffect(() => {
    orbs.forEach((orb, i) => {
      const delay = i * 200
      const floatLoop = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(orb.ty, { toValue: -(10 + Math.random() * 15), duration: 2500 + i * 300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(orb.ty, { toValue: 0, duration: 2500 + i * 300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ])
        ).start()
        Animated.loop(
          Animated.sequence([
            Animated.timing(orb.tx, { toValue: 8 + Math.random() * 8, duration: 3500 + i * 200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(orb.tx, { toValue: 0, duration: 3500 + i * 200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ])
        ).start()
      }
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(orb.op, { toValue: 0.4 + Math.random() * 0.4, duration: 500, useNativeDriver: true }),
      ]).start(floatLoop)
    })
  }, [])

  return (
    <>
      {orbs.map((orb, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: orb.left,
            top: orb.top,
            width: orb.size,
            height: orb.size,
            borderRadius: orb.size / 2,
            backgroundColor: accent,
            opacity: orb.op,
            transform: [{ translateX: orb.tx }, { translateY: orb.ty }, { scale: orb.sc }],
          }}
        />
      ))}
    </>
  )
}

// CountUp Component
function CountUp({ end, suf, float: isFloat, color, size }: { end: number; suf: string; float?: boolean; color: string; size: number }) {
  const anim = useRef(new Animated.Value(0)).current
  const [val, setVal] = useState('0')

  useEffect(() => {
    Animated.timing(anim, { toValue: end, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start()
    const id = anim.addListener(({ value }) => setVal(isFloat ? (Math.round(value * 10) / 10).toFixed(1) : String(Math.floor(value))))
    return () => anim.removeListener(id)
  }, [end])

  return <Text style={{ fontSize: rf(size), fontWeight: '900', color, letterSpacing: -0.3 }}>{val}{suf}</Text>
}

// TypeWriter Component
function TypeWriter({ lines, color }: { lines: string[]; color: string }) {
  const [disp, setDisp] = useState<string[]>(['', '', ''])

  useEffect(() => {
    setDisp(['', '', ''])
    let li = 0, ci = 0
    const tick = () => {
      if (li >= lines.length) return
      if (ci <= lines[li].length) {
        setDisp(prev => { const n = [...prev]; n[li] = lines[li].slice(0, ci); return n })
        ci++
        setTimeout(tick, 30)
      } else { li++; ci = 0; setTimeout(tick, 70) }
    }
    const t = setTimeout(tick, 150)
    return () => clearTimeout(t)
  }, [lines.join('|')])

  return (
    <View style={TW.container}>
      {disp.map((l, i) => (
        <Text key={i} style={[TW.line, { color: i === 1 ? color : '#fff' }]} numberOfLines={1}>{l}</Text>
      ))}
    </View>
  )
}
const TW = StyleSheet.create({ container: { gap: 2 }, line: { fontSize: rf(isSM ? 28 : 34), fontWeight: '900', letterSpacing: -0.8, lineHeight: rf(isSM ? 34 : 42) } })

// Card3D Component
function Card3D({ slide, position }: { slide: typeof SLIDES[0]; position: 'left' | 'center' | 'right' }) {
  const rot = useRef(new Animated.Value(position === 'left' ? -12 : position === 'right' ? 12 : 0)).current
  const tx = useRef(new Animated.Value(position === 'left' ? -width * 0.24 : position === 'right' ? width * 0.24 : 0)).current
  const sc = useRef(new Animated.Value(position === 'center' ? 1 : 0.8)).current
  const op = useRef(new Animated.Value(position === 'center' ? 1 : 0.45)).current
  const glowOp = useRef(new Animated.Value(position === 'center' ? 1 : 0)).current
  const floatY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const tgt = { rot: position === 'left' ? -12 : position === 'right' ? 12 : 0, tx: position === 'left' ? -width * 0.24 : position === 'right' ? width * 0.24 : 0, sc: position === 'center' ? 1 : 0.8, op: position === 'center' ? 1 : 0.45, glow: position === 'center' ? 1 : 0 }
    Animated.parallel([Animated.spring(rot, { toValue: tgt.rot, useNativeDriver: true, tension: 50, friction: 10 }), Animated.spring(tx, { toValue: tgt.tx, useNativeDriver: true, tension: 50, friction: 10 }), Animated.spring(sc, { toValue: tgt.sc, useNativeDriver: true, tension: 50, friction: 10 }), Animated.timing(op, { toValue: tgt.op, duration: 250, useNativeDriver: true }), Animated.timing(glowOp, { toValue: tgt.glow, duration: 300, useNativeDriver: true })]).start()
  }, [position])

  useEffect(() => {
    if (position !== 'center') return
    Animated.loop(Animated.sequence([Animated.timing(floatY, { toValue: -6, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(floatY, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })])).start()
    return () => floatY.stopAnimation()
  }, [position])

  const cardW = isTAB ? 260 : isSM ? width * 0.52 : width * 0.56
  const cardH = cardW * 1.22

  return (
    <Animated.View style={{ position: 'absolute', width: cardW, height: cardH, borderRadius: 22, opacity: op, transform: [{ translateX: tx }, { translateY: floatY }, { rotate: rot.interpolate({ inputRange: [-30, 30], outputRange: ['-30deg', '30deg'] }) }, { scale: sc }], zIndex: position === 'center' ? 10 : 1, shadowColor: slide.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: position === 'center' ? 0.35 : 0.12, shadowRadius: 14 }}>
      <Animated.View style={[CD.glow, { borderColor: slide.accent + 'A0', opacity: glowOp }]} />
      <Image source={{ uri: slide.image }} style={CD.img} resizeMode="cover" />
      <LinearGradient colors={['transparent', 'rgba(2,4,8,0.92)']} style={CD.grad} />
      <BlurView intensity={35} tint="dark" style={CD.tag}><Text style={CD.tagTxt}>{slide.tag}</Text></BlurView>
      <View style={CD.footer}><BlurView intensity={45} tint="dark" style={CD.footerBlur}><View style={CD.footerRow}><View><Text style={CD.footerLbl}>Narx</Text><Text style={[CD.price, { color: slide.accent }]}>{slide.price}</Text></View><View style={CD.ratingWrap}><Ionicons name="star" size={10} color="#FFB800" /><Text style={CD.ratingTxt}>{slide.rating}</Text></View></View></BlurView></View>
    </Animated.View>
  )
}
const CD = StyleSheet.create({
  glow: { position: 'absolute', top: -1.5, left: -1.5, right: -1.5, bottom: -1.5, borderRadius: 23, borderWidth: 1.5, zIndex: 5 },
  img: { width: '100%', height: '100%', borderRadius: 22 },
  grad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', borderRadius: 22 },
  tag: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)' },
  tagTxt: { color: '#fff', fontSize: rf(10), fontWeight: '600' },
  footer: { position: 'absolute', bottom: 8, left: 8, right: 8, borderRadius: 12, overflow: 'hidden' },
  footerBlur: { padding: 8, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLbl: { color: 'rgba(255,255,255,0.4)', fontSize: rf(8.5) },
  price: { fontSize: rf(13), fontWeight: '800' },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 2.5, backgroundColor: 'rgba(255,184,0,0.12)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  ratingTxt: { color: '#FFB800', fontSize: rf(10.5), fontWeight: '700' },
})

// MAIN WELCOME SCREEN
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets()
  const [cur, setCur] = useState(0)
  const timer = useRef<any>(null)

  const topOp = useRef(new Animated.Value(0)).current
  const topTy = useRef(new Animated.Value(-20)).current
  const bodyOp = useRef(new Animated.Value(0)).current
  const btmOp = useRef(new Animated.Value(0)).current
  const btmTy = useRef(new Animated.Value(30)).current
  const stOps = useRef(STATS.map(() => new Animated.Value(0))).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([Animated.spring(topTy, { toValue: 0, useNativeDriver: true, tension: 65, friction: 9 }), Animated.timing(topOp, { toValue: 1, duration: 400, useNativeDriver: true })]),
      Animated.parallel([Animated.timing(bodyOp, { toValue: 1, duration: 500, useNativeDriver: true }), Animated.stagger(60, stOps.map(a => Animated.spring(a, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 })))]),
      Animated.parallel([Animated.spring(btmTy, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }), Animated.timing(btmOp, { toValue: 1, duration: 400, useNativeDriver: true })]),
    ]).start()
    startTimer()
    return () => clearInterval(timer.current)
  }, [])

  const startTimer = useCallback(() => { clearInterval(timer.current); timer.current = setInterval(() => setCur(c => (c + 1) % SLIDES.length), 5000) }, [])
  const goTo = (i: number) => { setCur(i); startTimer() }

  const slide = SLIDES[cur]
  const prev = (cur - 1 + SLIDES.length) % SLIDES.length
  const next = (cur + 1) % SLIDES.length

  return (
    <View style={[S.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <LinearGradient colors={slide.bg as any} style={StyleSheet.absoluteFillObject} />
      <Orbs accent={slide.accent} />
      <View style={[S.bgGlow, { backgroundColor: slide.accent + '12' }]} />

      {/* Top Bar */}
      <Animated.View style={[S.topBar, { opacity: topOp, transform: [{ translateY: topTy }] }]}>
        <BlurView intensity={20} tint="dark" style={S.logoPill}>
          <View style={[S.logoDot, { backgroundColor: slide.accent }]} />
          <Text style={[S.logoTxt, { color: slide.accent }]}>StayVerse</Text>
        </BlurView>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.8}>
          <BlurView intensity={15} tint="dark" style={S.skipPill}>
            <Text style={S.skipTxt}>Kirish</Text>
            <Ionicons name="log-in-outline" size={13} color="rgba(255,255,255,0.5)" />
          </BlurView>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={S.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
        {/* Card Deck */}
        <Animated.View style={[S.deckContainer, { opacity: bodyOp }]}>
          <View style={S.deckViewport}>
            <Card3D slide={SLIDES[prev]} position="left" />
            <Card3D slide={SLIDES[next]} position="right" />
            <Card3D slide={slide} position="center" />
          </View>
          <View style={S.dotsRow}>
            {SLIDES.map((sl, i) => (<TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={8}><View style={[S.dot, i === cur ? { width: 22, backgroundColor: sl.accent } : { width: 6, backgroundColor: 'rgba(255,255,255,0.25)' }]} /></TouchableOpacity>))}
          </View>
        </Animated.View>

        {/* Typewriter */}
        <Animated.View style={[S.infoContainer, { opacity: bodyOp }]}>
          <TypeWriter key={cur} lines={slide.title} color={slide.accent} />
          <BlurView intensity={12} tint="dark" style={S.subPill}><Ionicons name="sparkles-outline" size={12} color={slide.accent} /><Text style={[S.subTxt, { color: slide.accent }]}>{slide.sub}</Text></BlurView>
        </Animated.View>

        {/* Stats */}
        <View style={S.statsRow}>
          {STATS.map((st, i) => (<Animated.View key={i} style={[S.statItem, { opacity: stOps[i], transform: [{ scale: stOps[i].interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}><BlurView intensity={20} tint="dark" style={S.statBlur}><Ionicons name={st.icon as any} size={rf(13)} color={slide.accent} /><CountUp end={st.end} suf={st.suf} float={st.float} color="#fff" size={14} /><Text style={S.statLbl}>{st.label}</Text></BlurView></Animated.View>))}
        </View>

        {/* Action Buttons */}
        <Animated.View style={[S.actionContainer, { opacity: btmOp, transform: [{ translateY: btmTy }] }]}>
          {/* Email Register */}
          <TouchableOpacity style={[S.cta, { shadowColor: slide.accent }]} onPress={() => router.push('/(auth)/register')} activeOpacity={0.85}>
            <LinearGradient colors={[slide.accent, slide.accent + 'CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.ctaGrad}>
              <Ionicons name="mail-outline" size={rf(16)} color="#fff" />
              <Text style={S.ctaTxt}>Email bilan ro'yxatdan o'tish</Text>
              <View style={S.ctaArrow}><Ionicons name="arrow-forward" size={12} color={slide.accent} /></View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={S.orRow}><View style={S.orLine} /><Text style={S.orTxt}>yoki tezkor kirish</Text><View style={S.orLine} /></View>

          {/* Social Login - FAQAT USER UCHUN (tugmalar faqat UI) */}
          <View style={S.socialsRow}>
            <TouchableOpacity style={S.socialBtnWrapper} onPress={() => router.push('/(auth)/login')}>
              <BlurView intensity={25} tint="dark" style={S.socialBtn}>
                <Ionicons name="logo-google" size={rf(16)} color="#DB4437" />
                <Text style={S.socialLbl}>Google</Text>
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity style={S.socialBtnWrapper} onPress={() => router.push('/(auth)/login')}>
              <BlurView intensity={25} tint="dark" style={S.socialBtn}>
                <Ionicons name="logo-apple" size={rf(16)} color="#000" />
                <Text style={S.socialLbl}>Apple</Text>
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity style={S.socialBtnWrapper} onPress={() => router.push('/(auth)/login')}>
              <BlurView intensity={25} tint="dark" style={S.socialBtn}>
                <Ionicons name="logo-facebook" size={rf(16)} color="#1877F2" />
                <Text style={S.socialLbl}>Facebook</Text>
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={S.loginRow}>
            <Text style={S.loginInfo}>Hisobingiz bormi?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[S.loginLink, { color: slide.accent }]}> Kirish →</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  )
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020408' },
  bgGlow: { position: 'absolute', width: width * 1.4, height: width * 1.4, borderRadius: width * 0.7, bottom: -width * 0.5, left: -width * 0.2 },
  scrollContent: { flexGrow: 1, justifyContent: 'space-between', paddingBottom: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, zIndex: 50 },
  logoPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' },
  logoDot: { width: 7, height: 7, borderRadius: 3.5 },
  logoTxt: { fontSize: rf(18), fontWeight: '900', letterSpacing: -0.5, textTransform: 'lowercase' },
  skipPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' },
  skipTxt: { color: 'rgba(255,255,255,0.6)', fontSize: rf(12), fontWeight: '600' },
  deckContainer: { flex: 1.1, minHeight: isSM ? 210 : 250, justifyContent: 'center', alignItems: 'center', marginTop: isSM ? 5 : 15 },
  deckViewport: { width: '100%', flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 10 },
  dot: { height: 6, borderRadius: 3 },
  infoContainer: { paddingHorizontal: 24, marginTop: isSM ? 10 : 20, gap: 6 },
  subPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, overflow: 'hidden', alignSelf: 'flex-start', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' },
  subTxt: { fontSize: rf(12), fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: isSM ? 5 : 8, paddingHorizontal: 16, marginTop: isSM ? 12 : 22 },
  statItem: { flex: 1 },
  statBlur: { alignItems: 'center', paddingVertical: isSM ? 6 : 10, borderRadius: 14, overflow: 'hidden', gap: 2, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.05)' },
  statLbl: { color: 'rgba(255,255,255,0.4)', fontSize: rf(8.5), fontWeight: '500' },
  actionContainer: { paddingHorizontal: 18, marginTop: isSM ? 14 : 24, gap: isSM ? 10 : 14 },
  cta: { borderRadius: 14, overflow: 'hidden', elevation: 8, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10 },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: isSM ? 12 : 15 },
  ctaTxt: { color: '#fff', fontSize: rf(14.5), fontWeight: '900', letterSpacing: 0.2 },
  ctaArrow: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  orLine: { flex: 1, height: 0.5, backgroundColor: 'rgba(255,255,255,0.08)' },
  orTxt: { color: 'rgba(255,255,255,0.3)', fontSize: rf(10.5) },
  socialsRow: { flexDirection: 'row', gap: isSM ? 6 : 10 },
  socialBtnWrapper: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: isSM ? 10 : 13, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  socialLbl: { color: 'rgba(255,255,255,0.75)', fontSize: rf(11.5), fontWeight: '600' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 6, marginTop: 2 },
  loginInfo: { color: 'rgba(255,255,255,0.4)', fontSize: rf(12) },
  loginLink: { fontSize: rf(12), fontWeight: '800' },
})