// app/messages/index.tsx
import { useRef, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Animated,
  Dimensions, Platform,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMessages } from '@/hooks/useMessages'
import { Avatar } from '@/components/common/Avatar'
import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/stores/authStore'

const { width } = Dimensions.get('window')

function fmtTime(iso: string) {
  const d    = new Date(iso)
  const now  = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)             return 'Hozir'
  if (mins < 60)            return `${mins} daq`
  if (diff < 86400000)      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff < 2 * 86400000)  return 'Kecha'
  if (diff < 7 * 86400000)  return `${Math.floor(diff / 86400000)} kun`
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
}

// ── Skeleton loader ──────────────────────────
function SkeletonItem() {
  const pulse = useRef(new Animated.Value(0.4)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    ).start()
  }, [])
  return (
    <Animated.View style={[SK.row, { opacity: pulse }]}>
      <View style={SK.avatar} />
      <View style={SK.info}>
        <View style={SK.line1} />
        <View style={SK.line2} />
      </View>
    </Animated.View>
  )
}
const SK = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.border },
  info:   { flex: 1, marginLeft: 14, gap: 8 },
  line1:  { height: 14, width: '55%', borderRadius: 7, backgroundColor: COLORS.border },
  line2:  { height: 12, width: '80%', borderRadius: 6, backgroundColor: COLORS.surface },
})

