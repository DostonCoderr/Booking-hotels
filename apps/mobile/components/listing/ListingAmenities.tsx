import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/colors'
 
const AMENITY_ICONS: Record<string, { icon: string; label: string }> = {
  'WiFi':              { icon: 'wifi',               label: 'WiFi' },
  'Basseyn':           { icon: 'water',              label: 'Basseyn' },
  'Oshxona':           { icon: 'restaurant-outline', label: 'Oshxona' },
  'Bepul parking':     { icon: 'car-outline',        label: 'Parking' },
  'Konditsioner':      { icon: 'snow-outline',       label: 'Konditsioner' },
  'Kir yuvish mashinasi': { icon: 'shirt-outline',   label: 'Kir yuvish' },
  'Nonushta':          { icon: 'cafe-outline',       label: 'Nonushta' },
  'TV':                { icon: 'tv-outline',         label: 'TV' },
  'Lift':              { icon: 'arrow-up-circle-outline', label: 'Lift' },
  'Gym':               { icon: 'barbell-outline',    label: 'Gym' },
  'Balkon':            { icon: 'home-outline',       label: 'Balkon' },
  'Hovli':             { icon: 'leaf-outline',       label: 'Hovli' },
}
 
const DEFAULT_SHOW = 6
 
interface Props {
  amenities: string[]
}
 
export function ListingAmenities({ amenities }: Props) {
  const [showAll, setShowAll] = useState(false)
  const displayed = showAll ? amenities : amenities.slice(0, DEFAULT_SHOW)
 
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Qulayliklar</Text>
      <View style={styles.grid}>
        {displayed.map((amenity, i) => {
          const info = AMENITY_ICONS[amenity] || { icon: 'checkmark-circle-outline', label: amenity }
          return (
            <View key={i} style={styles.item}>
              <View style={styles.iconWrap}>
                <Ionicons name={info.icon as any} size={22} color={COLORS.dark} />
              </View>
              <Text style={styles.label} numberOfLines={2}>{amenity}</Text>
            </View>
          )
        })}
      </View>
 
      {amenities.length > DEFAULT_SHOW && (
        <TouchableOpacity
          style={styles.showMoreBtn}
          onPress={() => setShowAll(!showAll)}
          activeOpacity={0.7}
        >
          <Text style={styles.showMoreText}>
            {showAll ? 'Kamroq ko\'rsatish' : `Barcha ${amenities.length} ta qulaylikni ko'rish`}
          </Text>
          <Ionicons
            name={showAll ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={COLORS.dark}
          />
        </TouchableOpacity>
      )}
    </View>
  )
}
 
const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  title: { fontSize: 18, fontWeight: '600', color: COLORS.dark, marginBottom: 16 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  item: {
    width: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { fontSize: 13, color: COLORS.dark, fontWeight: '500', flex: 1 },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: COLORS.dark,
    borderRadius: 12,
  },
  showMoreText: { fontSize: 14, fontWeight: '600', color: COLORS.dark },
})
 
