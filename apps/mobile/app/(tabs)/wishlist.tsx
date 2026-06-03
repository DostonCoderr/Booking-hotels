import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { ListingCard } from '@/components/home/ListingCard'
import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/stores/authStore'

interface WishlistItem {
  id: string
  listing: {
    id: string
    title: string
    price: number
    images: string[]
    city: string
    country: string
    avgRating: number
    reviewCount: number
  }
  createdAt: string
}

export default function WishlistScreen() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  // Get wishlist from backend
  const { data: wishlist, isLoading, refetch } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { data } = await api.get('/wishlist')
      return data as WishlistItem[]
    },
    enabled: !!user,
  })

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (listingId: string) => {
      await api.delete(`/wishlist/${listingId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [])

  const handleRemove = (listingId: string, title: string) => {
    Alert.alert(
      "Ro'yxatdan o'chirish",
      `"${title}" ni saqlanganlar ro'yxatidan o'chirmoqchimisiz?`,
      [
        { text: "Bekor qilish", style: "cancel" },
        { 
          text: "O'chirish", 
          style: "destructive",
          onPress: () => removeFromWishlistMutation.mutate(listingId)
        }
      ]
    )
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={64} color={COLORS.gray} />
        <Text style={styles.emptyTitle}>Saqlanganlar yo'q</Text>
        <Text style={styles.emptyText}>
          Sevimli joylaringizni saqlang va keyin bron qiling
        </Text>
        <TouchableOpacity 
          style={styles.exploreBtn} 
          onPress={() => router.push('/(tabs)/search')}
        >
          <Text style={styles.exploreBtnText}>Qidirish</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saqlanganlar</Text>
        <Text style={styles.headerSubtitle}>
          {wishlist.length} ta joy saqlangan
        </Text>
      </View>

      <FlatList
        data={wishlist}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.wishlistItem}>
            <ListingCard
              listing={item.listing}
              onPress={() => router.push(`/listing/${item.listing.id}`)}
            />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(item.listing.id, item.listing.title)}
            >
              <Ionicons name="heart" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.dark,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  list: {
    padding: 12,
  },
  row: {
    justifyContent: 'space-between',
  },
  wishlistItem: {
    position: 'relative',
    width: '48%',
    marginBottom: 16,
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
  },
  exploreBtn: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})