import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/colors'
import { Listing } from '@/types'

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - 48) / 2

interface Props {
  listing: Listing
  onPress: () => void
}

export function ListingCard({ listing, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: listing.images[0] }} style={styles.image} />
      
      {listing.avgRating > 0 && (
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#fff" />
          <Text style={styles.ratingText}>{listing.avgRating.toFixed(1)}</Text>
        </View>
      )}
      
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        <Text style={styles.location} numberOfLines={1}>
          {listing.city}, {listing.country}
        </Text>
        <Text style={styles.price}>
          ${listing.price} <Text style={styles.perNight}>/ kecha</Text>
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginBottom: 20,
    marginHorizontal: 4,
  },
  image: {
    width: '100%',
    height: CARD_WIDTH,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
  },
  ratingText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  info: {
    marginTop: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  location: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  price: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 4,
  },
  perNight: {
    fontWeight: '400',
    color: COLORS.gray,
  },
})