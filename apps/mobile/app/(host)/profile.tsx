// app/(host)/profile.tsx - Tuzatilgan qism

import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, Modal, ActivityIndicator, Dimensions } from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useAuthStore } from '@/stores/authStore'
import { Avatar } from '@/components/common/Avatar'
import { api } from '@/services/api'

const { width } = Dimensions.get('window')
const isTablet = width >= 768
const isSmall = width <= 365

// Kontent mutanosibligini ta'minlash uchun dinamik o'lcham (Responsive Font & Spacing)
const rf = (n: number) => isTablet ? n * 1.15 : isSmall ? n * 0.9 : n

const C = {
  bg: '#020408',          // OLED-Friendly chuqur qora kosmos foni
  card: 'rgba(10, 15, 30, 0.7)', // Shaffof glassmorphic karta foni
  stroke: 'rgba(255, 255, 255, 0.04)',
  primary: '#F43F5E',     // Neon Cyber Pushti
  primaryGradient: ['#F43F5E', '#9F1239'] as const,
  success: '#10B981',
  warning: '#F59E0B',
  text: '#F9FAFB',
  muted: '#9CA3AF',
  dimmed: '#4B5563',
}

interface HostProfile {
  id: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
  role: string
  createdAt: string
  telegramChatId: string | null
  isHost: boolean
  isVerified: boolean
}

