// app/(host)/messages.tsx

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Animated, Dimensions, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform, ScrollView, Modal
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Avatar } from '@/components/common/Avatar'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const isTablet = SCREEN_WIDTH >= 768
const isSmallPhone = SCREEN_WIDTH <= 375

// Premium Dark Cyber Palette (BMW M neon style)
const C = {
  bg: '#0A0D14',
  bgCard: '#10141E',
  bgCardTrans: 'rgba(16, 20, 30, 0.85)',
  primary: '#38BDF8',
  primaryGradient: ['#00F2FE', '#4FACFE'] as const,
  accentGradient: ['#F43F5E', '#FF2E93'] as const,
  success: '#34D399',
  warning: '#F59E0B',
  text: '#F3F4F6',
  textLight: '#9CA3AF',
  textLighter: '#6B7280',
  border: 'rgba(255, 255, 255, 0.06)',
  inputBg: 'rgba(255, 255, 255, 0.03)',
}

// Responsive helpers
const rf = (base: number) => {
  if (isTablet) return base * 1.15
  if (isSmallPhone) return base * 0.9
  return Math.round(base)
}

const rs = (base: number) => {
  if (isTablet) return base * 1.15
  if (isSmallPhone) return base * 0.9
  return Math.round(base)
}

interface Conversation {
  id: string
  user: {
    id: string
    name: string
    avatar: string | null
  }
  lastMessage: {
    id: string
    content: string
    createdAt: string
    isRead: boolean
  }
  unreadCount: number
  listing?: {
    id: string
    title: string
  }
}

interface Message {
  id: string
  content: string
  isRead: boolean
  senderId: string
  receiverId: string
  sender: { id: string; name: string; avatar: string | null }
  receiver: { id: string; name: string; avatar: string | null }
  createdAt: string
}

// ============================================
// Conversation Item Component
// ============================================
function ConversationItem({ item, onPress, isActive }: any) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }).start()
  }, [])

  const formatTime = (date: string) => {
    const msgDate = new Date(date)
    const now = new Date()
    const diff = now.getTime() - msgDate.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Hozir'
    if (minutes < 60) return `${minutes} min`
    if (hours < 24) return `${hours} soat`
    if (days < 7) return `${days} kun`
    return msgDate.toLocaleDateString()
  }

  return (
    <Animated.View style={[
      styles.conversationItem, 
      { 
        opacity: anim, 
        transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }], 
        backgroundColor: isActive ? 'rgba(56, 189, 248, 0.06)' : C.bgCard,
        borderColor: isActive ? C.primary : C.border
      }
    ]}>
      <TouchableOpacity style={styles.conversationContent} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.conversationAvatar}>
          <LinearGradient colors={C.primaryGradient} style={styles.avatarGradient}>
            <Avatar source={item.user.avatar} name={item.user.name} size={rs(48)} />
          </LinearGradient>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName} numberOfLines={1}>{item.user.name}</Text>
            <Text style={styles.timeText}>{formatTime(item.lastMessage.createdAt)}</Text>
          </View>
          {item.listing && (
            <Text style={styles.listingTitle} numberOfLines={1}>
              <Ionicons name="home-outline" size={rf(11)} color={C.primary} /> {item.listing.title}
            </Text>
          )}
          <Text style={[styles.lastMessage, !item.lastMessage.isRead && styles.unreadMessage]} numberOfLines={1}>
            {item.lastMessage.content}
          </Text>
        </View>
        
        <Ionicons name="chevron-forward" size={rf(16)} color={C.textLighter} />
      </TouchableOpacity>
    </Animated.View>
  )
}

