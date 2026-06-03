import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { COLORS } from '@/constants/colors'

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  const settingsItems = [
    { icon: 'notifications-outline', title: 'Bildirishnomalar', type: 'switch', value: notifications, onValueChange: setNotifications },
    { icon: 'moon-outline', title: 'Qorong\'i rejim', type: 'switch', value: darkMode, onValueChange: setDarkMode },
    { icon: 'language-outline', title: 'Til', type: 'arrow', value: 'O\'zbekcha' },
    { icon: 'lock-closed-outline', title: 'Maxfiylik', type: 'arrow' },
    { icon: 'trash-outline', title: "Hisobni o'chirish", type: 'danger' },
  ]

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sozlamalar</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {settingsItems.map((item, index) => (
          <View key={index} style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name={item.icon as any} size={22} color={COLORS.gray} />
              <Text style={styles.settingTitle}>{item.title}</Text>
            </View>
            <View style={styles.settingRight}>
              {item.type === 'switch' ? (
                <Switch
                  value={item.value}
                  onValueChange={item.onValueChange}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor="#fff"
                />
              ) : item.type === 'arrow' ? (
                <>
                  {item.value && <Text style={styles.settingValue}>{item.value}</Text>}
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                </>
              ) : (
                <Text style={styles.dangerText}>O'chirish</Text>
              )}
            </View>
          </View>
        ))}
      </View>
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
  content: { padding: 20 },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingTitle: { fontSize: 16, color: COLORS.dark },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { fontSize: 14, color: COLORS.gray },
  dangerText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
})