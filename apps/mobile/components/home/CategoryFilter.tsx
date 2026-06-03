import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/colors'

const CATEGORIES = [
  { id: 'all', name: 'Hammasi', icon: 'apps-outline' },
  { id: 'house', name: 'Uylar', icon: 'home-outline' },
  { id: 'apartment', name: 'Kvartiralar', icon: 'business-outline' },
  { id: 'loft', name: 'Loftlar', icon: 'cube-outline' },
  { id: 'cabin', name: 'Dachalar', icon: 'leaf-outline' },
  { id: 'villa', name: 'Villalar', icon: 'water-outline' },
  { id: 'studio', name: 'Studiyolar', icon: 'color-palette-outline' },
]

interface Props {
  selected: string
  onSelect: (id: string) => void
}

export function CategoryFilter({ selected, onSelect }: Props) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={CATEGORIES}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.category, selected === item.id && styles.selected]}
          onPress={() => onSelect(item.id)}
        >
          <Ionicons
            name={item.icon as any}
            size={24}
            color={selected === item.id ? COLORS.primary : COLORS.gray}
          />
          <Text style={[styles.name, selected === item.id && styles.nameSelected]}>
            {item.name}
          </Text>
        </TouchableOpacity>
      )}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 20,
  },
  category: {
    alignItems: 'center',
    gap: 6,
    paddingBottom: 8,
  },
  selected: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  name: {
    fontSize: 12,
    color: COLORS.gray,
  },
  nameSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
})