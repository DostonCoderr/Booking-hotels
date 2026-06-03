// app/(tabs)/messages.tsx
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useMessages } from '@/hooks/useMessages'
import { Avatar } from '@/components/common/Avatar'
import { COLORS } from '@/constants/colors'

export default function MessagesTabScreen() {
  const { conversations, isLoadingConversations } = useMessages()

  const formatTime = (date: string) => {
    const msgDate = new Date(date)
    const now = new Date()
    const diff = now.getTime() - msgDate.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Kecha'
    } else if (days < 7) {
      return `${days} kun oldin`
    } else {
      return msgDate.toLocaleDateString()
    }
  }

  if (isLoadingConversations) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  if (!conversations || conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color={COLORS.gray} />
        <Text style={styles.emptyTitle}>Xabarlar yo'q</Text>
        <Text style={styles.emptyText}>Hali hech qanday xabar yo'q</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Xabarlar</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.user.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => router.push(`/messages/${item.user.id}?name=${encodeURIComponent(item.user.name)}&avatar=${item.user.avatar || ''}`)}
          >
            <Avatar source={item.user.avatar} name={item.user.name} size={52} />

            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.userName}>{item.user.name}</Text>
                <Text style={styles.timeText}>{formatTime(item.lastMessage.createdAt)}</Text>
              </View>
              <View style={styles.messageRow}>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage.content}
                </Text>
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: COLORS.dark },
  list: { paddingHorizontal: 16 },
  chatItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chatInfo: { flex: 1, marginLeft: 12 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  userName: { fontSize: 16, fontWeight: '600', color: COLORS.dark },
  timeText: { fontSize: 12, color: COLORS.gray },
  messageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lastMessage: { flex: 1, fontSize: 14, color: COLORS.gray, marginRight: 8 },
  unreadBadge: { backgroundColor: COLORS.primary, borderRadius: 12, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: COLORS.dark, marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.gray, marginTop: 8, textAlign: 'center' },
})