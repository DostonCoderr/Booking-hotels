// app/listing/[id].tsx
import { useRef, useState } from 'react'
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Dimensions, Share, ActivityIndicator,
  Modal, Linking, Platform, Alert, Animated, FlatList,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@/services/api'
import { COLORS } from '@/constants/colors'
import { ListingAmenities } from '@/components/listing/ListingAmenities'
import { PriceMarker } from '@/components/map/PriceMarker'
import { ReviewsList } from '@/components/review/ReviewsList'
import { useAuthStore } from '@/stores/authStore'
import { useBooking } from '@/hooks/useBooking'

const { width, height } = Dimensions.get('window')
const IMG_H = height * 0.47

// Types
interface Listing {
  id: string
  title: string
  description: string
  price: number
  city: string
  country: string
  address: string
  latitude: number
  longitude: number
  images: string[]
  avgRating: number
  reviewCount: number
  maxGuests: number
  bedrooms: number
  bathrooms: number
  amenities: string[]
  hostId: string
  host?: {
    id: string
    name: string
    avatar: string | null
    phone: string | null
  }
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const insets = useSafeAreaInsets()
  const { myBookings } = useBooking()

  const scrollY = useRef(new Animated.Value(0)).current
  const flatListRef = useRef<FlatList<string>>(null)

  const [imgIdx, setImgIdx] = useState<number>(0)
  const [mapModal, setMapModal] = useState<boolean>(false)
  const [wishlisted, setWishlisted] = useState<boolean>(false)
  const [showDesc, setShowDesc] = useState<boolean>(false)
  const [fullscreenModal, setFullscreenModal] = useState<boolean>(false)
  const [fullscreenImgIdx, setFullscreenImgIdx] = useState<number>(0)

