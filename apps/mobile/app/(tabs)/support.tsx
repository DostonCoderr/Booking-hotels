import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/colors'

const faqs = [
  { question: "Bronni qanday bekor qilish mumkin?", answer: "Bronni bekor qilish uchun bronlar sahifasiga o'ting va bekor qilish tugmasini bosing." },
  { question: "To'lov qanday amalga oshiriladi?", answer: "To'lov Stripe orqali xavfsiz tarzda amalga oshiriladi." },
  { question: "Mehmon bo'lish uchun nima qilish kerak?", answer: "Ro'yxatdan o'ting va istalgan listingni bron qiling." },
]

export default function SupportScreen() {
  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yordam</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="headset-outline" size={64} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Yordam markazi</Text>
          <Text style={styles.text}>Savollaringiz bo'yicha yordam oling</Text>

          {/* Contact buttons */}
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactBtn}>
              <Ionicons name="chatbubble-outline" size={24} color={COLORS.primary} />
              <Text style={styles.contactBtnText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactBtn}>
              <Ionicons name="call-outline" size={24} color={COLORS.primary} />
              <Text style={styles.contactBtnText}>Qo'ng'iroq</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactBtn}>
              <Ionicons name="mail-outline" size={24} color={COLORS.primary} />
              <Text style={styles.contactBtnText}>Email</Text>
            </TouchableOpacity>
          </View>

          {/* FAQs */}
          <View style={styles.faqSection}>
            <Text style={styles.faqTitle}>Ko'p so'raladigan savollar</Text>
            {faqs.map((faq, index) => (
              <View key={index} style={styles.faqItem}>
                <Text style={styles.faqQuestion}>• {faq.question}</Text>
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 8, width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.dark },
  content: { padding: 20, alignItems: 'center' },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.dark, marginBottom: 8 },
  text: { fontSize: 16, color: COLORS.gray, textAlign: 'center', marginBottom: 24 },
  contactRow: { flexDirection: 'row', gap: 20, marginBottom: 32 },
  contactBtn: { alignItems: 'center', gap: 8, padding: 12, backgroundColor: COLORS.surface, borderRadius: 16, minWidth: 80 },
  contactBtnText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
  faqSection: { width: '100%' },
  faqTitle: { fontSize: 18, fontWeight: '600', color: COLORS.dark, marginBottom: 16 },
  faqItem: { marginBottom: 20, padding: 16, backgroundColor: COLORS.surface, borderRadius: 12 },
  faqQuestion: { fontSize: 15, fontWeight: '600', color: COLORS.dark, marginBottom: 8 },
  faqAnswer: { fontSize: 14, color: COLORS.gray, lineHeight: 20 },
})