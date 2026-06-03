// ============================================
// app/(tabs)/search.tsx — TO'LIQ MAP SCREEN
// ============================================
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ActivityIndicator, Image, Animated, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps'
import { useQuery } from '@tanstack/react-query'
import * as Location from 'expo-location'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@/services/api'
import { COLORS } from '@/constants/colors'
import { PriceMarker } from '@/components/map/PriceMarker'
import { useAuthStore } from '@/stores/authStore'

const { width, height } = Dimensions.get('window')

interface Listing {
  id: string
  title: string
  price: number
  images: string[]
  city: string
  country: string
  latitude: number
  longitude: number
  avgRating: number
  reviewCount: number
  maxGuests: number
  bedrooms: number
  beds: number
  bathrooms: number
  category: string
}

const UZ_REGION: Region = {
  latitude: 41.2995,
  longitude: 69.2401,
  latitudeDelta: 2.5,
  longitudeDelta: 2.5,
}

export default function MapScreen() {
  const { user } = useAuthStore()
  const insets = useSafeAreaInsets()
  const mapRef = useRef<MapView>(null)

  // Animations
  const sheetAnim   = useRef(new Animated.Value(320)).current
  const overlayAnim = useRef(new Animated.Value(0)).current
  const headerAnim  = useRef(new Animated.Value(0)).current

  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard')
  const [isWishlisted, setIsWishlisted] = useState(false)

  // ── Fetch ─────────────────────────────────
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['listings-map'],
    queryFn: async () => {
      const { data } = await api.get('/listings')
      return data
    },
  })

  const listings: Listing[] = data?.listings || []

  // ── Stats ─────────────────────────────────
  const prices   = listings.map(l => l.price)
  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0
  const maxPrice = prices.length ? Math.max(...prices) : 0
  const minPrice = prices.length ? Math.min(...prices) : 0

  // ── Header fade in ────────────────────────
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start()
  }, [])

  // ── Auto fit on ready ─────────────────────
  useEffect(() => {
    if (mapReady && listings.length > 0) fitAll()
  }, [mapReady, listings.length])

  // ── Sheet open/close ──────────────────────
  const openSheet = (listing: Listing) => {
    setSelectedListing(listing)
    setSheetVisible(true)
    Animated.parallel([
      Animated.spring(sheetAnim, {
        toValue: 0, useNativeDriver: true, tension: 85, friction: 12,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1, duration: 250, useNativeDriver: true,
      }),
    ]).start()
    mapRef.current?.animateToRegion(
      { latitude: listing.latitude, longitude: listing.longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 },
      450,
    )
  }

  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(sheetAnim, { toValue: 320, duration: 220, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => { setSheetVisible(false); setSelectedListing(null) })
  }, [])

  // ── Map helpers ───────────────────────────
  const fitAll = useCallback(() => {
    if (!listings.length) { mapRef.current?.animateToRegion(UZ_REGION, 400); return }
    mapRef.current?.fitToCoordinates(
      listings.map(l => ({ latitude: l.latitude, longitude: l.longitude })),
      { edgePadding: { top: 140, right: 50, bottom: 60, left: 50 }, animated: true },
    )
  }, [listings])

  const goToUser = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Ruxsat kerak', 'Joylashuvingizni ko\'rish uchun ruxsat bering')
      return
    }
    const loc = await Location.getCurrentPositionAsync({})
    mapRef.current?.animateToRegion(
      { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 },
      450,
    )
  }, [])

  // ── Loading ───────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Xarita yuklanmoqda...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* ── MAP ── */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFillObject}
        initialRegion={UZ_REGION}
        mapType={mapType}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale
        onMapReady={() => setMapReady(true)}
        onPress={() => sheetVisible && closeSheet()}
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
              selected={selectedListing?.id === listing.id}
              size="medium"
              withAnimation
            />
          </Marker>
        ))}
      </MapView>

      {/* ── HEADER ── */}
      <Animated.View style={[
        styles.header,
        { paddingTop: insets.top + 8, opacity: headerAnim }
      ]}>
        <View style={styles.headerRow}>
          {/* Title + count */}
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Xarita</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{listings.length} joy</Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setMapType(t => t === 'standard' ? 'satellite' : 'standard')}
            >
              <Ionicons
                name={mapType === 'standard' ? 'earth-outline' : 'map-outline'}
                size={18}
                color={COLORS.dark}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={fitAll}>
              <Ionicons name="scan-outline" size={18} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats row */}
        {listings.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Ionicons name="cash-outline" size={12} color={COLORS.primary} />
              <Text style={styles.statText}>Min: ${minPrice}</Text>
            </View>
            <View style={styles.statChip}>
              <Ionicons name="trending-up-outline" size={12} color={COLORS.primary} />
              <Text style={styles.statText}>O'rtacha: ${avgPrice}</Text>
            </View>
            <View style={styles.statChip}>
              <Ionicons name="diamond-outline" size={12} color={COLORS.primary} />
              <Text style={styles.statText}>Max: ${maxPrice}</Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* ── LOCATE BUTTON ── */}
      <TouchableOpacity
        style={[styles.locateBtn, { bottom: sheetVisible ? 320 : 40 }]}
        onPress={goToUser}
        activeOpacity={0.85}
      >
        <Ionicons name="locate-outline" size={22} color={COLORS.white} />
      </TouchableOpacity>

      {/* ── SHEET OVERLAY ── */}
      {sheetVisible && (
        <Animated.View
          style={[styles.overlay, { opacity: overlayAnim }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={closeSheet} />
        </Animated.View>
      )}

      {/* ── BOTTOM SHEET ── */}
      {sheetVisible && selectedListing && (
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Top row */}
          <View style={styles.sheetTop}>
            <View>
              <Text style={styles.sheetCity}>{selectedListing.city}, {selectedListing.country}</Text>
              <Text style={styles.sheetCategory}>{selectedListing.category}</Text>
            </View>
            <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {/* Card */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => { closeSheet(); router.push(`/listing/${selectedListing.id}`) }}
          >
            {/* Image */}
            <View style={styles.imgWrap}>
              <Image source={{ uri: selectedListing.images[0] }} style={styles.img} />

              {/* Wishlist */}
              <TouchableOpacity
                style={styles.heartBtn}
                onPress={() => {
                  if (!user) { router.push('/(auth)/login'); return }
                  setIsWishlisted(w => !w)
                }}
              >
                <Ionicons
                  name={isWishlisted ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isWishlisted ? COLORS.primary : COLORS.white}
                />
              </TouchableOpacity>

              {/* Price badge on image */}
              <View style={styles.imgPrice}>
                <Text style={styles.imgPriceText}>${selectedListing.price}<Text style={styles.imgPriceUnit}>/kecha</Text></Text>
              </View>
            </View>

            {/* Info */}
            <View style={styles.cardBody}>
              {/* Title + rating */}
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>{selectedListing.title}</Text>
                {(selectedListing.avgRating ?? 0) > 0 && (
                  <View style={styles.ratingWrap}>
                    <Ionicons name="star" size={12} color="#FFB800" />
                    <Text style={styles.ratingText}>{(selectedListing.avgRating ?? 0).toFixed(1)}</Text>
                    <Text style={styles.reviewCount}>({selectedListing.reviewCount})</Text>
                  </View>
                )}
              </View>

              {/* Meta chips */}
              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Ionicons name="people-outline" size={13} color={COLORS.gray} />
                  <Text style={styles.metaText}>{selectedListing.maxGuests} kishi</Text>
                </View>
                <View style={styles.metaDot} />
                <View style={styles.metaChip}>
                  <Ionicons name="bed-outline" size={13} color={COLORS.gray} />
                  <Text style={styles.metaText}>{selectedListing.bedrooms} xona</Text>
                </View>
                <View style={styles.metaDot} />
                <View style={styles.metaChip}>
                  <Ionicons name="water-outline" size={13} color={COLORS.gray} />
                  <Text style={styles.metaText}>{selectedListing.bathrooms} hammom</Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.msgBtn}
                  onPress={() => {
                    if (!user) { router.push('/(auth)/login'); return }
                    closeSheet()
                    router.push(`/listing/${selectedListing.id}`)
                  }}
                >
                  <Ionicons name="eye-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.msgBtnText}>Ko'rish</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bookBtn}
                  onPress={() => {
                    if (!user) { router.push('/(auth)/login'); return }
                    closeSheet()
                    router.push(`/booking/${selectedListing.id}`)
                  }}
                >
                  <Text style={styles.bookBtnText}>Bron qilish</Text>
                  <Ionicons name="arrow-forward" size={15} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>

          {/* Safe area padding */}
          <View style={{ height: 16 }} />
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  loader: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loaderText: { marginTop: 10, fontSize: 14, color: COLORS.gray },

  // Header
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.dark },
  countBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20,
  },
  countText: { fontSize: 12, color: COLORS.white, fontWeight: '600' },
  headerRight: { flexDirection: 'row', gap: 10 },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
    flex: 1, justifyContent: 'center',
  },
  statText: { fontSize: 11, fontWeight: '600', color: COLORS.dark },

  // Locate button
  locateBtn: {
    position: 'absolute', right: 16,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  // Bottom sheet
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  sheetTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  sheetCity: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  sheetCategory: { fontSize: 12, color: COLORS.gray, marginTop: 2, textTransform: 'capitalize' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center',
  },

  // Card
  card: {
    marginHorizontal: 16,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  imgWrap: { position: 'relative' },
  img: { width: '100%', height: 170, resizeMode: 'cover' },
  heartBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  imgPrice: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  imgPriceText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  imgPriceUnit: { fontSize: 11, fontWeight: '400' },

  cardBody: { padding: 14 },
  cardRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark, flex: 1, marginRight: 8 },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  reviewCount: { fontSize: 11, color: COLORS.gray },

  metaRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginBottom: 14,
  },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.gray },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.lightGray },

  actionRow: { flexDirection: 'row', gap: 10 },
  msgBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  msgBtnText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  bookBtn: {
    flex: 1.5, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  bookBtnText: { fontSize: 14, color: COLORS.white, fontWeight: '700' },
})