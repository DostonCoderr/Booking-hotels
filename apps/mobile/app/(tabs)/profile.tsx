// app/(tabs)/profile.tsx

import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Linking } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from '@/stores/authStore'
import { Avatar } from '@/components/common/Avatar'
import { api } from '@/services/api'
import { COLORS } from '@/constants/colors'

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  const handleBecomeHost = async () => {
    Alert.alert(
      'Host bo\'lish',
      'Siz Host bo\'lishni xohlaysizmi? Admin so\'rovingizni tekshiradi va tasdiqlaydi.',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        { 
          text: 'Yuborish', 
          onPress: async () => {
            setLoading(true)
            try {
              await api.post('/auth/become-host')
              setRequestSent(true)
              Alert.alert(
                'So\'rov yuborildi', 
                'Sizning so\'rovingiz adminga yuborildi. Tasdiqlangandan so\'ng siz Host bo\'lasiz.'
              )
            } catch (error: any) {
              Alert.alert('Xatolik', error.response?.data?.message || 'So\'rov yuborishda xatolik')
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const menuItems = [
    { 
      icon: 'person-outline', 
      title: 'Shaxsiy ma\'lumotlar', 
      onPress: () => router.push('/profile/edit')
    },
    { 
      icon: 'card-outline', 
      title: 'To\'lov usullari', 
      onPress: () => router.push('/payments')
    },
    { 
      icon: 'notifications-outline', 
      title: 'Bildirishnomalar', 
      onPress: () => router.push('/notifications')
    },
    { 
      icon: 'help-circle-outline', 
      title: 'Yordam', 
      onPress: () => {}
    },
  ]

  if (!user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </LinearGradient>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Avatar source={user?.avatar} name={user?.name} size={80} />
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        
        {/* Role Badge */}
        <View style={[styles.roleBadge, { 
          backgroundColor: user?.role === 'ADMIN' ? COLORS.error + '15' : 
                          user?.role === 'HOST' ? COLORS.success + '15' : 
                          COLORS.info + '15' 
        }]}>
          <Ionicons 
            name={user?.role === 'ADMIN' ? 'shield-checkmark' : 
                  user?.role === 'HOST' ? 'business' : 
                  'person'} 
            size={14} 
            color={user?.role === 'ADMIN' ? COLORS.error : 
                   user?.role === 'HOST' ? COLORS.success : 
                   COLORS.info} 
          />
          <Text style={[styles.roleText, { 
            color: user?.role === 'ADMIN' ? COLORS.error : 
                   user?.role === 'HOST' ? COLORS.success : 
                   COLORS.info 
          }]}>
            {user?.role === 'ADMIN' ? 'Administrator' : 
             user?.role === 'HOST' ? 'Host' : 
             'Foydalanuvchi'}
          </Text>
        </View>

        {/* Host bo'lish tugmasi (faqat USER roli uchun) */}
        {user?.role === 'USER' && !requestSent && (
          <TouchableOpacity 
            style={styles.hostBtn} 
            onPress={handleBecomeHost}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="business-outline" size={18} color={COLORS.primary} />
                <Text style={styles.hostBtnText}>Host bo'lish</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* So'rov yuborilganligi haqida xabar */}
        {requestSent && (
          <View style={styles.requestSentBadge}>
            <Ionicons name="time-outline" size={14} color={COLORS.warning} />
            <Text style={styles.requestSentText}>So'rov yuborilgan, admin tasdiqlashini kuting</Text>
          </View>
        )}

        {/* Host panelga o'tish tugmasi (faqat HOST roli uchun) */}
        {(user?.role === 'HOST' || user?.role === 'ADMIN') && (
          <TouchableOpacity 
            style={styles.hostPanelBtn} 
            onPress={() => router.push('/(host)')}
          >
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.hostPanelGradient}>
              <Ionicons name="business" size={18} color="#fff" />
              <Text style={styles.hostPanelText}>Host panelga o'tish</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.editBtn} 
          onPress={() => router.push('/profile/edit')}
        >
          <Text style={styles.editBtnText}>Profilni tahrirlash</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <LinearGradient colors={[COLORS.surface, COLORS.background]} style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Sayohatlar</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Bronlar</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Sharhlar</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Menu Section */}
      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
            <View style={styles.menuRight}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Version Info */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Versiya 1.0.0</Text>
      </View>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutBtn} 
        onPress={logout}
      >
        <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
        <Text style={styles.logoutText}>Chiqish</Text>
      </TouchableOpacity>

      <View style={styles.footer} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.dark,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 12,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  hostBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  requestSentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.warning + '15',
  },
  requestSentText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '500',
  },
  hostPanelBtn: {
    marginTop: 16,
    borderRadius: 25,
    overflow: 'hidden',
  },
  hostPanelGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  hostPanelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  editBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editBtnText: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '500',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  menuSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 15,
    color: COLORS.dark,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  footer: {
    height: 40,
  },
})