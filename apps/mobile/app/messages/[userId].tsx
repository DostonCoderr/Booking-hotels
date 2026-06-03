// app/messages/[userId].tsx
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Animated, Dimensions,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMessages, Message } from '@/hooks/useMessages'
import { Avatar } from '@/components/common/Avatar'
import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/stores/authStore'

const { width } = Dimensions.get('window')
const BUBBLE_MAX = width * 0.72

// ── Helpers ──────────────────────────────────
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function fmtDivider(iso: string) {
  const d    = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 86400000)     return 'Bugun'
  if (diff < 2 * 86400000) return 'Kecha'
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

function needsDivider(msgs: Message[], i: number) {
  if (i === 0) return true
  return (
    new Date(msgs[i].createdAt).toDateString() !==
    new Date(msgs[i - 1].createdAt).toDateString()
  )
}

function sameAuthorNext(msgs: Message[], i: number) {
  if (i >= msgs.length - 1) return false
  return msgs[i].sender?.id === msgs[i + 1].sender?.id
}

function sameAuthorPrev(msgs: Message[], i: number) {
  if (i === 0) return false
  return msgs[i].sender?.id === msgs[i - 1].sender?.id && !needsDivider(msgs, i)
}

// ── Typing indicator ─────────────────────────
function TypingBubble() {
  const d1 = useRef(new Animated.Value(0)).current
  const d2 = useRef(new Animated.Value(0)).current
  const d3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const anim = (v: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: -6, duration: 300, delay, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0,  duration: 300, useNativeDriver: true }),
      ]))

    Animated.parallel([anim(d1, 0), anim(d2, 150), anim(d3, 300)]).start()
  }, [])

  return (
    <View style={TB.wrap}>
      {[d1, d2, d3].map((v, i) => (
        <Animated.View key={i} style={[TB.dot, { transform: [{ translateY: v }] }]} />
      ))}
    </View>
  )
}

const TB = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: COLORS.white, borderRadius: 18, borderBottomLeftRadius: 4, alignSelf: 'flex-start', marginLeft: 42, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.lightGray },
})

