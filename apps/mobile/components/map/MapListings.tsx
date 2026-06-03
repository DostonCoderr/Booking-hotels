import { useState, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ActivityIndicator, Modal, Image, Animated, PanResponder,
} from 'react-native'
import MapView, { Marker, Region, PROVIDER_DEFAULT } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as Location from 'expo-location'
import { PriceMarker } from './PriceMarker'
import { Listing } from '@/types'
import { COLORS } from '@/constants/colors'
 
const { width, height } = Dimensions.get('window')
 
const DEFAULT_REGION: Region = {
  latitude: 41.2995,
  longitude: 69.2401,
  latitudeDelta: 2.5,
  longitudeDelta: 2.5,
}
 
interface Props {
  listings: Listing[]
  initialRegion?: Region
  onMarkerPress?: (listing: Listing) => void
  selectedListingId?: string
  loading?: boolean
  showStats?: boolean
}
 
export function MapListings({
  listings,
  initialRegion,
  onMarkerPress,
  selectedListingId,
  loading = false,
  showStats = true,
}: Props) {
  const mapRef = useRef<MapView>(null)
  const slideAnim = useRef(new Animated.Value(300)).current
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard')
 
  const openSheet = (listing: Listing) => {
    setSelectedListing(listing)
    setShowBottomSheet(true)
    Animated.spring(slideAnim, {
      toValue: 0, useNativeDriver: true,
      tension: 80, friction: 12,
    }).start()
    mapRef.current?.animateToRegion(
      { latitude: listing.latitude, longitude: listing.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      450,
    )
    onMarkerPress?.(listing)
  }
 
  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: 300, duration: 220, useNativeDriver: true,
    }).start(() => setShowBottomSheet(false))
  }
 
  const fitAll = useCallback(() => {
    if (!listings.length) {
      mapRef.current?.animateToRegion(DEFAULT_REGION, 400)
      return
    }
    mapRef.current?.fitToCoordinates(
      listings.map(l => ({ latitude: l.latitude, longitude: l.longitude })),
      { edgePadding: { top: 80, right: 50, bottom: 120, left: 50 }, animated: true },
    )
  }, [listings])
 
  const goToUser = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return
    const loc = await Location.getCurrentPositionAsync({})
    mapRef.current?.animateToRegion(
      { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      450,
    )
  }, [])
 
  const avgPrice = listings.length
    ? Math.round(listings.reduce((a, l) => a + l.price, 0) / listings.length)
    : 0
 
  if (loading) {
    return (
      <View style={S.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={S.loadingText}>Yuklanmoqda...</Text>
      </View>
    )
  }
 
  return (
    <View style={S.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={S.map}
        initialRegion={initialRegion || DEFAULT_REGION}
        mapType={mapType}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        showsScale
        onPress={() => showBottomSheet && closeSheet()}
      >
        {listings.map(listing => (
          <Marker
            key={listing.id}
            coordinate={{ latitude: listing.latitude, longitude: listing.longitude }}
            onPress={() => openSheet(listing)}
            tracksViewChanges={false}
          >
            <PriceMarker
              price={listing.price}
              selected={selectedListingId === listing.id || selectedListing?.id === listing.id}
              size="medium"
              withAnimation
            />
          </Marker>
        ))}
      </MapView>
 
      {/* Stats pill */}
      {showStats && listings.length > 0 && (
        <View style={S.statsPill}>
          <Ionicons name="home-outline" size={13} color={COLORS.primary} />
          <Text style={S.statsText}>{listings.length} joy</Text>
          <View style={S.statsDot} />
          <Text style={S.statsText}>o'rtacha ${avgPrice}</Text>
        </View>
      )}
 
      {/* Controls */}
      <View style={S.controls}>
        <TouchableOpacity style={S.ctrlBtn} onPress={() => setMapType(t => t === 'standard' ? 'satellite' : 'standard')}>
          <Ionicons name={mapType === 'standard' ? 'earth-outline' : 'map-outline'} size={20} color={COLORS.dark} />
        </TouchableOpacity>
        <TouchableOpacity style={S.ctrlBtn} onPress={fitAll}>
          <Ionicons name="scan-outline" size={20} color={COLORS.dark} />
        </TouchableOpacity>
        <TouchableOpacity style={[S.ctrlBtn, S.locBtn]} onPress={goToUser}>
          <Ionicons name="locate-outline" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
 
      {/* Bottom sheet */}
      {showBottomSheet && selectedListing && (
        <Animated.View style={[S.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={S.sheetHandle} />
 
          {/* Swipe to close hint */}
          <View style={S.sheetHeader}>
            <Text style={S.sheetCity}>{selectedListing.city}, {selectedListing.country}</Text>
            <TouchableOpacity onPress={closeSheet} style={S.sheetClose}>
              <Ionicons name="close" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
 
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => { closeSheet(); router.push(`/listing/${selectedListing.id}`) }}
            style={S.sheetCard}
          >
            <Image source={{ uri: selectedListing.images[0] }} style={S.sheetImage} />
 
            {/* Wishlist */}
            <TouchableOpacity style={S.sheetHeart}>
              <Ionicons name="heart-outline" size={18} color={COLORS.white} />
            </TouchableOpacity>
 
            <View style={S.sheetBody}>
              <View style={S.sheetRow}>
                <Text style={S.sheetTitle} numberOfLines={1}>{selectedListing.title}</Text>
                {(selectedListing.avgRating ?? 0) > 0 && (
                  <View style={S.sheetRating}>
                    <Ionicons name="star" size={12} color="#FFB800" />
                    <Text style={S.sheetRatingText}>{(selectedListing.avgRating ?? 0).toFixed(1)}</Text>
                  </View>
                )}
              </View>
 
              <View style={S.sheetMeta}>
                <View style={S.sheetMetaItem}>
                  <Ionicons name="people-outline" size={13} color={COLORS.gray} />
                  <Text style={S.sheetMetaText}>{selectedListing.maxGuests} kishi</Text>
                </View>
                <View style={S.sheetMetaDot} />
                <View style={S.sheetMetaItem}>
                  <Ionicons name="bed-outline" size={13} color={COLORS.gray} />
                  <Text style={S.sheetMetaText}>{selectedListing.bedrooms} xona</Text>
                </View>
              </View>
 
              <View style={S.sheetFooter}>
                <Text style={S.sheetPrice}>
                  ${selectedListing.price}
                  <Text style={S.sheetUnit}> / kecha</Text>
                </Text>
                <View style={S.sheetBtn}>
                  <Text style={S.sheetBtnText}>Ko'rish</Text>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.white} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  )
}
 
const S = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 10, fontSize: 14, color: COLORS.gray },
  map: { ...StyleSheet.absoluteFillObject },
 
  statsPill: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsText: { fontSize: 12, fontWeight: '600', color: COLORS.dark },
  statsDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.lightGray },
 
  controls: {
    position: 'absolute',
    right: 14,
    bottom: 120,
    gap: 10,
  },
  ctrlBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 5, elevation: 4,
    borderWidth: 1, borderColor: COLORS.border,
  },
  locBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
 
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetHandle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  sheetCity: { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  sheetClose: { padding: 4 },
 
  sheetCard: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  sheetImage: { width: '100%', height: 160, resizeMode: 'cover' },
  sheetHeart: {
    position: 'absolute', top: 10, right: 10,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  sheetBody: { padding: 12 },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark, flex: 1, marginRight: 8 },
  sheetRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  sheetRatingText: { fontSize: 12, fontWeight: '600', color: COLORS.dark },
  sheetMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sheetMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sheetMetaText: { fontSize: 12, color: COLORS.gray },
  sheetMetaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.lightGray },
  sheetFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetPrice: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  sheetUnit: { fontSize: 13, fontWeight: '400', color: COLORS.gray },
  sheetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  sheetBtnText: { fontSize: 13, color: COLORS.white, fontWeight: '600' },
})
