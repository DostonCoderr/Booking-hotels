// components/listing/ListingCard.tsx

import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Listing } from '@/types'

interface Props {
  listing: Listing
  onPress: () => void
  showStatus?: boolean
}

export function ListingCard({ listing, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: listing.images[0] }} style={styles.image} />
      
      {listing.avgRating > 0 && (
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color="#FFD700" />
          <Text style={styles.ratingText}>{listing.avgRating.toFixed(1)}</Text>
        </View>
      )}
      
      <View style={styles.info}>
        {/* Nomi - Mutloq tiniq oq rang */}
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        
        {/* Tasnifi/Joylashuvi - Eng och va yorqin kiber-kumush rang */}
        <Text style={styles.location} numberOfLines={1}>
          {listing.city}, {listing.country}
        </Text>
        
        {/* Narxi - To'liq tiniq oq rang */}
        <Text style={styles.price}>
          ${listing.price} <Text style={styles.perNight}>/ kecha</Text>
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    alignSelf: 'stretch',
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 14,
    backgroundColor: '#111827',
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 4, 8, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ratingText: {
    color: '#FFFFFF', // Tiniq oq
    fontSize: 11,
    fontWeight: '700',
  },
  info: {
    marginTop: 8,
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF', // Mutloq Tiniq Oq (Nom)
    letterSpacing: 0.3,
  },
  location: {
    fontSize: 12,
    fontWeight: '500',
    color: '#E5E7EB', // Eng och kiber-kumush (Tasnif endi yaqqol ko'rinadi)
    marginTop: 3,
  },
  price: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF', // Tiniq Oq (Narx)
    marginTop: 5,
  },
  perNight: {
    fontSize: 11,
    fontWeight: '400',
    color: '#9CA3AF', // Narxning yoni ham aniq ko'rinadigan kulrang
  },
})