import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Keyboard
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSearchStore } from '@/stores/searchStore'
import { ListingCard } from '@/components/home/ListingCard'
import { FilterModal } from '@/components/home/FilterModal'
import { COLORS } from '@/constants/colors'

export default function SearchScreen() {
  const {
    query,
    results,
    isLoading,
    hasSearched,
    recentSearches,
    setQuery,
    search,
    clearResults,
    removeRecentSearch,
    clearRecentSearches,
    setFilters,
  } = useSearchStore()

  const [showFilter, setShowFilter] = useState(false)

  const handleSearch = () => {
    Keyboard.dismiss()
    search()
  }

  const handleRecentSearchPress = (searchQuery: string) => {
    setQuery(searchQuery)
    handleSearch()
  }

  const handleClear = () => {
    clearResults()
    setQuery('')
  }

  if (hasSearched && !isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClear} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search-outline" size={20} color={COLORS.gray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Qayerlarga bormoqchisiz?"
                placeholderTextColor={COLORS.gray}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                autoFocus
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={() => setShowFilter(true)} style={styles.filterBtn}>
              <Ionicons name="options-outline" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
        </View>

        {results.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="sad-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>Hech narsa topilmadi</Text>
            <Text style={styles.emptyText}>
              "{query}" bo'yicha hech qanday joy topilmadi
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ListingCard
                listing={item}
                onPress={() => router.push(`/listing/${item.id}`)}
              />
            )}
          />
        )}

        <FilterModal
          visible={showFilter}
          onClose={() => setShowFilter(false)}
          onApply={(filters) => {
            setFilters(filters)
            search()
          }}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color={COLORS.gray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Qayerlarga bormoqchisiz?"
              placeholderTextColor={COLORS.gray}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={() => setShowFilter(true)} style={styles.filterBtn}>
            <Ionicons name="options-outline" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>
      </View>

      {recentSearches.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Oxirgi qidiruvlar</Text>
            <TouchableOpacity onPress={clearRecentSearches}>
              <Text style={styles.clearText}>Tozalash</Text>
            </TouchableOpacity>
          </View>
          {recentSearches.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recentItem}
              onPress={() => handleRecentSearchPress(item)}
            >
              <Ionicons name="time-outline" size={18} color={COLORS.gray} />
              <Text style={styles.recentText}>{item}</Text>
              <TouchableOpacity
                onPress={() => removeRecentSearch(item)}
                style={styles.removeBtn}
              >
                <Ionicons name="close" size={16} color={COLORS.gray} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={(filters) => {
          setFilters(filters)
          search()
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 4,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
  },
  filterBtn: {
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  recentSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  clearText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recentText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
    marginLeft: 12,
  },
  removeBtn: {
    padding: 4,
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
  list: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})