// ============================================
// Chat Detail Modal
// ============================================
function ChatModal({ visible, onClose, conversation, userId }: any) {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const flatListRef = useRef<FlatList>(null)
  const [sending, setSending] = useState(false)

  // Fetch messages
  const { data: fetchedMessages } = useQuery({
    queryKey: ['host-messages', userId],
    queryFn: async () => {
      const { data } = await api.get(`/messages/${userId}`)
      return data
    },
    enabled: visible && !!userId,
  })

  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages)
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [fetchedMessages])

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post('/messages', { receiverId: userId, content })
      return data
    },
    onSuccess: (newMessage) => {
      setMessages(prev => [...prev, newMessage])
      queryClient.invalidateQueries({ queryKey: ['host-conversations'] })
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    },
  })

  const handleSend = async () => {
    if (!message.trim() || sending) return
    setSending(true)
    await sendMessageMutation.mutateAsync(message)
    setMessage('')
    setSending(false)
  }

  const formatMessageTime = (date: string) => {
    const d = new Date(date)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const renderMessage = ({ item }: { item: Message }) => {
    // Determine if it's sent by current host or the guest
    const isMyMessage = item.senderId !== conversation?.user?.id
    return (
      <View style={[styles.chatBubbleWrapper, isMyMessage ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
        {!isMyMessage && (
          <Avatar source={item.sender?.avatar} name={item.sender?.name} size={rs(30)} />
        )}
        
        {isMyMessage ? (
          <LinearGradient colors={C.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.chatBubble, styles.myBubble]}>
            <Text style={[styles.chatText, styles.myChatText]}>{item.content}</Text>
            <Text style={[styles.chatTime, styles.myChatTime]}>{formatMessageTime(item.createdAt)}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.chatBubble, styles.theirBubble]}>
            <Text style={[styles.chatText, styles.theirChatText]}>{item.content}</Text>
            <Text style={[styles.chatTime, styles.theirChatTime]}>{formatMessageTime(item.createdAt)}</Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.chatContainer, { paddingTop: insets.top }]}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderContent}>
            <TouchableOpacity onPress={onClose} style={styles.chatBackBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={rf(22)} color={C.text} />
            </TouchableOpacity>
            <Avatar source={conversation?.user?.avatar} name={conversation?.user?.name} size={rs(40)} />
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderName}>{conversation?.user?.name}</Text>
              {conversation?.listing && (
                <Text style={styles.chatHeaderListing} numberOfLines={1}>
                  {conversation.listing.title}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatMessagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input Bar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + rs(10) : 0}
        >
          <View style={[styles.chatInputContainer, { paddingBottom: Math.max(insets.bottom, rs(12)) }]}>
            <View style={styles.chatInputWrap}>
              <TextInput
                style={styles.chatInput}
                placeholder="Xabar yozing..."
                placeholderTextColor={C.textLighter}
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <TouchableOpacity
                style={[styles.chatSendBtn, !message.trim() && styles.chatSendDisabled]}
                onPress={handleSend}
                disabled={!message.trim() || sending}
                activeOpacity={0.8}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#0A0D14" />
                ) : (
                  <LinearGradient colors={message.trim() ? C.primaryGradient : ['#20293A', '#20293A']} style={styles.sendGradient}>
                    <Ionicons name="send" size={rf(16)} color={message.trim() ? '#0A0D14' : C.textLighter} />
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

// ============================================
// MAIN MESSAGES SCREEN
// ============================================
export default function HostMessagesScreen() {
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start()
  }, [])

  // Fetch conversations
  const { data: conversations, isLoading, refetch } = useQuery<Conversation[]>({
    queryKey: ['host-conversations'],
    queryFn: async () => {
      const { data } = await api.get('/messages/conversations')
      return data
    },
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const unreadCount = conversations?.filter(c => c.unreadCount > 0).length || 0

  const handleConversationPress = (conv: Conversation) => {
    setSelectedConversation(conv)
    setModalVisible(true)
  }

  if (isLoading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    )
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={rf(22)} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Xabarlar</Text>
          {unreadCount > 0 && (
            <LinearGradient colors={C.accentGradient} style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </LinearGradient>
          )}
        </View>
        <Text style={styles.headerSubtitle}>Mehmonlar bilan faol suhbatlar</Text>
      </View>

      {/* Conversations List */}
      {!conversations || conversations.length === 0 ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          contentContainerStyle={styles.emptyScroll}
        >
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={rf(44)} color={C.textLighter} />
            </View>
            <Text style={styles.emptyTitle}>Xabarlar yo'q</Text>
            <Text style={styles.emptyText}>Hali hech qanday xabar yozishmalari mavjud emas</Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.user.id}
          contentContainerStyle={styles.conversationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          renderItem={({ item }) => (
            <ConversationItem
              item={item}
              onPress={() => handleConversationPress(item)}
              isActive={selectedConversation?.user.id === item.user.id}
            />
          )}
        />
      )}

      {/* Chat Modal */}
      <ChatModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false)
          setSelectedConversation(null)
          refetch()
        }}
        conversation={selectedConversation}
        userId={selectedConversation?.user.id}
      />
    </Animated.View>
  )
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
  },

  // Header
  header: {
    paddingHorizontal: rs(16),
    paddingVertical: rs(14),
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
  },
  backBtn: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: rf(20),
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.4,
  },
  headerBadge: {
    minWidth: rs(22),
    height: rs(22),
    borderRadius: rs(11),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: rs(5),
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: rf(11),
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: rf(13),
    color: C.textLight,
    marginTop: rs(4),
  },

  // Conversations List
  conversationsList: {
    paddingHorizontal: rs(16),
    paddingTop: rs(12),
    paddingBottom: rs(24),
    gap: rs(10),
  },
  conversationItem: {
    borderRadius: rs(16),
    borderWidth: 1,
    overflow: 'hidden',
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: rs(12),
    gap: rs(12),
  },
  conversationAvatar: {
    position: 'relative',
  },
  avatarGradient: {
    borderRadius: rs(26),
    padding: rs(1.5),
  },
  unreadBadge: {
    position: 'absolute',
    top: rs(-2),
    right: rs(-2),
    backgroundColor: '#FF2E93',
    minWidth: rs(18),
    height: rs(18),
    borderRadius: rs(9),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: rs(4),
    borderWidth: 1.5,
    borderColor: C.bg,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: rf(9),
    fontWeight: '700',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(2),
  },
  userName: {
    fontSize: rf(15),
    fontWeight: '600',
    color: C.text,
  },
  timeText: {
    fontSize: rf(11),
    color: C.textLighter,
  },
  listingTitle: {
    fontSize: rf(11),
    color: C.primary,
    fontWeight: '500',
    marginBottom: rs(2),
  },
  lastMessage: {
    fontSize: rf(13),
    color: C.textLight,
  },
  unreadMessage: {
    color: C.text,
    fontWeight: '600',
  },

  // Empty State
  emptyScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(32),
    gap: rs(12),
  },
  emptyIcon: {
    width: rs(70),
    height: rs(70),
    borderRadius: rs(35),
    backgroundColor: C.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyTitle: {
    fontSize: rf(16),
    fontWeight: '600',
    color: C.text,
  },
  emptyText: {
    fontSize: rf(13),
    color: C.textLight,
    textAlign: 'center',
    lineHeight: rs(18),
  },

  // Chat Modal Styles
  chatContainer: {
    flex: 1,
    backgroundColor: C.bg,
  },
  chatHeader: {
    paddingBottom: rs(12),
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  chatHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(16),
    gap: rs(12),
  },
  chatBackBtn: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.border,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: rf(15),
    fontWeight: '600',
    color: C.text,
  },
  chatHeaderListing: {
    fontSize: rf(11),
    color: C.primary,
    fontWeight: '500',
    marginTop: rs(1),
  },
  chatMessagesList: {
    paddingHorizontal: rs(16),
    paddingVertical: rs(16),
    flexGrow: 1,
  },
  chatBubbleWrapper: {
    flexDirection: 'row',
    marginBottom: rs(12),
    alignItems: 'flex-end',
  },
  myMessageWrapper: {
    justifyContent: 'flex-end',
  },
  theirMessageWrapper: {
    justifyContent: 'flex-start',
    gap: rs(8),
  },
  chatBubble: {
    maxWidth: '78%',
    paddingHorizontal: rs(14),
    paddingVertical: rs(10),
    borderRadius: rs(16),
  },
  myBubble: {
    borderBottomRightRadius: rs(2),
  },
  theirBubble: {
    backgroundColor: C.bgCard,
    borderBottomLeftRadius: rs(2),
    borderWidth: 1,
    borderColor: C.border,
  },
  chatText: {
    fontSize: rf(14.5),
    lineHeight: rs(20),
  },
  myChatText: {
    color: '#0A0D14',
    fontWeight: '500',
  },
  theirChatText: {
    color: C.text,
  },
  chatTime: {
    fontSize: rf(9),
    marginTop: rs(4),
  },
  myChatTime: {
    color: 'rgba(10, 13, 20, 0.6)',
    textAlign: 'right',
    fontWeight: '500',
  },
  theirChatTime: {
    color: C.textLighter,
  },
  chatInputContainer: {
    paddingHorizontal: rs(16),
    paddingTop: rs(12),
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  chatInputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: rs(10),
  },
  chatInput: {
    flex: 1,
    backgroundColor: C.bgCard,
    borderRadius: rs(18),
    paddingHorizontal: rs(14),
    paddingVertical: rs(10),
    fontSize: rf(14),
    color: C.text,
    maxHeight: rs(100),
    borderWidth: 1,
    borderColor: C.border,
  },
  chatSendBtn: {
    width: rs(42),
    height: rs(42),
    borderRadius: rs(14),
    overflow: 'hidden',
  },
  sendGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSendDisabled: {
    opacity: 0.6,
  },
})