export default function HostProfileScreen() {
  const { logout } = useAuthStore()
  const [profile, setProfile] = useState<HostProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPersonalInfo, setShowPersonalInfo] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/host/profile')
      setProfile(response.data)
      setEditForm({
        name: response.data.name || '',
        phone: response.data.phone || '',
      })
    } catch (error: any) {
      console.error('Profile yuklashda xatolik:', error)
      Alert.alert('Xatolik', error.response?.data?.message || 'Profil yuklanmadi')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    setSaving(true)
    try {
      await api.put('/host/profile', editForm)
      await fetchProfile()
      setShowPersonalInfo(false)
      Alert.alert('Muvaffaqiyatli', "Profil ma'lumotlari yangilandi")
    } catch (error: any) {
      Alert.alert('Xatolik', error.response?.data?.message || 'Yangilashda xatolik')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const menuItems = [
    { 
      icon: 'person-outline' as const, 
      title: "Shaxsiy ma'lumotlar", 
      onPress: () => setShowPersonalInfo(true),
      gradient: C.primaryGradient
    },
    { 
      icon: 'notifications-outline' as const, 
      title: 'Bildirishnomalar', 
      onPress: () => router.push('/(host)/notifications'),
      gradient: ['#F59E0B', '#B45309'] as const
    },
    { 
      icon: 'help-circle-outline' as const, 
      title: 'Yordam va qo\'llab-quvvatlash', 
      onPress: () => Alert.alert('Yordam', 'Savollaringiz bo\'lsa support@space.uz ga yozing'),
      gradient: ['#6B7280', '#374151'] as const
    },
  ]

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      {/* Mutloq Shaffof Fiksirlangan Header */}
      <BlurView intensity={25} tint="dark" style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={{ width: 38 }} />
      </BlurView>

      {/* Ekran tubidan qolib ketishni oldini oluvchi Responsiv Scroll */}
      <ScrollView 
        contentContainerStyle={styles.scrollBody} 
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Ambient Neon Glow Backlighting */}
        <View style={[styles.ambientGlow, { backgroundColor: C.primary + '08' }]} />

        {/* Profile Card (Glassmorphism effect) */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Avatar source={profile?.avatar} name={profile?.name || 'Host'} size={rf(80)} />
            {profile?.isVerified && (
              <LinearGradient colors={['#10B981', '#059669'] as const} style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={11} color="#fff" />
              </LinearGradient>
            )}
          </View>
          
          <Text style={styles.userName}>{profile?.name || 'Foydalanuvchi'}</Text>
          <Text style={styles.userEmail}>{profile?.email}</Text>
          
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <View style={styles.liveIndicator} />
              <Text style={styles.roleBadgeTxt}>Host Status</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Matrix Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Ro'yxatdan o'tish</Text>
            <Text style={styles.statValue}>{formatDate(profile?.createdAt || '')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Verifikatsiya</Text>
            <Text style={[styles.statValue, { color: profile?.isVerified ? C.success : C.warning }]}>
              {profile?.isVerified ? 'Tasdiqlangan' : 'Kutilmoqda'}
            </Text>
          </View>

          {profile?.telegramChatId && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Telegram bot</Text>
              <Text style={[styles.statValue, { color: '#2AABEE' }]}>Faol</Text>
            </View>
          )}
        </View>

        {/* Navigation Control List */}
        <View style={styles.menuBox}>
          <Text style={styles.sectionTitle}>Tizim boshqaruvi</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
              <LinearGradient colors={item.gradient} style={styles.menuIconBox}>
                <Ionicons name={item.icon} size={rf(18)} color="#fff" />
              </LinearGradient>
              <Text style={styles.menuTxt}>{item.title}</Text>
              {/* ✅ Tuzatildi: 'chevron-forward-edge' -> 'chevron-forward' */}
              <Ionicons name="chevron-forward" size={16} color={C.dimmed} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Terminal Action Buttons */}
        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.switchBtn} onPress={() => router.push('/(tabs)')} activeOpacity={0.8}>
            <Ionicons name="swap-horizontal" size={18} color={C.primary} />
            <Text style={styles.switchTxt}>Foydalanuvchi rejimiga o'tish</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Tizimdan chiqish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Cyberpunk Elegant Personal Info Modal */}
      <Modal visible={showPersonalInfo} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPersonalInfo(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Profil Ma'lumotlari</Text>
              <TouchableOpacity onPress={updateProfile} disabled={saving} style={styles.saveBtn}>
                {saving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.saveBtnTxt}>Saqlash</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Modal Scrollable Inputs */}
            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false} bounces={true}>
              <View style={styles.modalAvatarZone}>
                <Avatar source={profile?.avatar} name={profile?.name} size={rf(70)} />
                <TouchableOpacity style={styles.avatarChangeLink}>
                  <Text style={styles.avatarChangeTxt}>Profil rasmini o'zgartirish</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>To'liq ismingiz</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.name}
                  onChangeText={(t) => setEditForm(p => ({ ...p, name: t }))}
                  placeholder="Ism va familiya"
                  placeholderTextColor={C.dimmed}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>E-mail manzil</Text>
                <View style={[styles.textInput, styles.inputDisabled]}>
                  <Text style={styles.disabledText}>{profile?.email}</Text>
                  <Ionicons name="lock-closed" size={14} color={C.dimmed} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telefon raqam</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.phone}
                  onChangeText={(t) => setEditForm(p => ({ ...p, phone: t }))}
                  placeholder="+998 XX XXX XX XX"
                  placeholderTextColor={C.dimmed}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={{ height: 50 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: C.bg 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: C.bg 
  },
  
  // Header dizayni
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: rf(48),
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: C.stroke,
    zIndex: 100,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.stroke,
  },
  headerTitle: {
    fontSize: rf(15),
    fontWeight: '700',
    color: C.text,
    letterSpacing: 0.5,
  },
  
  // Scroll va fon elementlari
  scrollBody: {
    paddingTop: rf(110),
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  ambientGlow: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    width: width * 0.7,
    height: width * 0.5,
    borderRadius: 100,
    zIndex: -1,
  },

  // Profil kartasi
  profileCard: {
    width: '100%',
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.stroke,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0A0F1E',
  },
  userName: {
    fontSize: rf(17),
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: rf(12),
    color: C.muted,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  roleBadgeTxt: {
    color: C.text,
    fontSize: rf(11),
    fontWeight: '600',
  },
  
  // Statistika kataklari
  statsGrid: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.stroke,
    padding: 12,
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: rf(10.5),
    color: C.muted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: rf(11.5),
    color: C.text,
    fontWeight: '700',
  },
  
  // Menular bloki
  menuBox: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: rf(11),
    color: C.dimmed,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.stroke,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTxt: {
    flex: 1,
    fontSize: rf(13.5),
    color: C.text,
    fontWeight: '500',
  },
  
  // Pastki action tugmalari
  footerActions: {
    marginTop: 16,
    gap: 8,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: 'rgba(244, 63, 94, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
    borderRadius: 16,
  },
  switchTxt: {
    color: C.primary,
    fontSize: rf(13.5),
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 16,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: rf(13.5),
    fontWeight: '600',
  },
  
  // Modal arxitekturasi
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#070A12',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: C.stroke,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: rf(15),
    fontWeight: '700',
    color: C.text,
  },
  saveBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveBtnTxt: {
    color: '#000',
    fontSize: rf(12),
    fontWeight: '700',
  },
  modalForm: {
    padding: 20,
  },
  modalAvatarZone: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarChangeLink: {
    marginTop: 10,
  },
  avatarChangeTxt: {
    color: C.primary,
    fontSize: rf(12),
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: rf(12),
    color: C.muted,
    marginBottom: 6,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 14,
    color: C.text,
    fontSize: rf(13.5),
    borderWidth: 1,
    borderColor: C.stroke,
  },
  inputDisabled: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    opacity: 0.5,
  },
  disabledText: {
    color: C.text,
    fontSize: rf(13.5),
  },
})