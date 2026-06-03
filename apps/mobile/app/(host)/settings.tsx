// app/(host)/settings.tsx

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Animated, Dimensions } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { router, useNavigation } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Dinamik responsive shrift funksiyasi
const rf = (size: number) => {
  const scale = SCREEN_WIDTH / 375
  const newSize = size * scale
  return Math.round(newSize) < size ? size : Math.round(newSize)
}

// Premium Dark Cyber Palette
const C = {
  bg: '#0A0D14',
  card: 'rgba(16, 20, 30, 0.65)',
  primary: '#38BDF8',         // Neon Havorang
  accent: '#A78BFA',          // Neon Binafsha
  text: '#F3F4F6',
  textLight: '#9CA3AF',
  border: 'rgba(255, 255, 255, 0.06)',
  switchOn: '#38BDF8',
  switchOff: '#1F2937',
}

const SETTINGS_SECTIONS = [
  {
    title: 'Bildirishnomalar',
    items: [
      { icon: 'mail-outline', label: 'Email bildirishnomalar', type: 'switch', key: 'email' },
      { icon: 'paper-plane-outline', label: 'Telegram bildirishnomalar', type: 'switch', key: 'telegram' },
      { icon: 'notifications-outline', label: 'Yangi bronlar', type: 'switch', key: 'newBookings' },
      { icon: 'megaphone-outline', label: 'Aksiyalar va yangiliklar', type: 'switch', key: 'promotions' },
    ]
  },
  {
    title: 'Maxfiylik',
    items: [
      { icon: 'eye-off-outline', label: 'Profilni yashirish', type: 'switch', key: 'hideProfile' },
      { icon: 'shield-checkmark-outline', label: 'Ikki faktorli autentifikatsiya', type: 'button', key: '2fa' },
    ]
  },
  {
    title: 'Tizim va ilova',
    items: [
      { icon: 'language-outline', label: 'Ilova tili', type: 'button', key: 'language', value: "O'zbekcha" },
      { icon: 'moon-outline', label: 'Qorong\'u rejim', type: 'switch', key: 'darkMode' },
      { icon: 'trash-outline', label: 'Kesh ma\'lumotlarini tozalash', type: 'button', key: 'clearCache' },
    ]
  },
]

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const fadeAnim = useRef(new Animated.Value(0)).current
  
  const [settings, setSettings] = useState({
    email: true,
    telegram: false,
    newBookings: true,
    promotions: false,
    hideProfile: false,
    darkMode: true,
  })

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
  }, [])

  const handleSwitch = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleButton = (key: string) => {
    if (key === 'language') {
      Alert.alert('Til sozlamalari', 'Ko\'p tillilik tizimi keyingi yangilanishda faollashtiriladi.')
    } else if (key === '2fa') {
      Alert.alert('Xavfsizlik', 'Ikki faktorli himoya tizimi tez orada qo\'shiladi.')
    } else if (key === 'clearCache') {
      Alert.alert('Tozalash', 'Ilova kesh xotirasi muvaffaqiyatli tozalandi.')
    }
  }

  // ✅ Xavfsiz orqaga qaytish funksiyasi
  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      router.back()
    } else {
      router.replace('/(host)')
    }
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header wrapper */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top || 12 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={rf(20)} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sozlamalar</Text>
          <View style={{ width: 38 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {SETTINGS_SECTIONS.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIdx) => {
                const isLast = itemIdx === section.items.length - 1
                return (
                  <TouchableOpacity
                    key={itemIdx}
                    style={[styles.settingItem, isLast && styles.lastItem]}
                    onPress={() => item.type === 'button' && handleButton(item.key)}
                    activeOpacity={item.type === 'button' ? 0.7 : 1}
                  >
                    <View style={styles.settingLeft}>
                      <View style={styles.iconContainer}>
                        <Ionicons name={item.icon as any} size={rf(18)} color={C.accent} />
                      </View>
                      <Text style={styles.settingLabel}>{item.label}</Text>
                    </View>

                    {item.type === 'switch' ? (
                      <Switch
                        value={settings[item.key as keyof typeof settings]}
                        onValueChange={(val) => handleSwitch(item.key, val)}
                        trackColor={{ false: C.switchOff, true: C.switchOn + '40' }}
                        thumbColor={settings[item.key as keyof typeof settings] ? C.primary : '#9CA3AF'}
                        ios_backgroundColor={C.switchOff}
                      />
                    ) : (
                      <View style={styles.settingRight}>
                        {item.value && <Text style={styles.settingValue}>{item.value}</Text>}
                        <Ionicons name="chevron-forward" size={rf(15)} color={C.textLight} />
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: C.bg 
  },
  
  // Header section
  headerWrapper: {
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 14,
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16 
  },
  backBtn: { 
    width: 38, 
    height: 38, 
    borderRadius: 12, 
    backgroundColor: C.card, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  headerTitle: { 
    fontSize: rf(18), 
    fontWeight: '700', 
    color: C.text,
    letterSpacing: -0.4,
  },

  // Main Container List
  scrollContent: { 
    padding: 16, 
    gap: 20 
  },
  section: { 
    gap: 8 
  },
  sectionTitle: { 
    fontSize: rf(13), 
    fontWeight: '600', 
    color: C.textLight, 
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  sectionCard: { 
    backgroundColor: C.card, 
    borderRadius: 20, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: C.border 
  },
  settingItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: C.border 
  },
  lastItem: { 
    borderBottomWidth: 0 
  },
  settingLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
    flex: 1
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  settingLabel: { 
    fontSize: rf(13.5), 
    color: C.text,
    fontWeight: '500',
    letterSpacing: -0.1,
    flex: 1
  },
  settingRight: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  settingValue: { 
    fontSize: rf(12.5), 
    color: C.textLight,
    fontWeight: '400' 
  },
})