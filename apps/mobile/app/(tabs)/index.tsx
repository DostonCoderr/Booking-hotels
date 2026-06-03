import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
  Dimensions, ScrollView
} from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { ListingCard } from '@/components/home/ListingCard'
import { NotificationBell } from '@/components/common/NotificationBell'
import { api } from '@/services/api'
import { COLORS } from '@/constants/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - 48) / 2

export default function HomeScreen() {
  const { user } = useAuthStore()
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['listings', selectedCategory],
    queryFn: async () => {
      const params: any = {}
      if (selectedCategory !== 'all') {
        params.category = selectedCategory
      }
      const { data } = await api.get('/listings', { params })
      return data
    },
  })

  const listings = data?.listings || []

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [selectedCategory])

  const categories = [
    { id: 'all', name: 'Hammasi', icon: 'apps', color: COLORS.primary },
    { id: 'apartment', name: 'Kvartira', icon: 'business', color: '#FFB347' },
    { id: 'house', name: 'Uy', icon: 'home', color: '#4CAF50' },
    { id: 'villa', name: 'Villa', icon: 'water', color: '#2196F3' },
  ]

  const CategoryItem = ({ item }: any) => {
    const isSelected = selectedCategory === item.id
    return (
      <TouchableOpacity 
        style={styles.categoryItem} 
        onPress={() => setSelectedCategory(item.id)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.categoryIcon,
          isSelected && { backgroundColor: item.color + '20', borderColor: item.color }
        ]}>
          <Ionicons 
            name={item.icon as any} 
            size={26} 
            color={isSelected ? item.color : COLORS.gray} 
          />
        </View>
        <Text style={[
          styles.categoryName,
          isSelected && { color: item.color, fontWeight: '600' }
        ]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    )
  }

  if (isLoading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
  <View>
    <Text style={styles.greeting}>Salom, {user?.name?.split(' ')[0] || 'Mehmon'}!</Text>
    <Text style={styles.subGreeting}>Bugun qayerga boramiz?</Text>
  </View>
  <NotificationBell />
</View>

        {/* Search Bar */}
        <TouchableOpacity 
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/search')}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={20} color={COLORS.gray} />
          <Text style={styles.searchText}>Qayerlarga bormoqchisiz?</Text>
          <Ionicons name="options-outline" size={20} color={COLORS.gray} style={styles.filterIcon} />
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.categoriesWrapper}>
          <View style={styles.categoriesHeader}>
            <Text style={styles.categoriesTitle}>Kategoriyalar</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Hammasi</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }) => <CategoryItem item={item} />}
          />
        </View>

        {/* Listings */}
        <View style={styles.listingsHeader}>
          <Text style={styles.listingsTitle}>Top joylar</Text>
          <Text style={styles.listingsCount}>{listings.length} ta joy</Text>
        </View>

        {listings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>Hozircha listinglar yo'q</Text>
            <Text style={styles.emptySubText}>
              {selectedCategory !== 'all' ? 'Bu kategoriyada joy topilmadi' : 'Yangi listinglar qo\'shilmoqda'}
            </Text>
          </View>
        ) : (
          <View style={styles.listingsGrid}>
            {listings.map((item: any) => (
              <View key={item.id} style={styles.gridItem}>
                <ListingCard
                  listing={item}
                  onPress={() => router.push(`/listing/${item.id}`)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.dark,
  },
  subGreeting: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  notifBtn: {
    padding: 8,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.gray,
    marginLeft: 10,
  },
  filterIcon: {
    marginLeft: 8,
  },
  categoriesWrapper: {
    marginTop: 8,
    marginBottom: 16,
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
  },
  seeAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryItem: {
    alignItems: 'center',
    width: 70,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryName: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  listingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  listingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
  },
  listingsCount: {
    fontSize: 13,
    color: COLORS.gray,
  },
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
  },
})