  // Fetch listing
  const { data: listing, isLoading } = useQuery<Listing>({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data } = await api.get(`/listings/${id}`)
      return data
    },
  })

  // Wishlist check
  useQuery({
    queryKey: ['wishlist-check', id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/wishlist/check/${id}`)
        setWishlisted(data.isWishlisted)
        return data
      } catch {
        return { isWishlisted: false }
      }
    },
    enabled: !!user,
  })

  const canReview = (): boolean => {
    if (!myBookings || !listing) return false
    return myBookings.some(
      (b: any) => b.listing?.id === listing.id && new Date(b.checkOut) < new Date()
    )
  }

  const stickyOpacity = scrollY.interpolate({
    inputRange: [IMG_H - 90, IMG_H - 30],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })

  const imgParallax = scrollY.interpolate({
    inputRange: [-80, 0, IMG_H],
    outputRange: [1.12, 1, 0.88],
    extrapolate: 'clamp',
  })

  const handleShare = async (): Promise<void> => {
    if (!listing) return
    try {
      await Share.share({
        message: `🏠 ${listing.title}\n$${listing.price}/kecha\n📍 ${listing.city}, ${listing.country}\n⭐ ${listing.avgRating || 0}`,
      })
    } catch (error) {
      console.error('Share error:', error)
    }
  }

  const handleWishlist = async (): Promise<void> => {
    if (!user) {
      Alert.alert('Kirish kerak', 'Saqlash uchun tizimga kiring', [
        { text: 'Bekor', style: 'cancel' },
        { text: 'Kirish', onPress: () => router.push('/(auth)/login') },
      ])
      return
    }
    try {
      if (wishlisted && listing) {
        await api.delete(`/wishlist/${listing.id}`)
        setWishlisted(false)
      } else if (listing) {
        await api.post('/wishlist', { listingId: listing.id })
        setWishlisted(true)
      }
    } catch (error) {
      console.error('Wishlist error:', error)
    }
  }

  const handleOpenMaps = (): void => {
    if (!listing) return
    const url = Platform.select({
      ios: `maps:0,0?q=${listing.latitude},${listing.longitude}`,
      android: `geo:0,0?q=${listing.latitude},${listing.longitude}(${listing.title})`,
    })
    if (url) Linking.openURL(url)
  }

  const openFullscreenImage = (index: number): void => {
    setFullscreenImgIdx(index)
    setFullscreenModal(true)
  }

  const onFullscreenScroll = (e: any): void => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width)
    setFullscreenImgIdx(index)
  }

  const handleMessagePress = (): void => {
    if (!user) {
      Alert.alert('Kirish kerak', 'Xabar yozish uchun tizimga kiring', [
        { text: 'Bekor', style: 'cancel' },
        { text: 'Kirish', onPress: () => router.push('/(auth)/login') },
      ])
      return
    }
    if (!listing) return
    
    router.push({
      pathname: `/messages/${listing.hostId}`,
      params: {
        name: listing.host?.name || 'Mezbon',
        avatar: listing.host?.avatar || '',
        listingTitle: listing.title
      }
    })
  }

  const handleCallPress = (): void => {
    if (listing?.host?.phone) {
      Linking.openURL(`tel:${listing.host.phone}`)
    } else {
      Alert.alert("Ma'lumot", "Telefon raqami mavjud emas")
    }
  }

  const cleanFee = Math.round((listing?.price || 0) * 0.1)
  const serviceFee = Math.round((listing?.price || 0) * 0.05)
  const total = (listing?.price || 0) + cleanFee + serviceFee

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }
  if (!listing) return null

  const shortDesc = listing.description.length > 200
    ? listing.description.slice(0, 200) + '...'
    : listing.description

  const getAvatarUrl = (name?: string): string => {
    const userName = name || 'H'
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=FF385C&color=fff`
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Sticky Header */}
      <Animated.View
        style={[styles.stickyHeader, { opacity: stickyOpacity, paddingTop: insets.top + 6 }]}
        pointerEvents="box-none"
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark ?? '#E31C5F']}
          style={styles.stickyGrad}
        >
          <TouchableOpacity style={styles.stickyRound} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.stickyTitle} numberOfLines={1}>{listing.title}</Text>
          <View style={styles.stickyActions}>
            <TouchableOpacity style={styles.stickyRound} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.stickyRound} onPress={handleWishlist}>
              <Ionicons
                name={wishlisted ? 'heart' : 'heart-outline'}
                size={18}
                color={wishlisted ? '#FFD700' : '#fff'}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Main Scroll */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Image Gallery */}
        <View style={styles.imgBox}>
          <Animated.FlatList
            ref={flatListRef}
            data={listing.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_item: string, index: number) => String(index)}
            style={[styles.imgFlatList, { transform: [{ scale: imgParallax }] }]}
            onMomentumScrollEnd={(e) => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item, index }: { item: string; index: number }) => (
              <TouchableOpacity activeOpacity={0.95} onPress={() => openFullscreenImage(index)}>
                <Image source={{ uri: item }} style={styles.img} resizeMode="cover" />
              </TouchableOpacity>
            )}
          />

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.imgGradient}
          />

          {listing.images.length > 1 && (
            <View style={styles.dotRow}>
              {listing.images.map((_: string, idx: number) => (
                <View key={idx} style={[styles.dot, idx === imgIdx && styles.dotActive]} />
              ))}
            </View>
          )}

          <View style={styles.counterBadge}>
            <Text style={styles.counterTxt}>{imgIdx + 1} / {listing.images.length}</Text>
          </View>

          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeTxt}>
              ${listing.price}
              <Text style={styles.priceBadgeUnit}>/kecha</Text>
            </Text>
          </View>

          <View style={[styles.floats, { top: insets.top + 12 }]}>
            <TouchableOpacity style={styles.fab} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={COLORS.dark} />
            </TouchableOpacity>
            <View style={styles.fabRight}>
              <TouchableOpacity style={styles.fab} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color={COLORS.dark} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.fab} onPress={handleWishlist}>
                <Ionicons
                  name={wishlisted ? 'heart' : 'heart-outline'}
                  size={20}
                  color={wishlisted ? COLORS.primary : COLORS.dark}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Title & Host Avatar */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{listing.title}</Text>
              <TouchableOpacity style={styles.locPill} onPress={() => setMapModal(true)}>
                <Ionicons name="location" size={14} color={COLORS.primary} />
                <Text style={styles.locTxt} numberOfLines={1}>{listing.address}, {listing.city}</Text>
                <Ionicons name="chevron-forward" size={13} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.hostAvatarBtn} onPress={handleMessagePress}>
              <Image
                source={{ uri: listing.host?.avatar || getAvatarUrl(listing.host?.name) }}
                style={styles.hostAvatarImg}
              />
              <View style={styles.verifiedDot}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { icon: 'star' as const, val: listing.avgRating > 0 ? listing.avgRating.toFixed(1) : 'Yangi', color: '#FFB800', bold: true },
              { icon: 'people-outline' as const, val: `${listing.maxGuests} kishi`, color: COLORS.gray, bold: false },
              { icon: 'bed-outline' as const, val: `${listing.bedrooms} xona`, color: COLORS.gray, bold: false },
              { icon: 'water-outline' as const, val: `${listing.bathrooms} hammom`, color: COLORS.gray, bold: false },
            ].map((item, idx, arr) => (
              <View key={idx} style={[styles.statItem, idx < arr.length - 1 && styles.statBorder]}>
                <Ionicons name={item.icon} size={15} color={item.color} />
                <Text style={[styles.statTxt, item.bold && styles.statBold]}>{item.val}</Text>
              </View>
            ))}
          </View>

          <View style={styles.hr} />

          {/* Host Info with Contact Buttons */}
          <View style={styles.hostRow}>
            <Image
              source={{ uri: listing.host?.avatar || getAvatarUrl(listing.host?.name) }}
              style={styles.hostRowImg}
            />
            <View style={styles.hostRowInfo}>
              <Text style={styles.hostRowName}>{listing.host?.name || 'Mezbon'} mezbonlik qiladi</Text>
              <View style={styles.hostBadgeRow}>
                <View style={styles.superhostBadge}>
                  <Ionicons name="ribbon-outline" size={12} color="#FFB800" />
                  <Text style={styles.superhostTxt}>Superhost</Text>
                </View>
                <Text style={styles.hostDot}>·</Text>
                <Text style={styles.hostExp}>4 yillik tajriba</Text>
              </View>
            </View>
            <View style={styles.hostContactBtns}>
              <TouchableOpacity style={styles.contactBtn} onPress={handleCallPress}>
                <Ionicons name="call-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactBtn} onPress={handleMessagePress}>
                <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.hr} />

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.secTitle}>Tavsif</Text>
            <Text style={styles.descTxt}>{showDesc ? listing.description : shortDesc}</Text>
            {listing.description.length > 200 && (
              <TouchableOpacity onPress={() => setShowDesc(!showDesc)}>
                <Text style={styles.expandTxt}>
                  {showDesc ? 'Yig\'ish ↑' : 'Ko\'proq o\'qish →'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.hr} />

          {/* Amenities */}
          <ListingAmenities amenities={listing.amenities} />

          <View style={styles.hr} />

          {/* Map */}
          <View style={styles.section}>
            <View style={styles.secHeaderRow}>
              <Text style={styles.secTitle}>Joylashuv</Text>
              <TouchableOpacity onPress={() => setMapModal(true)}>
                <Text style={styles.secLink}>Kattalashtirish →</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.addrLine}>
              <Ionicons name="location-outline" size={13} color={COLORS.gray} />
              {'  '}{listing.address}
            </Text>
            <TouchableOpacity
              style={styles.mapThumb}
              onPress={() => setMapModal(true)}
              activeOpacity={0.88}
            >
              <MapView
                provider={PROVIDER_DEFAULT}
                style={StyleSheet.absoluteFillObject}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                initialRegion={{
                  latitude: listing.latitude,
                  longitude: listing.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker coordinate={{ latitude: listing.latitude, longitude: listing.longitude }}>
                  <PriceMarker price={listing.price} size="medium" />
                </Marker>
              </MapView>
              <View style={styles.mapExpandHint}>
                <View style={styles.mapHintChip}>
                  <Ionicons name="expand-outline" size={14} color={COLORS.dark} />
                  <Text style={styles.mapHintTxt}>Kattalashtirish</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.hr} />

          {/* Price Breakdown */}
          <View style={styles.section}>
            <Text style={styles.secTitle}>Narx tafsiloti</Text>
            <View style={styles.priceCard}>
              {[
                { lbl: `$${listing.price} × 1 kecha`, val: `$${listing.price}` },
                { lbl: "Tozalash to'lovi", val: `$${cleanFee}` },
                { lbl: 'Xizmat haqi', val: `$${serviceFee}` },
              ].map((item, idx) => (
                <View key={idx} style={styles.priceLineRow}>
                  <Text style={styles.priceLbl}>{item.lbl}</Text>
                  <Text style={styles.priceAmnt}>{item.val}</Text>
                </View>
              ))}
              <View style={styles.priceTotalRow}>
                <Text style={styles.priceTotalLbl}>Jami</Text>
                <Text style={styles.priceTotalAmnt}>${total}</Text>
              </View>
            </View>
          </View>

          <View style={styles.hr} />

          {/* Reviews */}
          <ReviewsList
            listingId={listing.id}
            listingTitle={listing.title}
            canReview={canReview()}
          />

          <View style={{ height: 110 }} />
        </View>
      </Animated.ScrollView>

      {/* Booking Bar */}
      <View style={[styles.bookingBar, { paddingBottom: insets.bottom || 22 }]}>
        <View>
          <View style={styles.bookingPriceRow}>
            <Text style={styles.bookingPrice}>${listing.price}</Text>
            <Text style={styles.bookingUnit}> / kecha</Text>
          </View>
          {listing.reviewCount > 0 && (
            <View style={styles.bookingRating}>
              <Ionicons name="star" size={11} color="#FFB800" />
              <Text style={styles.bookingRatingTxt}>{listing.avgRating.toFixed(1)}</Text>
              <Text style={styles.bookingRatingCount}>· {listing.reviewCount} sharh</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          activeOpacity={0.85}
          onPress={() => {
            if (!user) {
              router.push('/(auth)/login')
              return
            }
            router.push(`/booking/${listing.id}`)
          }}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark ?? '#E31C5F']}
            style={styles.bookBtnGrad}
          >
            <Text style={styles.bookBtnTxt}>Bron qilish</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Map Modal */}
      <Modal
        visible={mapModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMapModal(false)}
      >
        <View style={styles.mapModal}>
          <View style={styles.mapModalHeader}>
            <TouchableOpacity style={styles.mapModalBack} onPress={() => setMapModal(false)}>
              <Ionicons name="close" size={22} color={COLORS.dark} />
            </TouchableOpacity>
            <Text style={styles.mapModalTitle}>{listing.city}</Text>
            <TouchableOpacity style={styles.mapModalNav} onPress={handleOpenMaps}>
              <Ionicons name="navigate-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <MapView
            provider={PROVIDER_DEFAULT}
            style={styles.mapModalMap}
            initialRegion={{
              latitude: listing.latitude,
              longitude: listing.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation
            showsCompass
          >
            <Marker coordinate={{ latitude: listing.latitude, longitude: listing.longitude }}>
              <PriceMarker price={listing.price} selected size="large" />
            </Marker>
          </MapView>
          <View style={styles.mapModalFooter}>
            <View style={styles.mapModalAddrRow}>
              <Ionicons name="location" size={18} color={COLORS.primary} />
              <Text style={styles.mapModalAddrTxt}>{listing.address}</Text>
            </View>
            <TouchableOpacity style={styles.directionBtn} onPress={handleOpenMaps}>
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={styles.directionTxt}>Yo'nalish olish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Fullscreen Image Modal */}
      <Modal
        visible={fullscreenModal}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setFullscreenModal(false)}
      >
        <View style={styles.fullscreenModalContainer}>
          <TouchableOpacity
            style={[styles.fullscreenCloseBtn, { top: insets.top + 16 }]}
            onPress={() => setFullscreenModal(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.fullscreenCounter, { top: insets.top + 20, right: 20 }]}>
            <Text style={styles.fullscreenCounterText}>
              {fullscreenImgIdx + 1} / {listing.images.length}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.fullscreenShareBtn, { top: insets.top + 16, right: 70 }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <FlatList
            data={listing.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_item: string, index: number) => `full_${index}`}
            initialScrollIndex={fullscreenImgIdx}
            getItemLayout={(_data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onMomentumScrollEnd={onFullscreenScroll}
            renderItem={({ item }: { item: string }) => (
              <View style={styles.fullscreenImgWrapper}>
                <Image source={{ uri: item }} style={styles.fullscreenImg} resizeMode="contain" />
              </View>
            )}
          />
          {listing.images.length > 1 && (
            <View style={styles.fullscreenDotRow}>
              {listing.images.map((_: string, idx: number) => (
                <View
                  key={idx}
                  style={[
                    styles.fullscreenDot,
                    idx === fullscreenImgIdx && styles.fullscreenDotActive
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  
  // Sticky Header
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 },
  stickyGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  stickyRound: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center' },
  stickyTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#fff', textAlign: 'center' },
  stickyActions: { flexDirection: 'row', gap: 8 },
  
  // Images
  imgBox: { height: IMG_H, backgroundColor: COLORS.surface, overflow: 'hidden' },
  imgFlatList: { width, height: IMG_H },
  img: { width, height: IMG_H },
  imgGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 130 },
  dotRow: { position: 'absolute', bottom: 56, alignSelf: 'center', flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
  counterBadge: { position: 'absolute', bottom: 18, right: 16, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  counterTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
  priceBadge: { position: 'absolute', bottom: 18, left: 16, backgroundColor: 'rgba(0,0,0,0.58)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  priceBadgeTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  priceBadgeUnit: { fontSize: 12, fontWeight: '400' },
  floats: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  fabRight: { flexDirection: 'row', gap: 10 },
  fab: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.14, shadowRadius: 6 },
  
  // Content Card
  contentCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 26, borderTopRightRadius: 26, marginTop: -26, paddingTop: 20 },
  titleRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.dark, lineHeight: 30, marginBottom: 6 },
  locPill: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locTxt: { fontSize: 13, color: COLORS.gray, flex: 1 },
  hostAvatarBtn: { position: 'relative', marginTop: 4 },
  hostAvatarImg: { width: 52, height: 52, borderRadius: 26, borderWidth: 2.5, borderColor: COLORS.border },
  verifiedDot: { position: 'absolute', bottom: -2, right: -2, backgroundColor: COLORS.white, borderRadius: 10 },
  
  // Stats
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16 },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10 },
  statBorder: { borderRightWidth: 1, borderRightColor: COLORS.border },
  statTxt: { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  statBold: { color: COLORS.dark, fontWeight: '700' },
  
  // Separator
  hr: { height: 1, backgroundColor: COLORS.border, marginVertical: 20, marginHorizontal: 20 },
  
  // Host Row
  hostRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  hostRowImg: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: COLORS.border },
  hostRowInfo: { flex: 1 },
  hostRowName: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  hostBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  superhostBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFB80015', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  superhostTxt: { fontSize: 11, color: '#FFB800', fontWeight: '700' },
  hostDot: { color: COLORS.lightGray, fontSize: 14 },
  hostExp: { fontSize: 12, color: COLORS.gray },
  hostContactBtns: { flexDirection: 'row', gap: 8 },
  contactBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.primary + '40', backgroundColor: COLORS.primary + '08', justifyContent: 'center', alignItems: 'center' },
  
  // Sections
  section: { paddingHorizontal: 20 },
  secTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark, marginBottom: 10 },
  secHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  secLink: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  descTxt: { fontSize: 15, color: COLORS.dark, lineHeight: 24 },
  expandTxt: { marginTop: 8, fontSize: 14, color: COLORS.primary, fontWeight: '700' },
  
  // Map
  addrLine: { fontSize: 13, color: COLORS.gray, marginBottom: 10 },
  mapThumb: { height: 185, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  mapExpandHint: { position: 'absolute', bottom: 10, right: 10 },
  mapHintChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  mapHintTxt: { fontSize: 12, color: COLORS.dark, fontWeight: '600' },
  
  // Price Card
  priceCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginTop: 10, gap: 10 },
  priceLineRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLbl: { fontSize: 14, color: COLORS.gray },
  priceAmnt: { fontSize: 14, color: COLORS.dark },
  priceTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 4 },
  priceTotalLbl: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  priceTotalAmnt: { fontSize: 18, fontWeight: '800', color: COLORS.dark },
  
  // Booking Bar
  bookingBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  bookingPriceRow: { flexDirection: 'row', alignItems: 'baseline' },
  bookingPrice: { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  bookingUnit: { fontSize: 14, color: COLORS.gray },
  bookingRating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  bookingRatingTxt: { fontSize: 12, fontWeight: '700', color: COLORS.dark },
  bookingRatingCount: { fontSize: 12, color: COLORS.gray },
  bookBtn: { borderRadius: 16, overflow: 'hidden' },
  bookBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 28, paddingVertical: 14 },
  bookBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  
  // Map Modal
  mapModal: { flex: 1, backgroundColor: COLORS.white },
  mapModalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  mapModalBack: { width: 40, height: 40, justifyContent: 'center' },
  mapModalTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.dark, textAlign: 'center' },
  mapModalNav: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  mapModalMap: { flex: 1 },
  mapModalFooter: { padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingBottom: 34 },
  mapModalAddrRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapModalAddrTxt: { fontSize: 14, color: COLORS.dark, flex: 1 },
  directionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 14, elevation: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  directionTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  
  // Fullscreen Modal
  fullscreenModalContainer: { flex: 1, backgroundColor: '#000000' },
  fullscreenCloseBtn: { position: 'absolute', left: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  fullscreenCounter: { position: 'absolute', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  fullscreenCounterText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  fullscreenShareBtn: { position: 'absolute', zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  fullscreenImgWrapper: { width, height, justifyContent: 'center', alignItems: 'center' },
  fullscreenImg: { width, height },
  fullscreenDotRow: { position: 'absolute', bottom: 50, alignSelf: 'center', flexDirection: 'row', gap: 8, zIndex: 10 },
  fullscreenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  fullscreenDotActive: { backgroundColor: '#fff', width: 20 },
})