// ── Main ─────────────────────────────────────
export default function ChatScreen() {
  const { userId, name, avatar } = useLocalSearchParams<{
    userId: string; name: string; avatar: string
  }>()
  const { user }  = useAuthStore()
  const insets    = useSafeAreaInsets()
  const listRef   = useRef<FlatList>(null)
  const inputRef  = useRef<TextInput>(null)
  const headerAnim = useRef(new Animated.Value(0)).current

  const [message,     setMessage]     = useState('')
  const [inputH,      setInputH]      = useState(44)
  const [showTyping,  setShowTyping]  = useState(false)

    const {
    messages, 
    sendMessage, 
    markMessagesAsRead,  
    isSending, 
    isLoadingMessages, 
    isConnected,
  } = useMessages(userId as string)

  const decodedName   = name   ? decodeURIComponent(name)   : 'Foydalanuvchi'
  const decodedAvatar = avatar ? decodeURIComponent(avatar) : null

  // animate header
  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1, 
      useNativeDriver: true, 
      tension: 70, 
      friction: 10,
    }).start()
  }, [])

  // scroll to end
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages.length])

  // mark read
  useEffect(() => {
    if (userId) {
      markMessagesAsRead(userId as string)
    }
  }, [messages.length, userId, markMessagesAsRead])

  const handleSend = useCallback(() => {
    const txt = message.trim()
    if (!txt || isSending) return
    setMessage('')
    setInputH(44)
    sendMessage(userId, txt)
  }, [message, userId, isSending])

  if (isLoadingMessages) return (
    <View style={S.loader}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  )

  return (
    <View style={[S.root, { paddingTop: insets.top }]}>

      {/* ━━━ Header ━━━ */}
      <Animated.View style={[
        S.header,
        {
          opacity:   headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-24,0] }) }],
        }
      ]}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.dark} />
        </TouchableOpacity>

        <TouchableOpacity style={S.headerCenter} activeOpacity={0.85}>
          <Avatar source={decodedAvatar} name={decodedName} size={40} showOnline isOnline={isConnected} />
          <View style={S.headerText}>
            <Text style={S.headerName} numberOfLines={1}>{decodedName}</Text>
            <View style={S.statusRow}>
              <View style={[S.statusDot, { backgroundColor: isConnected ? '#00A651' : COLORS.lightGray }]} />
              <Text style={[S.statusTxt, { color: isConnected ? '#00A651' : COLORS.gray }]}>
                {showTyping ? 'Yozmoqda...' : isConnected ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={S.headerActions}>
          <TouchableOpacity style={S.hBtn} onPress={() => Alert.alert("Qo'ng'iroq", "Tez orada ishga tushadi")}>
            <Ionicons name="call-outline" size={20} color={COLORS.dark} />
          </TouchableOpacity>
          <TouchableOpacity style={S.hBtn} onPress={() => Alert.alert('Amallar', 'Tozalash · Blok qilish')}>
            <Ionicons name="ellipsis-vertical" size={20} color={COLORS.dark} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ━━━ Messages + Input ━━━ */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={[S.msgList, messages.length === 0 && S.msgListEmpty]}
          showsVerticalScrollIndicator={false}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={S.emptyChat}>
              <View style={S.emptyAvatarWrap}>
                <Avatar source={decodedAvatar} name={decodedName} size={72} />
              </View>
              <Text style={S.emptyName}>{decodedName}</Text>
              <Text style={S.emptyHint}>Suhbat boshlang 👋</Text>
              <View style={S.emptyTips}>
                {['Salom 👋', 'Joy hali bo\'sh?', 'Narx so\'ramoqchi edim'].map((q, i) => (
                  <TouchableOpacity key={i} style={S.tipChip} onPress={() => setMessage(q)}>
                    <Text style={S.tipTxt}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          renderItem={({ item, index }) => {
            const isMe      = item.sender?.id === user?.id
            const showDate  = needsDivider(messages, index)
            const groupNext = sameAuthorNext(messages, index)
            const groupPrev = sameAuthorPrev(messages, index)
            const isLast    = !groupNext

            // corner rounding: grouped bubbles share one tail
            const meRadius    = { borderBottomRightRadius: isLast ? 4 : 18 }
            const themRadius  = { borderBottomLeftRadius:  isLast ? 4 : 18 }

            return (
              <>
                {/* Date divider */}
                {showDate && (
                  <View style={S.divRow}>
                    <View style={S.divLine} />
                    <View style={S.divPill}>
                      <Text style={S.divTxt}>{fmtDivider(item.createdAt)}</Text>
                    </View>
                    <View style={S.divLine} />
                  </View>
                )}

                <View style={[
                  S.msgRow,
                  isMe ? S.msgRowMe : S.msgRowThem,
                  !isLast && { marginBottom: 2 },
                  isLast  && { marginBottom: 8 },
                ]}>
                  {/* Their avatar — only on last of group */}
                  {!isMe && (
                    <View style={S.theirAvatar}>
                      {isLast
                        ? <Avatar source={item.sender?.avatar} name={item.sender?.name} size={28} />
                        : <View style={{ width: 28 }} />
                      }
                    </View>
                  )}

                  {/* Bubble */}
                  <View style={[
                    S.bubble,
                    isMe ? S.bubbleMe : S.bubbleThem,
                    isMe ? meRadius : themRadius,
                    // top corners if grouped with previous
                    groupPrev && isMe   && { borderTopRightRadius: 6 },
                    groupPrev && !isMe  && { borderTopLeftRadius:  6 },
                  ]}>
                    <Text style={[S.bubbleTxt, isMe ? S.bubbleTxtMe : S.bubbleTxtThem]}>
                      {item.content}
                    </Text>
                    <View style={S.bubbleMeta}>
                      <Text style={[S.bubbleTime, isMe ? S.bubbleTimeMe : S.bubbleTimeThem]}>
                        {fmtTime(item.createdAt)}
                      </Text>
                      {isMe && (
                        <Ionicons
                          name={item.isRead ? 'checkmark-done' : 'checkmark'}
                          size={13}
                          color={item.isRead ? '#60D4FF' : 'rgba(255,255,255,0.55)'}
                        />
                      )}
                    </View>
                  </View>
                </View>
              </>
            )
          }}
        />

        {/* Typing indicator */}
        {showTyping && <TypingBubble />}

        {/* ━━━ Input bar ━━━ */}
        <View style={[S.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity style={S.attachBtn} activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={27} color={COLORS.gray} />
          </TouchableOpacity>

          <View style={[S.inputWrap, inputH > 48 && { borderRadius: 18 }]}>
            <TextInput
              ref={inputRef}
              style={[S.input, { height: Math.max(44, inputH) }]}
              placeholder="Xabar yozing..."
              placeholderTextColor={COLORS.gray}
              value={message}
              onChangeText={setMessage}
              multiline
              onContentSizeChange={e =>
                setInputH(Math.min(e.nativeEvent.contentSize.height + 4, 120))
              }
            />
          </View>

          <TouchableOpacity
            style={[S.sendBtn, !!message.trim() && S.sendBtnActive]}
            onPress={handleSend}
            disabled={!message.trim() || isSending}
            activeOpacity={0.82}
          >
            {isSending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons
                  name="send"
                  size={18}
                  color={message.trim() ? '#fff' : COLORS.lightGray}
                />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#ECEEF1' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ECEEF1' },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerText: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusTxt: { fontSize: 12, fontWeight: '500' },
  headerActions: { flexDirection: 'row', gap: 4 },
  hBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface },

  // ── Message list ──
  msgList: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 6 },
  msgListEmpty: { flex: 1 },

  // Empty
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 48, gap: 10 },
  emptyAvatarWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: COLORS.primary + '22', marginBottom: 4 },
  emptyName: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  emptyHint: { fontSize: 14, color: COLORS.gray },
  emptyTips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 10 },
  tipChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, elevation: 1 },
  tipTxt: { fontSize: 13, color: COLORS.dark, fontWeight: '500' },

  // Date divider
  divRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  divPill: { backgroundColor: '#ECEEF1', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  divTxt: { fontSize: 12, color: COLORS.gray, fontWeight: '500' },

  // Rows
  msgRow: { flexDirection: 'row' },
  msgRowMe:   { justifyContent: 'flex-end',  paddingLeft:  56 },
  msgRowThem: { justifyContent: 'flex-start', paddingRight: 56 },
  theirAvatar: { marginRight: 6, justifyContent: 'flex-end', paddingBottom: 2 },

  // Bubbles
  bubble: {
    maxWidth: BUBBLE_MAX,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 3,
  },
  bubbleTxt: { fontSize: 15, lineHeight: 21 },
  bubbleTxtMe:   { color: '#fff' },
  bubbleTxtThem: { color: COLORS.dark },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  bubbleTime: { fontSize: 11 },
  bubbleTimeMe:   { color: 'rgba(255,255,255,0.65)' },
  bubbleTimeThem: { color: COLORS.gray },

  // ── Input bar ──
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 10, paddingTop: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  attachBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  inputWrap: {
    flex: 1, minHeight: 44,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, justifyContent: 'center',
  },
  input: { fontSize: 15, color: COLORS.dark, paddingVertical: 10, maxHeight: 120 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  sendBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    elevation: 4,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 6,
  },
})