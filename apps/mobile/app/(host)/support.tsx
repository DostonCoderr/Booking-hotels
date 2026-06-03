// app/(host)/support.tsx

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Animated, Dimensions } from 'react-native'
import { useEffect, useRef } from 'react'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Oddiy va samarali responsive shrift funksiyasi (baza: 375px - iPhone X o'lchami)
const rf = (size: number) => {
  const scale = SCREEN_WIDTH / 375
  const newSize = size * scale
  return Math.round(newSize) < size ? size : Math.round(newSize)
}

// Grid elementlarining kengligini aniq dinamik hisoblash
// (Ekran kengligi - chetki paddinglar (16*2) - elementlar orasidagi masofa (12)) / 2
const CARD_WIDTH = (SCREEN_WIDTH - 32 - 12) / 2

const C = {
  bg: '#0A0D14',
  card: 'rgba(16, 20, 30, 0.65)',
  primary: '#38BDF8',         
  accent: '#A78BFA',          
  success: '#34D399',         
  warning: '#FBBF24',         
  text: '#F3F4F6',
  textLight: '#9CA3AF',
  border: 'rgba(255, 255, 255, 0.06)',
}

const SUPPORT_ITEMS = [
  { icon: 'chatbubbles-outline', title: 'Jonli chat', subtitle: '24/7 tezkor ko\'mak', color: C.primary, action: () => Alert.alert('Jonli chat', 'Tez orada aktivlashtiriladi.') },
  { icon: 'paper-plane-outline', title: 'Telegram Bot', subtitle: '@stayhub_support', color: '#2AABEE', action: () => Linking.openURL('https://t.me/stayhub_support') },
  { icon: 'mail-outline', title: 'Elektron pochta', subtitle: 'support@stayhub.uz', color: C.success, action: () => Linking.openURL('mailto:support@stayhub.uz') },
  { icon: 'call-outline', title: 'Aloqa markazi', subtitle: '+998 71 123 45 67', color: C.warning, action: () => Linking.openURL('tel:+998711234567') },
]

const FAQ_ITEMS = [
  { q: "Yangi e'lon (listing) qanday qo'shiladi?", a: "Asosiy boshqaruv panelidagi '+' tugmasi yoki 'E'lonlar' bo'limidagi 'Yangi e'lon' tugmasini bosish orqali ma'lumotlarni to'ldirib yuborishingiz mumkin." },
  { q: "Mijoz bron qilganini qanday tasdiqlayman?", a: "Tizimga kelib tushgan buyurtmalarni 'Bronlar' sahifasiga o'tgan holda cheklovlarsiz ko'rib chiqishingiz va 'Tasdiqlash' tugmasini bosish orqali qabul qilishingiz mumkin." },
  { q: "Mening hisobimga to'lovlar qachon o'tkaziladi?", a: "Mijoz turar joyga muvaffaqiyatli joylashgan kundan boshlab, 24 soat vaqt oralig'ida barcha mablag'lar avtomatlashtirilgan holda hisob raqamingizga tushirib beriladi." },
  { q: "Agar e'lonim moderator tomonidan rad etilsa nima qilaman?", a: "Xabarnomalar bo'limida ko'rsatilgan rad etilish sababini o'rganib chiqib, listing ma'lumotlarini tahrirlang va qayta tekshirish uchun yuboring." },
]

export default function SupportScreen() {
  const insets = useSafeAreaInsets()
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
  }, [])

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top || 12 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={rf(20)} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yordam markazi</Text>
          <View style={{ width: 38 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Support Grid */}
        <Text style={styles.sectionTitle}>Bog'lanish kanallari</Text>
        <View style={styles.supportGrid}>
          {SUPPORT_ITEMS.map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.supportCard} onPress={item.action} activeOpacity={0.75}>
              <LinearGradient colors={[item.color + '06', 'transparent']} style={styles.supportCardGradient} />
              <View style={[styles.supportIcon, { backgroundColor: item.color + '12' }]}>
                <Ionicons name={item.icon as any} size={rf(22)} color={item.color} />
              </View>
              <Text style={styles.supportTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.supportSubtitle} numberOfLines={1}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ Section */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Ko'p so'raladigan savollar</Text>
        <View style={styles.faqContainer}>
          {FAQ_ITEMS.map((item, idx) => (
            <View key={idx} style={styles.faqItem}>
              <View style={styles.faqHeader}>
                <View style={styles.faqIndicator} />
                <Text style={styles.faqQuestion}>{item.q}</Text>
              </View>
              <Text style={styles.faqAnswer}>{item.a}</Text>
            </View>
          ))}
        </View>

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
  scrollContent: { 
    padding: 16, 
    gap: 16 
  },
  sectionTitle: { 
    fontSize: rf(15), 
    fontWeight: '700', 
    color: C.text, 
    letterSpacing: -0.2 
  },
  supportGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12 // Kartalar orasidagi aniq masofa
  },
  supportCard: { 
    width: CARD_WIDTH, // Har qanday telefonda aniq simmetrik 2 ustun bo'ladi
    backgroundColor: C.card, 
    borderRadius: 18, 
    padding: 14, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: C.border, 
    overflow: 'hidden',
    position: 'relative'
  },
  supportCardGradient: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    height: 70 
  },
  supportIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  supportTitle: { 
    fontSize: rf(13), 
    fontWeight: '600', 
    color: C.text, 
    marginBottom: 4,
    letterSpacing: -0.1
  },
  supportSubtitle: { 
    fontSize: rf(10.5), 
    color: C.textLight, 
    textAlign: 'center',
    fontWeight: '500'
  },
  faqContainer: { 
    gap: 10 
  },
  faqItem: { 
    backgroundColor: C.card, 
    borderRadius: 16, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: C.border 
  },
  faqHeader: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 10, 
    marginBottom: 8 
  },
  faqIndicator: { 
    width: 3, 
    height: 16, 
    borderRadius: 1.5, 
    backgroundColor: C.accent,
    marginTop: 2 
  },
  faqQuestion: { 
    fontSize: rf(13), 
    fontWeight: '600', 
    color: C.text, 
    flex: 1,
    lineHeight: 18
  },
  faqAnswer: { 
    fontSize: rf(12), 
    color: C.textLight, 
    lineHeight: 18, 
    paddingLeft: 13,
    fontWeight: '400'
  },
})