export default function MessagesScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const { conversations, isLoadingConversations } = useMessages()

  const fadeAnim  = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(24)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
    ]).start()
  }, [])

  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0)

  // ── Not logged in ─────────────────────────
  if (!user) return (
    <View style={[S.authWrap, { paddingTop: insets.top + 24 }]}>
      <View style={S.authCircle}>
        <Ionicons name="chatbubbles-outline" size={44} color={COLORS.primary} />
      </View>
      <Text style={S.authTitle}>Xabarlar</Text>
      <Text style={S.authDesc}>Xabarlarni ko'rish uchun tizimga kiring</Text>
      <TouchableOpacity style={S.authBtn} onPress={() => router.push('/(auth)/login')}>
        <Text style={S.authBtnTxt}>Kirish</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
        <Text style={S.authLink}>Hisob yo'qmi? Ro'yxatdan o'ting</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={[S.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <Animated.View style={[S.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={S.headerLeft}>
          <Text style={S.headerTitle}>Xabarlar</Text>
          {totalUnread > 0 && (
            <View style={S.totalPill}>
              <Text style={S.totalPillTxt}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={S.newBtn} activeOpacity={0.75}>
          <Ionicons name="create-outline" size={21} color={COLORS.dark} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Skeleton ── */}
      {isLoadingConversations && (
        <View style={{ flex: 1 }}>
          {[1, 2, 3, 4, 5].map(i => <SkeletonItem key={i} />)}
        </View>
      )}

      {/* ── Empty ── */}
      {!isLoadingConversations && conversations.length === 0 && (
        <View style={S.emptyWrap}>
          <View style={S.emptyCircle}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.lightGray} />
          </View>
          <Text style={S.emptyTitle}>Xabarlar yo'q</Text>
          <Text style={S.emptyDesc}>
            Listing sahifasidan mezbonga xabar yuboring
          </Text>
          <TouchableOpacity style={S.exploreBtn} onPress={() => router.push('/(tabs)')}>
            <Ionicons name="search-outline" size={15} color={COLORS.primary} />
            <Text style={S.exploreBtnTxt}>Joylarni ko'rish</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Conversations list ── */}
      {!isLoadingConversations && conversations.length > 0 && (
        <FlatList
          data={conversations}
          keyExtractor={item => item.user.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={S.listContent}
          ItemSeparatorComponent={() => <View style={S.sep} />}
          renderItem={({ item, index }) => {
            const unread = item.unreadCount > 0
            const rowAnim = new Animated.Value(0)
            Animated.spring(rowAnim, {
              toValue: 1, useNativeDriver: true,
              tension: 60, friction: 10, delay: index * 40,
            }).start()

            return (
              <Animated.View style={{
                opacity: rowAnim,
                transform: [{ translateX: rowAnim.interpolate({ inputRange:[0,1], outputRange:[30,0] }) }],
              }}>
                <TouchableOpacity
                  style={[S.row, unread && S.rowUnread]}
                  onPress={() => router.push(
                    `/messages/${item.user.id}?name=${encodeURIComponent(item.user.name)}&avatar=${encodeURIComponent(item.user.avatar || '')}`
                  )}
                  activeOpacity={0.82}
                >
                  {/* Unread accent */}
                  {unread && <View style={S.accentBar} />}

                  {/* Avatar */}
                  <View style={S.avatarWrap}>
                    <Avatar
                      source={item.user.avatar}
                      name={item.user.name}
                      size={54}
                      showOnline
                      isOnline={false}
                      borderColor={unread ? COLORS.primary : 'transparent'}
                      borderWidth={unread ? 2 : 0}
                    />
                  </View>

                  {/* Info */}
                  <View style={S.info}>
                    <View style={S.topRow}>
                      <Text style={[S.name, unread && S.nameUnread]} numberOfLines={1}>
                        {item.user.name}
                      </Text>
                      <Text style={[S.time, unread && S.timeUnread]}>
                        {fmtTime(item.lastMessage.createdAt)}
                      </Text>
                    </View>
                    <View style={S.bottomRow}>
                      <Text style={[S.preview, unread && S.previewUnread]} numberOfLines={1}>
                        {item.lastMessage.content}
                      </Text>
                      {unread ? (
                        <View style={S.badge}>
                          <Text style={S.badgeTxt}>
                            {item.unreadCount > 99 ? '99+' : item.unreadCount}
                          </Text>
                        </View>
                      ) : (
                        <Ionicons name="checkmark-done" size={15} color={COLORS.lightGray} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )
          }}
        />
      )}
    </View>
  )
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },

  // Auth
  authWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 44, backgroundColor: COLORS.white },
  authCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.primary + '12', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary + '25', marginBottom: 6 },
  authTitle: { fontSize: 26, fontWeight: '800', color: COLORS.dark },
  authDesc: { fontSize: 15, color: COLORS.gray, textAlign: 'center', lineHeight: 22 },
  authBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 16, marginTop: 6, width: '100%', alignItems: 'center', elevation: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  authBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  authLink: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.dark },
  totalPill: { backgroundColor: COLORS.primary, borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 7 },
  totalPillTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  newBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },

  // Empty
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 44 },
  emptyCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginBottom: 4 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  emptyDesc: { fontSize: 14, color: COLORS.gray, textAlign: 'center', lineHeight: 22 },
  exploreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary + '10', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 22, borderWidth: 1.5, borderColor: COLORS.primary + '30' },
  exploreBtnTxt: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },

  // List
  listContent: { paddingBottom: 110 },
  sep: { height: 0 },

  // Row
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 20, position: 'relative' },
  rowUnread: { backgroundColor: COLORS.primary + '05' },
  accentBar: { position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 3.5, borderRadius: 2, backgroundColor: COLORS.primary },
  avatarWrap: { marginRight: 14 },
  info: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 },
  name: { fontSize: 15, fontWeight: '500', color: COLORS.dark, flex: 1, marginRight: 8 },
  nameUnread: { fontWeight: '800' },
  time: { fontSize: 12, color: COLORS.gray, flexShrink: 0 },
  timeUnread: { color: COLORS.primary, fontWeight: '700' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preview: { fontSize: 14, color: COLORS.gray, flex: 1, marginRight: 8 },
  previewUnread: { color: COLORS.dark, fontWeight: '600' },
  badge: { backgroundColor: COLORS.primary, borderRadius: 12, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
})