// app/(host)/listings.tsx

import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native'
import { useState, useCallback } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { ListingCard } from '@/components/listing/ListingCard'
import { Listing } from '@/types'

const { width } = require('react-native').Dimensions.get('window')
const isTablet = width >= 768
const isSmall = width <= 365

// Responsive proporsiyalar uchun yordamchi formula
const rf = (n: number) => isTablet ? n * 1.15 : isSmall ? n * 0.9 : n

const C = {
  bg: '#020408',            // Chuqur premium qora kosmos foni
  card: 'rgba(10, 15, 30, 0.65)', // Glassmorphic shaffof karta foni
  stroke: 'rgba(255, 255, 255, 0.04)',
  primary: '#F43F5E',       // Cyber neon pushti
  primaryGradient: ['#F43F5E', '#9F1239'] as const,
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#F9FAFB',
  muted: '#9CA3AF',
  dimmed: '#4B5563',
}

export default function HostListingsScreen() {
  const { status } = useLocalSearchParams<{ status?: string }>()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  const { data: listings, isLoading, refetch } = useQuery<Listing[]>({
    queryKey: ['host-listings'],
    queryFn: async () => {
      const { data } = await api.get('/host/listings')
      return data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/host/listings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-listings'] })
      queryClient.invalidateQueries({ queryKey: ['host-stats'] })
      Alert.alert('Muvaffaqiyatli', 'E\'lon muvaffaqiyatli o\'chirildi')
    },
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const filteredListings = listings?.filter(l => {
    if (!status) return true
    if (status === 'approved') return l.status === 'APPROVED'
    if (status === 'pending') return l.status === 'PENDING'
    if (status === 'rejected') return l.status === 'REJECTED'
    return true
  })

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'E\'lonni o\'chirish',
      `"${title}" e'loningizni butunlay o'chirmoqchimisiz?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        { text: 'O\'chirish', style: 'destructive', onPress: () => deleteMutation.mutate(id) }
      ]
    )
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={C.primary} />
      </View>
    )
  }

  const tabs = [
    { key: 'all', title: 'Hammasi' },
    { key: 'approved', title: 'Tasdiqlangan' },
    { key: 'pending', title: 'Kutilmoqda' },
    { key: 'rejected', title: 'Rad etilgan' },
  ]

  return (
    <View style={styles.root}>
      {/* Absolute Premium Blur Header */}
      <BlurView intensity={25} tint="dark" style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Listinglarim</Text>
        <TouchableOpacity style={styles.addNavBtn} onPress={() => router.push('/add-listing')}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </BlurView>

      {/* Cyber Ambient Gradient (Cross-platform Neon Glow) */}
      <LinearGradient
        colors={[C.primary + '1A', 'transparent']}
        style={styles.ambientGlowGradient}
      />

      {/* Gorizontal filtr tablari */}
      <View style={styles.tabsWrapper}>
        <FlatList
          data={tabs}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            const isActive = (!status && item.key === 'all') || status === item.key
            return (
              <TouchableOpacity
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => router.setParams({ status: item.key === 'all' ? undefined : item.key })}
                activeOpacity={0.75}
              >
                {isActive && (
                  <LinearGradient 
                    colors={C.primaryGradient} 
                    start={{ x: 0, y: 0 }} 
                    end={{ x: 1, y: 1 }} 
                    style={styles.gradientTabBg} 
                  />
                )}
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            )
          }}
        />
      </View>

      {/* Grid holatidagi listinglar ro'yxati */}
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
            progressBackgroundColor="#111827"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyZone}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="folder-open-outline" size={32} color={C.muted} />
            </View>
            <Text style={styles.emptyTitle}>E'lonlar topilmadi</Text>
            <Text style={styles.emptyText}>Bu bo'limda hali hech qanday ob'ekt mavjud emas.</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => router.push('/add-listing')}>
              <LinearGradient colors={C.primaryGradient} style={styles.emptyAddGradient}>
                <Text style={styles.emptyAddBtnTxt}>Yangi joy qo'shish</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <View style={styles.cardContainer}>
              <ListingCard 
                listing={item} 
                onPress={() => router.push(`/listing/${item.id}`)}
                showStatus
              />
              
              {/* Premium Mini Action Toolbar Kartaning ichida */}
              <View style={styles.actionToolbar}>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => router.push(`/(host)/edit-listing/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil-sharp" size={14} color={C.text} />
                </TouchableOpacity>
                
                <View style={styles.actionDivider} />
                
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => handleDelete(item.id, item.title)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={14} color={C.error} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
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
  
  // Header blur dizayni
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
  addNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.primary + '30',
  },

  // Cross-platform Xatoliksiz Ambient Light Effect
  ambientGlowGradient: {
    position: 'absolute',
    top: 40,
    right: -50,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    zIndex: -1,
  },

  // Gorizontal Filter Tablari
  tabsWrapper: {
    marginTop: rf(112),
    marginBottom: 10,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.stroke,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    borderColor: 'transparent',
  },
  gradientTabBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  tabText: {
    fontSize: rf(12.5),
    color: C.muted,
    fontWeight: '500',
    zIndex: 1,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  // Grid va List Elementlari (Responsiv)
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '49%', 
    marginBottom: 14,
  },
  cardContainer: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.stroke,
    padding: 8,
    overflow: 'hidden',
  },

  // Action Toolbar Kartaning ichida
  actionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    height: 34,
  },
  actionBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionDivider: {
    width: 1,
    height: 14,
    backgroundColor: C.stroke,
  },

  // Bo'sh ro'yxat dizayni (Empty State)
  emptyZone: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: rf(100),
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.stroke,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: rf(16),
    fontWeight: '700',
    color: C.text,
  },
  emptyText: {
    fontSize: rf(13),
    color: C.muted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyAddBtn: {
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 200,
  },
  emptyAddGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAddBtnTxt: {
    color: '#fff',
    fontSize: rf(13),
    fontWeight: '600',
  },
})